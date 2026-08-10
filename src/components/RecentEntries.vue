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
        <div class="type-lanes" ref="lanesEl" data-tour="type-lanes" @scroll="onLanesScroll">
        <div v-for="group in typeGroups" :key="group.type" class="type-lane">
          <div class="type-lane-header" :class="{ 'type-lane-header--clickable': isDesktop }"
            :style="{ borderTopColor: groupColor(group) }"
            @click="isDesktop && toggleType(group.type)">
            <q-icon v-if="isDesktop" :name="isExpanded(group.type) ? 'expand_more' : 'chevron_right'" size="18px"
              class="type-lane-chevron" />
            <q-icon :name="group.icon" size="18px" :style="{ color: groupColor(group) }" />
            <span class="type-lane-label">{{ group.label }}</span>
            <span class="type-lane-count">{{ group.entries.length }}</span>
          </div>
          <div v-show="isExpanded(group.type)" class="type-lane-list">
            <template v-if="group.resourceTree">
              <ResourceTreeSection
                v-for="node in group.resourceTree.roots" :key="node.id"
                :node="node" :color="groupColor(group)"
                @view-entry="viewEntry"
              />
              <q-item
                v-for="entry in group.resourceTree.ungrouped" :key="entry.id"
                clickable class="entry-item"
                :style="{ borderLeftColor: typeColorsStore.getColor(entry.type) }"
                @click="viewEntry(entry.id)"
              >
                <q-item-section>
                  <q-item-label class="text-wrap">
                    <q-icon v-if="entry.is_favorite" name="star" color="warning" size="16px" class="q-mr-xs" />
                    {{ entry.title }}
                  </q-item-label>
                  <q-item-label caption class="text-wrap">{{ formatDate(entryDate(entry)) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center no-wrap">
                    <FavoriteButton :entry="entry" />
                    <q-icon name="chevron_right" />
                  </div>
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
                  <q-item-label class="text-wrap">
                    <q-icon v-if="entry.is_favorite" name="star" color="warning" size="16px" class="q-mr-xs" />
                    {{ entry.title }}
                  </q-item-label>
                  <q-item-label caption class="text-wrap">{{ formatDate(entryDate(entry)) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center no-wrap">
                    <FavoriteButton :entry="entry" />
                    <q-icon name="chevron_right" />
                  </div>
                </q-item-section>
              </q-item>
            </template>
            <q-item
              v-if="group.hasViewAll"
              clickable class="entry-item view-all-item"
              :style="{ borderLeftColor: groupColor(group) }"
              @click="viewFavorites"
            >
              <q-item-section>
                <q-item-label class="text-wrap text-weight-medium">View all favorites</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
            <div v-if="!group.entries.length" class="type-lane-empty">No entries</div>
          </div>
        </div>
        </div>
      </div>
      <div v-if="!isDesktop" class="swipe-hint text-center">
        <q-icon name="swipe" size="14px" class="q-mr-xs" />Swipe left or right to browse
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useJournalStore, getResourceTitle } from 'stores/journalData'
import { useJournalTypeColorsStore } from 'stores/journalTypeColors'
import { useUserPreferencesStore } from 'stores/userPreferences'
import { useHomeViewStateStore } from 'stores/homeViewState'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'
import { getResourceTypeDepth } from 'src/configs/resourceConfigs'
import { getBibleBook } from 'src/constants/bibleBooks'
import { HOME_SECTION_IDS } from 'stores/userPreferences'
import { searchRouteForFacet } from 'src/utils/searchRoute'
import ResourceTreeSection from './ResourceTreeSection.vue'
import FavoriteButton from './FavoriteButton.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const journalStore = useJournalStore()
const typeColorsStore = useJournalTypeColorsStore()
const userPreferencesStore = useUserPreferencesStore()
const homeViewState = useHomeViewStateStore()
const sortOrder = ref('desc')
const lanesEl = ref(null)

// A ?type= query param survives a full page reload, unlike homeViewState
// (in-memory only) — restore from it first, so an accidental refresh
// while scrolled into e.g. "Sermon Notes" doesn't jump back to Recent.
if (route.query.type) {
  homeViewState.setActiveType(route.query.type)
}

const entries = computed(() => journalStore.entries || [])

// Falls back to created_at for entries fetched before the updated_at
// migration/backfill ran (see sql/Journal Entries Updated At Column.sql)
// and for demo-tour entries, which have no updated_at column at all.
const entryDate = (entry) => entry.updated_at || entry.created_at

const sortedEntries = computed(() => {
  const factor = sortOrder.value === 'desc' ? -1 : 1
  return [...entries.value].sort((a, b) => factor * (new Date(entryDate(a)) - new Date(entryDate(b))))
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
const FAVORITES_LIMIT = 10
const SPECIAL_SECTION_COLORS = {
  [HOME_SECTION_IDS.FAVORITES]: '#d4a94c',
  [HOME_SECTION_IDS.RECENT]: '#7c9082',
}

const groupColor = (group) => group.color || SPECIAL_SECTION_COLORS[group.type] || typeColorsStore.getColor(group.type)

const typeGroups = computed(() => {
  const factor = sortOrder.value === 'desc' ? -1 : 1
  const byType = new Map()
  for (const entry of entries.value) {
    if (!byType.has(entry.type)) byType.set(entry.type, [])
    byType.get(entry.type).push(entry)
  }
  byType.forEach((list) => list.sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1
    return factor * (new Date(entryDate(a)) - new Date(entryDate(b)))
  }))

  const buildGroup = (type, label, icon) => {
    const list = byType.get(type)
    return { type, label, icon, entries: list, resourceTree: buildResourceTree(list) }
  }

  // User-customized order (see stores/userPreferences.js) instead of the
  // fixed JOURNAL_TYPES order, falling back to it for anything unset
  const typesById = new Map(JOURNAL_TYPES.map((t) => [t.id, t]))
  const favoriteEntries = sortedEntries.value.filter((entry) => entry.is_favorite)
  const groups = []
  const usedTypeIds = new Set()

  for (const sectionId of userPreferencesStore.homeSectionOrder) {
    if (sectionId === HOME_SECTION_IDS.FAVORITES) {
      if (favoriteEntries.length) {
        groups.push({
          type: HOME_SECTION_IDS.FAVORITES,
          label: 'Favorites',
          icon: 'star',
          color: SPECIAL_SECTION_COLORS[HOME_SECTION_IDS.FAVORITES],
          entries: favoriteEntries.slice(0, FAVORITES_LIMIT),
          resourceTree: null,
          hasViewAll: favoriteEntries.length > FAVORITES_LIMIT,
        })
      }
      continue
    }

    if (sectionId === HOME_SECTION_IDS.RECENT) {
      groups.push({
        type: HOME_SECTION_IDS.RECENT,
        label: 'Recent',
        icon: 'schedule',
        color: SPECIAL_SECTION_COLORS[HOME_SECTION_IDS.RECENT],
        entries: sortedEntries.value.slice(0, 10),
        resourceTree: null,
      })
      continue
    }

    const type = typesById.get(sectionId)
    if (type && byType.has(type.id)) {
      groups.push(buildGroup(type.id, type.label, type.icon))
      usedTypeIds.add(type.id)
    }
  }

  const unknown = [...byType.keys()]
    .filter((type) => !usedTypeIds.has(type))
    .map((type) => buildGroup(type, type, 'help_outline'))

  return [...groups, ...unknown]
})

// On tablet/desktop, lanes stack as full-width collapsible rows instead of
// side-by-side swipeable columns — mobile keeps every lane's contents
// always visible since there's no room for a click-to-expand affordance in
// a single swiped-to column. Only "Recent" starts open on desktop.
const isDesktop = computed(() => $q.screen.gt.sm)
const expandedTypes = reactive(new Set())
if (homeViewState.activeType) {
  expandedTypes.add(homeViewState.activeType)
}
const isExpanded = (type) => !isDesktop.value || expandedTypes.has(type)

// Mirrors the active type into ?type= (dropped entirely for Recent, the
// default) — same router.replace-into-query pattern IndexPage.vue already
// uses for ?tab=, so it doesn't grow browser history on every swipe/toggle.
const syncTypeToRoute = (type) => {
  const defaultType = typeGroups.value[0]?.type
  const next = type && type !== defaultType ? type : undefined
  if ((route.query.type || undefined) === next) return
  const query = { ...route.query }
  if (next) query.type = next
  else delete query.type
  router.replace({ query })
}

const toggleType = (type) => {
  if (expandedTypes.has(type)) {
    expandedTypes.delete(type)
  } else {
    expandedTypes.add(type)
    homeViewState.setActiveType(type)
    syncTypeToRoute(type)
  }
}

// Mobile lanes are a horizontally swiped, one-at-a-time view — track
// whichever lane is currently snapped into view as "the type the user is
// on" the same way toggleType does for desktop's expand/collapse rows.
let scrollDebounce = null
const onLanesScroll = () => {
  if (isDesktop.value || !lanesEl.value) return
  clearTimeout(scrollDebounce)
  scrollDebounce = setTimeout(() => {
    const el = lanesEl.value
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    const group = typeGroups.value[index]
    if (group) {
      homeViewState.setActiveType(group.type)
      syncTypeToRoute(group.type)
    }
  }, 150)
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

const viewFavorites = () => {
  router.push(searchRouteForFacet('favorites', 'Favorites'))
}

onMounted(async () => {
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
    return
  }

  await nextTick()
  if (!expandedTypes.size && typeGroups.value[0]) {
    expandedTypes.add(typeGroups.value[0].type)
  }
  if (!isDesktop.value && lanesEl.value && homeViewState.activeType) {
    const index = typeGroups.value.findIndex((g) => g.type === homeViewState.activeType)
    if (index > 0) {
      lanesEl.value.scrollLeft = index * lanesEl.value.clientWidth
    }
  }
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
  color: var(--color-text-secondary);
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

.swipe-hint {
  flex: none;
  padding: 8px 12px;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.entry-item {
  min-height: 60px;
  border-bottom: 1px solid var(--color-border);
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

/* Mobile default; overridden for tablet/desktop below where lanes stack
   as full-width rows instead of scrolling. */
.type-lanes-wrapper {
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
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-surface-alt);
  scroll-snap-stop: always;
}

.type-lane-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
  border-top: 3px solid transparent;
  background: var(--color-surface-muted);
  font-weight: 700;
  font-size: 0.85rem;
}

.type-lane-header--clickable {
  cursor: pointer;
}

.type-lane-header--clickable:hover {
  background: var(--color-surface-muted-hover);
}

.type-lane-chevron {
  color: var(--color-text-secondary);
}

.type-lane-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-lane-count {
  color: var(--color-text-secondary);
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
  color: var(--color-text-muted);
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
