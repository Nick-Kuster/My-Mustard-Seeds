import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'
import { Notify } from 'quasar'
import { supabase } from 'src/boot/supabase'
import {
  bytesToBase64,
  base64ToBytes,
  generateDekBytes,
  importDek,
  isV2,
  encryptJson,
  legacyKeyFromUserId,
  legacyDecrypt,
} from 'src/utils/cryptoPrimitives'

/**
 * Provides the AES-256-GCM data key for the session.
 *
 * The key lives in user_profiles.encryption_key (readable only by its owner
 * via RLS). On first use it is generated client-side and stored; afterwards
 * it is fetched transparently — no prompts. After the key is ready, legacy
 * XOR-encrypted rows are re-encrypted in the background.
 */
export const useEncryptionStore = defineStore('encryption', () => {
  const dek = shallowRef(null)
  const userId = ref(null)
  const migrating = ref(false)

  const isReady = computed(() => !!dek.value)

  let initPromise = null
  let authListenerRegistered = false

  const initialize = () => {
    if (!initPromise) {
      initPromise = doInitialize().catch((error) => {
        initPromise = null
        throw error
      })
    }
    return initPromise
  }

  const doInitialize = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      initPromise = null
      return null
    }
    userId.value = session.user.id

    // Drop the in-memory key on sign-out
    if (!authListenerRegistered) {
      authListenerRegistered = true
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          reset()
        }
      })
    }

    let { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, encryption_key')
      .eq('id', userId.value)
      .maybeSingle()
    if (error) throw error

    if (!profile?.encryption_key) {
      const newKey = bytesToBase64(generateDekBytes())

      if (profile) {
        // Fill only while still empty so the first device to write wins
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ encryption_key: newKey, updated_at: new Date().toISOString() })
          .eq('id', userId.value)
          .is('encryption_key', null)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .upsert(
            { id: userId.value, encryption_key: newKey },
            { onConflict: 'id', ignoreDuplicates: true },
          )
        if (insertError) throw insertError
      }

      // Re-read so a concurrent first login on another device converges
      // on whichever key actually landed
      const { data: confirmed, error: confirmError } = await supabase
        .from('user_profiles')
        .select('encryption_key')
        .eq('id', userId.value)
        .single()
      if (confirmError) throw confirmError
      profile = confirmed
    }

    dek.value = await importDek(base64ToBytes(profile.encryption_key))
    migrateLegacyRows()
    return dek.value
  }

  /**
   * Resolves with the data key, initializing (or creating the key) if
   * needed. Throws if there is no active session.
   */
  const waitForKey = async () => {
    if (dek.value) return dek.value
    const key = await initialize()
    if (!key) throw new Error('No active session')
    return key
  }

  const reset = () => {
    dek.value = null
    userId.value = null
    initPromise = null
  }

  /**
   * One-time, idempotent re-encryption of legacy XOR rows to AES-GCM.
   * Runs in the background; anything it misses still decrypts through the
   * legacy fallback, so partial runs are harmless and it retries next login.
   */
  const migrateLegacyRows = async () => {
    if (migrating.value) return
    migrating.value = true
    try {
      const legacyKey = legacyKeyFromUserId(userId.value)
      let migrated = 0

      const { data: entryRows, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id, content')
        .eq('user_id', userId.value)
      if (entriesError) throw entriesError

      for (const row of entryRows || []) {
        if (!row.content || isV2(row.content)) continue
        let plain
        try {
          plain = legacyDecrypt(row.content, legacyKey)
        } catch (error) {
          console.error(`Skipping entry ${row.id}: legacy decrypt failed`, error)
          continue
        }
        const reEncrypted = await encryptJson(plain, dek.value)
        const { error } = await supabase
          .from('journal_entries')
          .update({ content: reEncrypted, updated_at: new Date().toISOString() })
          .eq('id', row.id)
        if (error) throw error
        migrated++
      }

      const { data: quoteRows, error: quotesError } = await supabase
        .from('journal_quotes')
        .select('id, quote')
      if (quotesError) throw quotesError

      for (const row of quoteRows || []) {
        if (!row.quote || isV2(row.quote)) continue
        let plain
        try {
          plain = legacyDecrypt(row.quote, legacyKey)
        } catch (error) {
          console.error(`Skipping quote ${row.id}: legacy decrypt failed`, error)
          continue
        }
        const reEncrypted = await encryptJson(plain, dek.value)
        const { error } = await supabase
          .from('journal_quotes')
          .update({ quote: reEncrypted, updated_at: new Date().toISOString() })
          .eq('id', row.id)
        if (error) throw error
        migrated++
      }

      if (migrated > 0) {
        Notify.create({
          type: 'positive',
          message: `Upgraded encryption on ${migrated} item${migrated === 1 ? '' : 's'}`,
        })
      }
    } catch (error) {
      console.error('Encryption migration error (will retry next login):', error)
    } finally {
      migrating.value = false
    }
  }

  return {
    dek,
    isReady,
    migrating,
    initialize,
    waitForKey,
    reset,
  }
})
