import { RESOURCE_TYPES } from '../constants/resourceTypes'

const configs = {
  [RESOURCE_TYPES.AUTHOR]: {
    title: 'Author',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.BOOK],
    getDisplayTitle: (resource) => resource.metadata.name,
  },
  [RESOURCE_TYPES.BOOK]: {
    title: 'Book',
    fields: {
      title: {
        label: 'Title',
        required: true,
        type: 'text',
      },
      year: {
        label: 'Publication Year',
        required: false,
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
      description: {
        label: 'Description',
        required: false,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.SERMON],
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) =>
      resource.metadata.year ? `(${resource.metadata.year})` : null,
  },

  [RESOURCE_TYPES.SERMON]: {
    title: 'Sermon',
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
      description: {
        label: 'Description',
        required: false,
        type: 'text',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) => resource.metadata.date,
  },

  [RESOURCE_TYPES.PASTOR]: {
    title: 'Pastor',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
      church: {
        label: 'Church',
        required: false,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.SERMON_SERIES],
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.church,
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

  [RESOURCE_TYPES.MINISTRY]: {
    title: 'Ministry',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
      website: {
        label: 'Website',
        required: false,
        type: 'text',
      },
    },
    allowedChildren: [RESOURCE_TYPES.DEVOTIONAL_SERIES],
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.website,
  },

  [RESOURCE_TYPES.DEVOTIONAL_SERIES]: {
    title: 'Devotional Series',
    fields: {
      name: {
        label: 'Name',
        required: true,
        type: 'text',
      },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
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

// Correct plural for resource titles: Ministry -> Ministries,
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
// as brand-new top-level resources (Church, Ministry, Author, ...)
export const getRootResourceTypes = () => {
  const childTypes = new Set(Object.values(configs).flatMap((cfg) => cfg.allowedChildren || []))
  return Object.keys(configs).filter((type) => !childTypes.has(type))
}
