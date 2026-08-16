export const SECTION_BACKGROUND_SWATCHES = [
  { id: 'warm', light: '#f4eee6', dark: '#3a332d', label: 'Warm' },
  { id: 'yellow', light: '#f2edcf', dark: '#3a3726', label: 'Yellow' },
  { id: 'green', light: '#e6eee4', dark: '#2d3a31', label: 'Green' },
  { id: 'blue', light: '#e5edf4', dark: '#2b3540', label: 'Blue' },
  { id: 'pink', light: '#f1e5eb', dark: '#3b2d34', label: 'Pink' },
  { id: 'purple', light: '#ede6f2', dark: '#352f3d', label: 'Purple' },
  { id: 'slate', light: '#e8edf1', dark: '#30373d', label: 'Slate' },
  { id: 'gray', light: '#e9e7e4', dark: '#343433', label: 'Gray' },
]

export const SECTION_TEXT_SWATCHES = [
  { id: 'ink', light: '#1f2937', dark: '#eef2f7', label: 'Ink' },
  { id: 'charcoal', light: '#3f3f46', dark: '#d6d3d1', label: 'Charcoal' },
  { id: 'taupe', light: '#57534e', dark: '#d6cfc7', label: 'Taupe' },
  { id: 'red', light: '#7f1d1d', dark: '#f0b3a7', label: 'Red' },
  { id: 'gold', light: '#854d0e', dark: '#e2c174', label: 'Gold' },
  { id: 'green', light: '#166534', dark: '#9fc7a9', label: 'Green' },
  { id: 'blue', light: '#1e3a8a', dark: '#a9c2e8', label: 'Blue' },
  { id: 'purple', light: '#581c87', dark: '#c9b4e5', label: 'Purple' },
]

const legacyBackgroundByHex = new Map(
  SECTION_BACKGROUND_SWATCHES.flatMap((swatch) => [
    [swatch.light.toLowerCase(), swatch.id],
    [swatch.dark.toLowerCase(), swatch.id],
  ]),
)

const legacyTextByHex = new Map(
  SECTION_TEXT_SWATCHES.flatMap((swatch) => [
    [swatch.light.toLowerCase(), swatch.id],
    [swatch.dark.toLowerCase(), swatch.id],
  ]),
)

export const normalizeSectionBackgroundColor = (value) => {
  if (!value) return ''
  const normalized = String(value).trim().toLowerCase()
  return legacyBackgroundByHex.get(normalized) || normalized
}

export const normalizeSectionTextColor = (value) => {
  if (!value) return ''
  const normalized = String(value).trim().toLowerCase()
  return legacyTextByHex.get(normalized) || normalized
}

const cssColor = (value, prefix) => {
  if (!value) return ''
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl') || value.startsWith('var(')) return value
  return `var(--${prefix}-${value})`
}

export const getSectionStyle = (section) => {
  const background = cssColor(normalizeSectionBackgroundColor(section?.color), 'section-bg')
  const text = cssColor(normalizeSectionTextColor(section?.textColor), 'section-text')

  return {
    ...(background ? { backgroundColor: background } : {}),
    ...(text ? { color: text, '--section-text-color': text } : {}),
  }
}
