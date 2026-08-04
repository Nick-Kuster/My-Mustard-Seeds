import { RESOURCE_TYPES } from '../constants/resourceTypes'

const configs = {
  [RESOURCE_TYPES.AUTHOR]: {
    title: 'Author/Ministry',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.BOOK],
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: null,
  },
  [RESOURCE_TYPES.BOOK]: {
    title: 'Book',
    fields: {
      title: {
        label: 'Title',
        required: true,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.CHAPTER],
    getDisplayTitle: (resource) => resource.metadata.title,
  },

  [RESOURCE_TYPES.CHAPTER]: {
    title: 'Chapter',
    fields: {
      title: {
        label: 'Title',
        required: true,
        type: 'text',
      },
      number: {
        label: 'Chapter Number',
        required: true,
        type: 'text',
      },
    },
    getDisplayTitle: (resource) =>
      `Chapter ${resource.metadata.number}: ${resource.metadata.title}`,
    getDisplaySubtitle: null,
  },

  [RESOURCE_TYPES.SERMON_SERIES]: {
    title: 'Sermon Series',
    // Used in the resource-selection modal, where a Sermon Series and a
    // one-off Sermon can appear side by side and need a quick label (and
    // color) to tell them apart
    shortTitle: 'Series',
    color: '#5f9ea8',
    fields: {
      title: {
        label: 'Series Title',
        required: true,
        type: 'text',
      },
      year: {
        label: 'Year',
        required: false,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.SERMON],
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) =>
      resource.metadata.year ? `(${resource.metadata.year})` : null,
    getYear: (resource) => resource.metadata.year || null,
  },

  [RESOURCE_TYPES.SERMON]: {
    title: 'Sermon',
    color: '#c98a6b',
    fields: {
      title: {
        label: 'Title',
        required: true,
        type: 'text',
      },
      date: {
        label: 'Date Preached',
        required: false,
        type: 'date',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) => resource.metadata.date,
    getYear: (resource) => resource.metadata.date?.slice(0, 4) || null,
  },

  [RESOURCE_TYPES.PASTOR]: {
    title: 'Pastor',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
    },
    // A Pastor can hold either a full Sermon Series or a one-off Sermon
    // directly — the drill-down lets a sermon skip the series level when
    // it isn't part of one
    allowedChildren: [RESOURCE_TYPES.SERMON_SERIES, RESOURCE_TYPES.SERMON],
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: null,
  },

  [RESOURCE_TYPES.SONG_ARTIST]: {
    title: 'Artist',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: () => '',
  },

  [RESOURCE_TYPES.CHURCH]: {
    title: 'Church',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
      location: {
        label: 'Location',
        required: false,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.PASTOR],
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.location,
  },

  [RESOURCE_TYPES.DEVOTIONAL]: {
    title: 'Devotional',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
      author: {
        label: 'Author or Ministry',
        required: false,
        type: 'text',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.author,
  },

  [RESOURCE_TYPES.PODCAST]: {
    title: 'Podcast',
    fields: {
      title: {
        label: 'Title',
        required: true,
        type: 'text',
      },
      host: {
        label: 'Host',
        required: false,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.PODCAST_EPISODE],
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) =>
      resource.metadata.host ? `Hosted by ${resource.metadata.host}` : null,
  },

  [RESOURCE_TYPES.PODCAST_EPISODE]: {
    title: 'Episode',
    fields: {
      title: {
        label: 'Episode Title',
        required: true,
        type: 'text',
      },
      episodeNumber: {
        label: 'Episode Number',
        required: false,
        type: 'text',
      },
      date: {
        label: 'Date Released',
        required: false,
        type: 'date',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) =>
      resource.metadata.episodeNumber ? `Episode ${resource.metadata.episodeNumber}` : null,
  },

  [RESOURCE_TYPES.GROUP]: {
    title: 'Group',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
      leader: {
        label: 'Leader',
        required: true,
        type: 'text',
      },
      church: {
        label: 'Church',
        required: false,
        type: 'text',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) =>
      `Lead by ${resource.metadata.leader} At ${resource.metadata.church}`,
  },

  [RESOURCE_TYPES.SHOW]: {
    title: 'Show',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.SEASON],
    getDisplayTitle: (resource) => resource.metadata.name,
  },

  [RESOURCE_TYPES.SEASON]: {
    title: 'Season',
    fields: {
      seasonNumber: {
        label: 'Season',
        required: true,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.EPISODE],
    getDisplayTitle: (resource) => `Season ${resource.metadata.seasonNumber}`,
  },

  [RESOURCE_TYPES.EPISODE]: {
    title: 'Episode',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
      episodeNumber: {
        label: 'Episode Number',
        required: true,
        type: 'text',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => `Episode ${resource.metadata.episodeNumber}`,
  },
}

// Correct plural for resource titles: Author/Ministry -> Author/Ministries,
// Church -> Churches, Sermon Series -> Sermon Series (unchanged)
export const pluralizeTitle = (title) => {
  if (!title) return title
  if (/s$/i.test(title)) return title
  if (/[^aeiou]y$/i.test(title)) return title.slice(0, -1) + 'ies'
  if (/(ch|sh|x|z)$/i.test(title)) return title + 'es'
  return title + 's'
}

export const getResourceConfig = (type) => {
  const config = configs[type]
  if (!config) {
    throw new Error(`No configuration found for resource type: ${type}`)
  }
  return config
}

export const getAllowedChildTypes = (parentType) => {
  return configs[parentType]?.allowedChildren || []
}

// Resource types that are never another type's child — i.e. can be created
// as brand-new top-level resources (Church, Author/Ministry, Devotional, ...)
export const getRootResourceTypes = () => {
  const childTypes = new Set(Object.values(configs).flatMap((cfg) => cfg.allowedChildren || []))
  return Object.keys(configs).filter((type) => !childTypes.has(type))
}

// child type -> parent types, derived once from allowedChildren so it can
// never drift out of sync with the tree defined above. Usually one parent,
// but a type like Sermon can attach at more than one level (under a
// SermonSeries, or directly under a Pastor as a one-off)
const parentTypesOf = (() => {
  const map = {}
  Object.entries(configs).forEach(([parentType, cfg]) => {
    ;(cfg.allowedChildren || []).forEach((childType) => {
      if (!map[childType]) map[childType] = []
      map[childType].push(parentType)
    })
  })
  return map
})()

// How many levels deep a type sits below its root (Church=0, Pastor=1,
// SermonSeries=2, Sermon=3, ...) — useful for ordering a flat bag of
// resources into their natural parent-first hierarchy. For a type with
// multiple possible parents, uses the deepest chain (e.g. Sermon is always
// treated as 3 levels down, its depth via SermonSeries) so a one-off sermon
// — which has no SermonSeries in its resource list at all — still sorts
// after its Pastor rather than colliding with a real series at the same
// depth.
export const getResourceTypeDepth = (type) => {
  const parents = parentTypesOf[type]
  if (!parents || parents.length === 0) return 0
  return 1 + Math.max(...parents.map((parentType) => getResourceTypeDepth(parentType)))
}
