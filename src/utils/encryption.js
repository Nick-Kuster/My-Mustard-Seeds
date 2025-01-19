const getCryptoSubtle = () => {
  // For most modern browsers
  if (window.crypto && window.crypto.subtle) {
    return window.crypto.subtle
  }

  // For older browsers and some mobile browsers
  if (window.crypto && window.crypto.webkitSubtle) {
    return window.crypto.webkitSubtle
  }

  // For Safari and some mobile browsers
  if (window.crypto && window.crypto.random) {
    const subtle = {
      async digest(algorithm, data) {
        const buffer = new ArrayBuffer(32)
        const view = new DataView(buffer)
        const dataView = new Uint8Array(data)

        const entropy = new Uint8Array(32)
        window.crypto.getRandomValues(entropy)

        for (let i = 0; i < 32; i++) {
          view.setUint8(i, dataView[i % dataView.length] ^ entropy[i])
        }

        return buffer
      },
    }
    return subtle
  }

  // Last resort fallback
  return {
    async digest(algorithm, data) {
      let hash = new ArrayBuffer(32)
      let view = new DataView(hash)
      let dataView = new Uint8Array(data)

      for (let i = 0; i < 32; i++) {
        let value = 0
        for (let j = 0; j < dataView.length; j++) {
          value = value ^ (dataView[j] << j % 8)
        }
        view.setUint8(i, value)
      }

      return hash
    },
  }
}

const getEncryptionKey = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required for encryption key generation')
  }

  const encoder = new TextEncoder()
  const keyData = encoder.encode(userId)
  const subtle = getCryptoSubtle()
  const hash = await subtle.digest('SHA-256', keyData)
  return hash
}

const encryptData = async (data, key) => {
  try {
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(JSON.stringify(data))

    // Use a simpler encryption method if AES-GCM is not available
    if (!window.crypto.subtle) {
      const keyBytes = new Uint8Array(key)
      const encrypted = new Uint8Array(dataBytes.length)
      for (let i = 0; i < dataBytes.length; i++) {
        encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length]
      }
      return arrayBufferToBase64(encrypted)
    }

    // Use standard WebCrypto if available
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const cryptoKey = await window.crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
      'encrypt',
    ])
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBytes,
    )

    const combined = new Uint8Array(iv.length + encryptedData.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedData), iv.length)
    return arrayBufferToBase64(combined)
  } catch {
    console.error('Encryption fallback activated')
    // Fallback to simpler encryption
    const encoder = new TextEncoder()
    const keyBytes = new Uint8Array(key)
    const dataToEncrypt = encoder.encode(JSON.stringify(data))
    const encrypted = new Uint8Array(dataToEncrypt.length)
    for (let i = 0; i < dataToEncrypt.length; i++) {
      encrypted[i] = dataToEncrypt[i] ^ keyBytes[i % keyBytes.length]
    }
    return arrayBufferToBase64(encrypted)
  }
}

const decryptData = async (encryptedData, key) => {
  if (!encryptedData) {
    return null
  }

  try {
    const combined = base64ToArrayBuffer(encryptedData)

    // Try standard WebCrypto first
    if (window.crypto.subtle) {
      try {
        const combinedArray = new Uint8Array(combined)
        const iv = combinedArray.slice(0, 12)
        const data = combinedArray.slice(12)
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          key,
          { name: 'AES-GCM' },
          false,
          ['decrypt'],
        )
        const decryptedData = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          data,
        )
        const decoder = new TextDecoder()
        return JSON.parse(decoder.decode(decryptedData))
      } catch {
        // Fall through to backup decryption if WebCrypto fails
      }
    }

    // Fallback decryption
    const encryptedBytes = new Uint8Array(combined)
    const keyBytes = new Uint8Array(key)
    const decrypted = new Uint8Array(encryptedBytes.length)
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length]
    }
    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

// Helper functions
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
