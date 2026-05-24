/**
 * TikTok Upload Automation — browser-based video upload
 *
 * Steps:
 * 1. Launch browser with saved profile
 * 2. Navigate to tiktok.com/upload
 * 3. Click upload button and select file
 * 4. Fill description and settings
 * 5. Click post
 *
 * Requires Chrome/Chromium installed for persistent profile support.
 */

export async function uploadToTikTok(
  videoPath: string,
  description: string,
  profileDir: string,
): Promise<string> {
  const fs = await import("node:fs");
  const path = await import("node:path");

  // Verify video file exists
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  const absVideoPath = path.resolve(videoPath);

  // We return instructions for the agent to execute using browser tools
  // The agent will call browser_launch, browser_navigate, etc. sequentially
  return JSON.stringify({
    action: "browser_automation",
    steps: [
      { tool: "browser_launch", args: { userDataDir: profileDir, headless: false } },
      { tool: "browser_navigate", args: { url: "https://www.tiktok.com/upload" } },
      { tool: "browser_wait", args: { ms: 3000 } },
      { tool: "browser_click", args: { selector: "input[type=file]" } },
      { tool: "browser_type_file", args: { path: absVideoPath } },
      { tool: "browser_wait", args: { ms: 5000 } },
      { tool: "browser_type", args: { selector: "div[contenteditable=true]", text: description } },
      { tool: "browser_click", args: { selector: "button[type=submit]" } },
    ],
    description: `Uploading ${absVideoPath} to TikTok with caption: ${description.slice(0, 50)}...`,
  });
}
