# Convivencia — Concepto

## Propósito

Ayudar a mantener una **convivencia saludable en viviendas compartidas** mediante la definición de espacios, recursos, reglas, responsabilidades y recordatorios — promoviendo que cada residente cuide las áreas y elementos que usa.

**NO es una app de tareas genéricas** (eso depende del antojo personal → Todoist). Es un **gestor de responsabilidades compartidas**: requisitos de convivir bien en un lugar arrendado. El incumplimiento no es contractual, pero rompe la convivencia.

## Qué es / qué no es

| Concepto                            | Ejemplo                              | ¿Genera recordatorio?                                                                     |
| ----------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Regla** (inmediata)               | "si usás la cocina, limpiala"        | ❌ NO — es referencia/onboarding. No agendable. Sería presión excesiva.                   |
| **Tarea periódica**                 | "limpieza profunda baño cada 7 días" | ✅ SÍ — disparable por tiempo → WhatsApp                                                  |
| ~~Mantenimiento~~ (comprar insumos) | "comprar cloro"                      | ❌ Descartado — trackear consumo = scope creep no confiable. Cada uno maneja sus insumos. |

**Split limpio del sistema**: `Rules` (referencia estática, se muestran) vs `Tasks` (agendadas, generan ping WhatsApp). El motor de recordatorios SOLO conoce tareas periódicas.

## Modelo de dominio (general, role-aware — NO hardcodear la casa real)

```
House
 ├── Residents   (role: OWNER/MANAGER | MEMBER)
 ├── Zones       (kind: SHARED | ASSIGNED, created_by)
 │     └── Resources   (lavadora, refri, mesa… dentro de una Zone)
 ├── Rules       (referencia inmediata, NO motor)
 └── Tasks       (recurrencia, assigned_to: Resident, zone/resource opcional)
```

- **Zone** puede ser compartida o asignada. Una compartida puede tener recursos/partes exclusivas o comunes.
- **Resource** vive dentro de una Zone.
- Modelar genérico: `assigned_to: resident` — NO "la señora del patio" como entidad.

## Roles (modelados desde F1, enforced en F3)

- **OWNER/MANAGER** (la dueña): crea casa, zonas, recursos, reglas; asigna tareas a residents.
- **MEMBER** (Freddy/otros): ve sus asignaciones, marca hecho, recibe recordatorio.

Separar **rol** (campo de dominio, barato, día 1) de **auth** (login/JWT, capa de enforcement, F3). En F1 hay 1 owner sembrado, sin login. Schema role-aware desde el inicio → multi-residente sin retrofit doloroso.

## Seguridad: RLS (no RBAC como protagonista)

- **RLS (Postgres Row-Level Security)** = aislamiento de **filas** por resident/casa, enforced en la DB (no en código). Práctica estrella, fit del norte (Postgres serio).
  - Impl: policies en migraciones Prisma + `SET app.current_resident` por request en NestJS → el motor filtra.
- **Role flag mínimo** para acciones owner-only (crear zonas/asignar) = autorización de **acción**, complementa RLS (que es de filas). Coexisten.

## Stack

**Core = NestJS API** (proceso persistente = fit natural para colas/cron del motor de reminders). Base = template-nest (Fastify + Prisma + Postgres + pino + Jest + Swagger + Docker, ya incluidos).

Agregar:

- **BullMQ** (+ Redis) — cola/jobs de recordatorios (recurrencia → ping). Redis también como **caché** (F2, wishlist).
- **Sentry** — error tracking (F1, free tier; ya usado en api.resume).
- **Mensajería del ping** — F1: **Telegram** (gratis, Hermes ya corre) o **Twilio sandbox** (test). **WhatsApp real = F2/F3** (Meta Cloud API = Business + templates aprobados; Twilio prod = pago). No bloquear F1 por WhatsApp.
- **RLS policies** — migraciones Prisma.
- **Observabilidad faseada**: Sentry (F1) → **OpenTelemetry + Prometheus + Grafana** self-hosted (F2). NO los cuatro juntos (se solapan).
- **Google OAuth avanzado** — login F3 (las señoras se logean con Google; wishlist).

