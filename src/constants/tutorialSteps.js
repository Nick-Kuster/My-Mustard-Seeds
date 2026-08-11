// Pure data — no framework/router imports here on purpose. See
// src/stores/tutorial.js for how a raw step here becomes a driver.js
// DriveStep (selector lookup, cross-page navigation, and the
// open/close-filter-modal-style side effects below all live there).
//
// `selector` is a CSS selector matching a `data-tour="..."` attribute
// added to the real element elsewhere in the app. `page` is the route the
// element lives on — when it differs from the previous step's `page`, the
// tour navigates there before highlighting it. `onAdvance` is an optional
// side-effect key the composable understands (opening/closing the filter
// modal, switching a tab, entering a component's "manage" mode, etc.) —
// each target component watches tutorialStore.pendingAction for its own
// key, same pattern as SearchPage.vue's filter-modal watcher; everything
// about triggering it is the composable's/component's job, not this
// file's.
//
// Steps whose elements are conditionally rendered (facets/saved filters
// only exist once there's data to derive them from; entry-resource-fields
// only exists once a specific journal type is picked) rely on the
// composable setting `skipMissingElement: true` — on a brand-new demo
// account those steps just get skipped rather than getting the tour stuck.
//
// QUICK_TOUR_STEPS stays a short highlights reel for real first-time
// users and is built ONLY from the shared building blocks below (no
// Full-Tour-only step arrays mixed in). All the deeper, demo-oriented
// expansion lives in the *-only consts further down and is spliced into
// FULL_TOUR_STEPS alone.

