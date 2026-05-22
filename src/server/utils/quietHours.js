import Settings from '../models/Settings.js'

/**
 * Default quiet hours (no dispatch between 22h and 7h).
 */
const DEFAULT = { enabled: true, inicio: 22, fim: 7 }

export async function getQuietHours() {
  try {
    const doc = await Settings.findOne({ key: 'quietHours' })
    if (!doc?.value) return DEFAULT
    return { ...DEFAULT, ...doc.value }
  } catch {
    return DEFAULT
  }
}

export async function setQuietHours(value) {
  return Settings.findOneAndUpdate(
    { key: 'quietHours' },
    { value: { ...DEFAULT, ...value } },
    { upsert: true, new: true }
  )
}

/**
 * Returns true if currently inside the quiet window.
 */
export function isQuietNow({ enabled, inicio, fim }, now = new Date()) {
  if (!enabled) return false
  const h = now.getHours()
  if (inicio === fim) return false
  if (inicio < fim) return h >= inicio && h < fim
  // wraps around midnight (ex: 22 -> 7)
  return h >= inicio || h < fim
}
