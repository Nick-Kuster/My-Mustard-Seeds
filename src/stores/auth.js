import { defineStore } from 'pinia'
import { supabase } from '../boot/supabase'
import { ref, computed } from 'vue'
import { useEncryptionStore } from 'src/stores/encryption'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  let authListenerRegistered = false

  const isAuthenticated = computed(() => !!user.value)

  const initialize = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user.value = session?.user || null
    loading.value = false

    if (!authListenerRegistered) {
      authListenerRegistered = true
      supabase.auth.onAuthStateChange((event, session) => {
        user.value = session?.user || null
        if (event === 'SIGNED_OUT') {
          useEncryptionStore().reset()
        }
      })
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
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
