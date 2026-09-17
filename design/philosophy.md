# Household UI — locked design philosophy

North star: **Flatastic-like WG OS** (mint/teal, four tabs, circular complete). Not Google blue. Not Sweepy gamification. Do not copy the Flatastic logo.

Reference mockups (Schloss):

- `~/.cursor/projects/Users-sascha-WG-APP/assets/mockup-tasks-schloss.png`
- `.../mockup-shopping-schloss.png`
- `.../mockup-pinboard-schloss.png`
- `.../mockup-finances-schloss.png`
- `.../mockup-signin-schloss.png`

## IA (do not change)

Tabs: **Tasks · Shopping · Pinboard · Finances**. Calendar, polls, members, settings stay in the household chip sheet / sidebar. Pinboard is notices, not chat.

## Visual tokens

| Token | Light | Role |
|---|---|---|
| `--sage` | `#1DB8A6` | Accent, active tab, complete fill, primary buttons |
| `--sage-soft` | `#E6F7F4` | Tints, waiting banner, active nav wash |
| `--bg` | `#F4FBF9` | Page wash |
| `--card` | `#FFFFFF` | Rows and cards |
| `--ink` | `#1A2E2B` | Text |
| `--muted` | `#5B7370` | Meta |
| `--clay` | `#E4574D` | Overdue / you owe |

Type: **Plus Jakarta Sans**, then system-ui. Page titles are bold. Section labels are small teal caps.

## Patterns

- **Complete:** 26px circular stroke; fill teal + check when on. Never square checkboxes on Tasks/Shopping lists.
- **Lists:** white grouped rows, ~16px radius, assignee letter mark on the right.
- **Chips:** pill; active = filled sage.
- **Buttons:** pill (full radius), not 4px Google Search.
- **Nav:** four-tab bar; sage only on the active item.
- **Finances:** “You owe” / “You are owed” tiles, then balances, settle, add expense.
- **Shopping:** list chips, To buy / Bought, aisle groups with 16px line icons in the header and row, optional convert to expense (opt-in, not automatic).
- **Pinboard:** stacked notice cards with pin/remove.

Chrome is utility (cluster 2). Features can stay WG (rotation, board). No leaderboards as home.
