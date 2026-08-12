import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useSharedPrayerContextsStore } from 'stores/sharedPrayerContexts'
import {
  decryptSharedPrayerText,
  encryptSharedPrayerText,
  sharedPrayerDekFromInviteCode,
} from 'src/utils/sharedPrayerCrypto'

const toDateValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

const toDisplayRequest = async (row, groupDek) => ({
  ...row,
  shared_group_id: row.group_id,
  group_id: row.request_group_id || null,
  decryptedContent: (await decryptSharedPrayerText(row.content, groupDek)) || '',
  decryptedAnswerNote: row.answer_note ? await decryptSharedPrayerText(row.answer_note, groupDek) : null,
})

export const useSharedPrayerRequestsStore = defineStore('sharedPrayerRequests', () => {
  const requests = ref([])
  const loading = ref(false)

  const activeSharedGroupId = () => {
    const contextsStore = useSharedPrayerContextsStore()
    if (!contextsStore.activeGroup?.id) throw new Error('No shared prayer group selected')
    return contextsStore.activeGroup.id
  }

  const activeGroupDek = async () => {
    const contextsStore = useSharedPrayerContextsStore()
    if (!contextsStore.activeGroup?.invite_code) throw new Error('No shared prayer invite code available')
    return sharedPrayerDekFromInviteCode(contextsStore.activeGroup.invite_code)
  }

  const fetchRequests = async () => {
    loading.value = true
    try {
      const groupId = activeSharedGroupId()
      const { data, error } = await supabase
        .from('shared_prayer_requests')
        .select('*')
        .eq('group_id', groupId)
        .order('position', { ascending: true })
      if (error) throw error

      const groupDek = await activeGroupDek()
      requests.value = await Promise.all((data || []).map((row) => toDisplayRequest(row, groupDek)))
    } finally {
      loading.value = false
    }
  }

  const addRequest = async (content, requestGroupId = null, followUpDate = null, followUpTime = null) => {
    const groupId = activeSharedGroupId()
    const groupDek = await activeGroupDek()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const position = Math.min(0, ...requests.value.map((r) => r.position)) - 1
    const { data, error } = await supabase
      .from('shared_prayer_requests')
      .insert({
        group_id: groupId,
        request_group_id: requestGroupId || null,
        created_by: session.user.id,
        content: await encryptSharedPrayerText(content, groupDek),
        follow_up_date: followUpDate || null,
        follow_up_time: followUpDate ? followUpTime || null : null,
        position,
      })
      .select()
      .single()
    if (error) throw error

    const request = await toDisplayRequest(data, groupDek)
    requests.value.unshift(request)
    return request
  }

  const updateFollowUp = async (id, followUpDate, followUpTime = null) => {
    const nextDate = followUpDate || null
    const nextTime = nextDate ? followUpTime || null : null
    const { error } = await supabase
      .from('shared_prayer_requests')
      .update({ follow_up_date: nextDate, follow_up_time: nextTime, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    const request = requests.value.find((r) => r.id === id)
    if (request) {
      request.follow_up_date = nextDate
      request.follow_up_time = nextTime
    }
  }

  const markFollowedUp = async (id) => {
    const followedAt = new Date().toISOString()
    const { error } = await supabase
      .from('shared_prayer_requests')
      .update({
        follow_up_date: null,
        follow_up_time: null,
        last_followed_up_at: followedAt,
        updated_at: followedAt,
      })
      .eq('id', id)
    if (error) throw error

    const request = requests.value.find((r) => r.id === id)
    if (request) {
      request.follow_up_date = null
      request.follow_up_time = null
      request.last_followed_up_at = followedAt
    }
  }

  const snoozeFollowUp = async (id, days = 7, followUpTime = null) => {
    const next = new Date()
    next.setDate(next.getDate() + days)
    await updateFollowUp(id, toDateValue(next), followUpTime)
  }

  const updateContent = async (id, content) => {
    const groupDek = await activeGroupDek()
    const encryptedContent = await encryptSharedPrayerText(content, groupDek)
    const { error } = await supabase
      .from('shared_prayer_requests')
      .update({ content: encryptedContent, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    const request = requests.value.find((r) => r.id === id)
    if (request) {
      request.content = encryptedContent
      request.decryptedContent = content
    }
  }

  const markAnswered = async (id, answerNote) => {
    const groupDek = await activeGroupDek()
    const encryptedAnswerNote = answerNote ? await encryptSharedPrayerText(answerNote, groupDek) : null
    const answeredAt = new Date().toISOString()
    const { error } = await supabase
      .from('shared_prayer_requests')
      .update({
        status: 'answered',
        answer_note: encryptedAnswerNote,
        answered_at: answeredAt,
        follow_up_date: null,
        follow_up_time: null,
        updated_at: answeredAt,
      })
      .eq('id', id)
    if (error) throw error

    const request = requests.value.find((r) => r.id === id)
    if (request) {
      request.status = 'answered'
      request.answer_note = encryptedAnswerNote
      request.decryptedAnswerNote = answerNote || null
      request.answered_at = answeredAt
      request.follow_up_date = null
      request.follow_up_time = null
    }
  }

  const reopenRequest = async (id) => {
    const { error } = await supabase
      .from('shared_prayer_requests')
      .update({ status: 'active', answer_note: null, answered_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    const request = requests.value.find((r) => r.id === id)
    if (request) {
      request.status = 'active'
      request.answer_note = null
      request.decryptedAnswerNote = null
      request.answered_at = null
    }
  }

  const deleteRequest = async (id) => {
    const { error } = await supabase.from('shared_prayer_requests').delete().eq('id', id)
    if (error) throw error
    requests.value = requests.value.filter((r) => r.id !== id)
  }

  return {
    requests,
    loading,
    fetchRequests,
    addRequest,
    updateFollowUp,
    markFollowedUp,
    snoozeFollowUp,
    updateContent,
    markAnswered,
    reopenRequest,
    deleteRequest,
  }
})
