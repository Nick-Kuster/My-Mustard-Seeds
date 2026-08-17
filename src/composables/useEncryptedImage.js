import { ref, watch, onBeforeUnmount } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, decryptBytes } from 'src/utils/encryption'

const BUCKET = 'journal-images'

// Downloads + decrypts an encrypted image attachment for display, exposing
// an object URL. imagePathRef/mimeTypeRef are refs (or computeds) so this
// tracks a NodeView instance whose node attrs can change out from under it.
export function useEncryptedImage(imagePathRef, mimeTypeRef) {
  const objectUrl = ref(null)
  const status = ref('loading') // 'loading' | 'loaded' | 'error'

  let currentToken = 0
  let currentUrl = null

  const revokeCurrent = () => {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl)
      currentUrl = null
    }
  }

  const load = async () => {
    const imagePath = imagePathRef.value
    const mimeType = mimeTypeRef.value
    const token = ++currentToken
    status.value = 'loading'

    if (!imagePath) {
      status.value = 'error'
      return
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')
      if (!imagePath.startsWith(`${session.user.id}/`)) {
        throw new Error('Invalid image path')
      }

      const keyBundle = await getEncryptionKey(session.user.id)
      const { data, error } = await supabase.storage.from(BUCKET).download(imagePath)
      if (error) throw error

      const cipherBytes = new Uint8Array(await data.arrayBuffer())
      const plainBytes = await decryptBytes(cipherBytes, keyBundle)

      // A newer load started (attrs changed again) while this one was in
      // flight — drop this result rather than flashing a stale image.
      if (token !== currentToken) return

      const blob = new Blob([plainBytes], { type: mimeType || 'image/jpeg' })
      revokeCurrent()
      currentUrl = URL.createObjectURL(blob)
      objectUrl.value = currentUrl
      status.value = 'loaded'
    } catch (err) {
      if (token !== currentToken) return
      console.error('Failed to load encrypted image:', err)
      status.value = 'error'
    }
  }

  watch([imagePathRef, mimeTypeRef], load, { immediate: true })

  onBeforeUnmount(() => {
    currentToken++
    revokeCurrent()
  })

  return { objectUrl, status }
}
