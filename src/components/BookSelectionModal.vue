<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6">Select Book</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>

        <!-- Book list -->
        <div v-if="!showAddForm">
          <!-- Search field -->
          <q-input v-model="searchTerm" label="Search books" dense class="q-mb-md" clearable>
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else-if="filteredBooks.length === 0" class="text-center q-pa-md">
            No books found
          </div>
          <q-list v-else separator>
            <q-item v-for="book in filteredBooks" :key="book.id" clickable @click="selectBook(book)">
              <q-item-section>
                <q-item-label>{{ book.metadata.title }}</q-item-label>
                <q-item-label caption>by {{ book.metadata.author }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="text-center q-mt-md">
            <q-btn flat color="primary" label="Add New Book" @click="showAddForm = true" />
          </div>
        </div>

        <!-- Add book form -->
        <div v-else>
          <q-form @submit="addBook" class="q-gutter-md">
            <q-input v-model="newBook.title" label="Title *" :rules="[val => !!val || 'Title is required']" />
            <q-input v-model="newBook.author" label="Author *" :rules="[val => !!val || 'Author is required']" />

            <div class="row q-mt-lg">
              <q-btn flat label="Back" color="primary" @click="showAddForm = false" class="q-mr-sm" />
              <q-btn type="submit" label="Save" color="primary" :loading="saving" />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResourcesStore, RESOURCE_TYPES } from 'stores/resources'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const resourcesStore = useResourcesStore()
const loading = ref(false)
const saving = ref(false)
const searchTerm = ref('')
const showAddForm = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const newBook = ref({
  title: '',
  author: ''
})

const filteredBooks = computed(() => {
  if (!searchTerm.value) return resourcesStore.bookResources
  const search = searchTerm.value.toLowerCase()
  return resourcesStore.bookResources.filter(book =>
    book.metadata.title.toLowerCase().includes(search) ||
    book.metadata.author.toLowerCase().includes(search)
  )
})

const selectBook = (book) => {
  emit('select', book)
  isOpen.value = false
}

const addBook = async () => {
  saving.value = true
  try {
    const book = await resourcesStore.addResource(RESOURCE_TYPES.BOOK, newBook.value)
    selectBook(book)
    showAddForm.value = false
    newBook.value = resourcesStore.getMetadataTemplate(RESOURCE_TYPES.BOOK)
  } catch (error) {
    console.error('Error adding book:', error)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await resourcesStore.loadResources()
  } finally {
    loading.value = false
  }
})
</script>
