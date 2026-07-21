# FASE 2: DOMINIO COMPLETO + OBSERVABILIDAD + WHATSAPP REAL

**Status**: ⏸️ PENDIENTE
**Prioridad**: Media
**Dependencias**: FASE_1_MVP_FREDDY

Objetivo (de `docs/_CONCEPTO.md`): Zones/Resources/Rules, asignación manager→resident, RLS real en Postgres, observabilidad self-hosted, caché Redis, WhatsApp real. El frontend Next.js consumidor vive fuera de este repo — no se incluye acá.

## Orden de ejecución

1. Tarea 2.A — Zone/Resource/Rule modules (CRUD, independiente de RLS)
2. Tarea 2.B — depende de 2.A — asignación manager→resident (usa Zone/Resource ya existentes)
3. Tarea 2.C — RLS policies — depende de que el schema esté estable (2.A hecha), es infra de DB
4. Tarea 2.D — Redis caché — independiente, puede ir en paralelo a 2.C
5. Tarea 2.E — OTel+Prometheus+Grafana — independiente, instrumentación transversal
6. Tarea 2.F — WhatsApp real — depende de FASE 1 (reemplaza/agrega a `NotificationSender`)
7. Tarea 2.G — independiente, checklist de revisión — hacerla cuando 2.A-2.C estén cerca de terminar (necesita código real que auditar)

## Tareas

### Tarea 2.A: Zone / Resource / Rule — CRUD

- Archivo: `src/modules/zone/*` (crear) — mismo patrón 4-capas que `task`/`example`
- Archivo: `src/modules/resource/*` (crear) — `Resource` pertenece a `Zone`
- Archivo: `src/modules/rule/*` (crear) — CRUD simple, sin motor de recurrencia (es referencia estática, ver `_CONCEPTO.md`)
- Archivo: `src/app.module.ts` (modificar) — registrar los 3 módulos nuevos
- Referencia: `src/modules/task/` (FASE 1) como patrón más reciente y ya consistente con el dominio.

### Tarea 2.B: Asignación manager→resident

- Archivo: `src/modules/task/task.controller.ts` (modificar) — endpoint `PATCH /api/v1/tasks/:id/assign` restringido a role `OWNER`/`MANAGER`
- Archivo: `src/common/guards/role.guard.ts` (crear) — guard que lee `Resident.role` (aún sin JWT — ver nota)
- Que hacer: **nota de secuencia** — sin auth real (F3 todavía no llegó), el guard debe leer el resident actual de un header/contexto temporal (ej. `x-resident-id`), NO hardcodear. Documentar esta limitación en el ADR de esta tarea; se reemplaza en FASE 3 por el JWT real.
- Referencia: `src/common/decorators/public.decorator.ts` — patrón de decorator existente para marcar rutas, usar de base para `@Roles(...)`.

### Tarea 2.C: RLS policies — Postgres Row-Level Security

