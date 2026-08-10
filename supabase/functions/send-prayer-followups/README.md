# Prayer Follow-Up Push Reminders

This function sends generic Web Push reminders for due prayer follow-ups. It does not include prayer text because prayer request content is encrypted client-side.

## Required secrets

Set these as Supabase Edge Function secrets:

```sh
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=long-random-value
```

The same `VAPID_PUBLIC_KEY` must also be set in the PWA environment as `VITE_VAPID_PUBLIC_KEY`.

## Deploy

Deploy without JWT verification so Supabase Cron can call it with `x-cron-secret`:

```sh
supabase functions deploy send-prayer-followups --no-verify-jwt
```

## Schedule

Run the SQL in `sql/Prayer Reminder Push Notifications.sql`, then create an hourly Cron job that posts to:

```text
https://<project-ref>.supabase.co/functions/v1/send-prayer-followups
```

Include this header:

```text
x-cron-secret: <CRON_SECRET>
```
