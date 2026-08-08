import { defineStore } from 'pinia'
import { supabase } from '../boot/supabase'
import { ref, computed } from 'vue'
import { useEncryptionStore } from 'src/stores/encryption'
import { useResourcesStore } from 'src/stores/resources'

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
          useResourcesStore().reset()
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

  const sendEmailSignInCode = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    if (error) throw error
  }

  const verifyEmailSignInCode = async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
    useEncryptionStore().reset()
    useResourcesStore().reset()
  }

  return {
    user,
    loading,
    isAuthenticated,
    initialize,
    signInWithGoogle,
    sendEmailSignInCode,
    verifyEmailSignInCode,
    signOut,
  }
})
