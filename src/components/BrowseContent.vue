<template>
  <div class="browse-content">
    <q-list>
      <!-- Navigation Breadcrumbs -->
      <div class="row items-center q-mb-md" v-if="navigationStack.length > 0">
        <q-btn flat dense icon="arrow_back" @click="navigateBack" class="q-mr-sm" />
        <div class="text-caption text-grey">
          <template v-for="(item, index) in navigationStack" :key="index">
            <span class="cursor-pointer hover-underline" @click="navigateToIndex(index)">{{ item.title }}</span>
            <span v-if="index < navigationStack.length - 1"> / </span>
          </template>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="resourcesStore.loading" class="text-center q-pa-md">
        <q-spinner color="primary" size="2em" />
        <div class="text-grey q-mt-sm">Loading resources...</div>
      </div>

      <template v-else>
        <!-- Main Menu -->
        <template v-if="navigationStack.length === 0">
          <!-- View All Resources Button -->
          <q-item clickable v-ripple @click="navigateToSearch()" class="view-all-item">
            <q-item-section avatar>
              <q-icon name="grid_view" />
            </q-item-section>
            <q-item-section>View All Resources</q-item-section>
          </q-item>

          <q-separator spaced />

          <q-item clickable v-ripple @click="navigateToSearch('Bible')">
            <q-item-section avatar>
              <q-icon name="auto_stories" />
            </q-item-section>
            <q-item-section>Bible Study</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateToResourceType(RESOURCE_TYPES.PASTOR)">
            <q-item-section avatar>
              <q-icon name="record_voice_over" />
            </q-item-section>
            <q-item-section>Sermons</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateToResourceType(RESOURCE_TYPES.AUTHOR)">
            <q-item-section avatar>
              <q-icon name="menu_book" />
            </q-item-section>
            <q-item-section>Books</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateToResourceType(RESOURCE_TYPES.SONG_ARTIST)">
            <q-item-section avatar>
              <q-icon name="music_note" />
            </q-item-section>
            <q-item-section>Songs</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateToResourceType(RESOURCE_TYPES.MINISTRY)">
            <q-item-section avatar>
              <q-icon name="groups" />
            </q-item-section>
            <q-item-section>Ministries</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateToResourceType(RESOURCE_TYPES.CHURCH)">
            <q-item-section avatar>
              <q-icon name="church" />
            </q-item-section>
            <q-item-section>Churches</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateToResourceType(RESOURCE_TYPES.SHOW)">
            <q-item-section avatar>
              <q-icon name="smart_display" />
            </q-item-section>
            <q-item-section>Shows</q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </template>

        <!-- Sub-level navigation -->
        <template v-else>
          <div class="text-h6 q-px-md q-pt-md q-mb-sm">{{ currentView.title }}</div>

          <!-- View All Resources for current type -->
          <q-item clickable v-ripple @click="navigateToCurrentLevelSearch" class="view-all-item">
            <q-item-section avatar>
              <q-icon name="grid_view" />
            </q-item-section>
            <q-item-section>View All {{ getResourceConfig(currentView.resourceType).title }}s</q-item-section>
          </q-item>

          <q-separator spaced />

          <!-- Resource List -->
          <div v-if="currentResources.length > 0">
            <q-item v-for="resource in currentResources" :key="resource.id" clickable v-ripple
              @click="handleResourceClick(resource)">
              <q-item-section avatar>
                <q-icon :name="getResourceIcon(resource.type)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ getResourceDisplay(resource) }}</q-item-label>
                <q-item-label caption v-if="getResourceSubtitle(resource)">
                  {{ getResourceSubtitle(resource) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side v-if="resourcesStore.canHaveChildOfType(resource.type).length > 0">
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center text-grey q-pa-md">
            No {{ currentView.title.toLowerCase() }} found
          </div>

          <!-- Add New Button -->
          <div class="text-center q-mt-xl">
            <q-btn unelevated color="primary" :label="`Add ${getResourceConfig(currentView.resourceType).title}`"
              @click="showAddDialog = true" class="add-button" icon="add" />
          </div>
        </template>
      </template>
    </q-list>

    <!-- Add Resource Dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Add {{ currentView?.title.slice(0, -1) || 'Resource' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="handleAddResource">
            <template v-for="(field, key) in currentResourceFields" :key="key">
              <q-input v-model="newResource[key]" :label="field.label" :required="field.required" class="q-mb-md" />
            </template>

            <div class="row q-col-gutter-sm justify-end">
              <div class="col-auto">
                <q-btn flat label="Cancel" color="primary" v-close-popup />
              </div>
              <div class="col-auto">
                <q-btn :loading="saving" type="submit" label="Save" color="primary" />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useResourcesStore } from 'src/stores/resources'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'
import { getResourceConfig } from 'src/configs/resourceConfigs'

const router = useRouter()
const $q = useQuasar()
const resourcesStore = useResourcesStore()

// State
const navigationStack = ref([])
const showAddDialog = ref(false)
const newResource = ref({})
const saving = ref(false)

// Computed
const currentView = computed(() => {
  if (navigationStack.value.length === 0) return null
  return navigationStack.value[navigationStack.value.length - 1]
})

const currentResources = ref([])

const loadCurrentResources = async () => {
  try {
    if (!currentView.value) {
      currentResources.value = []
      return
    }

    if (currentView.value.parentResource) {
      currentResources.value = await resourcesStore.getChildResources(currentView.value.parentResource.id)
    } else {
      currentResources.value = resourcesStore.getResourcesByType(currentView.value.resourceType)
    }
  } catch (error) {
    console.error('Error loading resources:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load resources'
    })
  }
}

const currentResourceFields = computed(() => {
  if (!currentView.value?.resourceType) return {}
  const config = getResourceConfig(currentView.value.resourceType)
  return config.fields
})

// Methods
const navigateToSearch = ({ type = null, resource = null, contextPath = [], resourceType = null } = {}) => {
  const query = {}

  // Add journal type if provided
  if (type) {
    query.type = type
  }

  // Build context-based filters
  if (contextPath.length > 0) {
    // Always add the journal type from the root context
    if (contextPath[0].journalType) {
      query.type = contextPath[0].journalType
    }

    // Build resource context from the navigation path
    const contextResources = contextPath
      .filter(context => context.parentResource)
      .map(context => ({
        id: context.parentResource.id,
        type: context.parentResource.type,
        title: getResourceDisplay(context.parentResource)
      }))

    // Add the final resource if provided
    if (resource) {
      contextResources.push({
        id: resource.id,
        type: resource.type,
        title: getResourceDisplay(resource)
      })
    }

    if (contextResources.length > 0) {
      query.resources = JSON.stringify(contextResources)
    }
  } else if (resource) {
    // Handle direct resource navigation
    query.resources = JSON.stringify([{
      id: resource.id,
      type: resource.type,
      title: getResourceDisplay(resource)
    }])
  }

  // Add resource type filter if provided
  if (resourceType) {
    query.resourceType = resourceType
  }

  router.push({
    path: '/search',
    query
  })
}

// Helper method for "View All" navigation at current level
const navigateToCurrentLevelSearch = () => {
  if (!currentView.value) return navigateToSearch()

  navigateToSearch({
    type: currentView.value.journalType,
    contextPath: navigationStack.value.slice(0, -1), // Exclude current level
    resourceType: currentView.value.resourceType
  })
}

const getJournalTypeForResource = (resourceType) => {
  switch (resourceType) {
    case RESOURCE_TYPES.PASTOR:
    case RESOURCE_TYPES.SERMON_SERIES:
    case RESOURCE_TYPES.SERMON:
      return 'Sermon'
    case RESOURCE_TYPES.AUTHOR:
    case RESOURCE_TYPES.BOOK:
    case RESOURCE_TYPES.CHAPTER:
      return 'Book'
    case RESOURCE_TYPES.SONG_ARTIST:
      return 'Song'
    case RESOURCE_TYPES.SHOW:
    case RESOURCE_TYPES.SEASON:
    case RESOURCE_TYPES.EPISODE:
      return 'Show'
    default:
      return null
  }
}

const navigateToResourceType = (resourceType) => {
  const config = getResourceConfig(resourceType)
  navigationStack.value = [{
    title: config.title + 's',
    resourceType,
    parentResource: null,
    journalType: getJournalTypeForResource(resourceType)
  }]
}

const handleResourceClick = async (resource) => {
  const allowedChildTypes = resourcesStore.canHaveChildOfType(resource.type)
  const currentContext = navigationStack.value[0] // Get the root context for journal type

  if (allowedChildTypes.length > 0) {
    const config = getResourceConfig(resource.type)
    navigationStack.value.push({
      title: config.getDisplayTitle(resource),
      resourceType: allowedChildTypes[0],
      parentResource: resource,
      journalType: currentContext.journalType
    })
  } else {
    // Navigate to search with the full context
    navigateToSearch({
      type: currentContext.journalType,
      resource,
      contextPath: navigationStack.value
    })
  }
}

const handleAddResource = async () => {
  saving.value = true
  try {
    const metadata = { ...newResource.value }
    let newResourceData;

    if (currentView.value.parentResource) {
      newResourceData = await resourcesStore.addChildResource(
        currentView.value.parentResource.id,
        currentView.value.resourceType,
        metadata
      )
    } else {
      newResourceData = await resourcesStore.addResource(currentView.value.resourceType, metadata)
    }

    // Update the current resources list immediately
    currentResources.value = [...currentResources.value, newResourceData]

    showAddDialog.value = false
    newResource.value = {}
    $q.notify({
      type: 'positive',
      message: 'Resource added successfully'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message
    })
  } finally {
    saving.value = false
  }
}

const navigateBack = () => {
  navigationStack.value.pop()
}

const navigateToIndex = (index) => {
  navigationStack.value = navigationStack.value.slice(0, index + 1)
}

const getResourceDisplay = (resource) => {
  const config = getResourceConfig(resource.type)
  return config.getDisplayTitle(resource)
}

const getResourceSubtitle = (resource) => {
  const config = getResourceConfig(resource.type)
  return config.getDisplaySubtitle?.(resource) || null
}

const getResourceIcon = (type) => {
  switch (type) {
    case RESOURCE_TYPES.PASTOR: return 'person'
    case RESOURCE_TYPES.SERMON_SERIES: return 'playlist_play'
    case RESOURCE_TYPES.SERMON: return 'mic'
    case RESOURCE_TYPES.AUTHOR: return 'person'
    case RESOURCE_TYPES.BOOK: return 'book'
    case RESOURCE_TYPES.CHAPTER: return 'bookmark'
    case RESOURCE_TYPES.SONG_ARTIST: return 'person'
    case RESOURCE_TYPES.MINISTRY: return 'groups'
    case RESOURCE_TYPES.DEVOTIONAL_SERIES: return 'menu_book'
    case RESOURCE_TYPES.SHOW: return 'smart_display'
    case RESOURCE_TYPES.SEASON: return 'playlist_play'
    case RESOURCE_TYPES.EPISODE: return 'play_circle'
    default: return 'article'
  }
}

// Watch for navigation changes
watch(currentView, () => {
  loadCurrentResources()
})

// Lifecycle
onMounted(async () => {
  await resourcesStore.loadResources()
  await loadCurrentResources()
})
</script>

<style scoped>
.hover-underline:hover {
  text-decoration: underline;
}

.browse-content {
  min-height: 300px;
}

.add-button {
  height: 40px;
  min-width: 200px;
}

.view-all-item {
  background: rgba(0, 0, 0, 0.03);
  min-height: 40px;
}
</style>
