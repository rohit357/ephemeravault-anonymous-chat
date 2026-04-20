# Security Notes

## Public credentials in this repo

The values in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`) are **publishable anon keys**. They are designed to
be shipped in client-side bundles and are safe to commit to a public repo.

What actually protects your data is **Row Level Security (RLS)** on the database
tables — not hiding the anon key. The truly sensitive secrets
(`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `LOVABLE_API_KEY`) are stored
server-side as backend secrets and **never appear in this repository**.

If you ever believe your anon key has been misused, you can rotate it from the
Lovable Cloud dashboard.

## Threat model

Secret Chat ☠️ is an **unauthenticated**, throwaway chat app. Users pick a
display name (no password, no account) and either create a room or join one
using a 6-character room code. Rooms and messages are auto-deleted when the
last member leaves.

Because there is no login, server-side RLS cannot tie data to a specific user
identity. Access control is enforced through two mechanisms:

1. **Knowledge of the room code.** Rooms cannot be listed by anonymous
   clients. The only way to obtain a room's UUID is to call the
   `get_room_by_code(code)` RPC with the correct 6-character code.
2. **Foreign-key gated reads.** `messages` and `room_members` can only be read
   for rooms that exist and whose UUID you already know. You cannot enumerate
   either table without first knowing a room id.

## RLS policies

| Table          | SELECT                                            | INSERT          | UPDATE | DELETE                          |
| -------------- | ------------------------------------------------- | --------------- | ------ | ------------------------------- |
| `rooms`        | ❌ blocked (use `get_room_by_code` RPC)            | ✅ anyone        | —      | ❌ blocked (use `leave_room` RPC) |
| `messages`     | ✅ if parent room exists                           | ✅ anyone        | —      | ❌ blocked (use `leave_room` RPC) |
| `room_members` | ✅ if parent room exists                           | ✅ anyone        | —      | ❌ blocked (use `leave_room` RPC) |

The `INSERT` policies use `WITH CHECK (true)` because the app intentionally has
no authentication — anyone with the room code is allowed to send messages and
join. This is an accepted tradeoff for a public, anonymous chat product.

## Helper functions (security definer)

- **`get_room_by_code(_code text)`** — returns a single room row matching the
  given code, or no rows. Used by clients to resolve a code to a room id.
- **`leave_room(_room_id uuid, _username text)`** — removes the caller's
  membership row, then deletes the room and its messages if no members remain.

Both functions are `SECURITY DEFINER` with `search_path = public` and are only
granted to the `anon` and `authenticated` roles.

## Known residual risks

- **Anyone who guesses or learns a room code can read its messages and join.**
  Codes are 6 characters from a 32-character alphabet (~10^9 possibilities),
  which is sufficient for short-lived rooms but not a substitute for end-to-end
  encryption. Do not use this app for anything you would not be comfortable
  posting publicly.
- **Display names are not verified.** Anyone can claim any name in a given
  room.
- **No rate limiting on room creation or message sending.** The app relies on
  Lovable Cloud's platform-level abuse protection.

If your use case requires stronger guarantees (verified identity, end-to-end
encryption, per-user history), add real authentication (`@supabase/auth-ui` or
similar) and revisit the policies above.
