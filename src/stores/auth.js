import { defineStore } from 'pinia'
import { supabase } from '../boot/supabase'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  const initialize = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user.value = session?.user || null
    loading.value = false

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null
    })
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error
  }

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUpWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      // Pass through the raw error for handling in the component
      throw error
    }

    // Check if email is already registered
    if (data?.user?.identities?.length === 0) {
      throw new Error('already-registered')
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  const resetPassword = async (email) => {
    // First check if user exists and what provider they use
    const {
      data: { users },
      error: userError,
    } = await supabase.auth.admin.listUsers({
      filter: { email },
    })

    if (userError) throw userError

    const user = users?.[0]
    if (!user) {
      throw new Error('No account found with this email')
    }

    // Check if user uses password auth or OAuth
    const identities = user.identities || []
    const hasPasswordAuth = identities.some((id) => !id.provider || id.provider === 'email')

    if (!hasPasswordAuth) {
      throw new Error(
        'This account uses Google sign-in. Please use the "Continue with Google" button.',
      )
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  return {
    user,
    loading,
    isAuthenticated,
    initialize,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
  }
})
