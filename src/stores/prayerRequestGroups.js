import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData, decryptData } from 'src/utils/encryption'
import { isV2 } from 'src/utils/cryptoPrimitives'
import { demoModeActive } from 'src/utils/demoMode'

// Real, persisted prayer request groups (see sql/Prayer Request Groups
// Table.sql for why this replaced the old freeform group_name text column:
// a group with no prayers in it needs its own row to survive a refresh).
// Group names aren't encrypted — unlike prayer content/notes, a group label
// is just an organizational tag, not the personal content itself.
export const usePrayerRequestGroupsStore = defineStore('prayerRequestGroups', () => {
  const groups = ref([])
  const loading = ref(false)

  const decryptGroupRow = async (row, encryptionKey) => {
    if (!row?.name) return { ...row, name: '' }
    if (!isV2(row.name)) return { ...row, encryptedName: row.name }
    return {
      ...row,
      encryptedName: row.name,
      name: (await decryptData(row.name, encryptionKey)) || '',
    }
  }

  const migratePlaintextGroupNames = async (rows, encryptionKey) => {
    const plaintextRows = rows.filter((row) => row.encryptedName && !isV2(row.encryptedName))
    if (plaintextRows.length === 0) return

    await Promise.all(
      plaintextRows.map(async (row) => {
        const encryptedName = await encryptData(row.name, encryptionKey)
        const { error } = await supabase
          .from('prayer_request_groups')
          .update({ name: encryptedName, updated_at: new Date().toISOString() })
          .eq('id', row.id)
        if (error) throw error
        row.encryptedName = encryptedName
      }),
    )
  }

  const groupNameExists = (name, exceptId = null) => {
    const normalized = name.trim().toLowerCase()
    return groups.value.some((group) =>
      group.id !== exceptId && group.name.trim().toLowerCase() === normalized,
    )
  }

  const fetchGroups = async () => {
    // See usePrayerRequestsStore().fetchRequests()'s identical guard — the
    // demo swap in src/stores/tutorial.js populates `groups` directly.
    if (demoModeActive.value) return
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('prayer_request_groups')
        .select('*')
        .eq('user_id', session.user.id)
        .order('position', { ascending: true })

      if (error) throw error
      const encryptionKey = await getEncryptionKey(session.user.id)
      const decryptedRows = await Promise.all((data || []).map((row) => decryptGroupRow(row, encryptionKey)))
      groups.value = decryptedRows
      await migratePlaintextGroupNames(decryptedRows, encryptionKey)
    } catch (error) {
      console.error('Error fetching prayer request groups:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // New groups append after existing ones, matching the previous UX where
  // "New Group" landed right before Miscellaneous.
  const addGroup = async (name) => {
    if (groupNameExists(name)) {
      const error = new Error('A group with that name already exists')
      error.code = '23505'
      throw error
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const encryptionKey = await getEncryptionKey(session.user.id)
    const encryptedName = await encryptData(name, encryptionKey)
    const position = groups.value.length ? Math.max(...groups.value.map((g) => g.position)) + 1 : 0

    const { data, error } = await supabase
      .from('prayer_request_groups')
      .insert({ user_id: session.user.id, name: encryptedName, position })
      .select()
      .single()

    if (error) throw error

    const group = { ...data, encryptedName, name }
    groups.value.push(group)
    return group
  }

  const renameGroup = async (id, name) => {
    if (groupNameExists(name, id)) {
      const error = new Error('A group with that name already exists')
      error.code = '23505'
      throw error
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const encryptionKey = await getEncryptionKey(session.user.id)
    const encryptedName = await encryptData(name, encryptionKey)

    const { error } = await supabase
      .from('prayer_request_groups')
      .update({ name: encryptedName, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    const group = groups.value.find((g) => g.id === id)
    if (group) {
      group.name = name
      group.encryptedName = encryptedName
    }
  }

  const reorderGroups = async (orderedIds) => {
    const updates = orderedIds.map((id, index) => ({ id, position: index }))

    await Promise.all(
      updates.map(async ({ id, position }) => {
        const { error } = await supabase
          .from('prayer_request_groups')
          .update({ position, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      }),
    )

    updates.forEach(({ id, position }) => {
      const group = groups.value.find((g) => g.id === id)
      if (group) group.position = position
    })
  }

  // The FK's ON DELETE SET NULL clears group_id on member prayers
  // server-side automatically — callers just need to mirror that in the
  // prayer requests store's local cache themselves.
  const deleteGroup = async (id) => {
    const { error } = await supabase.from('prayer_request_groups').delete().eq('id', id)
    if (error) throw error
    groups.value = groups.value.filter((g) => g.id !== id)
  }

  return { groups, loading, fetchGroups, addGroup, renameGroup, reorderGroups, deleteGroup }
})
