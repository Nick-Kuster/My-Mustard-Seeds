import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }
}

type PreferenceRow = {
  user_id: string
  preferences: {
    prayerReminderOptions?: {
      enabled?: boolean
      hour?: number
      timezone?: string
    }
  }
}

type PrayerRow = {
  user_id: string
  follow_up_date: string
  follow_up_time?: string | null
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const datePartsForZone = (timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())

  const value = (type: string) => parts.find((part) => part.type === type)?.value
  const hourValue = value('hour') || '0'
  const hour = Number(hourValue === '24' ? '0' : hourValue)

  return {
    hour,
    date: `${value('year')}-${value('month')}-${value('day')}`,
  }
}

const safeZoneParts = (timezone?: string) => {
  try {
    return datePartsForZone(timezone || 'UTC')
  } catch {
    return datePartsForZone('UTC')
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    return json({ error: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' }, 500)
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('push_subscriptions')
    .select('id,user_id,endpoint,subscription')
    .eq('enabled', true)

  if (subscriptionsError) return json({ error: subscriptionsError.message }, 500)
  if (!subscriptions?.length) return json({ sent: 0, users: 0, removed: 0 })

  const userIds = [...new Set(subscriptions.map((row: PushSubscriptionRow) => row.user_id))]

  const { data: preferences, error: preferencesError } = await supabase
    .from('user_preferences')
    .select('user_id,preferences')
    .in('user_id', userIds)

  if (preferencesError) return json({ error: preferencesError.message }, 500)

  const preferenceByUser = new Map(
    (preferences || []).map((row: PreferenceRow) => [row.user_id, row.preferences?.prayerReminderOptions || {}]),
  )

  const eligibleUsers = userIds
    .map((userId) => {
      const options = preferenceByUser.get(userId)
      if (!options?.enabled) return null
      const local = safeZoneParts(options.timezone)
      return { userId, today: local.date, hour: local.hour, fallbackHour: Number(options.hour ?? 8) }
    })
    .filter(Boolean) as Array<{ userId: string, today: string, hour: number, fallbackHour: number }>

  if (!eligibleUsers.length) return json({ sent: 0, users: 0, removed: 0 })

  const { data: prayers, error: prayersError } = await supabase
    .from('prayer_requests')
    .select('user_id,follow_up_date,follow_up_time')
    .in('user_id', eligibleUsers.map((user) => user.userId))
    .eq('status', 'active')
    .not('follow_up_date', 'is', null)

  if (prayersError) return json({ error: prayersError.message }, 500)

  const localByUser = new Map(eligibleUsers.map((user) => [user.userId, user]))
  const dueCountByUser = new Map<string, number>()
  ;(prayers || []).forEach((prayer: PrayerRow) => {
    const local = localByUser.get(prayer.user_id)
    const reminderHour = prayer.follow_up_time
      ? Number(prayer.follow_up_time.slice(0, 2))
      : local?.fallbackHour

    if (local && prayer.follow_up_date <= local.today && reminderHour === local.hour) {
      dueCountByUser.set(prayer.user_id, (dueCountByUser.get(prayer.user_id) || 0) + 1)
    }
  })

  const deadSubscriptionIds: string[] = []
  let sent = 0

  await Promise.all(
    subscriptions.map(async (row: PushSubscriptionRow) => {
      const dueCount = dueCountByUser.get(row.user_id) || 0
      if (dueCount === 0) return

      try {
        await webpush.sendNotification(row.subscription, JSON.stringify({
          title: 'Prayer follow-up',
          body: dueCount === 1
            ? 'One prayer follow-up is ready to revisit.'
            : `${dueCount} prayer follow-ups are ready to revisit.`,
          url: '/?tab=prayers',
          tag: 'prayer-follow-up',
        }))
        sent += 1
      } catch (error) {
        const statusCode = error && typeof error === 'object' && 'statusCode' in error
          ? Number(error.statusCode)
          : 0
        if (statusCode === 404 || statusCode === 410) deadSubscriptionIds.push(row.id)
        else console.error('Failed to send prayer reminder', error)
      }
    }),
  )

  if (deadSubscriptionIds.length) {
    await supabase
      .from('push_subscriptions')
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .in('id', deadSubscriptionIds)
  }

  return json({
    sent,
    users: dueCountByUser.size,
    removed: deadSubscriptionIds.length,
  })
})
