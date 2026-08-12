export const BIBLE_TRANSLATION_OPTIONS = [
  {
    provider: 'local',
    bibleId: null,
    label: 'BSB - Berean Standard Bible',
    abbreviation: 'BSB',
    description: 'Local default with Strong\'s word-study links',
  },
  {
    provider: 'apiBible',
    bibleId: 'a761ca71e0b3ddcf-01',
    label: 'NASB20 - New American Standard Bible 2020',
    abbreviation: 'NASB20',
    description: 'New American Standard Bible 2020',
  },
  {
    provider: 'apiBible',
    bibleId: '78a9f6124f344018-01',
    label: 'NIV - New International Version',
    abbreviation: 'NIV',
    description: 'New International Version 2011',
  },
  {
    provider: 'apiBible',
    bibleId: 'd6e14a625393b4da-01',
    label: 'NLT - New Living Translation',
    abbreviation: 'NLT',
    description: 'New Living Translation',
  },
]

export const bibleOptionKey = (option) => option?.provider === 'local' ? 'local' : option?.bibleId

export const findBibleTranslationOption = (preference) =>
  BIBLE_TRANSLATION_OPTIONS.find((option) => bibleOptionKey(option) === bibleOptionKey(preference))
  || BIBLE_TRANSLATION_OPTIONS[0]
