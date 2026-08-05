import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

// Identity data (first name, first-login status) — see
// sql/Profiles Table.sql for why this is its own table instead of another
// user_preferences key.
export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const loaded = ref(false)
  const loading = ref(false)

  // No row (or onboarded: false) means this is the user's first login —
  // MainLayout uses that to decide whether to show the welcome flow.
  const fetchProfile = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) throw error
      profile.value = data
      loaded.value = true
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Called once the first-login welcome flow finishes (name entered or
  // left blank, tour chosen or skipped) — creates the row if this is truly
  // the first login, or updates it if called again later for some reason.
  const completeOnboarding = async (firstName) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: session.user.id,
          first_name: firstName || null,
          onboarded: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single()

    if (error) throw error
    profile.value = data
  }

  return { profile, loaded, loading, fetchProfile, completeOnboarding }
})
