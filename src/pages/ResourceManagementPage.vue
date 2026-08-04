<template>
  <q-page class="q-pa-md q-mt-lg">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 wide-content-card q-pa-lg parchment">
        <div class="row items-center q-mb-md">
          <div class="col text-h6 text-center">Manage Resources</div>
        </div>

        <q-input v-model="searchTerm" placeholder="Search resources..." dense clearable outlined
          class="q-mb-md">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <div v-if="initialLoading" class="text-center q-pa-xl">
          <q-spinner color="primary" size="2em" />
        </div>

        <!-- Search mode: flat list of matches regardless of depth -->
        <template v-else-if="searchTerm.trim()">
          <div v-if="searchResults.length === 0" class="text-center text-grey q-pa-lg">
            No resources match "{{ searchTerm }}"
          </div>
          <q-list v-else separator bordered class="rounded-borders bg-white">
            <q-item v-for="resource in searchResults" :key="resource.id">
              <q-item-section>
                <q-item-label>{{ displayTitle(resource) }}</q-item-label>
                <q-item-label caption>
                  {{ typeLabel(resource.type) }}
                  <span v-if="parentOf(resource.id)"> · Under: {{ displayTitle(parentOf(resource.id)) }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="more_vert" :loading="viewingNotesId === resource.id"
                  aria-label="Resource actions">
                  <q-menu anchor="bottom right" self="top right">
                    <q-list style="min-width: 220px">
                      <q-item clickable v-close-popup @click="viewNotes(resource)">
                        <q-item-section avatar>
                          <q-icon :name="isLeafType(resource.type) ? 'notes' : 'manage_search'" color="teal" />
                        </q-item-section>
                        <q-item-section>
                          {{ isLeafType(resource.type) ? 'View Journal Entries' : 'Browse Entries Under This' }}
                        </q-item-section>
                      </q-item>
                      <q-item v-if="childTypeLabel(resource.type)" clickable v-close-popup
                        @click="openAddChild(resource)">
                        <q-item-section avatar>
                          <q-icon name="add" color="positive" />
                        </q-item-section>
                        <q-item-section>Add {{ childTypeLabel(resource.type) }}</q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="openEdit(resource)">
                        <q-item-section avatar>
                          <q-icon name="edit" color="primary" />
                        </q-item-section>
                        <q-item-section>Edit</q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="openDelete(resource)">
                        <q-item-section avatar>
                          <q-icon name="delete" color="negative" />
                        </q-item-section>
                        <q-item-section class="text-negative">Delete</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </template>

        <!-- Tree mode: grouped by top-level resource type (Churches,
             Ministries, Books, ...), each holding a flattened tree of that
             type's resources and their descendants -->
        <template v-else>
          <div v-if="typeSections.length === 0" class="text-center text-grey q-pa-lg">
            No resources found
          </div>
          <q-list v-else separator bordered class="rounded-borders bg-white">
            <q-expansion-item v-for="section in typeSections" :key="section.type"
              :model-value="openSectionTypes.has(section.type)"
              @update:model-value="(val) => toggleSection(section.type, val)">
              <template v-slot:header>
                <q-item-section>
                  <q-item-label>{{ section.label }}</q-item-label>
                  <q-item-label caption>
                    {{ section.roots.length }} item{{ section.roots.length === 1 ? '' : 's' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section v-if="section.isRootType" side>
                  <q-btn flat round dense icon="add" color="positive" @click.stop="openAddRoot(section.type)">
                    <q-tooltip>Add {{ typeLabel(section.type) }}</q-tooltip>
                  </q-btn>
                </q-item-section>
              </template>

              <div v-if="section.rows.length === 0" class="text-center text-grey q-pa-md text-caption">
                No {{ section.label.toLowerCase() }} yet
              </div>
              <q-item v-for="row in section.rows" :key="row.resource.id"
                :clickable="row.hasChildren" v-ripple="row.hasChildren"
                @click="row.hasChildren && toggleExpand(row.resource.id)"
                :style="{ paddingLeft: `${16 + row.depth * 24}px` }">
                <q-item-section avatar>
                  <div class="row-toggle">
                    <q-icon v-if="row.hasChildren"
                      :name="expandedIds.has(row.resource.id) ? 'expand_more' : 'chevron_right'" />
                    <q-icon v-else name="fiber_manual_record" size="8px" class="text-grey-5" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ displayTitle(row.resource) }}</q-item-label>
                  <q-item-label v-if="row.depth > 0" caption>{{ typeLabel(row.resource.type) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense icon="more_vert" :loading="viewingNotesId === row.resource.id"
                    aria-label="Resource actions" @click.stop>
                    <q-menu anchor="bottom right" self="top right">
                      <q-list style="min-width: 220px">
                        <q-item clickable v-close-popup @click="viewNotes(row.resource)">
                          <q-item-section avatar>
                            <q-icon :name="isLeafType(row.resource.type) ? 'notes' : 'manage_search'" color="teal" />
                          </q-item-section>
                          <q-item-section>
                            {{ isLeafType(row.resource.type) ? 'View Journal Entries' : 'Browse Entries Under This' }}
                          </q-item-section>
                        </q-item>
                        <q-item v-if="childTypeLabel(row.resource.type)" clickable v-close-popup
                          @click="openAddChild(row.resource)">
                          <q-item-section avatar>
                            <q-icon name="add" color="positive" />
                          </q-item-section>
                          <q-item-section>Add {{ childTypeLabel(row.resource.type) }}</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="openEdit(row.resource)">
                          <q-item-section avatar>
                            <q-icon name="edit" color="primary" />
                          </q-item-section>
                          <q-item-section>Edit</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="openDelete(row.resource)">
                          <q-item-section avatar>
                            <q-icon name="delete" color="negative" />
                          </q-item-section>
                          <q-item-section class="text-negative">Delete</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-expansion-item>
          </q-list>
        </template>
      </div>
    </div>

    <!-- Edit metadata dialog -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Edit {{ editingConfig?.title }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-form @submit="saveEdit">
            <template v-for="(field, key) in editingConfig?.fields" :key="key">
              <q-input v-model="editForm[key]" :label="field.label" :required="field.required" class="q-mb-md" />
            </template>
            <div class="row justify-end q-col-gutter-sm">
              <div class="col-auto"><q-btn flat label="Cancel" v-close-popup /></div>
              <div class="col-auto">
                <q-btn color="primary" label="Save" type="submit" :loading="saving" />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Add child dialog -->
    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Add {{ addChildConfig?.title }}</div>
          <div v-if="addParentResource" class="text-caption text-grey-8">
            Under {{ displayTitle(addParentResource) }}
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-form @submit="saveAdd">
            <template v-for="(field, key) in addChildConfig?.fields" :key="key">
              <q-input v-model="addForm[key]" :label="field.label" :required="field.required" class="q-mb-md" />
            </template>
            <div class="row justify-end q-col-gutter-sm">
              <div class="col-auto"><q-btn flat label="Cancel" v-close-popup /></div>
              <div class="col-auto">
                <q-btn color="primary" label="Save" type="submit" :loading="addingChild" />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete confirmation dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="width: 90vw; max-width: 380px">
        <q-card-section>
          <div class="text-h6">Delete {{ deletingResource ? displayTitle(deletingResource) : '' }}?</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="deleteInfoLoading" class="text-center q-pa-md">
            <q-spinner color="primary" />
          </div>
          <template v-else>
            <q-banner v-if="journalUsage.length" dense class="bg-warning text-dark rounded-borders q-mb-md">
              Used in {{ journalUsage.length }} journal entr{{ journalUsage.length === 1 ? 'y' : 'ies' }}.
              Deleting removes those links — the entries themselves are kept.
            </q-banner>

            <div v-if="descendantCount > 0" class="q-mb-md">
              <div class="text-body2 q-mb-sm">
                This has {{ descendantCount }} linked child resource{{ descendantCount === 1 ? '' : 's' }}.
              </div>
              <q-option-group v-model="deleteMode" dense :options="[
                { label: 'Delete this only — children become independent', value: 'orphan' },
                { label: `Delete this and all ${descendantCount} children`, value: 'cascade' }
              ]" />
            </div>
            <div v-else class="text-body2 text-grey-8">This cannot be undone.</div>
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" :loading="deleting" :disable="deleteInfoLoading"
            @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useResourcesStore } from 'src/stores/resources'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'
import { getResourceConfig, pluralizeTitle, getRootResourceTypes } from 'src/configs/resourceConfigs'

const router = useRouter()
const $q = useQuasar()
const resourcesStore = useResourcesStore()

const initialLoading = ref(true)
const searchTerm = ref('')
const relationships = ref([])

// Always returns a non-empty string — never lets a resource with
// incomplete/legacy metadata (a getDisplayTitle that silently returns
// undefined rather than throwing) propagate into a sort comparator
const displayTitle = (resource) => {
  try {
    return getResourceConfig(resource.type).getDisplayTitle(resource) || resource?.id || 'Untitled'
  } catch {
    return resource?.id || 'Untitled'
  }
}

const typeLabel = (type) => {
  try {
    return getResourceConfig(type).title
  } catch {
    return type
  }
}

// child id -> parent id, from the current relationship set
const parentIdMap = computed(() => {
  const map = new Map()
  relationships.value.forEach((rel) => map.set(rel.child_resource_id, rel.parent_resource_id))
  return map
})

// parent id -> array of child resource objects, for the tree
const childrenMap = computed(() => {
  const byId = new Map(resourcesStore.resources.map((r) => [r.id, r]))
  const map = new Map()
  relationships.value.forEach((rel) => {
    const child = byId.get(rel.child_resource_id)
    if (!child) return
    if (!map.has(rel.parent_resource_id)) map.set(rel.parent_resource_id, [])
    map.get(rel.parent_resource_id).push(child)
  })
  map.forEach((list) => list.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b))))
  return map
})

