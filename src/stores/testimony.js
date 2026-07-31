import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData, decryptData } from 'src/utils/encryption'

// A single, evolving testimony write-up per user (one row, like
// user_preferences) — encrypted client-side the same way journal entries
// are (see src/utils/encryption.js).
export const useTestimonyStore = defineStore('testimony', () => {
  const content = ref('')
  const loaded = ref(false)
  const loading = ref(false)
  const saving = ref(false)

  const load = async () => {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('testimonies')
        .select('content')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) throw error

      if (data?.content) {
        const encryptionKey = await getEncryptionKey(session.user.id)
        content.value = (await decryptData(data.content, encryptionKey)) || ''
      }
      loaded.value = true
    } catch (error) {
      console.error('Error loading testimony:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const save = async (text) => {
    saving.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const encryptionKey = await getEncryptionKey(session.user.id)
      const encryptedContent = await encryptData(text, encryptionKey)

      const { error } = await supabase.from('testimonies').upsert(
        {
          user_id: session.user.id,
          content: encryptedContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

      if (error) throw error
      content.value = text
    } catch (error) {
      console.error('Error saving testimony:', error)
      throw error
    } finally {
      saving.value = false
    }
  }

  return { content, loaded, loading, saving, load, save }
})
