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
- Twilio now has full parity for outbound calls via `/api/twilio/voice/outbound` and `/api/twilio/voice/outbound/answer`.
- Settings screen now adapts webhook and provider labels dynamically based on `VOICE_PROVIDER` (`telnyx`, `twilio`, `plivo`).
- Voice runtime now loads dynamic call objectives per workspace and injects playbook instructions into LLM turn orchestration.
- Twilio outbound now uses `calls.create({ url: /api/twilio/voice/outbound?agentId=... })` with status callbacks to `/api/twilio/voice/status`.
- Outbound TwiML bootstraps cold-call playbook from dashboard config (system prompt, checklist, objectives, disallowed claims), then continues multi-turn via `/api/twilio/voice/process`.
- Twilio process flow now supports `Gather` speech text (`SpeechResult`) as first-class input, falling back to recording transcription when needed.

## Bridge Lead Import (Puente)
- New tenant-scoped bridge data model:
  - `Customer` (workspace customer owner for import batches)
  - `BridgeLead` (externalId + objective + collectedInfo + preferredTimes + call status)
  - `CallLog` (bridge lead call outcome tracking)
- New authenticated APIs:
  - `POST /api/bridge/import` (JSON file/body import with zod validation, upsert by `(customerId, externalId)`)
  - `GET /api/bridge/leads` (paginated bridge lead list + customer filter)
  - `POST /api/bridge/leads/:id/call` (Twilio outbound trigger with `url=/api/twilio/voice/outbound?agentId=...&leadId=...`)
  - `POST /api/bridge/leads/:id/outcome` (manual outcome logging)
- Settings now includes a `Puente` section to upload JSON, inspect imported leads, and click `Llamar ahora`.
- Twilio outbound TwiML now consumes optional `leadId` to inject lead-aware playbook context (objective, collected info, preferred times) while preserving dashboard agent config and guardrails.
- Voice status webhook updates both standard call records and `BridgeLead` status by `CallSid`.

## Leads Widget Handoff Endpoint
- New authenticated production endpoint: `POST /api/leads/handoff`.
- Authorization is validated with bearer token against `IACLOSER_API_KEY`.
- Payload is validated with strict Zod schema (`source`, `lead`, `consent`, optional bounded `history`).
- On success, server stores full handoff payload in `LeadHandoff` with `receivedAt` and `status=queued`.
- Outbound call trigger is queued asynchronously (non-blocking response) and status is synchronized by `CallSid` via voice status webhook.
- Redirect contract: `redirect_url = ${PUBLIC_APP_URL}/session/<lead_id>`.

## Forms and Validation UX
- Agent configuration form blocks invalid `pricingRules` JSON and shows inline validation feedback.
- Telephony number form now shows explicit success/error state after submit.
- Forgot password now handles `delivered=false` correctly as UI error (instead of success style message).
- Agent settings now include a full `Call Objectives` builder with primary/secondary objectives, meeting/follow-up config, lead field builder, disqualify/compliance JSON, and live playbook preview.

## Password Recovery
- If `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are configured, password reset uses internal token flow (`/reset-password?token=...`).
- If Resend is not configured, system falls back to Firebase Auth password reset email using `FIREBASE_WEB_API_KEY` (or `NEXT_PUBLIC_FIREBASE_API_KEY`).
- Credentials sign-in includes Firebase verification fallback and re-syncs `passwordHash` in DB after successful Firebase password sign-in.
- Registration now attempts best-effort provisioning of an email/password user in Firebase to keep recovery path available.


## Localization
- Global ES/EN locale selector is available via LanguageToggle in landing, auth and app shell.
- Locale is persisted in cookie `aicallcloser_locale` via `POST /api/preferences/locale`.
- Root layout reads locale server-side and sets <html lang> accordingly.

## Landing UX Updates
- Hero was upgraded for US-focused conversion with EN/ES localized promise:
  - EN headline: `AI That Calls Your Leads in Under 2 Minutes.`
  - EN subheadline: `From live chat to booked meetings—qualify, schedule, and close automatically.`
  - Primary CTA now scrolls to `#live-chat-demo` and opens the live Lead Chat modal.
