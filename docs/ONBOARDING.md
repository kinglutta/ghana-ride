# YENKO RIDE — Unified Onboarding

YENKO now has one entry point for every role: `/onboarding`.

## Role lanes

- **Rider** — book, track, pay and manage rides.
- **Captain** — go online, accept ride requests and manage earnings.
- **Operations** — invite-only access to the admin command centre.

Legacy routes continue to work by redirecting:

| Old route | New destination |
| --- | --- |
| `/login` | `/onboarding?mode=signin&role=rider` |
| `/signup` | `/onboarding?mode=signup&role=rider` |
| `/captain-login` | `/onboarding?mode=signin&role=captain` |
| `/captain-signup` | `/onboarding?mode=signup&role=captain` |
| `/admin-login` | `/onboarding?mode=signin&role=admin` |
| `/admin-signup` | `/onboarding?mode=signup&role=admin` |

## Admin access codes

Operations accounts are protected server-side. The onboarding form sends the code to `POST /users/register`, and the API refuses to create an `admin` account without a valid code. The browser never stores or exposes the code.

Configure one or more codes in `Backend/.env`:

```env
ADMIN_SIGNUP_CODES=YENKO-ADMIN-2026,SECOND-ROTATION-CODE
```

`ADMIN_SIGNUP_CODE` is also accepted for a single code. `ADMIN_SIGNUP_CODES` takes priority.

- In development, if neither variable is set, `YENKO-ADMIN-2026` is used.
- In production, there is no fallback. Admin self-registration is disabled until a code is configured.
- Codes are compared in constant time to avoid timing leaks.

Admin sign-in does not require the code; only account creation does.

## Role-aware sessions

Successful onboarding stores the token in the matching browser slot:

- `yenko:rider:token`
- `yenko:captain:token`
- `yenko:admin:token`

This lets a rider, captain and operations user stay signed in at once in the same browser.
