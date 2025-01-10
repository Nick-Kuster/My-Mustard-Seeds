import { RESOURCE_TYPES } from '../constants/resourceTypes'

const configs = {
  [RESOURCE_TYPES.BOOK]: {
    title: 'Book',
    fields: {
      title: {
        label: 'Title',
        required: true,
      },
      author: {
        label: 'Author',
        required: true,
      },
      year: {
        label: 'Publication Year',
        required: false,
      },
    },
    allowedChildren: [RESOURCE_TYPES.CHAPTER],
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) => `by ${resource.metadata.author}`,
  },

  [RESOURCE_TYPES.CHAPTER]: {
    title: 'Chapter',
    fields: {
      title: {
        label: 'Title',
        required: true,
      },
      number: {
        label: 'Chapter Number',
        required: true,
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
      },
      year: {
        label: 'Year',
        required: false,
      },
      description: {
        label: 'Description',
        required: false,
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
      },
      date: {
        label: 'Date Preached',
        required: false,
      },
      description: {
        label: 'Description',
        required: false,
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
      },
      church: {
        label: 'Church',
        required: false,
      },
    },
    allowedChildren: [RESOURCE_TYPES.SERMON_SERIES, RESOURCE_TYPES.SERMON],
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.church,
  },

  [RESOURCE_TYPES.SONG_ARTIST]: {
    title: 'Artist',
    fields: {
      name: {
        label: 'Name',
        required: true,
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
      },
      location: {
        label: 'Location',
        required: false,
      },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.location,
  },

  [RESOURCE_TYPES.MINISTRY]: {
    title: 'Ministry',
    fields: {
      name: {
        label: 'Name',
        required: true,
      },
      website: {
        label: 'Website',
        required: false,
      },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.website,
  },

  [RESOURCE_TYPES.PODCAST]: {
    title: 'Podcast',
    fields: {
      title: {
        label: 'Title',
        required: true,
      },
      host: {
        label: 'Host',
        required: false,
      },
    },
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) =>
      resource.metadata.host ? `Hosted by ${resource.metadata.host}` : null,
  },
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
