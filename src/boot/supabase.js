import { createClient } from '@supabase/supabase-js'
import { boot } from 'quasar/wrappers'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default boot(async ({ app }) => {
  app.config.globalProperties.$supabase = supabase

  // Dev-only auto sign-in so the router guard doesn't bounce to /login before
  // the app even renders. Never active outside a dev build.
  if (import.meta.env.DEV) {
    const devEmail = import.meta.env.VITE_DEV_AUTH_EMAIL
    const devPassword = import.meta.env.VITE_DEV_AUTH_PASSWORD
    if (devEmail && devPassword) {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword })
      }
    }
  }
})
