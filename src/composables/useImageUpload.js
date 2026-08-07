import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { demoModeActive } from 'src/utils/demoMode'
import { getEncryptionKey, encryptBytes } from 'src/utils/encryption'
import { resizeImageFile } from 'src/utils/imageResize'

// Sanity ceiling on the *original* file before resizing — resizeImageFile
// already shrinks anything over 1600px, this just rejects absurd input
// outright rather than trying to decode/canvas a huge file in the browser.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const BUCKET = 'journal-images'

// supabase.storage.from(...) is a separate accessor from supabase.from(...)
// — src/boot/supabase.js's demo-mode write guard only patches the latter,
// so uploads need their own check here to avoid writing real Storage
// objects during a "Show with sample data" tutorial run.
export function useImageUpload() {
  const uploading = ref(false)

  const uploadImage = async (file) => {
    if (demoModeActive.value) {
      throw new Error('Image upload is disabled while viewing sample data.')
    }
    if (!file.type?.startsWith('image/')) {
      throw new Error('Please choose an image file.')
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('That image is too large (max 15MB).')
    }

    uploading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const keyBundle = await getEncryptionKey(session.user.id)
      const { blob, mimeType } = await resizeImageFile(file)
      const plainBytes = new Uint8Array(await blob.arrayBuffer())
      const cipherBytes = await encryptBytes(plainBytes, keyBundle)

      const imagePath = `${session.user.id}/${crypto.randomUUID()}`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(imagePath, cipherBytes, { contentType: 'application/octet-stream' })
      if (error) throw error

      return { imagePath, mimeType }
    } finally {
      uploading.value = false
    }
  }

  return { uploading, uploadImage }
}
