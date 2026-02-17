# AI Call Closer - Arquitectura, Sistema de Diseño y Plan de Implementación

## 1) Arquitectura textual (MVP + escalable)

### Objetivo de arquitectura
SaaS multi-tenant real por `workspace`, con aislamiento lógico de datos, telefonía inbound con Twilio, orquestación conversacional IA con guardrails y persistencia completa de resultados (lead, transcript, outcome, agenda/handoff).

### Arquitectura de alto nivel
- Frontend: Next.js 14+ App Router, TypeScript estricto, Tailwind + shadcn/ui, mobile-first.
- Backend BFF/API: Route Handlers en App Router (`app/api/*`) con validación Zod y logging estructurado.
- Auth: Auth.js/NextAuth con sesión JWT + resolución de workspace activo.
- Datos: PostgreSQL + Prisma con estrategias multi-tenant por `workspaceId` en tablas de dominio.
- Telefonía: Twilio Voice inbound webhook + TwiML para media stream/flujo conversacional.
- IA Runtime:
  - STT: transcripción de audio de llamada (streaming o chunked) hacia proveedor OpenAI-compatible.
  - LLM: motor de diálogo con prompt por workspace + políticas de guardrails.
  - TTS: síntesis de respuestas para retorno de audio al caller.
- Observabilidad: logs JSON, correlación por `callId`, `workspaceId`, `requestId`.
- Deploy: Vercel (web + API), Postgres gestionado, Twilio webhook a dominio productivo.

### Multi-tenant real
- Entidades críticas con `workspaceId` obligatorio: `AgentConfig`, `Lead`, `Call`, `Transcript`, `Appointment`, `Handoff`.
- ACL a nivel app: cada request resuelve `session.user.id` y `workspaceId` activo.
- Consultas Prisma SIEMPRE filtradas por `workspaceId`.
- Índices compuestos para aislamiento y performance: `(workspaceId, createdAt)`, `(workspaceId, status)`.

### Flujo inbound (end-to-end)
1. Cliente llama al número Twilio del workspace.
2. Twilio pega a `POST /api/twilio/voice/inbound` con metadata de llamada.
3. Se resuelve workspace por número Twilio.
4. Se crea registro `Call` en estado `in_progress`.
5. Pipeline conversacional:
   - Captura voz -> STT
   - LLM decide siguiente acción: `qualify | schedule | handoff | close`
   - TTS devuelve respuesta al usuario
6. Durante la llamada se persiste `TranscriptTurn` y señales de calificación.
7. Al finalizar: se calcula `outcome`, se actualiza `Lead`, agenda cita o se marca handoff humano.
8. Dashboard consume métricas agregadas por workspace.

### Guardrails conversacionales
- Regla dura: nunca inventar precios ni condiciones no configuradas.
- Si usuario pregunta por humanidad: responder explícitamente que es asistente virtual.
- Si falta dato crítico o hay incertidumbre -> transferir a humano.
- Respuestas breves, naturales y orientadas al cierre.

### Seguridad
- Validación de entrada con Zod en TODOS los endpoints.
- Verificación de firma de Twilio en webhooks.
- Secrets en variables de entorno (sin hardcode).
- Rate limiting básico en endpoints sensibles.
- Sanitización de texto para evitar prompt injection simple.

## 2) Plan de módulos

### `apps/web` (monolito modular en Next)
- `app/(auth)` -> login/registro
- `app/(app)` -> dashboard, leads, calls, ai-agent, settings
- `app/api/*` -> route handlers autenticados y webhooks
- `components/ui/*` -> shadcn base
- `components/premium/*` -> cards, nav, métricas, estados IA
- `modules/auth/*`
- `modules/workspaces/*`
- `modules/leads/*`
- `modules/calls/*`
- `modules/agent/*`
- `modules/metrics/*`
- `lib/db.ts`, `lib/auth.ts`, `lib/logger.ts`, `lib/env.ts`, `lib/guards.ts`

### Modelo de datos (resumen)
- `User`, `Workspace`, `WorkspaceMember`
- `TwilioPhoneNumber` (mapeo número->workspace)
- `AgentConfig` (prompt, tono, reglas, handoff)
- `Lead` (estado, score, datos)
- `Call` (duración, estado, outcome)
- `TranscriptTurn` (speaker, text, timestamp)
- `Appointment`
- `Handoff`
- `MetricDaily` (pre-agregado)

## 3) Sistema de diseño premium (tokens)

### Principios visuales
- Lujo minimalista, oscuro profesional, alta legibilidad.
- Contraste controlado, acento dorado sobrio.
- Movimiento sutil y funcional (150-250ms).

### Tokens base (CSS variables)
- Fondo:
  - `--bg-0: #0A0A0A`
  - `--bg-1: #111111`
  - `--bg-2: #171717`