const parentOf = (resourceId) => {
  const parentId = parentIdMap.value.get(resourceId)
  return parentId ? resourcesStore.getResourceById(parentId) : null
}

const roots = computed(() => {
  const list = resourcesStore.resources.filter((r) => !parentIdMap.value.has(r.id))
  return list.sort(
    (a, b) => typeLabel(a.type).localeCompare(typeLabel(b.type)) || displayTitle(a).localeCompare(displayTitle(b)),
  )
})

// Ids of nodes the user has manually expanded; everything else defaults to
// collapsed. A plain JS walk (not a recursive component) flattens the tree
// into rows with a depth, so rendering is a single v-for.
const expandedIds = reactive(new Set())

const toggleExpand = (id) => {
  if (expandedIds.has(id)) {
    expandedIds.delete(id)
  } else {
    expandedIds.add(id)
  }
}

// Flattens a root and its descendants into rows with a depth, so rendering
// is a single v-for rather than a recursive component
const flattenTree = (rootResources) => {
  const rows = []
  const walk = (resource, depth) => {
    const children = childrenMap.value.get(resource.id) || []
    rows.push({
      resource,
      depth,
      hasChildren: children.length > 0,
    })
    if (!expandedIds.has(resource.id)) return
    children.forEach((child) => walk(child, depth + 1))
  }
  rootResources.forEach((r) => walk(r, 0))
  return rows
}

