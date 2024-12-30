<template>
  <q-img src="bg.png" class="fit absolute"></q-img>
  <q-page class="flex flex-center">
    <div class="q-pa-md" style="max-width: 400px">
      <q-card class="q-pa-md">
        <q-card-section class="text-center">
          <img src="seed.png" class="q-mb-md" style="width: 80px; height: 80px; border-radius: 50%;" alt="App Icon" />
          <h5 class="q-mt-none q-mb-md">Welcome to <br /> My Mustard Seed!</h5>
          <small class="q-mt-none q-mb-md">Your Christian study companion!</small>

          <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="justify"
            narrow-indicator>
            <q-tab name="login" label="Login" />
            <q-tab name="register" label="Register" />
          </q-tabs>

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="login">
              <q-form @submit="handleEmailLogin">
                <q-input v-model="email" label="Email" type="email" :rules="[val => !!val || 'Email is required']" />
                <q-input v-model="password" label="Password" :type="showPassword ? 'text' : 'password'"
                  :rules="[val => !!val || 'Password is required']">
                  <template v-slot:append>
                    <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                      @click="showPassword = !showPassword" />
                  </template>
                </q-input>
                <div class="row justify-between items-center q-my-sm">
                  <q-btn flat dense color="primary" label="Forgot Password?" @click="handleResetPassword" />
                </div>
                <q-btn type="submit" color="primary" class="full-width q-mt-md" :loading="loading" label="Login" />
              </q-form>
            </q-tab-panel>

            <q-tab-panel name="register">
              <q-form @submit="handleEmailSignup">
                <q-input v-model="email" label="Email" type="email" :rules="[val => !!val || 'Email is required']" />
                <q-input v-model="password" label="Password" :type="showPassword ? 'text' : 'password'" :rules="[
                  val => !!val || 'Password is required',
                  val => val.length >= 6 || 'Password must be at least 6 characters'
                ]">
                  <template v-slot:append>
                    <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                      @click="showPassword = !showPassword" />
                  </template>
                </q-input>
                <q-input v-model="passwordConfirm" label="Confirm Password" :type="showPassword ? 'text' : 'password'"
                  :rules="[
                    val => !!val || 'Password confirmation is required',
                    val => val === password || 'Passwords do not match'
                  ]">
                  <template v-slot:append>
                    <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                      @click="showPassword = !showPassword" />
                  </template>
                </q-input>
                <q-btn type="submit" color="primary" class="full-width q-mt-md" :loading="loading" label="Register" />
              </q-form>
            </q-tab-panel>
          </q-tab-panels>

          <div class="q-py-md text-grey">OR</div>

          <q-btn class="full-width" color="primary" @click="handleGoogleSignIn" :loading="loading">
            Continue with Google
          </q-btn>

          <div class="text-caption text-grey q-my-md text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const auth = useAuthStore()
const $q = useQuasar()
const loading = ref(false)
const tab = ref('login')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')

const handleGoogleSignIn = async () => {
  try {
    loading.value = true
    await auth.signInWithGoogle()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message
    })
  } finally {
    loading.value = false
  }
}

const handleEmailLogin = async () => {
  try {
    loading.value = true
    await auth.signInWithEmail(email.value, password.value)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message
    })
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  if (!email.value) {
    $q.notify({
      type: 'warning',
      message: 'Please enter your email address'
    })
    return
  }

  try {
    loading.value = true
    await auth.resetPassword(email.value)
    $q.notify({
      type: 'positive',
      message: 'Password reset instructions have been sent to your email'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message
    })
  } finally {
    loading.value = false
  }
}

const handleEmailSignup = async () => {
  try {
    loading.value = true
    const { error } = await auth.signUpWithEmail(email.value, password.value)

    if (error?.message === 'already-registered') {
      $q.notify({
        type: 'warning',
        message: 'This email is already registered. Try logging in with Google or password.'
      })
      tab.value = 'login'
      return
    }

    if (error) throw error

    $q.notify({
      type: 'positive',
      message: 'Registration successful! Please check your email to verify your account.'
    })
  } catch (error) {
    console.error('Signup error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'An error occurred during signup'
    })
  } finally {
    loading.value = false
  }
}
</script>
