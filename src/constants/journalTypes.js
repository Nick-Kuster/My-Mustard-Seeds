// `color` is the default fill color for each type — used wherever a type
// needs a visual accent (type-lane headers, the type picker, ...). These are
// only the defaults: src/stores/journalTypeColors.js lets a per-user
// override take precedence, so a future settings screen can let users pick
// their own without touching anything that reads getColor().
export const JOURNAL_TYPES = [
  { id: 'Daily Bible Reading', icon: 'menu_book', label: 'Daily Bible Reading', description: 'Read and meditate on Scripture', color: '#7c9082' },
  { id: 'Sermon', icon: 'church', label: 'Sermon Notes', description: 'Notes from a sermon or teaching', color: '#9b6e4b' },
  { id: 'Answered Prayer / Miracle', icon: 'front_hand', label: 'Monuments', description: 'Something big or small God has done that brought you joy or gratitude — a moment to look back on and say "God is good," even when times are hard.', color: '#d4a94c' },
  { id: 'Devotional', icon: 'auto_stories', label: 'Devotional', description: 'Daily devotional reflections', color: '#c98a6b' },
  { id: 'Group', icon: 'group', label: 'Group Study', description: 'Small group or Bible study notes', color: '#6ba58a' },
  { id: 'Video', icon: 'smart_display', label: 'Video', description: 'Notes from Christian videos', color: '#5f9ea8' },
  { id: 'Book', icon: 'book', label: 'Book Notes', description: 'Notes from Christian books', color: '#8a6d4f' },
  { id: 'Song', icon: 'music_note', label: 'Worship Song', description: 'Reflections on worship music', color: '#b5658a' },
  { id: 'Article', icon: 'article', label: 'Article Notes', description: 'Notes from Christian articles', color: '#7a8c99' },
  { id: 'Podcast', icon: 'podcasts', label: 'Podcast Notes', description: 'Notes from Christian podcasts', color: '#a67c52' },
  { id: 'Show', icon: 'tv', label: 'Show Notes', description: 'Notes from Christian shows/videos', color: '#6d7fae' },
  { id: 'Other', icon: 'more_horiz', label: 'Other', description: 'Other spiritual reflections', color: '#9aa398' },
]