// Types that can be created as brand-new top-level resources (Church,
// Author/Ministry, Devotional, ...) — their sections always show, even with
// zero items yet, so there's somewhere to add the first one
const ROOT_TYPES = getRootResourceTypes()

// Which sections are expanded; nothing open by default
const openSectionTypes = reactive(new Set())

const toggleSection = (type, isOpen) => {
  if (isOpen) {
    openSectionTypes.add(type)
  } else {
    openSectionTypes.delete(type)
  }
}

// Group roots by their own type — e.g. all Churches together (each with its
// pastors/series/sermons nested beneath), all Ministries together, etc.
// Always includes the official root types (even empty), plus any type that
// unexpectedly has orphaned root-level items (e.g. a Pastor with no Church).
const typeSections = computed(() => {
  const byType = new Map()
  roots.value.forEach((r) => {
    if (!byType.has(r.type)) byType.set(r.type, [])
    byType.get(r.type).push(r)
  })

  const orderedTypes = [
    ...ROOT_TYPES,
    ...Object.values(RESOURCE_TYPES).filter((t) => !ROOT_TYPES.includes(t) && byType.has(t)),
  ]

  return orderedTypes.map((type) => {
    const typeRoots = byType.get(type) || []
    return {
      type,
      label: pluralizeTitle(typeLabel(type)),
      roots: typeRoots,
      rows: flattenTree(typeRoots),
      isRootType: ROOT_TYPES.includes(type),
    }
  })
})

const searchResults = computed(() => {
  const search = searchTerm.value.trim().toLowerCase()
  if (!search) return []
  return resourcesStore.resources
    .filter((r) => displayTitle(r).toLowerCase().includes(search))
    .sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)))
})

const loadRelationships = async () => {
  relationships.value = await resourcesStore.getAllRelationships()
}

onMounted(async () => {
  try {
    if (!resourcesStore.resources.length) {
      await resourcesStore.loadResources()
    }
    await loadRelationships()
  } catch (error) {
    console.error('Error loading resource management data:', error)
    $q.notify({ type: 'negative', message: error.message || 'Failed to load resources' })
  } finally {
    initialLoading.value = false
  }
})

// ---- Edit metadata ----
const showEditDialog = ref(false)
const editingResource = ref(null)
const editingConfig = computed(() =>
  editingResource.value ? getResourceConfig(editingResource.value.type) : null,
)
const editForm = ref({})
const saving = ref(false)

const openEdit = (resource) => {
  editingResource.value = resource
  editForm.value = { ...resource.metadata }
  showEditDialog.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    await resourcesStore.updateResource(editingResource.value.id, { ...editForm.value })
    $q.notify({ type: 'positive', message: 'Saved' })
    showEditDialog.value = false
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Failed to save' })
  } finally {
    saving.value = false
  }
}

