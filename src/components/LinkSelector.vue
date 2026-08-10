<template>
  <div class="q-mb-lg">
    <div v-if="!displayOnly" class="row items-center no-wrap q-mb-sm section-header" role="button" @click="addNewLink">
      <div class="text-subtitle1 text-weight-medium">Add Link</div>
      <q-btn flat round dense color="info" icon="link" class="q-ml-xs" />
    </div>
    <div v-else class="row items-center no-wrap q-mb-sm display-header">
      <div class="text-subtitle1 text-weight-medium">Links</div>
    </div>

    <div v-if="links.length > 0" class="q-gutter-y-sm">
      <div v-for="(link, index) in links" :key="index" class="link-item">
        <div class="row items-start">
          <div class="col">
            <a v-if="displayOnly" href="#" class="text-weight-medium reference-search-link"
              @click.prevent="openLinkSearch(link)">
              {{ link.name }}
            </a>
            <div v-else class="text-weight-medium">{{ link.name }}</div>
            <div class="text-caption text-grey-8 link-url">
              {{ link.url }}
            </div>
          </div>
          <div class="col-auto">
            <div class="row q-gutter-x-xs">
              <q-btn flat round dense color="info" icon="open_in_new" size="sm" @click="openLink(link.url)" />
              <q-btn v-if="!displayOnly" flat round dense color="primary" icon="edit" size="sm"
                @click="editLink(index)" />
              <q-btn v-if="!displayOnly" flat round dense color="negative" icon="delete" size="sm"
                @click="removeLink(index)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <LinkSelectionModal v-model="showModal" :edit-data="editingLink" @select="onLinkSelect" @update="onLinkUpdate" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import LinkSelectionModal from './LinkSelectionModal.vue'
import { openSafeExternalUrl } from 'src/utils/urlUtils'
import { searchRouteForFacet } from 'src/utils/searchRoute'

const $q = useQuasar()
const router = useRouter()

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  displayOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const showModal = ref(false)
const links = ref(props.modelValue || [])
const currentEditIndex = ref(null)
const editingLink = ref(null)

watch(() => props.modelValue, (newValue) => {
  links.value = [...newValue]
}, { immediate: true, deep: true })

const onLinkSelect = (linkData) => {
  links.value.push(linkData)
  emit('update:modelValue', links.value)
}

const onLinkUpdate = (updatedLink) => {
  if (currentEditIndex.value !== null) {
    links.value[currentEditIndex.value] = {
      ...links.value[currentEditIndex.value],
      name: updatedLink.name,
      url: updatedLink.url
    }
    currentEditIndex.value = null
    emit('update:modelValue', links.value)
  }
}

const addNewLink = () => {
  currentEditIndex.value = null
  editingLink.value = null
  showModal.value = true
}

const editLink = (index) => {
  currentEditIndex.value = index
  editingLink.value = {
    name: links.value[index].name,
    url: links.value[index].url
  }
  showModal.value = true
}

const removeLink = (index) => {
  links.value.splice(index, 1)
  emit('update:modelValue', links.value)
}

const openLink = (url) => {
  if (!openSafeExternalUrl(url)) {
    $q.notify({ type: 'negative', message: 'This link is not a valid http(s) URL and was not opened' })
  }
}

const openLinkSearch = (link) => {
  if (!props.displayOnly || !link?.name) return
  router.push(searchRouteForFacet('links', link.name))
}
</script>

<style scoped>
.section-header {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background: var(--color-hover);
}

.section-header .q-btn {
  pointer-events: none;
}

.link-item {
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--color-surface-muted);
  border-left: 3px solid #0d6efd;
}

.link-url {
  word-break: break-all;
  line-height: 1.3;
}

.reference-search-link {
  color: var(--q-primary);
  text-decoration: underline;
  text-decoration-style: dotted;
}
</style>
