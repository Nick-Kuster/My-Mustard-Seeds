# API.Bible Edge Function

This function keeps the API.Bible key server-side and exposes only a small whitelist of Bible lookup actions to the app.

## Required Supabase secret

```bash
supabase secrets set API_BIBLE_KEY=your_api_bible_key_here
```

## Deploy

```bash
supabase functions deploy api-bible
```

The app calls this function through `supabase.functions.invoke('api-bible', ...)`, so the user's Supabase session is sent with the request. The function verifies the user before making any API.Bible request.

## Supported actions

- `listBibles`
- `getBooks`
- `getChapters`
- `getPassage`

`getPassage` intentionally requires a chapter-scoped passage id such as `JHN.3` or `JHN.3.16`. It rejects book-only passage ids so a bad inline tag cannot request an entire Bible book.
