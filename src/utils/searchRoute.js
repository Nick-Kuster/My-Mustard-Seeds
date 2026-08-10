export const FACET_KEYS = ['types', 'verses', 'books', 'resourceTypes', 'resources', 'tags', 'quotes', 'links', 'strongs']

export const emptyFacets = () => ({
  types: [],
  verses: [],
  books: [],
  resourceTypes: [],
  resources: [],
  tags: [],
  quotes: [],
  links: [],
  strongs: [],
})

export const searchRouteForFacet = (facetType, value) => {
  const facets = emptyFacets()
  facets[facetType] = [value]

  return {
    path: '/search',
    query: {
      facets: JSON.stringify(facets),
    },
  }
}

export const verseFacetFromDisplayVerse = (verse) => ({
  book: verse.book,
  startChapter: verse.start_chapter,
  startVerse: verse.start_verse,
  endChapter: verse.end_chapter,
  endVerse: verse.end_verse,
  label: verse.display,
})
