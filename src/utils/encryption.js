/**
 * Journal content encryption — AES-256-GCM with a passphrase-wrapped key.
 *
 * This module keeps the original three-function API so existing callers
 * don't change:
 *   getEncryptionKey(userId) -> key bundle (waits until the vault is unlocked)
 *   encryptData(data, bundle) -> "v2:..." AES-GCM ciphertext
 *   decryptData(payload, bundle) -> plaintext (reads both v2 and the legacy
 *                                   XOR format until migration finishes)
 *
 * encryptBytes/decryptBytes are the same idea for raw binary (image
 * uploads) instead of JSON — no base64 detour, no legacy format to read.
 */
import { useEncryptionStore } from 'src/stores/encryption'
import {
  isV2,
  encryptJson,
  decryptJson,
  aesEncryptRawBytes,
  aesDecryptRawBytes,
  legacyKeyFromUserId,
  legacyDecrypt,
} from 'src/utils/cryptoPrimitives'

const getEncryptionKey = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required for encryption key generation')
  }
  const encryptionStore = useEncryptionStore()
  const dek = await encryptionStore.waitForKey()
  return { dek, legacyKey: legacyKeyFromUserId(userId) }
}

const encryptData = async (data, keyBundle) => {
  try {
    return await encryptJson(data, keyBundle.dek)
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

const decryptData = async (encryptedData, keyBundle) => {
  if (!encryptedData) {
    return null
  }
  try {
    if (isV2(encryptedData)) {
      return await decryptJson(encryptedData, keyBundle.dek)
    }
    return legacyDecrypt(encryptedData, keyBundle.legacyKey)
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

const encryptBytes = async (plainBytes, keyBundle) => {
  try {
    return await aesEncryptRawBytes(plainBytes, keyBundle.dek)
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

const decryptBytes = async (cipherBytes, keyBundle) => {
  try {
    return await aesDecryptRawBytes(cipherBytes, keyBundle.dek)
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

export { getEncryptionKey, encryptData, decryptData, encryptBytes, decryptBytes }
