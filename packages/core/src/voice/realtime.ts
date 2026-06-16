/**
 * Realtime Voice Streaming Manager
 * WebSocket-based bidirectional audio streaming
 */
import { WebSocket } from "ws";
import { safeMessage } from "../errors";

interface VoiceSession {
  id: string;
  ws: WebSocket;
  language: string;
  status: "listening" | "processing" | "speaking" | "idle";
  audioBuffer: Float32Array[];
  startTime: number;
}

class RealtimeVoiceManager {
  private sessions: Map<string, VoiceSession> = new Map();
  private vadThreshold = 0.01; // Voice Activity Detection threshold
  private silenceTimeout = 1500; // ms of silence before auto-send

  createSession(ws: WebSocket, language: string = "pl-PL"): string {
    const id = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.sessions.set(id, {
      id, ws, language, status: "idle",
      audioBuffer: [], startTime: Date.now(),
    });
    console.log(`[voice] Session created: ${id}`);
    return id;
  }

  handleAudioChunk(sessionId: string, chunk: ArrayBuffer): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const float32 = new Float32Array(chunk);
    session.audioBuffer.push(float32);

    // Simple VAD: check if audio level is above threshold
    let sum = 0;
    for (let i = 0; i < float32.length; i++) {
      sum += float32[i] * float32[i];
    }
    const rms = Math.sqrt(sum / float32.length);

    if (rms > this.vadThreshold) {
      session.status = "listening";
    } else if (session.status === "listening") {
      // Silence detected after speech
      session.status = "processing";
      this.processAudio(session);
    }
  }

  private async processAudio(session: VoiceSession): Promise<void> {
    try {
      // Concatenate audio buffers
      const totalLength = session.audioBuffer.reduce((acc, buf) => acc + buf.length, 0);
      const combined = new Float32Array(totalLength);
      let offset = 0;
      for (const buf of session.audioBuffer) {
        combined.set(buf, offset);
        offset += buf.length;
      }
      session.audioBuffer = [];

      // Send to STT (Whisper or Web Speech API)
      const transcript = await this.sttTranscribe(combined, session.language);

      if (transcript && transcript.trim()) {
        // Send transcript back to client
        this.sendToClient(session, {
          type: "transcript",
          text: transcript,
          timestamp: Date.now(),
        });

        // Generate TTS response
        session.status = "speaking";
        const ttsAudio = await this.ttsSynthesize(transcript, session.language);

        if (ttsAudio) {
          this.sendToClient(session, {
            type: "audio",
            audio: ttsAudio,
            timestamp: Date.now(),
          });
        }
      }

      session.status = "idle";
    } catch (e) {
      console.error(`[voice] Processing error: ${safeMessage(e)}`);
      session.status = "idle";
    }
  }

  private async sttTranscribe(audio: Float32Array, language: string): Promise<string> {
    // Use Web Speech API on client side, or OpenAI Whisper on server
    // For server-side, convert Float32Array to WAV and send to Whisper
    try {
      const wavBuffer = this.float32ToWav(audio, 16000);
      const formData = new FormData();
      formData.append("file", new Blob([wavBuffer], { type: "audio/wav" }), "audio.wav");
      formData.append("model", "whisper-1");
      formData.append("language", language.split("-")[0]);

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return "";

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body: formData,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return "";
      const data = await response.json();
      return data.text || "";
    } catch {
      return "";
    }
  }

  private async ttsSynthesize(text: string, language: string): Promise<string | null> {
    try {
      // Use edge-tts or OpenAI TTS
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return null;

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "tts-1", input: text, voice: "alloy" }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    } catch {
      return null;
    }
  }

  private float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  }

  private sendToClient(session: VoiceSession, data: any): void {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(data));
    }
  }

  closeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`[voice] Session closed: ${sessionId}`);
  }

  getSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

export const realtimeVoiceManager = new RealtimeVoiceManager();
