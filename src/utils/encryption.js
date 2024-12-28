// In src/utils/encryption.js

const getEncryptionKey = async (userId) => {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(userId)
  const hash = await crypto.subtle.digest('SHA-256', keyData)
  return hash
}

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

const encryptData = async (data, key) => {
  try {
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(JSON.stringify(data))

    const iv = crypto.getRandomValues(new Uint8Array(12))

    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
      'encrypt',
    ])

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      dataBytes,
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedData), iv.length)

    // Convert to base64 using our helper
    return arrayBufferToBase64(combined)
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

const decryptData = async (encryptedData, key) => {
  try {
    // Convert base64 to array buffer using our helper
    const combined = base64ToArrayBuffer(encryptedData)
    const combinedArray = new Uint8Array(combined)

    // Extract IV and data
    const iv = combinedArray.slice(0, 12)
    const data = combinedArray.slice(12)

    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
      'decrypt',
    ])

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      data,
    )

    const decoder = new TextDecoder()
    const decryptedText = decoder.decode(decryptedData)
    return JSON.parse(decryptedText)
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

export { getEncryptionKey, encryptData, decryptData }
