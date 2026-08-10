const DRAFT_KEY = 'my-mustard-seeds:entry-drafts'
const MAX_DRAFTS = 3

const readDrafts = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeDrafts = (drafts) => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)))
}

export const getEntryDraft = (id) => readDrafts().find((draft) => draft.id === id) || null

export const saveEntryDraft = (id, data) => {
  if (!id || !data) return
  const now = new Date().toISOString()
  const draft = { id, data, updatedAt: now }
  const drafts = [draft, ...readDrafts().filter((item) => item.id !== id)]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_DRAFTS)
  writeDrafts(drafts)
}

export const deleteEntryDraft = (id) => {
  writeDrafts(readDrafts().filter((draft) => draft.id !== id))
}

export const entryDraftHasContent = (data) => {
  if (!data) return false
  if (data.title?.trim()) return true
  if (data.mainVerse?.display) return true
  if (data.linkedVerses?.length || data.selectedTags?.length || data.selectedQuotes?.length || data.selectedLinks?.length || data.selectedStrongs?.length) return true
  if (Object.values(data.resources || {}).some(Boolean)) return true
  return (data.contentSections || []).some((section) => {
    if (section.headerProperty) return String(section.content || '').trim()
    if (section.fieldType === 'list') return String(section.content || '').trim()
    const docText = JSON.stringify(section.content || '')
    return docText.includes('"text"')
  })
}
