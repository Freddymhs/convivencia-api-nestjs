# FASE 0: BASE — Rebrand template-nest → convivencia-api

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: Ninguna

## Orden de ejecución

1. Tarea 0.A — rename/rebrand (independiente, hacer primero para evitar diffs ruidosos después)
2. Tarea 0.B — depende de 0.A (edita los mismos archivos de infra)
3. Tarea 0.C — schema Prisma nuevo, independiente de 0.A/0.B pero debe ir antes de 0.D
4. Tarea 0.D — depende de 0.C (elimina Example una vez el schema real existe)
5. Tarea 0.E — independiente, agrega deps nuevas (bullmq, sentry, telegram/twilio)

## Tareas

### Tarea 0.A: Rebrand nombre de proyecto

- Archivo: `package.json` (modificar) — `name: "template-nest"` → `"convivencia-api"`
- Archivo: `README.md` (modificar) — título, referencias a `template-nest`
- Archivo: `docker-compose.yml`, `Dockerfile` (modificar) — nombres de imagen/servicio si hardcodeados
- Archivo: `.env.example` (modificar) — revisar `DATABASE_URL` default (nombre de DB `convivencia` en vez de `template_nest`)
- Que hacer: buscar todas las ocurrencias literales de `template-nest`/`template_nest` (`grep -ri template.nest .`) y reemplazar por `convivencia-api`/`convivencia`. No tocar lógica, solo naming.

### Tarea 0.B: Docker-compose — agregar servicio Redis

- Archivo: `docker-compose.yml` (modificar)
- Que hacer: agregar servicio `redis` (imagen `redis:7-alpine`, puerto `6379`, volumen para persistencia opcional). BullMQ (Tarea 0.E, FASE 1) lo necesita como broker.
- Referencia: servicio `postgres` ya existente en el mismo archivo — mismo patrón (imagen, env, volumes, healthcheck).

### Tarea 0.C: Schema Prisma — modelos de dominio base

- Archivo: `prisma/schema.prisma` (modificar) — reemplazar/complementar `model Example`
- Que hacer: definir modelos base según `docs/_CONCEPTO.md` (modelo de dominio):
  - `House` (id, name, createdAt)
  - `Resident` (id, houseId, name, role enum `OWNER`/`MEMBER`, telegramChatId/phone nullable — canal de ping)
  - `Zone` (id, houseId, name, kind enum `SHARED`/`ASSIGNED`, createdById → Resident)
  - `Resource` (id, zoneId, name)
  - `Rule` (id, houseId, text) — referencia estática, sin campos de recurrencia
  - `Task` (id, houseId, name, recurrenceType enum `EVERY_N_DAYS`/`WEEKLY_DAYS`/`FIXED_DAY_OF_MONTH`, recurrenceConfig Json, nextRunAt DateTime, assignedToId → Resident, zoneId/resourceId nullable)
- Referencia: `model Example` actual (`prisma/schema.prisma:11`) para convención de mapeo (`@@map`, `@map` snake_case en columnas).
- Nota: NO modelar RLS policies acá — eso es FASE 2 (requiere migración SQL manual, no solo `schema.prisma`).
- Nota: `role` es campo de dominio barato (día 1), sin JWT/login todavía — ver `_CONCEPTO.md` sección Roles.

### Tarea 0.D: Eliminar módulo Example

- Archivo: `src/modules/example/` (eliminar carpeta completa)
- Archivo: `src/app.module.ts` (modificar) — quitar import/registro de `ExampleModule`
- Archivo: `prisma/schema.prisma` (modificar) — quitar `model Example` una vez migrado el schema real (Tarea 0.C)
- Que hacer: `git rm -r src/modules/example`. Generar migración Prisma (`pnpm prisma:migrate`) que dropee `examples` y cree las tablas nuevas.
- Referencia: mantener `src/modules/example/*` como patrón de referencia visual (controller→service→repository→dto) hasta terminar Tarea 1.x si hace falta copiar la estructura; borrar recién al final de FASE 0.

### Tarea 0.E: Dependencias nuevas (BullMQ, Sentry, mensajería)

- Archivo: `package.json` (modificar), `pnpm-workspace.yaml` (modificar si hace falta override)
- Que hacer: agregar `@nestjs/bullmq`, `bullmq`, `ioredis` (colas), `@sentry/node` (error tracking), `node-telegram-bot-api` o `twilio` (mensajería F1 — decidir en Tarea 1.5 según ADR). Correr `pnpm install`.
- Archivo: `src/config/env.constants.ts` (modificar) — agregar keys: `REDIS_URL`, `SENTRY_DSN`, `TELEGRAM_BOT_TOKEN` (o `TWILIO_*`).
- Archivo: `.env.example` (modificar) — documentar las nuevas vars.
- Referencia: `src/config/env.constants.ts` actual y su validación Joi (buscar el schema Joi que consume estas keys, probablemente en `src/config/env.module.ts` o similar) — seguir mismo patrón fail-fast.

## Criterios de Aceptacion

- [ ] `pnpm type-check`, `pnpm lint`, `pnpm build` pasan sin referencias a `template-nest` ni `Example`
- [ ] `docker-compose up` levanta `api` + `postgres` + `redis` sin errores
- [ ] Migración Prisma nueva aplica limpio sobre DB vacía (`pnpm prisma:migrate`)
- [ ] `pnpm test` sigue en verde (tests de `Example` eliminados junto con el módulo)
