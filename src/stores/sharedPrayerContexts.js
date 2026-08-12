import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from 'src/boot/supabase'

const PERSONAL_CONTEXT_ID = 'personal'
const STORAGE_KEY = 'mustardSeedsPrayerContextId'

const makeInviteCode = () => {
  const bytes = new Uint8Array(12)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const useSharedPrayerContextsStore = defineStore('sharedPrayerContexts', () => {
  const groups = ref([])
  const memberships = ref([])
  const loading = ref(false)
  const activeContextId = ref(localStorage.getItem(STORAGE_KEY) || PERSONAL_CONTEXT_ID)

  const activeGroup = computed(() =>
    groups.value.find((group) => group.id === activeContextId.value) || null,
  )

  const activeMembership = computed(() =>
    memberships.value.find((membership) => membership.group_id === activeContextId.value) || null,
  )

  const isPersonalContext = computed(() => activeContextId.value === PERSONAL_CONTEXT_ID || !activeGroup.value)

  const contextOptions = computed(() => [
    { id: PERSONAL_CONTEXT_ID, label: 'Personal', description: 'Private prayer list', icon: 'person' },
    ...groups.value.map((group) => ({
      id: group.id,
      label: group.name,
      description: memberships.value.find((membership) => membership.group_id === group.id)?.role === 'owner'
        ? 'Shared prayer group'
        : 'Shared with you',
      icon: 'groups',
      group,
    })),
  ])

  const setActiveContext = (contextId) => {
    const next = contextId || PERSONAL_CONTEXT_ID
    activeContextId.value = next
    localStorage.setItem(STORAGE_KEY, next)
  }

  const loadGroups = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data: memberRows, error: memberError } = await supabase
        .from('shared_prayer_group_members')
        .select('group_id, user_id, role, joined_at')
        .eq('user_id', session.user.id)
      if (memberError) throw memberError

      memberships.value = memberRows || []

      if (!memberships.value.length) {
        groups.value = []
        if (activeContextId.value !== PERSONAL_CONTEXT_ID) setActiveContext(PERSONAL_CONTEXT_ID)
        return
      }

      const { data: groupRows, error: groupError } = await supabase
        .from('shared_prayer_groups')
        .select('*')
        .in('id', memberships.value.map((membership) => membership.group_id))
        .order('created_at', { ascending: true })
      if (groupError) throw groupError

      groups.value = groupRows || []
      if (activeContextId.value !== PERSONAL_CONTEXT_ID && !groups.value.some((group) => group.id === activeContextId.value)) {
        setActiveContext(PERSONAL_CONTEXT_ID)
      }
    } finally {
      loading.value = false
    }
  }

  const createGroup = async (name) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const { data, error: groupError } = await supabase.rpc('create_shared_prayer_group', {
      p_name: name,
      p_invite_code: makeInviteCode(),
    })
    if (groupError) throw groupError

    const group = Array.isArray(data) ? data[0] : data
    if (!group?.id) throw new Error('Shared group was not created')

    const membership = {
      group_id: group.id,
      user_id: session.user.id,
      role: 'owner',
    }
    groups.value.push(group)
    memberships.value.push(membership)
    setActiveContext(group.id)
    return group
  }

  const joinByInviteCode = async (inviteCode) => {
    const { data, error } = await supabase.rpc('join_shared_prayer_group', {
      p_invite_code: inviteCode,
    })
    if (error) throw error

    await loadGroups()
    const joined = Array.isArray(data) ? data[0] : data
    const joinedGroupId = joined?.shared_group_id || joined?.group_id
    if (joinedGroupId) setActiveContext(joinedGroupId)
    return joined
  }

  const inviteUrlForGroup = (group) => {
    if (!group?.invite_code) return ''
    return `${window.location.origin}/join-prayer/${group.invite_code}`
  }

  return {
    PERSONAL_CONTEXT_ID,
    groups,
    memberships,
    loading,
    activeContextId,
    activeGroup,
    activeMembership,
    isPersonalContext,
    contextOptions,
    setActiveContext,
    loadGroups,
    createGroup,
    joinByInviteCode,
    inviteUrlForGroup,
  }
})