// ---- Add child ----
const childTypeLabel = (parentType) => {
  const [childType] = resourcesStore.canHaveChildOfType(parentType)
  return childType ? typeLabel(childType) : ''
}

const showAddDialog = ref(false)
const addParentResource = ref(null)
const addChildType = ref(null)
const addChildConfig = computed(() => (addChildType.value ? getResourceConfig(addChildType.value) : null))
const addForm = ref({})
const addingChild = ref(false)

const openAddChild = (parentResource) => {
  const [childType] = resourcesStore.canHaveChildOfType(parentResource.type)
  addParentResource.value = parentResource
  addChildType.value = childType
  addForm.value = {}
  showAddDialog.value = true
}

// A brand-new top-level resource (Church, Author/Ministry, ...) — no parent
const openAddRoot = (type) => {
  addParentResource.value = null
  addChildType.value = type
  addForm.value = {}
  showAddDialog.value = true
}

const saveAdd = async () => {
  addingChild.value = true
  try {
    if (addParentResource.value) {
      await resourcesStore.addChildResource(addParentResource.value.id, addChildType.value, { ...addForm.value })
      await loadRelationships()
      expandedIds.add(addParentResource.value.id) // reveal the new child
    } else {
      await resourcesStore.addResource(addChildType.value, { ...addForm.value })
      openSectionTypes.add(addChildType.value) // reveal the new root item
    }
    $q.notify({ type: 'positive', message: `${addChildConfig.value.title} added` })
    showAddDialog.value = false
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Failed to add' })
  } finally {
    addingChild.value = false
  }
}

// ---- View notes ----
const viewingNotesId = ref(null)

// A leaf (Sermon, Episode, PodcastEpisode, ...) has no children — it
// represents a single specific note-worthy thing, not a whole category
const isLeafType = (type) => resourcesStore.canHaveChildOfType(type).length === 0

// Walks up from a resource through its parent chain (e.g. Sermon -> Series
// -> Pastor -> Church), so browsing includes the whole lineage as facets —
// matching how Browse's own drill-down builds its search filters
const getAncestorChain = (resource) => {
  const chain = [resource]
  let current = resource
  while (true) {
    const parent = parentOf(current.id)
    if (!parent) break
    chain.unshift(parent)
    current = parent
  }
  return chain
}

const browseUnder = (resource) => {
  const chain = getAncestorChain(resource)
  router.push({
    path: '/search',
    query: { resources: JSON.stringify(chain.map((r) => ({ type: r.type, title: displayTitle(r) }))) },
  })
}

// Leaves jump straight to the entry if only one references them, or to a
// filtered search if there are several. Anything with children (a Church,
// a Podcast, a Book, ...) always opens the filtered browse view instead —
// it's a category, not a single note.
const viewNotes = async (resource) => {
  if (!isLeafType(resource.type)) {
    browseUnder(resource)
    return
  }

  viewingNotesId.value = resource.id
  try {
    const usage = await resourcesStore.getJournalUsage(resource.id)
    if (usage.length === 0) {
      $q.notify({ type: 'info', message: 'No journal entries reference this yet' })
    } else if (usage.length === 1) {
      router.push(`/entry/${usage[0].id}`)
    } else {
      browseUnder(resource)
    }
  } catch (error) {
    console.error('Error loading journal entries for resource:', error)
    $q.notify({ type: 'negative', message: 'Failed to load journal entries' })
  } finally {
    viewingNotesId.value = null
  }
}

// ---- Delete ----
const showDeleteDialog = ref(false)
const deletingResource = ref(null)
const deleteInfoLoading = ref(false)
const journalUsage = ref([])
const descendantCount = ref(0)
const deleteMode = ref('orphan')
const deleting = ref(false)

const openDelete = async (resource) => {
  deletingResource.value = resource
  deleteMode.value = 'orphan'
  showDeleteDialog.value = true
  deleteInfoLoading.value = true
  try {
    const [usage, descendants] = await Promise.all([
      resourcesStore.getJournalUsage(resource.id),
      resourcesStore.getDescendantIds(resource.id),
    ])
    journalUsage.value = usage
    descendantCount.value = descendants.length
  } catch (error) {
    console.error('Error loading delete info:', error)
    journalUsage.value = []
    descendantCount.value = 0
  } finally {
    deleteInfoLoading.value = false
  }
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await resourcesStore.deleteResource(deletingResource.value.id, {
      cascade: deleteMode.value === 'cascade',
    })
    $q.notify({ type: 'positive', message: 'Deleted' })
    showDeleteDialog.value = false
    await loadRelationships()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Failed to delete' })
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.row-toggle {
  width: 2.5em;
  height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
