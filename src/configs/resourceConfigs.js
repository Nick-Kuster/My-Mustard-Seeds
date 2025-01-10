import { RESOURCE_TYPES } from '../constants/resourceTypes'

const configs = {
  [RESOURCE_TYPES.BOOK]: {
    title: 'Book',
    fields: {
      title: {
        label: 'Title',
        required: true,
        type: 'text',
      },
      author: {
        label: 'Author',
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
    getDisplaySubtitle: (resource) => `by ${resource.metadata.author}`,
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
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.website,
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
