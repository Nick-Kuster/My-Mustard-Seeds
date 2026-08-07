import { createClient } from 'npm:@supabase/supabase-js@2'

// Deletes the CALLING user's own Supabase Auth account. The user id comes
// only from the caller's own JWT (verified via userClient.auth.getUser()
// below) — never from a client-supplied value — so this can only ever
// delete the caller's own account, regardless of what a request body might
// claim. All app-data tables are wiped client-side by the app before this
// is invoked (see src/composables/useAccountDeletion.js); this function
// only handles the one thing the client's anon key cannot do itself:
// removing the actual auth.users row.
Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Missing Authorization header', { status: 401 })
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Service role key is auto-injected into every Edge Function's
  // environment by Supabase — never exposed to the client, never
  // configured manually.
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  )

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteError) {
    return new Response(deleteError.message, { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
