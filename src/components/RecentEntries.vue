<template>
  <div class="entries-wrapper">
    <div v-if="journalStore.loading" class="loader-container">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else-if="entries.length === 0" class="empty-container">
      No seeds planted yet. Start your journey by planting your first seed.
    </div>
    <template v-else>
      <div class="entries-toolbar">
        <q-btn
          flat dense no-caps
          :icon="sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'"
          label="Date"
          :aria-label="sortOrderLabel"
          class="sort-order-btn"
          @click="toggleSortOrder"
        >
          <q-tooltip>{{ sortOrderLabel }}</q-tooltip>
        </q-btn>
      </div>

      <!-- One swipeable lane per journal type, plus a leading "Recent" lane
           (last 10 entries across all types) — no more separate toggle, this
           is the only view now. -->
      <div class="type-lanes-wrapper">
        <div ref="lanesEl" class="type-lanes" @scroll="updateScrollArrows">
        <div v-for="group in typeGroups" :key="group.type" class="type-lane">
          <div class="type-lane-header" :class="{ 'type-lane-header--clickable': isDesktop }"
            :style="{ borderTopColor: typeColorsStore.getColor(group.type) }"
            @click="isDesktop && toggleType(group.type)">
            <q-icon v-if="isDesktop" :name="isExpanded(group.type) ? 'expand_more' : 'chevron_right'" size="18px"
              class="type-lane-chevron" />
            <q-icon :name="group.icon" size="18px" :style="{ color: typeColorsStore.getColor(group.type) }" />
            <span class="type-lane-label">{{ group.label }}</span>
            <span class="type-lane-count">{{ group.entries.length }}</span>
          </div>
          <div v-show="isExpanded(group.type)" class="type-lane-list">
            <template v-if="group.resourceTree">
              <ResourceTreeSection
                v-for="node in group.resourceTree.roots" :key="node.id"
                :node="node" :color="typeColorsStore.getColor(group.type)"
                @view-entry="viewEntry"
              />
              <q-item
                v-for="entry in group.resourceTree.ungrouped" :key="entry.id"
                clickable class="entry-item"
                :style="{ borderLeftColor: typeColorsStore.getColor(entry.type) }"
                @click="viewEntry(entry.id)"
              >
                <q-item-section>
                  <q-item-label class="text-wrap">{{ entry.title }}</q-item-label>
                  <q-item-label caption class="text-wrap">{{ formatDate(entry.created_at) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
            </template>
            <template v-else>
              <q-item
                v-for="entry in group.entries" :key="entry.id"
                clickable class="entry-item"
                :style="{ borderLeftColor: typeColorsStore.getColor(entry.type) }"
                @click="viewEntry(entry.id)"
              >
                <q-item-section>
                  <q-item-label class="text-wrap">{{ entry.title }}</q-item-label>
                  <q-item-label caption class="text-wrap">{{ formatDate(entry.created_at) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>
            </template>
            <div v-if="!group.entries.length" class="type-lane-empty">No entries</div>
          </div>
        </div>
        </div>
        <div v-if="canScrollLeft" class="scroll-arrow scroll-arrow-left">
          <q-icon name="chevron_left" size="18px" />
        </div>
        <div v-if="canScrollRight" class="scroll-arrow scroll-arrow-right">
          <q-icon name="chevron_right" size="18px" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useJournalStore, getResourceTitle } from 'stores/journalData'
import { useJournalTypeColorsStore } from 'stores/journalTypeColors'
import { useUserPreferencesStore } from 'stores/userPreferences'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'
import { getResourceTypeDepth } from 'src/configs/resourceConfigs'
import { getBibleBook } from 'src/constants/bibleBooks'
import ResourceTreeSection from './ResourceTreeSection.vue'

const router = useRouter()
const $q = useQuasar()
const journalStore = useJournalStore()
const typeColorsStore = useJournalTypeColorsStore()
const userPreferencesStore = useUserPreferencesStore()
const sortOrder = ref('desc')

const entries = computed(() => journalStore.entries || [])

const sortedEntries = computed(() => {
  const factor = sortOrder.value === 'desc' ? -1 : 1
  return [...entries.value].sort((a, b) => factor * (new Date(a.created_at) - new Date(b.created_at)))
})

// The verse an entry's Bible-reading reference is anchored to, if any
const getMainVerseBook = (entry) => entry.verses?.find((v) => v.main_verse)?.book || null

// Within a type, sub-group entries into an actual nested tree following
// their full resource hierarchy (e.g. Sermon entries under Church -> Pastor
// -> Series, each level its own collapsible section) — but only for types
// where entries actually carry resources or a Bible verse. Types with
// neither (Answered Prayer, Other, ...) stay a flat list. For real
// resources, the single deepest one (the specific Sermon/Chapter/Episode,
// essentially the entry itself) is excluded from the chain — unless it's
// the only resource present, in which case it IS the (single-level)
// section. Verse-only entries (Daily Bible Reading entries with no linked
// study) get an implied "Testament -> Book" chain instead (no separate
// "Bible" root — it's already implied by the type lane), derived from the
// verse itself rather than any real resource — deliberately stopping at
// Book, with no chapter level.
const buildResourceTree = (list) => {
  const hasAnyResources = list.some((entry) => entry.resources?.length > 0)
  const hasAnyVerse = list.some((entry) => getMainVerseBook(entry))
  if (!hasAnyResources && !hasAnyVerse) return null

  const roots = []
  const nodeByPath = new Map()
  const ungrouped = []

  const getOrCreateNode = (siblings, path, id, title, order) => {
    let node = nodeByPath.get(path)
    if (!node) {
      node = { id, title, order, children: [], entries: [] }
      nodeByPath.set(path, node)
      siblings.push(node)
    }
    return node
  }

  for (const entry of list) {
    const resources = entry.resources || []
    if (resources.length) {
      const byDepth = [...resources].sort((a, b) => getResourceTypeDepth(a.type) - getResourceTypeDepth(b.type))
      const chain = byDepth.length > 1 ? byDepth.slice(0, -1) : byDepth

      let siblings = roots
      let path = ''
      let node = null
      for (const resource of chain) {
        path += `>${resource.id}`
        node = getOrCreateNode(siblings, path, resource.id, getResourceTitle(resource))
        siblings = node.children
      }
      node.entries.push(entry)
      continue
    }

    const book = getBibleBook(getMainVerseBook(entry))
    if (book) {
      let siblings = roots
      let node = getOrCreateNode(siblings, book.testament, book.testament, book.testament, book.testament === 'Old Testament' ? 0 : 1)
      siblings = node.children

      node = getOrCreateNode(siblings, `${book.testament}>${book.name}`, book.name, book.name, book.order)
      node.entries.push(entry)
      continue
    }

    ungrouped.push(entry)
  }

  const sortTree = (nodes) => {
    nodes.sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order
      return a.title.localeCompare(b.title)
    })
    nodes.forEach((n) => sortTree(n.children))
  }
  sortTree(roots)

  return { roots, ungrouped }
}

// A leading "Recent" lane (last 10 entries across all types, flat — no
// resource-tree grouping), followed by one column per journal type
// (canonical order), each internally sorted by the same date direction.
const RECENT_LANE_TYPE = '__recent__'

const typeGroups = computed(() => {
  const factor = sortOrder.value === 'desc' ? -1 : 1
  const byType = new Map()
  for (const entry of entries.value) {
    if (!byType.has(entry.type)) byType.set(entry.type, [])
    byType.get(entry.type).push(entry)
  }
  byType.forEach((list) => list.sort((a, b) => factor * (new Date(a.created_at) - new Date(b.created_at))))

  const buildGroup = (type, label, icon) => {
    const list = byType.get(type)
    return { type, label, icon, entries: list, resourceTree: buildResourceTree(list) }
  }

  // User-customized order (see stores/userPreferences.js) instead of the
  // fixed JOURNAL_TYPES order, falling back to it for anything unset
  const typesById = new Map(JOURNAL_TYPES.map((t) => [t.id, t]))
  const known = userPreferencesStore.journalOrder
    .map((id) => typesById.get(id))
    .filter((t) => t && byType.has(t.id))
    .map((t) => buildGroup(t.id, t.label, t.icon))
  const knownIds = new Set(known.map((g) => g.type))
  const unknown = [...byType.keys()]
    .filter((type) => !knownIds.has(type))
    .map((type) => buildGroup(type, type, 'help_outline'))

  const recentGroup = {
    type: RECENT_LANE_TYPE,
    label: 'Recent',
    icon: 'schedule',
    entries: sortedEntries.value.slice(0, 10),
    resourceTree: null,
  }

  return [recentGroup, ...known, ...unknown]
})

// On tablet/desktop, lanes stack as full-width collapsible rows instead of
// side-by-side swipeable columns — mobile keeps every lane's contents
// always visible since there's no room for a click-to-expand affordance in
// a single swiped-to column. Only "Recent" starts open on desktop.
const isDesktop = computed(() => $q.screen.gt.sm)
const expandedTypes = reactive(new Set([RECENT_LANE_TYPE]))
const isExpanded = (type) => !isDesktop.value || expandedTypes.has(type)
const toggleType = (type) => {
  if (expandedTypes.has(type)) expandedTypes.delete(type)
  else expandedTypes.add(type)
}

const sortOrderLabel = computed(() => (sortOrder.value === 'desc' ? 'Newest first' : 'Oldest first'))

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const viewEntry = (id) => {
  router.push(`/entry/${id}`)
}

// Edge arrows for the type-lanes scroller — only shown when there's
// actually more to scroll to in that direction
const lanesEl = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateScrollArrows = () => {
  const el = lanesEl.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

watch(typeGroups, () => {
  nextTick(updateScrollArrows)
})

onMounted(async () => {
  window.addEventListener('resize', updateScrollArrows)
  try {
    await Promise.all([
      journalStore.entries.length ? Promise.resolve() : journalStore.fetchEntries(),
      userPreferencesStore.load(),
    ])
  } catch (error) {
    console.error('Error fetching entries:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading entries'
    })
  } finally {
    nextTick(updateScrollArrows)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollArrows)
})
</script>

<style scoped>
.entries-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 220px);
  min-height: 420px;
}