- Superficie cristal:
  - `--glass-bg: rgba(255,255,255,0.04)`
  - `--glass-border: rgba(229,199,107,0.28)`
- Texto:
  - `--text-1: #F5F3EE`
  - `--text-2: #C9C5BB`
  - `--text-3: #8B887F`
- Acentos:
  - `--gold-1: #C9A227`
  - `--gold-2: #E5C76B`
  - `--ai-blue: #6FA8FF`
- Sombras:
  - `--shadow-deep: 0 24px 64px rgba(0,0,0,0.55)`
  - `--shadow-gold: 0 0 24px rgba(201,162,39,0.20)`
- Radios:
  - `--radius-card: 20px`
  - `--radius-input: 14px`

### Tipografía
- Headlines: `Playfair Display` (peso 500/600) para tono premium.
- UI/Body: `Manrope` (500/600) por legibilidad profesional.
- Números métricas: `tabular-nums` + tracking leve.

### Componentes clave
- `PremiumCard` (glass oscuro + borde dorado sutil + sombra profunda).
- `KpiCard` (valor grande, delta, sparkline discreto).
- `AIThinkingIndicator` (pulso dorado/azul suave).
- `BottomNav` mobile (alto táctil >= 64px).
- `OutcomeBadge` (qualified, scheduled, handoff, lost).

### Motion
- Hover: elevación + glow dorado suave.
- Transiciones: `ease-out` 180ms.
- Skeleton: shimmer oscuro muy sutil.
- Framer Motion solo en entradas de pantalla y tarjetas de actividad.

## 4) Checklist mobile-first (390px)

- Diseñar primero viewport 390x844.
- Navegación principal en bottom nav fijo.
- Evitar tablas en móvil: usar cards con jerarquía clara.
- CTAs primarios ocupando ancho completo cuando aplique.
- Objetivos táctiles mínimo 44px.
- Inputs/Selects con altura mínima 44px.
- Tipografía mínima 14px en contenido secundario.
- Desktop >= 1024px: sidebar premium + grid amplio.

## 5) Variables de entorno

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_TRUST_HOST=true`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (si proveedor compatible alterno)
- `OPENAI_MODEL`
- `OPENAI_STT_MODEL`
- `OPENAI_TTS_MODEL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY`
- `TWILIO_API_SECRET`
- `TWILIO_INBOUND_NUMBER`
- `TWILIO_WEBHOOK_BASE_URL`
- `HUMAN_HANDOFF_PHONE`
- `LOG_LEVEL`

## 6) Plan de implementación por fases

### Fase 1 - Fundación
- Alcance:
  - Bootstrap Next.js + TS + Tailwind + shadcn.
  - Prisma + Postgres + NextAuth.
  - Modelo base `User/Workspace/WorkspaceMember`.
  - Shell UI premium responsive (mobile-first + desktop sidebar).
- Correr local:
  - `npm install`
  - `npx prisma migrate dev`
  - `npm run dev`
- Validación manual:
  - Login funcional.
  - Selección/creación workspace.
  - Navegación mobile y desktop correcta.
- Manejo de errores:
  - Error boundaries en layout.
  - Mensajes de sesión/DB degradados.

### Fase 2 - UI premium completa
- Alcance:
  - Componentes visuales premium reutilizables.
  - Pantallas Dashboard/Leads/Calls/Agent/Settings completas.
  - Estados loading/empty/error de calidad.
- Correr local: `npm run dev`
- Validación manual:
  - Consistencia visual total.
  - Touch targets y contraste correctos.
- Manejo de errores:
  - Fallbacks de datos por sección.

### Fase 3 - Twilio inbound
- Alcance:
  - Webhook inbound firmado.
  - Registro de llamada + mapeo de número a workspace.
- Correr local:
  - `ngrok http 3000`
  - Configurar webhook Twilio.
- Validación manual:
  - Llamada real crea `Call`.
- Manejo de errores:
  - Reintentos idempotentes por `CallSid`.

### Fase 4 - STT -> LLM -> TTS
- Alcance:
  - Orquestador de turnos con guardrails.
  - Persistencia de transcript y decisiones.
- Correr local: `npm run dev` + credenciales IA válidas.
- Validación manual:
  - Conversación real con respuesta IA.
  - Regla de no-invención de precios validada.
- Manejo de errores:
  - Fallback a handoff humano ante fallo de IA.

### Fase 5 - Leads, métricas y outcomes
- Alcance:
  - Lead scoring, agenda, handoff y dashboards.
  - Métricas agregadas por workspace.
- Correr local: `npm run dev`
- Validación manual:
  - Flujo completo llamada -> lead -> transcript -> outcome.
- Manejo de errores:
  - Consistencia de estado con transacciones Prisma.
