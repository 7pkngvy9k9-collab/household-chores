# Household chores

A tiny prototype of a shared household chore list.

## What this tests

Households will keep a single list if repeating chores come back automatically, ownership can rotate, and dated / on-demand tasks live next to them — without real accounts or push infrastructure.

Cut from the full idea:

- Real login → pick your name in the household
- Server-side accounts → local storage on this device
- Push notifications → browser reminders + an in-app “waiting for you” banner

## Run it

```bash
python3 -m http.server 4173
```

Open http://localhost:4173
