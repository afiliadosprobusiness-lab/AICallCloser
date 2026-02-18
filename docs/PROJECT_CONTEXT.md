# AI Call Closer - Project Context

## Stack
- Next.js App Router + TypeScript
- NextAuth (JWT session strategy)
- Prisma + PostgreSQL (Neon)
- Tailwind + shadcn/ui

## Auth and Roles
- Super admin is resolved by email with `isSuperAdminEmail`.
- Current unique super admin email: `afiliadosprobusiness@gmail.com`.
- Non-super users keep full workspace-based SaaS access.

## Access and Navigation Rules
- Super admin can access only `/super-admin`.
- Super admin is redirected to `/super-admin` from:
  - `/dashboard`
  - `/leads`
  - `/calls`
  - `/agent`
  - `/settings`
- Non-super users are redirected away from `/super-admin` to `/dashboard`.
- App navigation renders only `Super Admin` item for super admin.
- Workspace switcher is hidden for super admin.

## Enforcement Points
- UI navigation filtering in `src/components/app/app-shell.tsx`.
- Route-level access enforcement in `src/proxy.ts`.
- Post login routing in `src/app/post-auth/page.tsx`.

## Performance and UX
- Navigation links are proactively prefetched in src/components/app/app-shell.tsx.
- Route transitions show instant optimistic active state in sidebar and bottom nav.
- App routes use src/app/(app)/loading.tsx for responsive skeleton loading feedback.
- Auth JWT sync with DB is throttled (30s window) to reduce repeated query cost while navigating.

## Business Observability
- Dashboard now includes extended funnel and operations metrics:
  - callsCompleted, callsNoAnswer, noAnswerRate
  - newLeads, qualifiedLeads, scheduledLeads, wonLeads, lostLeads
  - avgDurationSeconds and activeNumbers
  - workspace readiness score and checklist
- Calls module now supports selecting a specific call via `?callId=...` for transcript review.

## Voice Webhook Reliability
- Inbound webhook flow avoids duplicate `Inbound call started` transcript turns on provider retries.
- Status webhook flow can resolve workspace by `callSid` fallback when destination number is missing.
- Terminal call closure is idempotent: ended calls are not overwritten by repeated provider callbacks.

## Forms and Validation UX
- Agent configuration form blocks invalid `pricingRules` JSON and shows inline validation feedback.
- Telephony number form now shows explicit success/error state after submit.


## Localization
- Global ES/EN locale selector is available via LanguageToggle in landing, auth and app shell.
- Locale is persisted in cookie icallcloser_locale via POST /api/preferences/locale.
- Root layout reads locale server-side and sets <html lang> accordingly.

