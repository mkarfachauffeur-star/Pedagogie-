export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function normalizeResendKey(raw: string | undefined): string | null {
  if (!raw) return null
  const key = raw.trim().replace(/^["']|["']$/g, '')
  if (!key.startsWith('re_')) return null
  return key
}

export function emailLog(scope: string, level: 'info' | 'ok' | 'warn' | 'error', message: string, extra: Record<string, unknown> = {}) {
  const payload = { scope, level, message, ts: new Date().toISOString(), ...extra }
  const line = `[${scope}] ${message}`
  if (level === 'error') console.error(line, payload)
  else if (level === 'warn') console.warn(line, payload)
  else console.log(line, payload)
}
