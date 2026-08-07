// Anywhere a stored URL gets handed to window.open() needs this check —
// input-level validation (the http(s)-only :rules on link forms) is cosmetic
// only in a few places (no <q-form> gates Save on it), so guarding the sink
// itself is what actually stops a javascript:/data: URI from executing.
const HTTP_URL_PATTERN = /^https?:\/\//i

export const isSafeExternalUrl = (url) => typeof url === 'string' && HTTP_URL_PATTERN.test(url.trim())

export const openSafeExternalUrl = (url) => {
  if (!isSafeExternalUrl(url)) return false
  globalThis.open?.(url.trim(), '_blank', 'noopener,noreferrer')
  return true
}
