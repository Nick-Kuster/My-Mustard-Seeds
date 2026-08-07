import { createClient } from '@supabase/supabase-js'
import { boot } from 'quasar/wrappers'
import { demoModeActive } from 'src/utils/demoMode'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Short-circuits every table write while a "Show with sample data" demo
// run is active (see src/stores/tutorial.js), at this one choke point
// rather than in every store's write actions individually — every store
// already does `if (error) throw error` then shows a generic failure
// notify, so resolving to a Postgrest-shaped error here is enough to block
// the write using each store's existing error handling, unmodified.
const MUTATING_METHODS = ['insert', 'update', 'upsert', 'delete']

// Postgrest's query builders are chainable (e.g. `.insert(x).select()
// .single()`) and thenable/awaitable from any point in the chain. Rather
// than hardcode every method Postgrest happens to support, a Proxy answers
// any property access with a function that returns itself (so further
// chaining is a no-op) while forwarding then/catch/finally to the blocked
// response.
const blockedResponse = () =>
  Promise.resolve({
    data: null,
    error: { message: 'Demo mode is active — writes are disabled', code: 'DEMO_MODE_BLOCKED' },
  })

const createBlockedBuilder = () => {
  const response = blockedResponse()
  const proxy = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'then') return response.then.bind(response)
        if (prop === 'catch') return response.catch.bind(response)
        if (prop === 'finally') return response.finally.bind(response)
        return () => proxy
      },
    },
  )
  return proxy
}

const createGuardedBuilder = (table) => {
  const builder = supabaseClient.from(table)
  MUTATING_METHODS.forEach((method) => {
    const original = builder[method].bind(builder)
    builder[method] = (...args) => {
      if (demoModeActive.value) {
        console.warn(`Demo mode: blocked ${method} on "${table}"`)
        return createBlockedBuilder()
      }
      return original(...args)
    }
  })
  return builder
}

export const supabase = new Proxy(supabaseClient, {
  get(target, prop, receiver) {
    if (prop === 'from') return createGuardedBuilder

    const value = Reflect.get(target, prop, receiver)
    return typeof value === 'function' ? value.bind(target) : value
  },
})

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
