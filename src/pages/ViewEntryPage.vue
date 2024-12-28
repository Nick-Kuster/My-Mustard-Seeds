<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>

        <template v-else>
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-h5">{{ entry.title }}</div>
              <div class="text-caption text-grey">
                {{ formatDate(entry.created_at) }} • {{ entry.type }}
              </div>
            </div>
            <div class="col-auto">
              <div class="row q-gutter-sm">
                <q-btn rounded unelevated color="negative" icon="delete" style="height: 40px" @click="confirmDelete" />
                <q-btn rounded unelevated color="grey" label="Back" @click="router.push('/')" style="height: 40px" />
              </div>
            </div>
          </div>

          <template v-if="decryptedContent">
            <div v-for="(section, key) in decryptedContent" :key="key" class="q-mb-lg">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ section.title }}</div>
              <div class="text-body1" style="white-space: pre-wrap">{{ section.content }}</div>
            </div>
          </template>

          <div v-else class="text-center text-grey q-pa-lg">
            Unable to decrypt entry content
          </div>
        </template>

        <!-- Delete Confirmation Dialog -->
        <q-dialog v-model="showDeleteDialog" persistent>
          <q-card style="min-width: 300px">
            <q-card-section>
              <div class="text-h6">Delete Entry</div>
            </q-card-section>

            <q-card-section>
              Are you sure you want to delete this entry? This action cannot be undone.
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup />
              <q-btn flat label="Delete" color="negative" :loading="deleting" @click="deleteEntry" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, decryptData } from 'src/utils/encryption'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const entry = ref(null)
const decryptedContent = ref(null)
const loading = ref(true)
const showDeleteDialog = ref(false)
const deleting = ref(false)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchEntry = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Entry not found')

    if (data.user_id !== session.user.id) {
      throw new Error('Unauthorized')
    }

    entry.value = data

    const encryptionKey = await getEncryptionKey(session.user.id)
    const decrypted = await decryptData(data.content, encryptionKey)
    decryptedContent.value = decrypted

    if (!decrypted) {
      $q.notify({
        type: 'negative',
        message: 'Unable to decrypt entry content'
      })
    }
  } catch (error) {
    console.error('Error fetching entry:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Error loading entry'
    })
    router.push('/')
  } finally {
    loading.value = false
  }
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const deleteEntry = async () => {
  deleting.value = true
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', route.params.id)

    if (error) throw error

    showDeleteDialog.value = false
    $q.notify({
      type: 'positive',
      message: 'Entry deleted successfully'
    })
    router.push('/')
  } catch (error) {
    console.error('Error deleting entry:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to delete entry'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchEntry()
})
</script>