- Archivo: `prisma/migrations/<timestamp>_rls_policies/migration.sql` (crear, vía `prisma migrate dev --create-only` + editar SQL a mano)
- Archivo: `src/database/prisma.service.ts` (modificar) — antes de cada query, ejecutar `SET app.current_resident = '<id>'` en la misma transacción/conexión (ver Prisma `$transaction` o middleware `$extends`)
- Que hacer: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` por tabla (`house_id` o `resident_id` como filtro), usando `current_setting('app.current_resident')`. Esto es la pieza "norte" (⭐ en el concepto) — cuidado extra en el ADR explicando la policy.
- Archivo: `docs/decisions/DECISION_rls-postgres.md` (crear) — por qué RLS en DB y no un `WHERE` repetido en cada repository (SSOT de seguridad de filas).
- Referencia: `src/database/base.repository.ts` — entender cómo las queries actuales usan el delegate de Prisma, para saber dónde inyectar el `SET`.

### Tarea 2.D: Redis caché (cache-aside)

- Archivo: `src/common/cache/cache.module.ts` (crear) — wrapper sobre `ioredis` (ya instalado en FASE 0/1 para BullMQ)
- Archivo: `src/modules/zone/zone.service.ts` (modificar) — cache-aside en `findAll` (listas de zonas por casa cambian poco)
- Que hacer: TTL corto (ej. 60s), invalidar cache en `create`/`update`/`remove`. No cachear datos sensibles a RLS sin incluir el `resident_id`/`house_id` en la key.

### Tarea 2.E: Observabilidad — OTel + Prometheus + Grafana

- Archivo: `src/main.ts` (modificar) — instrumentación OpenTelemetry (`@opentelemetry/sdk-node` + auto-instrumentations para Fastify/Prisma)
- Archivo: `docker-compose.yml` (modificar) — servicios `prometheus` + `grafana` (self-hosted, según `_CONCEPTO.md`)
- Archivo: `docs/diagrams/DIAGRAMAS_COMPONENTES.md` (modificar) — actualizar topología: agregar Prometheus/Grafana al diagrama de contexto
- Que hacer: métricas HTTP (latencia, tasa de error) + métricas custom del scheduler (jobs procesados, fallos de envío). Dashboards Grafana básicos, no elaborados.

### Tarea 2.F: WhatsApp real (Meta Cloud API)

- Archivo: `src/modules/notification/whatsapp-notification.sender.ts` (crear) — nueva implementación de `NotificationSender` (interface de FASE 1, Tarea 1.D)
- Archivo: `src/modules/notification/notification.module.ts` (modificar) — el Factory ahora puede elegir WhatsApp si `WHATSAPP_*` env vars están presentes
- Que hacer: usar templates aprobados de Meta Business (no mensajes libres — la API lo exige fuera de ventana de 24h). Documentar en ADR el flujo de aprobación de templates.

### Tarea 2.G: Checklist OWASP de revisión (RLS + roles)

- **Verificado antes de escribir esta tarea (no proponer lo que ya existe)**: el
  scaffold base ya trae `@fastify/helmet` registrado (`main.ts`), `ThrottlerGuard`
  global (`app.module.ts`, `APP_GUARD`) y `class-validator` con pipe global
  (`GLOBAL_VALIDATION_PIPE`) — cero trabajo nuevo ahí.
- Archivo: `docs/decisions/DECISION_owasp_checklist.md` (crear)
- Que hacer: al cerrar 2.A-2.C (Zone/Resource/Rule + asignación por rol + RLS), correr un
  checklist corto contra OWASP API Security Top 10 sobre ESE código específico —
  Broken Object Level Authorization (¿un resident puede leer/editar zona de otra casa
  vía RLS + el `role.guard.ts` de 2.B?), Broken Function Level Authorization (¿el
  `PATCH .../assign` de 2.B realmente rechaza roles no-`OWNER`/`MANAGER`?), Mass
  Assignment (¿los DTOs de `zone`/`resource`/`rule` aceptan solo los campos que deberían,
  no todo el body?). Documentar el resultado (qué se revisó, qué se encontró) en el
  ADR — no solo "quedó bien", sino la evidencia concreta de cada chequeo.
- **Por qué esta tarea existe**: cierra la molécula `wishlistInbox` "Conocimiento base de
  seguridad de software... OWASP" — el gap real de Freddy (`interview-gaps.yaml`,
  `cchc-fullstack-2026-07`) no era falta de infra, era no **articular** los riesgos de
  seguridad al revisar código ajeno. Esta tarea practica exactamente eso, sobre código
  propio y real.

## Criterios de Aceptacion

- [ ] Un resident sin permiso `OWNER`/`MANAGER` recibe 403 al intentar asignar una tarea
- [ ] RLS verificado: query directa a Postgres sin `SET app.current_resident` no devuelve filas de ninguna casa
- [ ] Grafana muestra al menos 1 dashboard con latencia HTTP y jobs de BullMQ
- [ ] Caché Redis reduce hits a Postgres en `GET /api/v1/zones` (verificable con logs/métricas)
- [ ] `DECISION_owasp_checklist.md` documenta los 3 chequeos (BOLA/BFLA/Mass Assignment) con evidencia concreta, no solo "revisado"
- [ ] Ping de WhatsApp real llega a un número de prueba usando un template aprobado