- New `LiveChatToCallDemoSection` added as the main conversion section:
  - two-column premium panel (`Live Chat` -> `AI Call Closer`)
  - frontend-only animated state machine (no backend dependency)
  - consent-required block (explicit AI call consent + optional follow-up consent)
  - objective selector (`Book Google Meet`, `Schedule a call`, `Simulate a sale`) with dynamic outcome
  - integration-ready hooks: `onSubmitLead()` and `onStartDemoCall()`
- New `UseCasesSection` added before live demo:
  - 4 industry cards (`Roofing/Home Services`, `Dental Clinics`, `Legal Firms`, `Real Estate`)
  - each card launches personalized demo flow (smooth scroll to live demo + auto-open lead chat modal)
  - prefill context wiring now sets industry, goal, objective and industry-specific opening message in both demo panel and live chat widget.
- New reusable `LeadChatPublicWidget` (3-step conversion funnel):
  - goal selection (`appointments`, `close deals`, `pricing`)
  - name + business capture
  - E.164 phone + required consent
  - urgency + no-card microcopy
- New public route `/lead-chat-public` renders the Lead Chat widget standalone.
- Landing now includes a conversion offer banner in Hero and Pricing:
  - EN: `We call your first lead for free.`
- Pricing section is followed by a horizontal testimonials rail (Instagram-style swipe/scroll) with real profile photos and 4-5 star ratings.
- A horizontal FAQ rail (5 questions) was added below testimonials with animated expand/collapse answers.
- Landing buttons now include a stronger deluxe hover/touch treatment (shadow + soft iridescent sweep) across all shadcn buttons.
- Testimonials rail now includes smooth autoplay, page indicators, and progressive lazy rendering/image loading for better mobile performance.
- Testimonials rail interaction is now axis-locked:
  - desktop supports horizontal drag (mouse/trackpad) plus button controls.
  - mobile touch interactions are constrained to horizontal (`pan-x`) inside the rail to avoid vertical testimonial movement.
- Mobile responsiveness hardening:
  - Landing navbar now adapts to narrow devices (320px+) with two-row action layout and compact CTA labels.
  - App shell mobile header now stacks controls (language/sign-out + workspace switcher) to avoid overflow.
  - Bottom mobile navigation now uses tighter spacing, truncation-safe labels, and safe-area padding.
  - Dashboard chart now measures container size with `ResizeObserver` before rendering to avoid `width(-1)/height(-1)` warnings and keep stable rendering on small screens.

## Call Objectives Engine
- New persistence model:
  - `AgentCallPreferences` (primary objective, secondary objectives, language, meeting config, follow-up config, lead fields, disqualify/compliance rules).
  - `BusinessProfile` (workspace value proposition used for playbook generation).
- Objective handlers implemented with module contracts:
  - `requiredInputs()`
  - `promptTemplate()`
  - `successAction()`
  - `outcomeCode`
- Minimum objective modules:
  - `sell_product`
  - `book_in_person_meeting`
  - `book_google_meet`
  - `book_calcom_appointment`
  - `schedule_followup_call`
  - `collect_lead_info`
  - `transfer_to_human`
- Dynamic playbook flow per call:
  - opening (<=30s)
  - qualification (max 4 prompts)
  - primary objective close
  - fallback objective resolution (follow-up or transfer)
- Guardrails now enforce:
  - strict no-price-invention fallback message
  - concise answers via max words rule
  - quick polite close on non-interest
- New outcomes supported in `CallOutcome`:
  - `sold`
  - `booked_meeting`
  - `booked_google_meet`
  - `followup_scheduled`
  - `info_collected`
  - `transferred`
  - `not_interested`
  - `disqualified`

