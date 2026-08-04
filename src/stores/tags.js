import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

// Tags aren't encrypted — like a group label, a tag name is an
// organizational label, not personal journal content.
export const useTagsStore = defineStore('tags', () => {
  const tags = ref([])
  const loading = ref(false)

  const fetchTags = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')

      if (error) throw error
      tags.value = data
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTag = async (name) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: session.user.id, name })
      .select()
      .single()

    if (error) throw error

    tags.value.push(data)
    tags.value.sort((a, b) => a.name.localeCompare(b.name))
    return data
  }

  // Removes journal_tags rows for these tags first, so this doesn't depend
  // on the FK having ON DELETE CASCADE configured — same reasoning as
  // group_id's FK for prayer requests, just handled explicitly here since
  // journal_tags is a many-to-many join table, not a nullable column.
  const deleteTags = async (ids) => {
    const { error: linkError } = await supabase.from('journal_tags').delete().in('tag_id', ids)
    if (linkError) throw linkError

    const { error } = await supabase.from('tags').delete().in('id', ids)
    if (error) throw error

    tags.value = tags.value.filter((t) => !ids.includes(t.id))
  }

  return { tags, loading, fetchTags, createTag, deleteTags }
})
