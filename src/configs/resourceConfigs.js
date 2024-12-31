// src/configs/resourceConfigs.js
import { RESOURCE_TYPES } from 'src/stores/resources'

export const resourceConfigs = {
  [RESOURCE_TYPES.BOOK]: {
    title: 'Book',
    fields: {
      title: { label: 'Title', required: false },
      author: { label: 'Author', required: false },
    },
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) => `by ${resource.metadata.author}`,
  },

  [RESOURCE_TYPES.PODCAST]: {
    title: 'Podcast',
    fields: {
      title: { label: 'Title', required: false },
      host: { label: 'Host', required: false },
    },
    getDisplayTitle: (resource) => resource.metadata.title,
    getDisplaySubtitle: (resource) => `hosted by ${resource.metadata.host}`,
  },

  [RESOURCE_TYPES.PASTOR]: {
    title: 'Pastor',
    fields: {
      name: { label: 'Name', required: false },
      church: { label: 'Church', required: false },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: (resource) => resource.metadata.church,
  },

  [RESOURCE_TYPES.SONG_ARTIST]: {
    title: 'Song Artist',
    fields: {
      name: { label: 'Name', required: false },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: () => null,
  },

  [RESOURCE_TYPES.CHURCH]: {
    title: 'Church',
    fields: {
      name: { label: 'Name', required: false },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: () => null,
  },

  [RESOURCE_TYPES.MINISTRY]: {
    title: 'Ministry',
    fields: {
      name: { label: 'Name', required: false },
    },
    getDisplayTitle: (resource) => resource.metadata.name,
    getDisplaySubtitle: () => null,
  },
}

export const getResourceConfig = (type) => {
  const config = resourceConfigs[type]
  if (!config) {
    throw new Error(`No configuration found for resource type: ${type}`)
  }
  return config
}