**Costos/portabilidad**: todo open-source/free (Postgres/Redis/BullMQ/OTel/Prometheus/Grafana) + free tiers (Sentry, Google OAuth). Único catch = **WhatsApp proactivo** (ver arriba). Dev en Linux (ThinkPad) → deploy Mac Mini M1: Node + imágenes Docker **multi-arch** = portable; si buildeás imagen propia → multi-arch o buildear en M1.

**Frontend = Next.js (RSC), DESPUÉS** (F2/F3): consume la API NestJS. Cierra gap fullstack/RSC de entrevistas. Contrato API limpio entre servicios = señal senior.

- **NO monolito Next.js**: las colas/workers/cron pelean con su modelo serverless → terminás con worker aparte igual, perdiendo la simpleza. El monolito no simplifica este workload.
- **NO BFF ahora**: "API que solo manda mensajes" no es BFF (un BFF moldea backend para UN frontend). El envío WhatsApp = worker DENTRO del API. BFF real = opcional, con el frontend (F3).

## Práctica de fundamentos (cierra interview-gaps — F1, arquitectura)

Las fallas reales en entrevista (banco-falabella) fueron **fundamentos + patrones**, no tech exótica: SOLID, NestJS lifecycle, Interface vs Abstract, TS tipos (null/undefined/never/unknown), Event Loop, "no nombró patrones formales". El dominio de convivencia es el canvas ideal para practicarlos A PROPÓSITO (es CÓMO se escribe F1, no features extra):

- **SOLID + patrones formales nombrados**: motor de recurrencia = **Strategy** (cada tipo cada-Nd/Nx-sem = una strategy) · **Repository** (acceso datos) · **Factory**. Nombrarlos en ADRs → cierra "no nombró patrones" + SOLID.
- **NestJS lifecycle**: usar a propósito guards/interceptors/pipes/exception-filters/DI → cierra el gap exacto.
- **TS tipos avanzados**: strict mode + **discriminated unions** (tipo de recurrencia, role) + `unknown`/`never` en boundaries.
- **Interface vs Abstract**: `abstract RecurrenceStrategy` + interfaces de repos — ambos conscientemente.

## Fases

```
F1 — MVP (Freddy solo, SIN login)
  Schema role-aware + multi-resident-aware, 1 owner sembrado.
  Task { nombre, recurrencia (cada Nd / Nx-sem / día fijo), próxima_fecha, assigned_to }
  + BullMQ scheduler + entrega del ping (Telegram/Twilio-sandbox) + Sentry.
  Arquitectura = práctica de fundamentos (ver sección arriba). → llega el ping. Ya tiene valor CV.

F2 — Dominio + observabilidad + WhatsApp real
  Zones (shared/assigned) + Resources + Rules (referencia) + lógica "manager asigna a resident".
  RLS policies. OTel + Prometheus + Grafana. Redis caché. WhatsApp real (Meta/Twilio).
  Frontend Next.js (RSC) consumiendo la API.

F3 — Multi-residente real
  Auth vía **Google OAuth** (login + link) → enforce roles. Otros residents entran.
  (Se construye igual aunque adopción incierta: el objetivo es practicar — OAuth+RLS+auth = señal senior.)
```

## Practice-wishlist (este proyecto como vehículo del NORTE)

Tech del norte/gaps asignada a este proyecto para crecer (mismo concepto que `wishlist` en resume.json):

- **RLS / Postgres** ⭐ (norte)
- **Colas / BullMQ** ⭐ (norte)
- **Sentry** (F1, error tracking)
- **OpenTelemetry + Prometheus + Grafana** (F2, norte — observabilidad self-hosted)
- **Redis** (broker + caché, wishlist)
- **Google OAuth avanzado** (F3, wishlist — login)
- **Jest** (graduable — testear el motor de recurrencia, escrito a mano)
- **Fundamentos** (cierra interview-gaps): SOLID, patrones (Strategy/Repository/Factory), NestJS lifecycle, TS tipos avanzados, Interface-vs-Abstract
- Mensajería: Telegram/Twilio (F1) → WhatsApp real (F2)

Registrar en `resume.json` vía `/work:resume:sync` cuando F1 tenga código real (`published:false`, DEVELOPMENT). No antes.

## Fuera de alcance (v1)

Auth/login · frontend · mantenimiento de insumos · multi-casa real · score histórico · animaciones.
