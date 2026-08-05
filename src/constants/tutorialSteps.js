// Pure data — no framework/router imports here on purpose. See
// src/stores/tutorial.js for how a raw step here becomes a driver.js
// DriveStep (selector lookup, cross-page navigation, and the
// open/close-filter-modal side effects below all live there).
//
// `selector` is a CSS selector matching a `data-tour="..."` attribute
// added to the real element elsewhere in the app. `page` is the route the
// element lives on — when it differs from the previous step's `page`, the
// tour navigates there before highlighting it. `onAdvance` is an optional
// side-effect key the composable understands (opening/closing the filter
// modal); everything else about triggering it is the composable's job, not
// this file's.
//
// Steps whose elements are conditionally rendered (facets/saved filters
// only exist once there's data to derive them from) rely on the
// composable setting `skipMissingElement: true` — on a brand-new demo
// account those steps just get skipped rather than getting the tour stuck.

const welcomeStep = {
  page: '/',
  title: 'Welcome to My Mustard Seeds',
  description:
    'A private, end-to-end encrypted Bible study and prayer journal. Let\'s take a quick look at what it can do.',
}

const introSteps = [
  {
    selector: '[data-tour="tab-seeds"]',
    page: '/',
    title: 'My Seeds',
    description:
      'Your journal entries, organized by type — Bible reading, sermon notes, book reflections, and more, each with its own structure.',
  },
  {
    selector: '[data-tour="nav-plant"]',
    page: '/',
    title: 'Plant a Seed',
    description: 'Start a new entry in one tap. Let\'s walk through creating one.',
  },
]

// A real detour into the entry editor — not just a description of the nav
// button. Nothing gets auto-submitted; Save is only highlighted, never
// clicked by the tour itself, same as everywhere else in the tour.
const entryCreationSteps = [
  {
    selector: '[data-tour="entry-type-picker"]',
    page: '/entry/new',
    title: 'Pick a format',
    description: 'Bible reading, sermon notes, a book you\'re working through — the fields below adjust to fit.',
    waitForElement: 1500,
  },
  {
    selector: '[data-tour="entry-content"]',
    page: '/entry/new',
    title: 'Write freely',
    description: 'Add as many sections as you like, switch any of them to a checklist, and drag to reorder.',
  },
  {
    selector: '[data-tour="entry-save"]',
    page: '/entry/new',
    title: 'Save',
    description:
      'Plants it in your journal. Verses, tags, quotes, and resources you attach under "Additional Content" are saved right along with it.',
  },
]

const homeReturnSteps = [
  {
    selector: '[data-tour="tab-prayers"]',
    page: '/',
    title: 'Prayers',
    description: 'Track prayer requests, organize them into groups, and mark prayers answered as God works.',
    waitForElement: 1000,
  },
  {
    selector: '[data-tour="tab-testimony"]',
    page: '/',
    title: 'Testimony',
    description: 'Keep an ongoing testimony journal — your story of what God has done.',
  },
  {
    selector: '[data-tour="theme-toggle"]',
    page: '/',
    title: 'Light or dark',
    description: 'Switch themes any time — everything in the app adapts.',
  },
]

const resourcesSteps = [
  {
    selector: '[data-tour="nav-resources"]',
    page: '/',
    title: 'Resources',
    description: 'The books, sermons, podcasts, and people you reference — let\'s take a look.',
  },
  {
    selector: '[data-tour="resources-heading"]',
    page: '/resources',
    title: 'Resources',
    description:
      'Attach a resource to an entry (from the entry editor\'s type-specific picker) and it shows up here automatically — organized into a tree, so a sermon nests under its series, its pastor, its church.',
    waitForElement: 1500,
  },
]

const searchNavStep = {
  selector: '[data-tour="nav-search"]',
  page: '/resources',
  title: 'Search',
  description: 'Everything you write is searchable — let\'s look at how.',
}

const filtersIntroStep = {
  selector: '[data-tour="filters-btn"]',
  page: '/search',
  title: 'Filters',
  description:
    'Filter your entries by type, tag, Bible book or verse, and linked resources — and save your favorite combinations as one-click presets.',
  waitForElement: 2000,
}

const quickWrapUpStep = {
  page: '/search',
  title: 'That\'s the quick tour',
  description:
    'Replay this tour anytime from Settings — or run it again and choose the Full Tour for a deeper look at filters and saved presets.',
}

export const QUICK_TOUR_STEPS = [
  welcomeStep,
  ...introSteps,
  ...entryCreationSteps,
  ...homeReturnSteps,
  ...resourcesSteps,
  searchNavStep,
  filtersIntroStep,
  quickWrapUpStep,
]

export const FULL_TOUR_STEPS = [
  welcomeStep,
  ...introSteps,
  ...entryCreationSteps,
  ...homeReturnSteps,
  ...resourcesSteps,
  searchNavStep,
  { ...filtersIntroStep, onAdvance: 'open-filter-modal' },
  {
    selector: '[data-tour="filter-types"]',
    page: '/search',
    title: 'Journal Types',
    description: 'Narrow results down to one or more entry types.',
    waitForElement: 1500,
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="filter-tags"]',
    page: '/search',
    title: 'Tags',
    description: 'Filter by any tag you\'ve created.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="filter-verses"]',
    page: '/search',
    title: 'Bible Verses',
    description: 'Build a book/chapter/verse range — matches any entry that references it.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="filter-resources"]',
    page: '/search',
    title: 'Resources',
    description: 'Filter by linked sermons, books, podcasts, and more — the same resources from a few steps ago.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="filter-saved"]',
    page: '/search',
    title: 'Saved Filters',
    description: 'This is the part worth remembering: save a combination of filters by name, then apply it again in one click next time — no rebuilding it from scratch.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="filter-save-row"]',
    page: '/search',
    title: 'Save the current selection',
    description: 'Name whatever\'s currently selected and save it. Saving under a name you\'ve already used updates that preset instead of erroring.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="filter-apply-btn"]',
    page: '/search',
    title: 'Apply Filters',
    description: 'Applies your selection and closes the dialog — results update immediately.',
    onAdvance: 'close-filter-modal',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="print-btn"]',
    page: '/search',
    title: 'Print / Export to PDF',
    description: 'Export whatever\'s currently filtered to a print-ready document, with control over exactly what\'s included.',
    waitForElement: 1000,
  },
  {
    selector: '[data-tour="nav-settings"]',
    page: '/search',
    title: 'Settings',
    description: 'One more stop — Settings is also where you can manage tags and replay this tour.',
  },
  {
    selector: '[data-tour="replay-tour-btn"]',
    page: '/settings',
    title: 'Replay anytime',
    description: 'This tour is always one click away from here.',
    waitForElement: 1500,
  },
  {
    page: '/settings',
    title: 'That\'s the full tour',
    description: 'You now know your way around. Happy journaling!',
  },
]
