<template>
  <q-img src="bg.png" class="fixed-full login-bg" />
  <q-page class="login-page">
    <q-card class="login-card parchment">
      <q-card-section class="text-center q-pb-sm">
        <div class="login-logo-wrap">
          <AppLogoMark class="login-logo-mark" />
        </div>
        <h1 class="login-title">My Mustard <em>Seeds</em></h1>
        <p class="login-subtitle">A private Bible study and prayer journal.</p>
      </q-card-section>

      <q-card-section>
        <q-form class="login-form" @submit="codeSent ? handleVerifyEmailCode() : handleSendEmailCode()">
          <q-input
            v-model.trim="email"
            outlined
            class="login-input"
            label="Email"
            type="email"
            autocomplete="email"
            :disable="codeSent"
            :rules="[val => !!val || 'Email is required']"
          >
            <template #prepend>
              <q-icon name="mail" />
            </template>
          </q-input>

          <q-input
            v-if="codeSent"
            v-model.trim="emailCode"
            outlined
            class="login-input"
            label="Email code"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="8"
            :rules="[val => !!val || 'Code is required']"
          >
            <template #prepend>
              <q-icon name="pin" />
            </template>
          </q-input>

          <div v-if="codeSent" class="text-caption text-grey-7">
            Enter the code we sent to {{ email }}.
          </div>

          <q-btn
            type="submit"
            unelevated
            color="primary"
            class="full-width login-submit"
            :loading="loading"
            :label="codeSent ? 'Verify Code' : 'Email Me a Sign-in Code'"
          />

          <div v-if="codeSent" class="row justify-between items-center">
            <q-btn flat dense color="primary" label="Use a different email" @click="resetCodeLogin" />
            <q-btn flat dense color="primary" label="Resend Code" :loading="loading" @click="handleResendEmailCode" />
          </div>
        </q-form>

        <div class="login-divider">
          <span>or</span>
        </div>

        <q-btn class="full-width" outline color="primary" icon="account_circle" @click="handleGoogleSignIn" :loading="loading">
          Continue with Google
        </q-btn>

        <div class="login-legal text-caption text-grey-7 text-center">
          By continuing, you agree to the
          <router-link to="/terms">Terms of Service</router-link>
          and
          <router-link to="/privacy">Privacy Policy</router-link>.
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'
import AppLogoMark from 'components/AppLogoMark.vue'

const auth = useAuthStore()
const $q = useQuasar()
const router = useRouter()
const loading = ref(false)
const email = ref('')
const emailCode = ref('')
const codeSent = ref(false)

const handleGoogleSignIn = async () => {
  try {
    loading.value = true
    await auth.signInWithGoogle()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message,
    })
  } finally {
    loading.value = false
  }
}

const handleSendEmailCode = async () => {
  try {
    loading.value = true
    await auth.sendEmailSignInCode(email.value)
    codeSent.value = true
    emailCode.value = ''
    $q.notify({
      type: 'positive',
      message: 'Check your email for your sign-in code.',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message,
    })
  } finally {
    loading.value = false
  }
}

const handleVerifyEmailCode = async () => {
  try {
    loading.value = true
    await auth.verifyEmailSignInCode(email.value, emailCode.value)
    router.push('/')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'That code is invalid or expired.',
    })
  } finally {
    loading.value = false
  }
}

const handleResendEmailCode = async () => {
  try {
    loading.value = true
    await auth.sendEmailSignInCode(email.value)
    emailCode.value = ''
    $q.notify({
      type: 'positive',
      message: 'A new sign-in code has been sent.',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message,
    })
  } finally {
    loading.value = false
  }
}

const resetCodeLogin = () => {
  codeSent.value = false
  emailCode.value = ''
}
</script>

<style scoped>
.login-bg {
  opacity: 0.95;
}

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.login-card {
  width: min(100%, 420px);
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(38, 52, 42, 0.28);
}

.login-logo-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin-bottom: 10px;
  border-radius: 50%;
  color: #66795e;
  background: rgba(255, 253, 248, 0.82);
  border: 1px solid rgba(102, 121, 94, 0.24);
}

.login-logo-mark {
  width: 48px;
  height: 50px;
}

.login-title {
  margin: 0;
  font-family: Georgia, 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text);
}

.login-title em {
  color: #66795e;
  font-style: italic;
  font-weight: 400;
}

.login-subtitle {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.login-form {
  display: grid;
  gap: 12px;
}

.login-input :deep(.q-field__control) {
  min-height: 52px;
  background: rgba(255, 253, 248, 0.96);
  border-radius: 8px;
}

.login-input :deep(.q-field__native),
.login-input :deep(.q-field__label),
.login-input :deep(.q-field__prepend) {
  font-size: 1rem;
  color: #2f3a32;
}

.login-input :deep(.q-field__native) {
  color: #2f3a32;
  caret-color: #66795e;
}

.login-input :deep(.q-field__label) {
  color: rgba(47, 58, 50, 0.68);
}

.login-input :deep(.q-field__prepend .q-icon) {
  color: rgba(47, 58, 50, 0.62);
}

.login-input :deep(input:-webkit-autofill),
.login-input :deep(input:-webkit-autofill:hover),
.login-input :deep(input:-webkit-autofill:focus) {
  -webkit-text-fill-color: #2f3a32;
  box-shadow: 0 0 0 1000px rgba(255, 253, 248, 0.96) inset;
  transition: background-color 9999s ease-out;
}

.login-submit {
  min-height: 44px;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.login-legal {
  margin-top: 18px;
  line-height: 1.5;
}

.login-legal a {
  color: var(--q-primary);
  font-weight: 600;
  text-decoration: none;
}

.login-legal a:hover {
  text-decoration: underline;
}
</style>
