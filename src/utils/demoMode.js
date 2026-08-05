import { ref } from 'vue'

// Plain module-level ref rather than a Pinia store — this needs to be
// readable from src/boot/supabase.js, which boots before the pinia boot
// file (see quasar.config.js's `boot` array), so a Pinia store wouldn't be
// safely instantiable there yet. ref() has no such restriction — it works
// fine as a standalone singleton outside any component/store context.
//
// Set by src/stores/tutorial.js for the duration of a "Show with sample
// data" demo run; read by src/boot/supabase.js to short-circuit writes.
export const demoModeActive = ref(false)
