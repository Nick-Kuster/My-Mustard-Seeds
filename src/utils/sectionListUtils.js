// A "list" section stores its items the same way any other section stores
// content — as a single string — just newline-delimited. This keeps the
// section data shape (and everything that reads section.content: search,
// encryption, save/load) unchanged; fieldType === 'list' only changes how
// the editor and viewer present that string.

// Always at least one item (never []) — an empty string is one blank item,
// matching plain split('\n') semantics. Treating '' as "zero items" instead
// (as an earlier version of this did) makes a one-blank-item list and a
// zero-item list serialize to the same string, so adding the very first
// item to a fresh list silently no-ops: [''].join('\n') is '' again.
export const getListItems = (content) => (content || '').split('\n')

export const setListItem = (content, index, value) => {
  const items = getListItems(content)
  items[index] = value
  return items.join('\n')
}

export const addListItem = (content) => [...getListItems(content), ''].join('\n')

export const removeListItem = (content, index) => {
  const items = getListItems(content)
  items.splice(index, 1)
  return items.join('\n')
}
