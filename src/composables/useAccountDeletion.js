import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useAuthStore } from 'src/stores/auth'
import { useResourcesStore } from 'src/stores/resources'

// Explicit, ordered deletes across every user-owned table — mirrors the
// app's own established convention (tags.js's deleteTags, resources.js's
// deleteResource both delete join-table rows first rather than trusting
// undocumented FK cascade behavior). journal_quotes/related_links/
// journal_verses have no user_id column of their own (confirmed via
// sql/Journal Strongs Table.sql's comment and the RPC's journal_id-keyed
// joins) — those are filtered by journal_id against this user's own entry
// ids, fetched first.
const wipeAllUserData = async (userId) => {
  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', userId)
  if (entriesError) throw entriesError

  const entryIds = (entries || []).map((e) => e.id)

  const runDelete = async (table, column, value) => {
    const { error } = await supabase.from(table).delete().in(column, value)
    if (error) throw error
  }
  const runDeleteEq = async (table, column, value) => {
    const { error } = await supabase.from(table).delete().eq(column, value)
    if (error) throw error
  }

  if (entryIds.length > 0) {
    await runDelete('journal_quotes', 'journal_id', entryIds)
    await runDelete('related_links', 'journal_id', entryIds)
    await runDelete('journal_verses', 'journal_id', entryIds)
    await runDelete('journal_tags', 'journal_id', entryIds)
  }

  await runDeleteEq('journal_resources', 'user_id', userId)
  await runDeleteEq('journal_strongs', 'user_id', userId)
  await runDeleteEq('journal_entries', 'user_id', userId)
  await runDeleteEq('resource_resources', 'user_id', userId)
  await runDeleteEq('resources', 'user_id', userId)
  await runDeleteEq('tags', 'user_id', userId)
  await runDeleteEq('prayer_requests', 'user_id', userId)
  await runDeleteEq('prayer_request_groups', 'user_id', userId)
  await runDeleteEq('saved_filters', 'user_id', userId)
  await runDeleteEq('testimonies', 'user_id', userId)
  await runDeleteEq('user_preferences', 'user_id', userId)
  await runDeleteEq('profiles', 'id', userId)
  await runDeleteEq('user_profiles', 'id', userId)

  useResourcesStore().clearCache()
}

// Encrypted image attachments live in Storage, not a table, so they aren't
// covered by wipeAllUserData above or any FK cascade — every object this
// user uploaded lives under the `${userId}/...` prefix (see
// src/composables/useImageUpload.js), so listing that one "folder" is
// enough to find and remove all of it without a metadata table to keep in
// sync.
const wipeAllUserStorage = async (userId) => {
  const { data: files, error: listError } = await supabase.storage.from('journal-images').list(userId)
  if (listError) throw listError

  if (files?.length) {
    const paths = files.map((file) => `${userId}/${file.name}`)
    const { error: removeError } = await supabase.storage.from('journal-images').remove(paths)
    if (removeError) throw removeError
  }
}

export function useAccountDeletion() {
  const deleting = ref(false)
  // 'wiping-data' | 'deleting-account' | null
  const step = ref(null)
  const error = ref('')

  const deleteAccount = async () => {
    deleting.value = true
    error.value = ''
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      step.value = 'wiping-data'
      await wipeAllUserData(session.user.id)
      await wipeAllUserStorage(session.user.id)

      step.value = 'deleting-account'
      const { error: functionError } = await supabase.functions.invoke('delete-account')
      if (functionError) {
        // Data is already gone at this point, but the auth record itself
        // is still there — leave the user signed in (their session is
        // still valid) so they can see this error and retry the account
        // deletion specifically, rather than signing them out into a
        // half-deleted state they can't act on. Re-running the wipe on
        // retry is harmless (deleting already-gone rows is a 0-row no-op).
        throw new Error(
          'Your data was deleted, but your account sign-in could not be removed. Please try again.',
        )
      }

      await useAuthStore().signOut()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete your account.'
      throw err
    } finally {
      deleting.value = false
      step.value = null
    }
  }

  return { deleting, step, error, deleteAccount }
}
