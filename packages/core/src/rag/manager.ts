/**
 * RAG Pipeline — Upload documents, chunk, embed, search, Q&A
 *
 * Flow: Upload → Parse → Chunk → Embed → Store → Search → Answer
 */
import { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { registerTool } from "../plugin/tools.ts";
import { safeMessage } from "../errors.ts";
import { emitEvent } from "../event-bus/index.ts";

const db = new Database("nova.db");
db.run("PRAGMA journal_mode = WAL");
db.run(`CREATE TABLE IF NOT EXISTS rag_documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ready',
  error TEXT,
  created_at TEXT NOT NULL
)`);
db.run(`CREATE TABLE IF NOT EXISTS rag_chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL,
  content TEXT NOT NULL,
  page INTEGER,
  metadata TEXT,
  FOREIGN KEY (doc_id) REFERENCES rag_documents(id)
)`);
// FTS5 full-text search index (separate, NOT content-sync)
db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS rag_fts USING fts5(
  content, doc_id, filename
)`);

const UPLOAD_DIR = join(process.cwd(), "data", "rag");
mkdirSync(UPLOAD_DIR, { recursive: true });

export interface RagDocument {
  id: string; filename: string; title?: string;
  type: string; size: number; chunkCount: number;
  status: string; error?: string; createdAt: string;
}

class RagManager {
  async uploadDocument(filename: string, content: Buffer | string): Promise<RagDocument> {
    const id = randomUUID().slice(0, 12);
    const now = new Date().toISOString();
    const ext = extname(filename).toLowerCase();
    const filePath = join(UPLOAD_DIR, `${id}${ext}`);

    // Save file
    if (typeof content === "string") writeFileSync(filePath, content, "utf-8");
    else writeFileSync(filePath, Buffer.from(content));

    const size = statSync(filePath).size;

    // Sanity check: reject files smaller than 50 bytes (likely not real documents)
    if (size < 50) {
      try { unlinkSync(filePath); } catch {}
      throw new Error(`File too small (${size} bytes). Upload a real document with text content (minimum 50 bytes).`);
    }

    // Read first bytes to check for binary content
    const header = readFileSync(filePath);
    let nullBytes = 0;
    for (let i = 0; i < Math.min(100, header.length); i++) {
      if (header[i] === 0) nullBytes++;
    }
    if (header.length > 0 && nullBytes > 30) {
      try { unlinkSync(filePath); } catch {}
      throw new Error(`File appears to be binary (${nullBytes} null bytes in first 100). Upload a plain text file (.txt, .md, .csv, .json).`);
    }
    const doc: RagDocument = {
      id, filename, title: filename.replace(ext, ""),
      type: ext.slice(1) || "txt", size, chunkCount: 0,
      status: "processing", createdAt: now,
    };

    db.run("INSERT INTO rag_documents (id, filename, title, type, size, status, created_at) VALUES (?,?,?,?,?,'processing',?)",
      [id, filename, doc.title, doc.type, size, now]);

    // Process synchronously
    try {
      await this.processDocument(id, filePath, ext);
      db.run("UPDATE rag_documents SET status = 'ready' WHERE id = ?", [id]);
      const updated = this.getDocument(id);
      return updated || doc;
    } catch (e) {
      db.run("UPDATE rag_documents SET status = 'error', error = ? WHERE id = ?", [safeMessage(e), id]);
      throw e;
    }
  }

  private async processDocument(docId: string, filePath: string, ext: string): Promise<void> {
    // Get document info
    const doc = this.getDocument(docId);
    if (!doc) throw new Error("Document not found: " + docId);
    const filename = doc.filename;
    // Step 1: Parse content based on file type
    let text = "";
    if (ext === ".txt" || ext === ".md" || ext === ".csv" || ext === ".json" || ext === ".xml" || ext === ".html") {
      text = readFileSync(filePath, "utf-8");
    } else if (ext === ".pdf") {
      text = await this.parsePdf(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    if (!text.trim()) throw new Error("No text content found");

    // Step 2: Chunk text
    const chunks = this.chunkText(text, 500, 50);
    if (chunks.length === 0) throw new Error("No chunks generated");

    // Step 3: Store chunks + FTS index
    const insert = db.prepare("INSERT INTO rag_chunks (id, doc_id, content, page, metadata) VALUES (?,?,?,?,?)");
    const insertFts = db.prepare("INSERT INTO rag_fts (content, doc_id, filename) VALUES (?,?,?)");
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${docId}_${i}`;
      insert.run(chunkId, docId, chunks[i].text, chunks[i].page || null, JSON.stringify({ index: i }));
      insertFts.run(chunks[i].text, docId, filename);
    }
    // Update chunk count
    db.run("UPDATE rag_documents SET chunk_count = ? WHERE id = ?", [chunks.length, docId]);

    emitEvent({ type: "event", kind: "message", sessionId: docId, data: { text: `[rag] ${chunks.length} chunks indexed from ${filePath}` } });
  }

  private async parsePdf(filePath: string): Promise<string> {
    // Try pdfplumber first
    const result1 = await this.tryParsePdfPlumber(filePath);
    if (result1 && !result1.startsWith("[PDF:") && result1.trim()) return result1;

    // Try PyMuPDF (fitz) - better for complex PDFs
    const result2 = await this.tryParseFitz(filePath);
    if (result2 && result2.trim()) return result2;

    // Fallback: try OCR via pytesseract
    const result3 = await this.tryOcr(filePath);
    if (result3 && result3.trim()) return result3;

    return "[PDF: no extractable text found - document may be scanned/contains only images]";
  }

  private async tryParsePdfPlumber(filePath: string): Promise<string | null> {
    const scriptPath = join(UPLOAD_DIR, "_parse_pdf.py");
    const script = `
import sys
try:
    import pdfplumber
    with pdfplumber.open(sys.argv[1]) as pdf:
        texts = []
        for page in pdf.pages:
            t = page.extract_text() or ""
            if t.strip():
                texts.append(t)
        if texts:
            print("\\n\\n---\\n\\n".join(texts))
        else:
            print("PDF_ERROR: no text extracted")
except ImportError:
    print("PDF_ERROR: pdfplumber not installed")
except Exception as e:
    print(f"PDF_ERROR: {e}")
`;
    writeFileSync(scriptPath, script, "utf-8");
    try {
      const { execSync } = await import("node:child_process");
      const result = execSync(`python "${scriptPath}" "${filePath}"`, { encoding: "utf-8", timeout: 30000 });
      const stdout = result.stdout || "";
      if (stdout.includes("PDF_ERROR") || !stdout.trim()) {
        console.warn(`[rag] pdfplumber: ${stdout.trim()}`);
        return null;
      }
      return stdout;
    } catch (e) {
      return null;
    } finally {
      try { unlinkSync(scriptPath); } catch {}
    }
  }

  private async tryParseFitz(filePath: string): Promise<string | null> {
    const scriptPath = join(UPLOAD_DIR, "_parse_fitz.py");
    const script = `
import sys
try:
    import fitz
    doc = fitz.open(sys.argv[1])
    texts = []
    for page in doc:
        t = page.get_text() or ""
        if t.strip():
            texts.append(t)
    doc.close()
    if texts:
        print("\\n\\n---\\n\\n".join(texts))
    else:
        print("FITZ_ERROR: no text")
except ImportError:
    print("FITZ_ERROR: pymupdf not installed")
except Exception as e:
    print(f"FITZ_ERROR: {e}")
`;
    writeFileSync(scriptPath, script, "utf-8");
    try {
      const { execSync } = await import("node:child_process");
      const result = execSync(`python "${scriptPath}" "${filePath}"`, { encoding: "utf-8", timeout: 30000 });
      const stdout = result.stdout || "";
      if (stdout.includes("FITZ_ERROR") || !stdout.trim()) return null;
      return stdout;
    } catch {
      return null;
    } finally {
      try { unlinkSync(scriptPath); } catch {}
    }
  }

  private async tryOcr(filePath: string): Promise<string | null> {
    const scriptPath = join(UPLOAD_DIR, "_ocr.py");
    const script = `
import sys
try:
    import pytesseract
    from PIL import Image
    import pdfplumber
    # Extract images from PDF and OCR them
    texts = []
    with pdfplumber.open(sys.argv[1]) as pdf:
        for page in pdf.pages:
            img = page.to_image(resolution=300)
            text = pytesseract.image_to_string(img.original, lang="pol+eng")
            if text.strip():
                texts.append(text)
    if texts:
        print("\\n\\n---\\n\\n".join(texts))
    else:
        print("OCR_ERROR: no text")
except ImportError:
    print("OCR_ERROR: install pytesseract + pillow + tesseract-ocr")
except Exception as e:
    print(f"OCR_ERROR: {e}")
`;
    writeFileSync(scriptPath, script, "utf-8");
    try {
      const { execSync } = await import("node:child_process");
      const result = execSync(`python "${scriptPath}" "${filePath}"`, { encoding: "utf-8", timeout: 120000 });
      const stdout = result.stdout || "";
      if (stdout.includes("OCR_ERROR") || !stdout.trim()) return null;
      return stdout;
    } catch {
      return null;
    } finally {
      try { unlinkSync(scriptPath); } catch {}
    }
  }

  private chunkText(text: string, chunkSize = 500, overlap = 50): Array<{ text: string; page?: number }> {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: Array<{ text: string; page?: number }> = [];
    let current = "";

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      if (current.length + trimmed.length > chunkSize && current.length > 0) {
        chunks.push({ text: current.trim() });
        // Keep overlap
        const words = current.split(/\s+/);
        const overlapText = words.slice(-Math.floor(overlap / 5)).join(" ");
        current = overlapText + " " + trimmed;
      } else {
        current += (current ? " " : "") + trimmed;
      }
    }
    if (current.trim()) chunks.push({ text: current.trim() });

    return chunks;
  }

  listDocuments(): RagDocument[] {
    const rows = db.query("SELECT * FROM rag_documents ORDER BY created_at DESC").all() as any[];
    return rows.map((r) => ({
      id: r.id, filename: r.filename, title: r.title,
      type: r.type, size: r.size, chunkCount: r.chunk_count,
      status: r.status, error: r.error, createdAt: r.created_at,
    }));
  }

  getDocument(id: string): RagDocument | null {
    const r = db.query("SELECT * FROM rag_documents WHERE id = ?").get(id) as any;
    if (!r) return null;
    return {
      id: r.id, filename: r.filename, title: r.title,
      type: r.type, size: r.size, chunkCount: r.chunk_count,
      status: r.status, error: r.error, createdAt: r.created_at,
    };
  }

  deleteDocument(id: string): boolean {
    db.run("DELETE FROM rag_chunks WHERE doc_id = ?", [id]);
    const r = db.query("SELECT * FROM rag_documents WHERE id = ?").get(id) as any;
    if (r) {
      const ext = extname(r.filename);
      const fp = join(UPLOAD_DIR, `${id}${ext}`);
      try { unlinkSync(fp); } catch {}
    }
    const result = db.run("DELETE FROM rag_documents WHERE id = ?", [id]);
    return (result.changes ?? 0) > 0;
  }

  getDocumentContent(id: string): string | null {
    const doc = this.getDocument(id);
    if (!doc) return null;
    const rows = db.query("SELECT content FROM rag_chunks WHERE doc_id = ? ORDER BY rowid").all(id) as any[];
    return rows.map((r: any) => r.content).join("\n\n---\n\n");
  }

  async search(query: string, limit = 5): Promise<Array<{ content: string; docId: string; filename: string; score: number }>> {
    const docCount = db.query("SELECT COUNT(*) as c FROM rag_documents WHERE status = 'ready'").get() as any;
    if (!docCount || docCount.c === 0) return [];

    // Sanitize query for FTS5: remove special chars, keep alphanumeric
    const terms = query.trim()
      .replace(/[^a-zA-Z0-9\s\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\uAC00-\uD7AF]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 0);

    if (terms.length === 0) return [];

    // Try FTS5 with each individual term (OR doesn't work well for multi-word)
    const seen = new Set<string>();
    const results: Array<{ content: string; docId: string; filename: string; score: number }> = [];

    for (const term of terms) {
      try {
        const rows = db.query(
          "SELECT content, doc_id, filename FROM rag_fts WHERE rag_fts MATCH ? LIMIT ?"
        ).all(term, limit) as any[];

        for (const r of rows) {
          const key = (r.doc_id || "") + "_" + (r.content || "").slice(0, 100);
          if (seen.has(key)) continue;
          seen.add(key);
          results.push({
            content: (r.content || "").replace(/\u0000/g, "").slice(0, 500) || "(empty)",
            docId: r.doc_id,
            filename: r.filename,
            score: 1,
          });
        }
      } catch {
        // FTS5 failed for this term, fallback to LIKE search
        try {
          const like = `%${term}%`;
          const rows = db.query(
            "SELECT c.content, c.doc_id, d.filename FROM rag_chunks c JOIN rag_documents d ON c.doc_id = d.id WHERE c.content LIKE ? AND d.status = 'ready' LIMIT ?"
          ).all(like, limit) as any[];
          for (const r of rows) {
            const key = (r.doc_id || "") + "_" + (r.content || "").slice(0, 100);
            if (seen.has(key)) continue;
            seen.add(key);
            results.push({
              content: (r.content || "").replace(/\u0000/g, "").slice(0, 500) || "(empty)",
              docId: r.doc_id,
              filename: r.filename,
              score: 0.5,
            });
          }
        } catch {}
      }
    }

    return results.slice(0, limit);
  }

  async query(question: string): Promise<string> {
    const results = await this.search(question, 10);
    if (results.length === 0) return "No relevant documents found for your question.";

    const context = results.map((r) => `[${r.filename}] ${r.content}`).join("\n\n---\n\n");

    // Try LLM-powered answer using configured model
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || "";
      const baseUrl = process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1";
      const model = process.env.DEEPSEEK_MODEL?.includes("/") ? process.env.DEEPSEEK_MODEL.split("/").pop()! : "deepseek-chat";

      if (apiKey) {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Answer the user's question based ONLY on the provided document context. If the context doesn't contain relevant information, say so. Be concise." },
              { role: "user", content: `Context:\n\n${context}\n\nQuestion: ${question}` },
            ],
            max_tokens: 500,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
          if (answer) return answer.trim();
        }
      }
    } catch (e) {
      console.warn(`[rag] LLM answer failed: ${safeMessage(e)}`);
    }

    // Fallback: return raw chunks
    return `Found ${results.length} relevant passages:\n\n${context}`;
  }
}

