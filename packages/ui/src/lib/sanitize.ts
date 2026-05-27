const escapeMap: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeRe = /[&<>"']/g;

export function escapeHtml(s: string): string {
  return s.replace(escapeRe, (c) => escapeMap[c]);
}
