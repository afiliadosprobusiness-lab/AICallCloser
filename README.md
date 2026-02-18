# AI Call Closer

SaaS multi-tenant **mobile-first** en Next.js para gestionar llamadas inbound con IA: calificacion de leads, agenda y handoff humano con guardrails estrictos.

## Stack

- Next.js 16 App Router + TypeScript estricto
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- NextAuth (Auth.js) con credenciales
- Plivo Voice inbound/outbound webhooks
- OpenAI-compatible LLM + STT + TTS
- Deploy target: Vercel

## Arquitectura

- Multi-tenant real por `workspaceId` en datos de dominio (`Lead`, `Call`, `TranscriptTurn`, `AgentConfig`, etc.).
- Aislamiento por sesión + membresía (`WorkspaceMember`) en backend.
- Flujo inbound:
  1. Plivo -> `/api/plivo/voice/inbound`
  2. Resolución de workspace por número de telefonía
  3. Persistencia de llamada + lead
  4. Turnos de voz en `/api/plivo/voice/process`
  5. STT -> LLM (guardrails) -> TTS
  6. Outcome + transcript + handoff/agenda

Documento completo: `docs/architecture-and-plan.md`

## Sistema de diseño premium

- Fondo negro profundo, superficies grafito, acentos dorados elegantes.
- Glassmorphism oscuro + sombras profundas + bordes dorados sutiles.
- Tipografías: `Playfair Display` (headline) + `Manrope` (UI).
- Mobile-first real (390px) con bottom navigation premium.

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- Cuenta Plivo (Voice)
- OpenAI API key (u proveedor compatible)

## Variables de entorno

1. Copia `.env.example` a `.env`.
2. Completa como mínimo:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_call_closer?schema=public"
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="<secret-largo>"
```

Opcionales para llamadas IA reales:

```bash
OPENAI_API_KEY="..."
OPENAI_BASE_URL="..." # solo si usas proveedor compatible
VOICE_PROVIDER="plivo"
PLIVO_AUTH_ID="..."
PLIVO_AUTH_TOKEN="..."
PLIVO_WEBHOOK_BASE_URL="https://tu-dominio-o-ngrok"
PLIVO_INBOUND_NUMBER="+15550001111"
HUMAN_HANDOFF_PHONE="+15550001111"
```

## Setup local

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

App: `http://localhost:3000`

## Usuario demo (seed)

- Email: `demo@aicallcloser.com`
- Password: `Demo1234!`

## Configuración Plivo

Configura el número inbound:

- Answer URL / Voice webhook (POST): `https://TU_URL/api/plivo/voice/inbound`
- Hangup URL / Status callback (POST): `https://TU_URL/api/plivo/voice/status`

Para local, usar `ngrok http 3000` y poner ese dominio en `PLIVO_WEBHOOK_BASE_URL`.

## Flujo MVP implementado

- Auth + workspaces multi-tenant
- Dashboard premium (KPIs, actividad reciente, tendencia)
- Leads (mobile cards + desktop table)
- Calls (historial + transcript + simulador de turnos)
- Agente IA (config editable con guardrails)
- Ajustes (workspace, números, handoff)
- Webhooks Plivo inbound/status + endpoint outbound
- Pipeline STT/LLM/TTS con fallback seguro

## Validación manual por fase

### Fase 1
- Registro/login funcional
- Cambio de workspace
- Layout mobile/desktop premium

### Fase 2
- Consistencia visual en todas las pantallas
- Estados vacíos y navegación táctil correcta

### Fase 3
- Llamada inbound crea `Call` + `Lead`
- Persistencia de transcript turn-by-turn

### Fase 4
- IA responde con guardrails
- Si no hay seguridad en respuesta o piden humano -> handoff

### Fase 5
- Lead/outcome actualizados
- Métricas visibles en dashboard

## Manejo de errores

- Validación de payloads con Zod en endpoints
- Verificación de firma Plivo/Twilio (según proveedor)
- Logs estructurados con Pino
- Fallback de IA cuando faltan credenciales o respuesta inválida

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Estado actual

- Build y lint en verde.
- Si `migrate` falla localmente, verifica que PostgreSQL esté corriendo y que `DATABASE_URL` sea accesible.
