import { defineStore } from 'pinia'
import { ref } from 'vue'

// Lets a page (e.g. the entry editor) swap the bottom nav bar for a row of
// page-specific actions while it's mounted. null means "show the default nav".
export const usePageActionsStore = defineStore('pageActions', () => {
  const footerActions = ref(null)

  function setFooterActions(actions) {
    footerActions.value = actions
  }

  function clearFooterActions() {
    footerActions.value = null
  }

  return { footerActions, setFooterActions, clearFooterActions }
})