export const ragManager = new RagManager();

// ─── Tools ────────────────────────────────────────────────────
registerTool({
  name: "rag_upload",
  description: "Upload a document to RAG knowledge base (supports .txt, .md, .pdf, .csv, .json)",
  parameters: {
    type: "object",
    properties: {
      filename: { type: "string", description: "Filename with extension" },
      content: { type: "string", description: "File content as text" },
    },
    required: ["filename", "content"],
    additionalProperties: false,
  },
  async execute(args: { filename: string; content: string }) {
    const doc = await ragManager.uploadDocument(args.filename, args.content);
    return `📄 Uploaded: ${doc.filename} (${(doc.size / 1024).toFixed(1)}KB) — processing...`;
  },
});

registerTool({
  name: "rag_list",
  description: "List all documents in RAG knowledge base",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  async execute() {
    const docs = ragManager.listDocuments();
    if (docs.length === 0) return "No documents in RAG knowledge base.";
    return docs.map((d) => `  ${d.status === "ready" ? "✅" : "⏳"} ${d.filename} (${(d.size / 1024).toFixed(1)}KB, ${d.chunkCount} chunks)`).join("\n");
  },
});

registerTool({
  name: "rag_query",
  description: "Ask a question about your uploaded documents",
  parameters: {
    type: "object",
    properties: {
      question: { type: "string", description: "Your question" },
    },
    required: ["question"],
    additionalProperties: false,
  },
  async execute(args: { question: string }) {
    return await ragManager.query(args.question);
  },
});
