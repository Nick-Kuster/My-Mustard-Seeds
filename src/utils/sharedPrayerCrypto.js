import { decryptJson, encryptJson, importDek, isV2 } from 'src/utils/cryptoPrimitives'

export const sharedPrayerDekFromInviteCode = async (inviteCode) => {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(inviteCode))
  return importDek(new Uint8Array(digest))
}

export const encryptSharedPrayerText = (text, groupDek) => encryptJson(text, groupDek)

export const decryptSharedPrayerText = async (payload, groupDek) => {
  if (!payload) return null
  if (!isV2(payload)) return payload
  try {
    return await decryptJson(payload, groupDek)
  } catch (error) {
    console.error('Error decrypting shared prayer content:', error)
    return ''
  }
}
