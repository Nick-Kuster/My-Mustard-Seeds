import ichthysRaw from 'src/assets/christian-glyphs/ichthys.svg?raw'
import holySpiritRaw from 'src/assets/christian-glyphs/holy-spirit.svg?raw'
import prayingHandsRaw from 'src/assets/christian-glyphs/praying-hands.svg?raw'
import holyBibleRaw from 'src/assets/christian-glyphs/holy-bible.svg?raw'
import tenCommandmentsRaw from 'src/assets/christian-glyphs/ten-commandments.svg?raw'
import weddingRingsRaw from 'src/assets/christian-glyphs/wedding-rings.svg?raw'
import feetWashingRaw from 'src/assets/christian-glyphs/feet-washing.svg?raw'
import pearlRaw from 'src/assets/christian-glyphs/pearl.svg?raw'
import handFromHeavenRaw from 'src/assets/christian-glyphs/hand-from-heaven.svg?raw'

// Source files (from svgrepo.com) all hardcode fill="#000000" on the root
// <svg> tag, with individual <path>s inheriting it — swapping that one
// attribute to currentColor is enough for every path to pick up the
// surrounding text color, light or dark theme, since nothing downstream
// overrides fill itself. Used as v-html by GlyphReferenceNodeView.vue (the
// actual inserted content, both editing and read-only) and
// GlyphPickerDialog.vue (the picker grid) — one registry, so the preview
// can never drift from what actually gets inserted.
const themeAware = (raw) => raw.replace('fill="#000000"', 'fill="currentColor"')

export const CHRISTIAN_GLYPHS = {
  ichthys: { label: 'Ichthys (Christian fish)', svg: themeAware(ichthysRaw) },
  'holy-spirit': { label: 'Holy Spirit', svg: themeAware(holySpiritRaw) },
  'praying-hands': { label: 'Praying hands', svg: themeAware(prayingHandsRaw) },
  'holy-bible': { label: 'Holy Bible', svg: themeAware(holyBibleRaw) },
  'ten-commandments': { label: 'Ten Commandments', svg: themeAware(tenCommandmentsRaw) },
  'wedding-rings': { label: 'Wedding rings', svg: themeAware(weddingRingsRaw) },
  'feet-washing': { label: 'Feet washing', svg: themeAware(feetWashingRaw) },
  pearl: { label: 'Fruit of the Spirit', svg: themeAware(pearlRaw) },
  'hand-from-heaven': { label: 'Hand of God', svg: themeAware(handFromHeavenRaw) },
}
