/**
 * Low-level crypto building blocks for journal encryption.
 *
 * Scheme: a random AES-256-GCM key per user (stored in user_profiles,
 * readable only by its owner via RLS) encrypts all journal content.
 * Ciphertexts are prefixed with "v2:" to distinguish them from the legacy
 * XOR format, which decryptData still reads until migration completes.
 */

const V2_PREFIX = 'v2:'
const IV_LENGTH = 12

// ---------- base64 helpers ----------

const bytesToBase64 = (bytes) => {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

const base64ToBytes = (base64) => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ---------- key generation ----------

const generateDekBytes = () => window.crypto.getRandomValues(new Uint8Array(32))

const importDek = (rawBytes) =>
  window.crypto.subtle.importKey('raw', rawBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])

// ---------- AES-GCM ----------

// Raw versions (Uint8Array in/out, no base64) — used directly for binary
// payloads like image bytes, where base64's ~33% size inflation would be
// pure waste on Storage bandwidth/cost. aesEncryptBytes/aesDecryptToBytes
// below are thin base64-wrapping callers for the existing JSON-payload use.
const aesEncryptRawBytes = async (plainBytes, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const cipherBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes)
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(cipherBuffer), iv.length)
  return combined
}

const aesDecryptRawBytes = async (combinedBytes, key) => {
  const iv = combinedBytes.slice(0, IV_LENGTH)
  const cipherBytes = combinedBytes.slice(IV_LENGTH)
  const plainBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes)
  return new Uint8Array(plainBuffer)
}

const aesEncryptBytes = async (plainBytes, key) =>
  bytesToBase64(await aesEncryptRawBytes(plainBytes, key))

const aesDecryptToBytes = async (base64Payload, key) =>
  aesDecryptRawBytes(base64ToBytes(base64Payload), key)

// ---------- v2 content encryption ----------

const isV2 = (payload) => typeof payload === 'string' && payload.startsWith(V2_PREFIX)

const encryptJson = async (data, dek) => {
  const plainBytes = new TextEncoder().encode(JSON.stringify(data))
  const payload = await aesEncryptBytes(plainBytes, dek)
  return V2_PREFIX + payload
}

const decryptJson = async (payload, dek) => {
  const plainBytes = await aesDecryptToBytes(payload.slice(V2_PREFIX.length), dek)
  return JSON.parse(new TextDecoder().decode(plainBytes))
}

// ---------- legacy XOR format (read-only, for migration) ----------

const legacyKeyFromUserId = (userId) => {
  const keyData = new TextEncoder().encode(userId)
  const keyArray = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    keyArray[i] = keyData[i % keyData.length]
  }
  return keyArray
}

const legacyDecrypt = (encryptedData, legacyKeyBytes) => {
  const encrypted = base64ToBytes(encryptedData)
  const iv = encrypted.slice(0, 16)
  const data = encrypted.slice(16)
  const decrypted = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ legacyKeyBytes[i % legacyKeyBytes.length] ^ iv[i % iv.length]
  }
  return JSON.parse(new TextDecoder().decode(decrypted))
}

export {
  bytesToBase64,
  base64ToBytes,
  generateDekBytes,
  importDek,
  isV2,
  encryptJson,
  decryptJson,
  aesEncryptRawBytes,
  aesDecryptRawBytes,
  legacyKeyFromUserId,
  legacyDecrypt,
}
