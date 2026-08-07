import { describe, expect, it } from 'vitest'
import {
  addListItem,
  getListItems,
  insertListItemAfter,
  removeListItem,
  setListItem,
} from './sectionListUtils'

describe('section list serialization', () => {
  it('treats empty content as one blank item', () => {
    expect(getListItems('')).toEqual([''])
    expect(getListItems(null)).toEqual([''])
  })

  it('updates an item while preserving newline serialization', () => {
    expect(setListItem('first\nthird', 1, 'second')).toBe('first\nsecond')
  })

  it('adds and inserts blank list items', () => {
    expect(addListItem('first')).toBe('first\n')
    expect(insertListItemAfter('first\nthird', 0)).toBe('first\n\nthird')
  })

  it('removes list items by index', () => {
    expect(removeListItem('first\nsecond\nthird', 1)).toBe('first\nthird')
  })
})