const welcomeStep = {
  page: '/',
  title: 'Welcome to My Mustard Seeds',
  description:
    'My Mustard Seeds helps you remember and revisit what God is growing in your life. Keep Scripture, sermons, prayers, and reflections together so you can see patterns, return to encouragement, and stay attentive to what the Lord is teaching you.',
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
    title: 'Quick Add',
    description:
      'Use this to plant a new journal entry or quickly add a prayer, including an optional reminder. Let\'s walk through creating an entry.',
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
    description:
      'Track prayer requests, organize them into groups, set follow-up reminders, and mark prayers answered as God works.',
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
    description:
      'The books, sermons, podcasts, and people you reference. On mobile, Resources lives in the header; on desktop, it stays in the top navigation.',
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

// ============================================================
// Full-Tour-only step groups — every one of these is genuinely untoured
// today. See sql/Demo Prayer Requests Table.sql and
// sql/Demo Resources Table.sql for the sample content that makes the
// Prayers/Testimony/Resources sections below look populated during a
// "Show with sample data" run instead of empty.
// ============================================================

const homeLanesStep = {
  selector: '[data-tour="type-lanes"]',
  page: '/',
  title: 'Browse by type',
  description:
    'Each journal type gets its own lane — swipe between them on your phone, or expand any lane right here on desktop. Entries with linked resources organize into a collapsible tree inside it.',
}

const entryResourceFieldsStep = {
  selector: '[data-tour="entry-resource-fields"]',
  page: '/entry/new',
  title: 'Fields adjust to the type',
  description:
    'Pick Sermon Notes and you get a Church → Pastor → Series → Sermon picker; pick Book and you get an Author → Book → Chapter picker instead — every type has its own fields.',
}

const richTextToolbarSteps = [
  {
    selector: '[data-tour="rich-text-toolbar"]',
    page: '/entry/new',
    title: 'A full formatting toolbar',
    description:
      'Headings, blockquotes, bullet and numbered lists (with indent/outdent), highlight and text color — all in one compact bar.',
  },
  {
    selector: '[data-tour="rich-text-glyph-btn"]',
    page: '/entry/new',
    title: 'Christian symbols',
    description: 'Insert a cross, church, crown, lamb, and more — right inline with your text.',
  },
  {
    selector: '[data-tour="rich-text-image-btn"]',
    page: '/entry/new',
    title: 'Attach a photo',
    description:
      'Upload an image straight into an entry. It\'s automatically resized and encrypted before it ever leaves your device — even we can\'t see it.',
  },
  {
    selector: '[data-tour="entry-content"]',
    page: '/entry/new',
    title: 'Type to link',
    description:
      'Type :: followed by a reference (like ::John 3:16) to link a verse, # to tag as you write, or $ to look up a Strong\'s Hebrew or Greek word — all with live suggestions, no separate dialog needed.',
  },
]

const entryAdditionalContentSteps = [
  {
    selector: '[data-tour="entry-additional-tab"]',
    page: '/entry/new',
    title: 'Additional Content',
    description: 'Verses, tags, quotes, links, and Strong\'s words all live here, separate from your main writing.',
    onAdvance: 'open-entry-additional-tab',
  },
  {
    selector: '[data-tour="entry-linked-verses"]',
    page: '/entry/new',
    title: 'Linked Verses',
    description: 'Attach extra Bible references beyond your entry\'s main passage.',
  },
  {
    selector: '[data-tour="entry-tags"]',
    page: '/entry/new',
    title: 'Tags',
    description: 'Organize entries with searchable tags — create a new one on the fly or reuse an existing one.',
  },
  {
    selector: '[data-tour="entry-quotes"]',
    page: '/entry/new',
    title: 'Quotes',
    description: 'Save a quote with its source and page number, right alongside your notes.',
  },
  {
    selector: '[data-tour="entry-links"]',
    page: '/entry/new',
    title: 'Links',
    description: 'Attach a named URL — a sermon recording, an article, anything worth revisiting.',
  },
  {
    selector: '[data-tour="entry-strongs"]',
    page: '/entry/new',
    title: 'Strong\'s Words',
    description: 'Attach specific Hebrew or Greek words from the Strong\'s dictionary — the same lookup as the $ inline trigger.',
  },
]

const prayersDeepDiveSteps = [
  {
    selector: '[data-tour="prayer-followups"]',
    page: '/',
    title: 'Follow up on prayers',
    description:
      'When a prayer has a follow-up date due soon, it appears here with quick actions to mark that you prayed, snooze it, reschedule it, or mark it answered.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="prayer-groups-area"]',
    page: '/',
    title: 'Organize your prayers',
    description:
      'Keep prayers grouped in one simple view. Add groups from the top, then add prayers inline under any group.',
  },
  {
    selector: '[data-tour="prayer-quick-add"]',
    page: '/',
    title: 'Quick add',
    description: 'Add a prayer inline, right where you\'re already looking — no separate dialog.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="prayer-followup-date"]',
    page: '/',
    title: 'Set a follow-up date',
    description:
      'Use the calendar button on any active prayer to choose when you want it to come back to your attention.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="prayer-mark-answered"]',
    page: '/',
    title: 'Mark answered',
    description: 'Record how God answered, right when it happens.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="prayer-answered-section"]',
    page: '/',
    title: 'A running record',
    description: 'Answered prayers collapse into their own section, struck-through — a quiet record of what God has done.',
    skipMissingElement: true,
  },
]

const testimonyDeepDiveSteps = [
  {
    selector: '[data-tour="testimony-guide"]',
    page: '/',
    title: 'Not sure where to start?',
    description: 'This guide breaks a testimony into Before / How / Now — a simple shape if you\'ve never written one down.',
  },
  {
    selector: '[data-tour="testimony-content"]',
    page: '/',
    title: 'One evolving story',
    description: 'Unlike journal entries, there\'s just one testimony — edit it any time your story grows.',
    skipMissingElement: true,
  },
]

const resourcesDeepDiveSteps = [
  {
    selector: '[data-tour="resources-search"]',
    page: '/resources',
    title: 'Find anything fast',
    description: 'Search across every resource regardless of depth — a search for a sermon shows you which pastor and church it\'s under.',
  },
  {
    selector: '[data-tour="resources-add-btn"]',
    page: '/resources',
    title: 'Add a new resource',
    description: 'Start a new Church, Author, Podcast, or any other top-level resource here.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="resources-item-menu"]',
    page: '/resources',
    title: 'Manage any resource',
    description:
      'View the entries that reference it, add a child underneath it (like a Pastor under a Church), edit its details, or delete it — with a choice to keep or cascade-delete its children.',
    skipMissingElement: true,
  },
]

const searchBoxStep = {
  selector: '[data-tour="search-box"]',
  page: '/search',
  title: 'Search everything you\'ve written',
  description: 'Free-text search across every entry, combined with whatever filters you have active.',
}

const printOptionsSteps = [
  {
    selector: '[data-tour="print-options-toggles"]',
    page: '/search',
    title: 'Choose what\'s included',
    description: 'Toggle entry content, verses, tags, quotes, and links independently — your choice is remembered for next time.',
    onAdvance: 'close-print-options',
  },
]

const settingsDeepDiveSteps = [
  {
    selector: '[data-tour="settings-prayer-reminders"]',
    page: '/settings',
    title: 'Prayer reminders',
    description:
      'Turn on phone reminders for due prayer follow-ups. Each prayer uses the follow-up time you set on that request. On iPhone, this works from the installed Home Screen app.',
  },
  {
    selector: '[data-tour="settings-tags"]',
    page: '/settings',
    title: 'Manage tags',
    description: 'See every tag you\'ve created — select several and delete them all at once, removing them from every entry that used them.',
  },
  {
    selector: '[data-tour="settings-import"]',
    page: '/settings',
    title: 'Bring in old notes with AI',
    description:
      'Copy the template, hand it to ChatGPT (or any AI) along with old notes or even photos of handwritten pages, then paste the structured response back in — it reviews and imports in bulk, flagging anything it skipped.',
  },
  {
    selector: '[data-tour="settings-data-export"]',
    page: '/settings',
    title: 'Export everything',
    description: 'Download your entire account — entries, prayers, testimony, tags, resources, saved filters — as both a JSON file and a readable document.',
  },
  {
    selector: '[data-tour="settings-danger-zone"]',
    page: '/settings',
    title: 'Delete your account',
    description: 'Permanently removes your data and login. Requires typing your email to confirm, and reminds you to export first.',
  },
]

const settingsNavStep = {
  selector: '[data-tour="nav-settings"]',
  page: '/search',
  title: 'Settings',
  description: 'Settings is where you manage tags, import old notes, export your data, and replay tours.',
}

const replayTourStep = {
  selector: '[data-tour="replay-tour-btn"]',
  page: '/settings',
  title: 'Replay anytime',
  description: 'This tour is always one click away from here.',
  waitForElement: 1500,
}

export const MAIN_TOUR_STEPS = [
  welcomeStep,
  introSteps[0],
  homeLanesStep,
  introSteps[1],
  entryCreationSteps[0],
  entryResourceFieldsStep,
  entryCreationSteps[1],
  ...richTextToolbarSteps,
  entryAdditionalContentSteps[0],
  entryAdditionalContentSteps[1],
  entryAdditionalContentSteps[2],
  entryAdditionalContentSteps[4],
  entryAdditionalContentSteps[5],
  entryCreationSteps[2],
  homeReturnSteps[0],
  ...prayersDeepDiveSteps,
  homeReturnSteps[1],
  ...testimonyDeepDiveSteps,
  homeReturnSteps[2],
  resourcesSteps[0],
  resourcesSteps[1],
  resourcesDeepDiveSteps[0],
  resourcesDeepDiveSteps[2],
  searchNavStep,
  searchBoxStep,
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
    selector: '[data-tour="filter-saved"]',
    page: '/search',
    title: 'Saved Filters',
    description: 'Save a useful filter combination, then apply it again in one click next time.',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="filter-apply-btn"]',
    page: '/search',
    title: 'Apply Filters',
    description: 'Apply your selection and return to the results.',
    onAdvance: 'close-filter-modal',
    skipMissingElement: true,
  },
  {
    selector: '[data-tour="print-btn"]',
    page: '/search',
    title: 'Print / Export to PDF',
    description: 'Export filtered results to a print-ready document.',
    waitForElement: 1000,
    onAdvance: 'open-print-options',
  },
  ...printOptionsSteps,
  settingsNavStep,
  settingsDeepDiveSteps[0],
  settingsDeepDiveSteps[1],
  settingsDeepDiveSteps[2],
  replayTourStep,
  {
    page: '/settings',
    title: 'That\'s the main tour',
    description: 'Run the Full Tour anytime if you want every advanced filter, print, resource, and settings detail.',
  },
]

export const FULL_TOUR_STEPS = [
  welcomeStep,
  introSteps[0],
  homeLanesStep,
  introSteps[1],
  entryCreationSteps[0],
  entryResourceFieldsStep,
  entryCreationSteps[1],
  ...richTextToolbarSteps,
  ...entryAdditionalContentSteps,
  entryCreationSteps[2],
  homeReturnSteps[0],
  ...prayersDeepDiveSteps,
  homeReturnSteps[1],
  ...testimonyDeepDiveSteps,
  homeReturnSteps[2],
  ...resourcesSteps,
  ...resourcesDeepDiveSteps,
  searchNavStep,
  searchBoxStep,
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
    onAdvance: 'open-print-options',
  },
  ...printOptionsSteps,
  {
    selector: '[data-tour="nav-settings"]',
    page: '/search',
    title: 'Settings',
    description: 'One more stop — Settings is also where you can manage tags and replay this tour.',
  },
  ...settingsDeepDiveSteps,
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