.loader-container,
.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
  padding: 48px 16px;
}

/* Left-aligned so it sits directly above the first lane instead of pinned
   to the far right of the (now much wider) container, isolated from the
   lanes it controls. */
.entries-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 12px;
}

.sort-order-btn {
  font-size: 0.78rem;
  font-weight: 700;
}

.entry-item {
  min-height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  border-left: 3px solid transparent;
}

.entry-item:last-child {
  border-bottom: none;
}

.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.q-item-section {
  min-width: 0;
}

/* Positioning shell for the type-lanes scroller — lets the swipe hint float
   on top without taking up any of its own flex space, so it can't disturb
   the height math above. Mobile default; overridden for tablet/desktop
   below where lanes stack as full-width rows instead of scrolling. */
.type-lanes-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
}

/* Type lanes, mobile default: a horizontally-scrolling row of full-height
   columns, one swipeable full-width column at a time (see media query
   below). Overridden for tablet/desktop just below, where lanes become a
   vertical stack of full-width collapsible rows instead. */
.type-lanes {
  display: flex;
  gap: 12px;
  padding: 0 12px 12px;
  overflow-x: auto;
  flex: 1;
  min-height: 0;
}

.type-lane {
  display: flex;
  flex-direction: column;
  flex: 0 0 280px;
  width: 280px;
  min-width: 0;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  overflow: hidden;
  background: #fffdf8;
  scroll-snap-stop: always;
}

