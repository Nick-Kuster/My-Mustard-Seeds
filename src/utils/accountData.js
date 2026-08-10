import { useJournalStore, getVerseDisplay, getResourceTitle } from 'src/stores/journalData'
import { usePrayerRequestsStore } from 'src/stores/prayerRequests'
import { usePrayerRequestGroupsStore } from 'src/stores/prayerRequestGroups'
import { useTestimonyStore } from 'src/stores/testimony'
import { useTagsStore } from 'src/stores/tags'
import { useResourcesStore } from 'src/stores/resources'
import { useSavedFiltersStore } from 'src/stores/savedFilters'
import { useUserPreferencesStore } from 'src/stores/userPreferences'
import { useProfileStore } from 'src/stores/profile'
import { formatRichTextAsMarkdown } from 'src/utils/richTextContent'
import { getListItems } from 'src/utils/sectionListUtils'

// Reuses every store's own fetch/decrypt method rather than re-querying
// Supabase here — this file is a thin aggregator, not a second data-access
// layer, so it can never drift from what the app itself actually shows the
// user (e.g. prayerRequests.js's decryptedContent/decryptedAnswerNote,
// journalData.js's RPC-based fetchEntries + decryptEntries). Deliberately
// does NOT touch user_profiles.encryption_key — that's the raw AES-GCM key
// protecting everything else; exporting it would defeat the encryption
// entirely. Only `profiles` (first_name/onboarded) is included.
export const gatherAllUserData = async () => {
  const journalStore = useJournalStore()
  const prayerRequestsStore = usePrayerRequestsStore()
  const prayerRequestGroupsStore = usePrayerRequestGroupsStore()
  const testimonyStore = useTestimonyStore()
  const tagsStore = useTagsStore()
  const resourcesStore = useResourcesStore()
  const savedFiltersStore = useSavedFiltersStore()
  const userPreferencesStore = useUserPreferencesStore()
  const profileStore = useProfileStore()

  await Promise.all([
    journalStore.fetchEntries(),
    prayerRequestsStore.fetchRequests(),
    prayerRequestGroupsStore.fetchGroups(),
    testimonyStore.load(),
    tagsStore.fetchTags(),
    resourcesStore.loadResources(true),
    savedFiltersStore.fetchFilters(),
    userPreferencesStore.load(),
    profileStore.fetchProfile(),
  ])

  const resourceRelationships = await resourcesStore.getAllRelationships()

  return {
    exportedAt: new Date().toISOString(),
    profile: profileStore.profile,
    journalEntries: journalStore.decryptedEntries,
    prayerRequests: prayerRequestsStore.requests,
    prayerRequestGroups: prayerRequestGroupsStore.groups,
    testimony: testimonyStore.content,
    tags: tagsStore.tags,
    resources: resourcesStore.resources,
    resourceRelationships,
    savedFilters: savedFiltersStore.filters,
    preferences: userPreferencesStore.preferences,
  }
}

export const formatAsJson = (data) => JSON.stringify(data, null, 2)

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

// Same section-flattening approach as PrintPage.vue (getSectionPlainText
// for longText, getListItems for list sections) — kept consistent with the
// app's one other "turn an entry into readable text" code path.
const formatEntrySections = (decryptedContent) => {
  const sections = decryptedContent?.sections || []
  return sections
    .map((section) => {
      if (!section?.title && !section?.content) return ''
      const heading = section.title ? `### ${section.title}\n` : ''
      const body = section.fieldType === 'list'
        ? getListItems(section.content).filter((item) => item.trim()).map((item) => `- ${item}`).join('\n')
        : formatRichTextAsMarkdown(section.content)
      return `${heading}${body}`
    })
    .filter(Boolean)
    .join('\n\n')
}

const formatEntryMarkdown = (entry) => {
  const lines = [`## ${entry.title || 'Untitled'}`, `_${formatDate(entry.created_at)} · ${entry.type}_`]

  if (entry.verses?.length) {
    const verseLine = entry.verses
      .map((verse) => {
        const display = getVerseDisplay(verse)
        return display ? (verse.main_verse ? `${display} (main)` : display) : null
      })
      .filter(Boolean)
      .join(', ')
    if (verseLine) lines.push(`**Verses:** ${verseLine}`)
  }

  if (entry.tags?.length) lines.push(`**Tags:** ${entry.tags.map((t) => t.name).join(', ')}`)

  const sectionsText = formatEntrySections(entry.decryptedContent)
  if (sectionsText) lines.push(sectionsText)

  if (entry.quotes?.length) {
    lines.push('**Quotes:**')
    entry.quotes.forEach((quote) => {
      const source = quote.source
        ? ` — ${quote.source}${quote.page_number ? `, p. ${quote.page_number}` : ''}`
        : ''
      lines.push(`> ${quote.decryptedQuote}${source}`)
    })
  }

  if (entry.links?.length) {
    lines.push(`**Links:** ${entry.links.map((link) => `[${link.name}](${link.url})`).join(', ')}`)
  }

  if (entry.strongs?.length) {
    lines.push(`**Strong's:** ${entry.strongs.map((s) => {
      const label = [s.strongs_number, s.transliteration || s.lemma].filter(Boolean).join(' ')
      return s.definition ? `${label} - ${s.definition}` : label
    }).join(', ')}`)
  }

  return lines.join('\n\n')
}

export const formatAsMarkdown = (data) => {
  const parts = [`# My Mustard Seeds — Data Export`, `_Exported ${formatDate(data.exportedAt)}_`]

  if (data.profile?.first_name) parts.push(`**Name:** ${data.profile.first_name}`)

  if (data.journalEntries?.length) {
    parts.push('# Journal Entries')
    data.journalEntries.forEach((entry) => parts.push(formatEntryMarkdown(entry)))
  }

  if (data.prayerRequests?.length) {
    parts.push('# Prayer Requests')
    data.prayerRequests.forEach((request) => {
      const group = data.prayerRequestGroups?.find((g) => g.id === request.group_id)?.name
      const status = request.status === 'answered' ? ' (Answered)' : ''
      const lines = [`## ${request.decryptedContent}${status}`]
      if (group) lines.push(`**Group:** ${group}`)
      if (request.follow_up_date) {
        lines.push(`**Follow Up:** ${[request.follow_up_date, request.follow_up_time].filter(Boolean).join(' ')}`)
      }
      if (request.last_followed_up_at) lines.push(`**Last Followed Up:** ${formatDate(request.last_followed_up_at)}`)
      if (request.decryptedAnswerNote) lines.push(`**Answer:** ${request.decryptedAnswerNote}`)
      parts.push(lines.join('\n\n'))
    })
  }

  if (data.testimony) {
    parts.push('# Testimony')
    parts.push(data.testimony)
  }

  if (data.tags?.length) {
    parts.push('# Tags')
    parts.push(data.tags.map((tag) => tag.name).join(', '))
  }

  if (data.resources?.length) {
    parts.push('# Resources')
    data.resources.forEach((resource) => parts.push(`- ${getResourceTitle(resource)} (${resource.type})`))
  }

  if (data.savedFilters?.length) {
    parts.push('# Saved Filters')
    data.savedFilters.forEach((filter) => parts.push(`- ${filter.name}`))
  }

  return parts.join('\n\n')
}

export const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
