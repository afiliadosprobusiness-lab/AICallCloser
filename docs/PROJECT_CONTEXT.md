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