.scroll-arrow {
  position: absolute;
  bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.85);
  color: rgba(0, 0, 0, 0.4);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 2;
}

.scroll-arrow-left {
  left: 20px;
}

.scroll-arrow-right {
  right: 20px;
}

.type-lane-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid transparent;
  background: #f4f1ea;
  font-weight: 700;
  font-size: 0.85rem;
}

.type-lane-header--clickable {
  cursor: pointer;
}

.type-lane-header--clickable:hover {
  background: #eee7d5;
}

.type-lane-chevron {
  color: rgba(0, 0, 0, 0.5);
}

.type-lane-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-lane-count {
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.78rem;
  font-weight: 800;
}

.type-lane-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.type-lane-empty {
  padding: 24px 12px;
  text-align: center;
  color: rgba(0, 0, 0, 0.4);
  font-size: 0.82rem;
}

/* Tablet/desktop: lanes stack as full-width collapsible rows instead of a
   horizontally-scrolling (or side-by-side) layout — no need for a wide
   container, and only the types you actually open take up vertical space.
   Each lane's own list still caps its height with internal scrolling so an
   expanded type with many entries can't make the page endlessly tall. */
@media (min-width: 600px) {
  .entries-wrapper {
    height: auto;
    min-height: 0;
  }

  .type-lanes-wrapper {
    flex: none;
  }

  .type-lanes {
    flex-direction: column;
    overflow: visible;
  }

  .type-lane {
    width: 100%;
    flex: none;
    height: auto;
  }

  .type-lane-list {
    flex: none;
    max-height: 400px;
  }

  .scroll-arrow {
    display: none;
  }
}

@media (max-width: 599px) {
  .type-lanes {
    display: flex;
    gap: 0;
    padding: 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    touch-action: pan-x pan-y;
  }

  .type-lane {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    scroll-snap-align: start;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
}
</style>
