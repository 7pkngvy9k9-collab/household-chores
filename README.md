# Household chores

A shared household chore list with permanent cloud storage (Supabase) and GitHub Pages hosting.

**Live:** https://7pkngvy9k9-collab.github.io/household-chores/

Static files only: `index.html`, `app.js`, `styles.css`, `config.js`. No build step.

## Architecture

```
Browser (GitHub Pages)
  ├─ Email/password session  →  Supabase Auth
  ├─ Households, members, chores  →  Postgres (via supabase-js + RLS)
  └─ Dark mode preference  →  localStorage on this device
```

`config.js` holds the public Supabase URL and anon key. Row Level Security must be what protects household data — do not put a `service_role` key in the client.

The SQL (tables, RPCs, policies) lives in the Supabase project, not this repo. The sections below describe what `app.js` actually calls so dashboard changes stay compatible.

## How it works

1. **Sign in** with email and password, or **Create account** on first visit (password at least 6 characters).
2. **Create a household** (names + invite code) or **join** with a code by claiming an open seat.
3. **Add chores** from the bottom composer. Completions and deletes write to Postgres for everyone in the household.

The signed-in member is the person whose `members.user_id` matches the Auth user. There is no in-app switcher: `loadHouseholdForUser()` uses `.maybeSingle()`, so a user can belong to at most one household.

## Auth

| Action | API |
| --- | --- |
| Sign in | `auth.signInWithPassword({ email, password })` |
| Create account | `auth.signUp({ email, password, options: { emailRedirectTo: siteUrl } })` |
| Sign out | `auth.signOut()` |

`siteUrl` is the current origin + path (no trailing slash), so confirmation links return to GitHub Pages or localhost automatically.

If sign-up returns **no session**, the UI shows *Account created. Confirm it from the email we sent, then sign in.* That happens when **Confirm email** is on in the Email provider. There is **no password-reset or magic-link UI**.

Sessions persist in the browser (`persistSession` + `autoRefreshToken`). `detectSessionInUrl` is still enabled for confirmation redirects.

## Households

### Create

`create_household({ p_name, p_member_names })` then reload.

The form requires a household name and at least two member names (the first field is labeled “Your name”). Extra people can be added before submit.

### Join

1. `lookup_household_by_invite({ p_code })` + `list_members_by_invite({ p_code })`
2. Pick an unclaimed seat (`claimed` seats are disabled)
3. `join_household({ p_code, p_member_id })`

Unknown codes surface *No household found for that invite code.* The invite code is shown in the app header after you are in.

## Chore model

Kinds in the composer (`app.js` → `addChore` / `completeChore`):

| Kind | Schedule | On complete |
| --- | --- | --- |
| **Repeating** | `daily` or `weekly`; first due date required | Stays open. Next due is **today + 1 or + 7 days** (not “previous due + interval”). If Rotate is on and 2+ people are selected, `holder_index` advances. |
| **On a date** | Single `due_date` | Marked `done: true` |
| **On demand** | No date | Marked `done: true` |

Rotate is ignored unless the kind is repeating **and** more than one holder is checked. Empty holders display as **Anyone** and count as “my turn” for every member (`isMine`).

Lists on the main screen:

- **Due now** — dated/repeating, not done, `due_date <= today`
- **On demand** — open on-demand chores
- **Upcoming** — dated/repeating, `due_date > today`
- **Done** — completed dated/on-demand only (repeating chores never sit in Done)

**My turn** (`body[data-filter=mine]`) keeps chores whose current holder is you, or that have no holder. The filter is not persisted.

Checkboxes:

- Left checkbox → complete, or **reopen** (`done: false` only — it does not rewind a repeating chore’s due date or rotation).
- Right checkbox → delete after confirm.

**Refresh** re-reads members and chores from Postgres.

### “Waiting for you”

The banner and browser notifications use `waitingForMe`: your turn, not done, and either on-demand **or** due today/overdue. `Enable reminders` is the Notification API on this device — not push, and it only fires when permission is already `granted` (after sign-in/load and when you enable it).

## Local vs cloud

