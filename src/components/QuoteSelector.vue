# QuoteSelector.vue
<template>
  <div class="q-mb-lg">
    <div v-if="!displayOnly" class="row items-center no-wrap q-mb-sm section-header" role="button" @click="addNewQuote">
      <div class="text-subtitle1 text-weight-medium">Add Quote</div>
      <q-btn flat round dense color="warning" icon="format_quote" class="q-ml-xs" />
    </div>
    <div v-else class="row items-center no-wrap q-mb-sm display-header">
      <div class="text-subtitle1 text-weight-medium">Quotes</div>
    </div>

    <div v-if="quotes.length > 0" class="q-gutter-y-sm">
      <div v-for="(quote, index) in quotes" :key="index" class="quote-item">
        <div class="row items-start">
          <div class="col">
            <div class="text-italic quote-text">
              "{{ quote.decryptedQuote || quote.quote }}"
            </div>
            <div v-if="quote.source || quote.page_number" class="text-caption text-grey-8">
              -
              <a v-if="displayOnly && quote.source" href="#" class="reference-search-link"
                @click.prevent="openQuoteSearch(quote)">
                {{ quote.source }}
              </a>
              <template v-else>{{ quote.source }}</template>
              <template v-if="quote.page_number">
                (p. {{ quote.page_number }})
              </template>
            </div>
          </div>
          <div class="col-auto">
            <div v-if="!displayOnly" class="row q-gutter-x-xs">
              <q-btn flat round dense color="primary" icon="edit" size="sm" @click="editQuote(index)" />
              <q-btn flat round dense color="negative" icon="delete" size="sm" @click="removeQuote(index)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <QuoteSelectionModal v-model="showModal" :edit-data="editingQuote" @select="onQuoteSelect"
      @update="onQuoteUpdate" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import QuoteSelectionModal from './QuoteSelectionModal.vue'
import { searchRouteForFacet } from 'src/utils/searchRoute'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  displayOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const showModal = ref(false)
const quotes = ref(props.modelValue || [])
const currentEditIndex = ref(0)
const editingQuote = ref(null);

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  quotes.value = [...newValue]
}, { immediate: true, deep: true })

const onQuoteSelect = (quoteData) => {
  // For new quotes, store the unencrypted quote in both quote and decryptedQuote
  quotes.value.push({
    ...quoteData,
    quote: quoteData.quote,
    decryptedQuote: quoteData.quote
  })
  emit('update:modelValue', quotes.value)
}

const onQuoteUpdate = (updatedQuote) => {
  if (currentEditIndex.value !== null) {
    quotes.value[currentEditIndex.value] = {
      ...quotes.value[currentEditIndex.value],
      quote: updatedQuote.quote,
      decryptedQuote: updatedQuote.quote,
      source: updatedQuote.source,
      page_number: updatedQuote.page_number
    }
    currentEditIndex.value = null
    emit('update:modelValue', quotes.value)
  }
}
const addNewQuote = () => {
  currentEditIndex.value = null
  editingQuote.value = null
  showModal.value = true
}

const editQuote = (index) => {
  currentEditIndex.value = index
  editingQuote.value = {
    quote: quotes.value[index].decryptedQuote || quotes.value[index].quote,
    source: quotes.value[index].source,
    page_number: quotes.value[index].page_number
  }
  showModal.value = true
}

const removeQuote = (index) => {
  quotes.value.splice(index, 1)
  emit('update:modelValue', quotes.value)
}

const openQuoteSearch = (quote) => {
  if (!props.displayOnly || !quote?.source) return
  router.push(searchRouteForFacet('quotes', quote.source))
}
</script>

<style scoped>
.section-header {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background: var(--color-hover);
}

.section-header .q-btn {
  pointer-events: none;
}

.quote-item {
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--color-surface-muted);
  border-left: 3px solid #ffc107;
}

.quote-content {
  min-width: 0;
  /* Important for text wrapping */
}

.quote-text {
  font-style: italic;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
  margin-right: 8px;
}

.reference-search-link {
  color: var(--q-primary);
  text-decoration: underline;
  text-decoration-style: dotted;
}
</style>
