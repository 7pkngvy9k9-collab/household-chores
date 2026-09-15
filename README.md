# Household chores

A shared household chore list with permanent cloud storage (Supabase) and GitHub Pages hosting.

**Live:** https://7pkngvy9k9-collab.github.io/household-chores/

## How it works

1. Sign in with an email and password (Create account on first visit)
2. Create a household (get an invite code) or join with a code
3. Add repeating / dated / on-demand chores — data is saved in Postgres for everyone in the household

Dark mode preference still stays on the device.

## Supabase setup checklist

In the project dashboard:

1. **Authentication → URL configuration**
   - Site URL: `https://7pkngvy9k9-collab.github.io/household-chores`
   - Redirect URLs: add the same URL
2. Keep the Email provider enabled
3. **Authentication → Providers → Email**: turn off "Confirm email" if you want new
   accounts to sign in immediately instead of clicking a confirmation email first

## Run locally

```bash
python3 -m http.server 4173
```

Open http://localhost:4173 — also add `http://localhost:4173` to Supabase redirect URLs so
confirmation links work locally.
