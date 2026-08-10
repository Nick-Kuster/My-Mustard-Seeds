<template>
  <div class="verse-chip">
    <q-chip :color="color" text-color="white" :removable="removable" @remove="$emit('remove')" clickable
      @click="handleClick">
      {{ verse.display }}
    </q-chip>

    <VerseDisplayModal v-model="showVerseModal" :reference="verse.display" :start-verse="verse.startVerse"
      :end-verse="verse.endVerse" :search-facet="searchFacet" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import VerseDisplayModal from './VerseDisplayModal.vue'
import { verseFacetFromDisplayVerse } from 'src/utils/searchRoute'

const props = defineProps({
  verse: {
    type: Object,
    required: true
  },
  color: {
    type: String,
    default: 'primary'
  },
  removable: {
    type: Boolean,
    default: true
  },
  showSearchAction: {
    type: Boolean,
    default: false
  }
})

defineEmits(['remove'])

const showVerseModal = ref(false)
const searchFacet = computed(() =>
  props.showSearchAction && props.verse?.book
    ? verseFacetFromDisplayVerse(props.verse)
    : null,
)

const handleClick = () => {
  showVerseModal.value = true
}
</script>