| Data | Where |
| --- | --- |
| Household, members, chores | Supabase Postgres |
| Auth session | Supabase Auth (persisted by the JS client) |
| Dark mode | `localStorage["household-chores.theme"]` (`1` / `0`) |
| Everyone vs My turn | In-memory on `document.body.dataset.filter` |

## File map

| File | Role |
| --- | --- |
| `index.html` | Shell, CDN `supabase-js@2`, cache-busting `?v=` query params, startup error fallback |
| `config.js` | `supabaseUrl`, `supabaseAnonKey`, `siteUrl` |
| `app.js` | Auth, onboarding, chore CRUD, filters, theme, notifications |
| `styles.css` | Layout; `html.theme-dark` tokens |

## Backend contract (from the client)

The app will break if these names or shapes change in the dashboard.

**Tables**

- `households` — nested read: `id`, `name`, `invite_code`
- `members` — `id`, `household_id`, `name`, `user_id`, `created_at`
- `chores` — mapped in `mapChore` / `choreToRow`:

  `id`, `household_id`, `title`, `kind`, `repeat`, `due_date`, `rotate`, `holder_ids`, `holder_index`, `done`, `last_done_at`, `last_done_by`, `updated_at`, `created_at`

**RPCs** (the browser never inserts households directly)

| RPC | Args | Used for |
| --- | --- | --- |
| `create_household` | `p_name`, `p_member_names` | Setup; response includes `invite_code` |
| `lookup_household_by_invite` | `p_code` | Join lookup (household `name`) |
| `list_members_by_invite` | `p_code` | Join seats (`id`, `name`, `claimed`) |
| `join_household` | `p_code`, `p_member_id` | Claim a seat for the current Auth user |

Direct table access after join: `members` and `chores` filtered by `household_id`. Chore insert/update/delete go to `chores` (not RPCs).

## Supabase setup checklist

In the project dashboard:

1. **Authentication → URL configuration**
   - Site URL: `https://7pkngvy9k9-collab.github.io/household-chores`
   - Redirect URLs: that URL **and** `http://localhost:4173` for local confirmation links
2. Keep the Email provider enabled (password sign-in; not magic links)
3. **Authentication → Providers → Email**: turn off **Confirm email** if new accounts should sign in immediately instead of clicking a confirmation email first
4. Keep RLS and the RPCs above aligned with this client. The anon key in `config.js` is expected to be public.

## Run locally

```bash
python3 -m http.server 4173
```

Open http://localhost:4173

## Deploy

GitHub Pages serves `main` as-is. After changing `app.js`, `styles.css`, or `config.js`, bump the matching `?v=` query strings in `index.html` (currently `v=5` on all three). Pages caches aggressively; skipping the bump shows a stale app.

## Pitfalls

- **Do not name the client `supabase`.** The jsDelivr UMD build already sets `window.supabase`. Shadowing it produced a blank page (`ae87d6f`). The client is `const db = window.supabase.createClient(...)`.
- **Blank page on first load:** `index.html` listens for `error` and prints the message only if `#app` has not rendered yet (`dataset.rendered`). Later exceptions stay in the console.
- **Stale GitHub Pages assets:** bump `?v=` (see Deploy).
- **Sign-up succeeds but you cannot sign in:** Confirm email is on, or the confirmation redirect URL is missing.
- **“Could not find the function …” / RLS errors:** dashboard SQL drifted from the contract above. This repo has no migrations to diff.
- **Repeating chore looks “late” after a skip:** completion always schedules from **today**, not from the missed due date.
- **Not in the app:** password reset, leave/switch household, or edit an existing chore (delete + add instead).

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Loading never finishes | Network tab → Auth + REST; `boot()` / `onAuthStateChange` both call `loadHouseholdForUser()` |
| Create/join fails | RPC names/args; whether the signed-in user already has a `members` row |
| Chores do not appear for a housemate | Same `household_id`; they claimed a seat; hit **Refresh** |
| Reminders never fire | Browser Notification permission; chores must match “waiting for you” |
| Theme resets on another device | Expected — theme is localStorage only |
