const getEncryptionKey = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required for encryption key generation')
  }

  // Create a consistent key from the userId
  const encoder = new TextEncoder()
  const keyData = encoder.encode(userId)
  const keyArray = new Uint8Array(32) // AES-256 key length

  // Fill the key with repeating userId data
  for (let i = 0; i < 32; i++) {
    keyArray[i] = keyData[i % keyData.length]
  }

  return keyArray.buffer
}

const encryptData = async (data, key) => {
  try {
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(JSON.stringify(data))
    const keyBytes = new Uint8Array(key)

    // Create initialization vector (IV)
    const iv = new Uint8Array(16)
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(iv)
    } else {
      // Fallback random IV generation
      for (let i = 0; i < 16; i++) {
        iv[i] = Math.floor(Math.random() * 256)
      }
    }

    // XOR encryption with IV
    const encrypted = new Uint8Array(iv.length + dataBytes.length)
    encrypted.set(iv) // Store IV at the beginning

    // Encrypt the data using XOR with key and IV
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[iv.length + i] = dataBytes[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length]
    }

    return arrayBufferToBase64(encrypted.buffer)
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

const decryptData = async (encryptedData, key) => {
  if (!encryptedData) {
    return null
  }

  try {
    const encrypted = new Uint8Array(base64ToArrayBuffer(encryptedData))
    const keyBytes = new Uint8Array(key)

    // Extract IV from the beginning
    const iv = encrypted.slice(0, 16)
    const data = encrypted.slice(16)

    // Decrypt using XOR with key and IV
    const decrypted = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ keyBytes[i % keyBytes.length] ^ iv[i % iv.length]
    }

    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

// Helper functions remain the same
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

export { getEncryptionKey, encryptData, decryptData }
