import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData, decryptData } from 'src/utils/encryption'
import { demoModeActive } from 'src/utils/demoMode'

const toDateValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

// Prayer requests, encrypted client-side the same way journal entries are
// (see src/utils/encryption.js) since this is personal content.
export const usePrayerRequestsStore = defineStore('prayerRequests', () => {
  const requests = ref([])
  const loading = ref(false)

  const fetchRequests = async () => {
    // src/stores/tutorial.js swaps `requests` for demo content directly
    // during a "Show with sample data" run — a real fetch here (e.g. from
    // this component re-mounting mid-tour) would silently overwrite that
    // swap with the real account's data.
    if (demoModeActive.value) return
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('position', { ascending: true })

      if (error) throw error

      const encryptionKey = await getEncryptionKey(session.user.id)
      requests.value = await Promise.all(
        data.map(async (row) => ({
          ...row,
          decryptedContent: (await decryptData(row.content, encryptionKey)) || '',
          decryptedAnswerNote: row.answer_note ? await decryptData(row.answer_note, encryptionKey) : null,
        })),
      )
    } catch (error) {
      console.error('Error fetching prayer requests:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const addRequest = async (content, groupId) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const encryptionKey = await getEncryptionKey(session.user.id)
    const encryptedContent = await encryptData(content, encryptionKey)
    // New requests lead the list, matching the previous newest-first order
    const position = Math.min(0, ...requests.value.map((r) => r.position)) - 1

    const { data, error } = await supabase
      .from('prayer_requests')
      .insert({
        user_id: session.user.id,
        content: encryptedContent,
        group_id: groupId || null,
        position,
      })
      .select()
      .single()

    if (error) throw error

    requests.value.unshift({ ...data, decryptedContent: content, decryptedAnswerNote: null })
    return data
  }

  const updateFollowUp = async (id, followUpDate) => {
    const nextDate = followUpDate || null
    const { error } = await supabase
      .from('prayer_requests')
      .update({ follow_up_date: nextDate, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    const index = requests.value.findIndex((r) => r.id === id)
    if (index !== -1) {
      requests.value[index] = { ...requests.value[index], follow_up_date: nextDate }
    }
  }

  const markFollowedUp = async (id) => {
    const followedAt = new Date().toISOString()
    const { error } = await supabase
      .from('prayer_requests')
      .update({
        follow_up_date: null,
        last_followed_up_at: followedAt,
        updated_at: followedAt,
      })
      .eq('id', id)

    if (error) throw error

    const index = requests.value.findIndex((r) => r.id === id)
    if (index !== -1) {
      requests.value[index] = {
        ...requests.value[index],
        follow_up_date: null,
        last_followed_up_at: followedAt,
      }
    }
  }

  const snoozeFollowUp = async (id, days = 7) => {
    const next = new Date()
    next.setDate(next.getDate() + days)
    const nextDate = toDateValue(next)
    await updateFollowUp(id, nextDate)
  }

  // Persists a full reorder/regroup in one go — items is the final flat
  // order across all groups (as displayed), each tagged with the group it
  // now belongs to. Positions stay globally monotonic across all groups
  // (not reset per-group), which still sorts correctly within any one
  // group's subset.
  const reorder = async (items) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const updatedAt = new Date().toISOString()
    const updates = items.map((item, index) => ({
      id: item.id,
      user_id: session.user.id,
      position: index,
      group_id: item.group_id || null,
      updated_at: updatedAt,
    }))
    if (updates.length === 0) return

    const { error } = await supabase
      .from('prayer_requests')
      .upsert(updates, { onConflict: 'id' })
    if (error) throw error

    updates.forEach(({ id, position, group_id }) => {
      const req = requests.value.find((r) => r.id === id)
      if (req) {
        req.position = position
        req.group_id = group_id
      }
    })
  }

  const updateContent = async (id, content) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const encryptionKey = await getEncryptionKey(session.user.id)
    const encryptedContent = await encryptData(content, encryptionKey)

    const { error } = await supabase
      .from('prayer_requests')
      .update({ content: encryptedContent, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    const index = requests.value.findIndex((r) => r.id === id)
    if (index !== -1) {
      requests.value[index] = { ...requests.value[index], content: encryptedContent, decryptedContent: content }
    }
  }

  // Marking answered accepts an optional note on how it was answered;
  // reopening always clears that note so a re-answer starts fresh
  const markAnswered = async (id, answerNote) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const encryptionKey = await getEncryptionKey(session.user.id)
    const encryptedNote = answerNote ? await encryptData(answerNote, encryptionKey) : null

    const { error } = await supabase
      .from('prayer_requests')
      .update({
        status: 'answered',
        answer_note: encryptedNote,
        answered_at: new Date().toISOString(),
        follow_up_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    const index = requests.value.findIndex((r) => r.id === id)
    if (index !== -1) {
      requests.value[index] = {
        ...requests.value[index],
        status: 'answered',
        answered_at: new Date().toISOString(),
        follow_up_date: null,
        decryptedAnswerNote: answerNote || null,
      }
    }
  }

  const reopenRequest = async (id) => {
    const { error } = await supabase
      .from('prayer_requests')
      .update({ status: 'active', answer_note: null, answered_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    const index = requests.value.findIndex((r) => r.id === id)
    if (index !== -1) {
      requests.value[index] = {
        ...requests.value[index],
        status: 'active',
        answer_note: null,
        decryptedAnswerNote: null,
        answered_at: null,
      }
    }
  }

  const deleteRequest = async (id) => {
    const { error } = await supabase.from('prayer_requests').delete().eq('id', id)
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
    reorder,
    markAnswered,
    reopenRequest,
    deleteRequest,
  }
})
