import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useSharedPrayerContextsStore } from 'stores/sharedPrayerContexts'
import {
  decryptSharedPrayerText,
  encryptSharedPrayerText,
  sharedPrayerDekFromInviteCode,
} from 'src/utils/sharedPrayerCrypto'

export const useSharedPrayerRequestGroupsStore = defineStore('sharedPrayerRequestGroups', () => {
  const groups = ref([])
  const loading = ref(false)

  const activeSharedGroup = () => {
    const contextsStore = useSharedPrayerContextsStore()
    if (!contextsStore.activeGroup?.id) throw new Error('No shared prayer group selected')
    return contextsStore.activeGroup
  }

  const activeGroupDek = async () => {
    const group = activeSharedGroup()
    if (!group.invite_code) throw new Error('No shared prayer invite code available')
    return sharedPrayerDekFromInviteCode(group.invite_code)
  }

  const decryptGroupRow = async (row, groupDek) => ({
    ...row,
    shared_group_id: row.group_id,
    encryptedName: row.name,
    name: (await decryptSharedPrayerText(row.name, groupDek)) || '',
  })

  const groupNameExists = (name, exceptId = null) => {
    const normalized = name.trim().toLowerCase()
    return groups.value.some((group) =>
      group.id !== exceptId && group.name.trim().toLowerCase() === normalized,
    )
  }

  const fetchGroups = async () => {
    loading.value = true
    try {
      const sharedGroup = activeSharedGroup()
      const groupDek = await activeGroupDek()
      const { data, error } = await supabase
        .from('shared_prayer_request_groups')
        .select('*')
        .eq('group_id', sharedGroup.id)
        .order('position', { ascending: true })
      if (error) throw error

      groups.value = await Promise.all((data || []).map((row) => decryptGroupRow(row, groupDek)))
    } finally {
      loading.value = false
    }
  }

  const addGroup = async (name) => {
    if (groupNameExists(name)) {
      const error = new Error('A group with that name already exists')
      error.code = '23505'
      throw error
    }

    const sharedGroup = activeSharedGroup()
    const groupDek = await activeGroupDek()
    const encryptedName = await encryptSharedPrayerText(name, groupDek)
    const position = groups.value.length ? Math.max(...groups.value.map((group) => group.position)) + 1 : 0

    const { data, error } = await supabase
      .from('shared_prayer_request_groups')
      .insert({ group_id: sharedGroup.id, name: encryptedName, position })
      .select()
      .single()
    if (error) throw error

    const group = { ...data, shared_group_id: data.group_id, encryptedName, name }
    groups.value.push(group)
    return group
  }

  const renameGroup = async (id, name) => {
    if (groupNameExists(name, id)) {
      const error = new Error('A group with that name already exists')
      error.code = '23505'
      throw error
    }

    const groupDek = await activeGroupDek()
    const encryptedName = await encryptSharedPrayerText(name, groupDek)
    const { error } = await supabase
      .from('shared_prayer_request_groups')
      .update({ name: encryptedName, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    const group = groups.value.find((item) => item.id === id)
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
          .from('shared_prayer_request_groups')
          .update({ position, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      }),
    )

    updates.forEach(({ id, position }) => {
      const group = groups.value.find((item) => item.id === id)
      if (group) group.position = position
    })
  }

  const deleteGroup = async (id) => {
    const { error } = await supabase.from('shared_prayer_request_groups').delete().eq('id', id)
    if (error) throw error
    groups.value = groups.value.filter((group) => group.id !== id)
  }

  return { groups, loading, fetchGroups, addGroup, renameGroup, reorderGroups, deleteGroup }
})
