# Household chores

A shared household chore list with permanent cloud storage (Supabase), built with
Vite + React + TypeScript and hosted on GitHub Pages.

**Live:** https://7pkngvy9k9-collab.github.io/household-chores/

## How it works

1. Sign in with an email and password (Create account on first visit)
2. Create a household (get an invite code) or join with a code
3. Add repeating / dated / on-demand chores — data is saved in Postgres for everyone in the household

Dark mode preference still stays on the device.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173/household-chores/ by default) — also add
`http://localhost:5173/household-chores/` to the Supabase redirect URLs so confirmation
links work locally.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run typecheck` | Type-check without emitting (`tsc --noEmit`) |
| `npm run build` | Type-check, then build the production bundle into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

## Deployment

`.github/workflows/deploy.yml` builds the app and publishes `dist/` to the `gh-pages`
branch (and as a GitHub Actions Pages artifact) on every push to `main`.

If the live site is a blank white page, GitHub is serving the **source** `index.html`
(`<script src="/src/main.tsx">`) instead of the Vite build. Fix that in
**Settings → Pages → Build and deployment**:

1. **Source: Deploy from a branch** → branch **`gh-pages`** / folder **`/`**, or
2. **Source: GitHub Actions**

Do not point Pages at `main` — that folder is the unbuilt Vite app.

## Supabase

Project ref: **`ezdmzygqkegevlzbmnko`** (the CLI keeps its own copy in `supabase/.temp/`,
which is not committed, so link with `npx supabase link --project-ref ezdmzygqkegevlzbmnko`).

The publishable project URL and anon key live in `src/lib/config.ts`. They are meant to
be visible in the browser — row level security is what actually protects household data.

### Database migrations

`supabase/migrations/` holds the SQL history of the database. To apply pending migrations
to the hosted project:

```bash
npx supabase db push
```

After changing the schema, regenerate the TypeScript types so queries stay type-safe:

```bash
npx supabase gen types typescript --project-id ezdmzygqkegevlzbmnko > src/lib/database.types.ts
```

### Dashboard setup checklist

In the project dashboard:

1. **Authentication → URL configuration**
   - Site URL: `https://7pkngvy9k9-collab.github.io/household-chores/`
   - Redirect URLs: add the same URL. The trailing `/household-chores/` path matters —
     the app is served from a subdirectory, so a redirect to the bare origin will 404.
2. Keep the Email provider enabled
3. **Authentication → Providers → Email**: turn off "Confirm email" if you want new
   accounts to sign in immediately instead of clicking a confirmation email first
