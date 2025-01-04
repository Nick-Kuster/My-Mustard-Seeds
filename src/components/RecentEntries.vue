<template>
  <div class="q-mt-lg">
    <h5 class="text-h6 q-mb-md">Last 5 Seeds Planted</h5>
    <div v-if="loading" class="text-center">
      <q-spinner color="primary" size="2em" />
    </div>
    <div v-else-if="entries.length === 0" class="text-center text-grey">
      No seeds planted yet. Start your journey by planting your first seed.
    </div>
    <q-list v-else bordered separator>
      <q-item v-for="entry in entries" :key="entry.id" clickable @click="viewEntry(entry.id)">
        <q-item-section>
          <q-item-label>{{ entry.title }}</q-item-label>
          <q-item-label caption>{{ formatDate(entry.created_at) }} • {{ entry.type }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'

const router = useRouter()
const entries = ref([])
const loading = ref(true)

const fetchRecentEntries = async () => {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, title, type, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error
    entries.value = data
  } catch (error) {
    console.error('Error fetching entries:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const viewEntry = (id) => {
  router.push({
    path: `/entry/${id}`,
    query: { from: 'home' }
  })
}

onMounted(() => {
  fetchRecentEntries()
})
</script>
