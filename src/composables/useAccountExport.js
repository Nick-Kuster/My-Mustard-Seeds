import { ref } from 'vue'
import { gatherAllUserData, formatAsJson, formatAsMarkdown, downloadTextFile } from 'src/utils/accountData'

export function useAccountExport() {
  const exporting = ref(false)
  const error = ref('')

  const exportAllData = async () => {
    exporting.value = true
    error.value = ''
    try {
      const data = await gatherAllUserData()
      const dateStamp = new Date().toISOString().slice(0, 10)

      downloadTextFile(`my-mustard-seeds-export-${dateStamp}.json`, formatAsJson(data), 'application/json')
      downloadTextFile(`my-mustard-seeds-export-${dateStamp}.md`, formatAsMarkdown(data), 'text/markdown')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export your data.'
      throw err
    } finally {
      exporting.value = false
    }
  }

  return { exporting, error, exportAllData }
}
