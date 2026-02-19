# AI Call Closer

SaaS multi-tenant **mobile-first** en Next.js para gestionar llamadas inbound con IA: calificacion de leads, agenda y handoff humano con guardrails estrictos.

## Stack

- Next.js 16 App Router + TypeScript estricto
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- NextAuth (Auth.js) con credenciales + Google via Firebase Auth
- Telnyx Voice inbound/outbound webhooks
- OpenAI-compatible LLM + STT + TTS
- Deploy target: Vercel

## Arquitectura

- Multi-tenant real por `workspaceId` en datos de dominio (`Lead`, `Call`, `TranscriptTurn`, `AgentConfig`, etc.).
- Aislamiento por sesión + membresía (`WorkspaceMember`) en backend.
- Flujo inbound:
  1. Telnyx -> `/api/telnyx/voice/inbound`
  2. Resolución de workspace por número de telefonía
  3. Persistencia de llamada + lead
  4. Turnos de voz en `/api/telnyx/voice/process`
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
- Cuenta Telnyx (Voice)
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
VOICE_PROVIDER="telnyx"
TELNYX_API_KEY="..."
TELNYX_CONNECTION_ID="..."
TELNYX_WEBHOOK_BASE_URL="https://tu-dominio-o-ngrok"
TELNYX_INBOUND_NUMBER="+15550001111"
HUMAN_HANDOFF_PHONE="+15550001111"
```

Alternativa Twilio:

```bash
VOICE_PROVIDER="twilio"
BASE_URL="https://ai-call-closer-saas.vercel.app" # dominio publico de webhooks
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_NUMBER="+15752550685" # numero origen para outbound test call
TWILIO_INBOUND_NUMBER="+15550001111"
HUMAN_HANDOFF_PHONE="+15550001111"
```

Opcional para login/registro con Google (Firebase):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
FIREBASE_WEB_API_KEY="..." # opcional, usa NEXT_PUBLIC_FIREBASE_API_KEY si no se define
```

Opcional para recuperación de contraseña por email propio (Resend):

```bash
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="no-reply@tu-dominio.com"
```

Si Resend no está configurado, la recuperación usa fallback con Firebase Auth (`FIREBASE_WEB_API_KEY`).

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

## Configuración Telnyx

Configura el número inbound:

- Voice webhook (POST): `https://TU_URL/api/telnyx/voice/inbound`
- Status callback (POST): `https://TU_URL/api/telnyx/voice/status`

Para local, usar `ngrok http 3000` y poner ese dominio en `TELNYX_WEBHOOK_BASE_URL`.

## Configuración Twilio

Configura el número inbound:

- Voice webhook (POST): `https://TU_URL/api/twilio/voice/inbound`
- Status callback (POST): `https://TU_URL/api/twilio/voice/status`

Salida programática (botón Test Call):

- Outbound API: `POST https://TU_URL/api/twilio/voice/outbound`
- TwiML outbound real: `POST https://TU_URL/api/twilio/voice/outbound?agentId=...`
- Status tracking: `POST https://TU_URL/api/twilio/voice/status`

### Prueba outbound cold-call (paso a paso)

1. En Vercel define:
   - `VOICE_PROVIDER=twilio`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_NUMBER` (o `TWILIO_INBOUND_NUMBER`)
   - `BASE_URL` (recomendado; si falta, el backend usa el dominio del request actual)
2. En Twilio Phone Number:
   - **A call comes in**: `POST https://TU_URL/api/twilio/voice/inbound`
   - **Call status changes**: `POST https://TU_URL/api/twilio/voice/status`
3. En el dashboard (`/dashboard`), en **Test Call**, ingresa destino en formato E.164 (`+51...`) y pulsa **Start call**.
4. En `Ajustes` puedes marcar el **Outbound Caller ID** del workspace. Ese número se prioriza para Test Call.
5. Verifica en Twilio Monitor:
   - Request 200 a `/api/twilio/voice/outbound`
   - Callback 200 a `/api/twilio/voice/status`
6. En trial de Twilio, el destino debe estar en **Verified Caller IDs**; si no, la UI mostrará:
   - `Twilio Trial: verify the destination number in Verified Caller IDs.`

## Puente (JSON lead import)

Nueva sección en `Settings -> Puente` para importar leads y lanzar llamadas outbound con el guion del agente configurado en dashboard.

### Formato `lead-import.json` (v1)

```json
{
  "version": 1,
  "customer": {
    "customerName": "Solar North LLC",
    "customerId": "cust_solar_north_001",
    "agentId": "cm7abc123xyz456"
  },
  "leads": [
    {
      "externalId": "lead_1001",
      "clientName": "John Miller",
      "phoneE164": "+51924464410",
      "objective": "CLOSE_SALE",
      "collectedInfo": {
        "serviceNeeded": "Solar installation",
        "budgetRange": "15000-25000",
        "urgency": "this month",
        "notes": "Asked for financing options"
      },
      "preferredTimes": [
        { "date": "2026-02-20", "time": "10:30", "timezone": "America/Lima" }
      ]
    }
  ]
}
```

### Reglas de validación

- `version` debe ser `1`
- `customer.customerName` y `customer.agentId` son obligatorios
- `leads` mínimo 1, máximo 5000
- `externalId` obligatorio y único dentro del archivo
- `phoneE164` debe ser E.164 (`+51...`, `+1...`)
- tamaño máximo del archivo: `200KB`

### Endpoints Puente

- `POST /api/bridge/import`
- `GET /api/bridge/leads?customerId=<id>&page=1&pageSize=50`
- `POST /api/bridge/leads/:id/call`
- `POST /api/bridge/leads/:id/outcome`

### Flujo de prueba rápida

1. Ir a `Settings -> Puente`.
2. Subir `lead-import.json` y pulsar **Importar**.
3. Verificar que los leads aparecen en tabla con estado `new`.
4. Pulsar **Llamar ahora** en un lead.
5. En Twilio Monitor validar request `200` a:
   - `/api/twilio/voice/outbound?agentId=...&leadId=...`
   - `/api/twilio/voice/status`
6. Confirmar que la apertura usa el `welcomeMessage` del agente y el objetivo del lead importado.

## Leads Widget Handoff API

Endpoint de producción para recibir handoff desde `leads.widget`:

- `POST /api/leads/handoff`
- Auth: `Authorization: Bearer <IACLOSER_API_KEY>`

Respuesta exitosa:

```json
{
  "success": true,
  "lead_id": "cma123...",
  "redirect_url": "https://tuapp.com/session/cma123...",
  "eta_seconds": 60
}
```

Variables requeridas:

```bash
IACLOSER_API_KEY="..."
PUBLIC_APP_URL="https://ai-call-closer-saas.vercel.app"
```

## Flujo MVP implementado

- Auth + workspaces multi-tenant
- Dashboard premium (KPIs, actividad reciente, tendencia)
- Leads (mobile cards + desktop table)
- Calls (historial + transcript + simulador de turnos)
- Agente IA (config editable con guardrails)
- Ajustes (workspace, números, handoff)
- Webhooks Telnyx inbound/status + endpoint outbound
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
- Verificación de firma para proveedores legacy (Plivo/Twilio)
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
