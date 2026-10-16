/**
 * HTML Sanitization and Escaping Utilities
 * Protects DOM innerHTML and text insertion against Cross-Site Scripting (XSS).
 */

export function escapeHtml(unsafe: string | null | undefined): string {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
