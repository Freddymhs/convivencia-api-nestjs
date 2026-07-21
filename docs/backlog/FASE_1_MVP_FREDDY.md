# FASE 1: MVP FREDDY — recordatorios de tareas, sin login

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_0_BASE

Objetivo (de `docs/_CONCEPTO.md`): 1 owner sembrado, Freddy como único resident, tareas periódicas que disparan un ping (Telegram/Twilio sandbox) cuando vencen. Esta fase es también la práctica de fundamentos (SOLID, patrones nombrados, NestJS lifecycle) — ver sección "Práctica de fundamentos" del concepto.

## Orden de ejecución

1. Tarea 1.A — seed (House + Owner + Freddy) — nada más funciona sin datos base
2. Tarea 1.B — RecurrenceStrategy (Strategy pattern) — el motor de cálculo, sin dependencias
3. Tarea 1.C — depende de 1.A + 1.B — Task module (CRUD + cálculo de `nextRunAt` vía strategy)
4. Tarea 1.D — NotificationSender (interface + implementaciones) — independiente, puede ir en paralelo a 1.C
5. Tarea 1.E — depende de 1.C + 1.D — BullMQ scheduler que cruza tareas vencidas con el envío de ping
6. Tarea 1.F — depende de todo lo anterior — Sentry (captura errores del scheduler/envío)
7. Tarea 1.G — tests, en paralelo a medida que cada pieza se completa

## Tareas

### Tarea 1.A: Seed — House + Owner + Freddy

- Archivo: `prisma/seed.ts` (crear)
- Archivo: `package.json` (modificar) — agregar `"prisma": { "seed": "ts-node prisma/seed.ts" }` o script `pnpm prisma:seed`
- Que hacer: script idempotente que crea 1 `House`, 1 `Resident` role `OWNER` (la dueña), 1 `Resident` role `MEMBER` (Freddy). Sin lógica de auth — son filas sembradas directo.

### Tarea 1.B: RecurrenceStrategy — Strategy pattern

- Archivo: `src/modules/task/recurrence/recurrence-strategy.interface.ts` (crear) — `abstract class RecurrenceStrategy { abstract nextRun(from: Date, config: unknown): Date }`
- Archivo: `src/modules/task/recurrence/every-n-days.strategy.ts` (crear)
- Archivo: `src/modules/task/recurrence/weekly-days.strategy.ts` (crear) — ej. martes/viernes
- Archivo: `src/modules/task/recurrence/fixed-day-of-month.strategy.ts` (crear)
- Archivo: `src/modules/task/recurrence/recurrence-strategy.factory.ts` (crear) — Factory que mapea `Task.recurrenceType` (enum de Tarea 0.C) → instancia de strategy concreta
- Archivo: `src/modules/task/recurrence/index.ts` (crear) — barrel export
- Que hacer: cada strategy implementa el cálculo puro de "próxima fecha dado config + fecha actual". Sin I/O, 100% testeable. Usar discriminated union para el `config` de cada tipo (TS tipos avanzados, ver concepto).
- Referencia: `src/common/exceptions/domain.exceptions.ts` para el patrón de clase abstracta + herencia ya usado en el repo (`DomainError`).

### Tarea 1.C: Task module — CRUD + integración con recurrencia

- Archivo: `src/modules/task/dto/create-task.dto.ts`, `update-task.dto.ts`, `task-response.dto.ts`, `index.ts` (crear)
- Archivo: `src/modules/task/task.repository.ts` (crear) — extiende `BaseRepository<Task>`
- Archivo: `src/modules/task/task.service.ts` (crear) — al crear/actualizar, usa `RecurrenceStrategyFactory` (Tarea 1.B) para calcular `nextRunAt`
- Archivo: `src/modules/task/task.controller.ts` (crear) — `GET/POST/PUT/DELETE /api/v1/tasks`
- Archivo: `src/modules/task/task.module.ts` (crear)
- Archivo: `src/app.module.ts` (modificar) — registrar `TaskModule`
- Referencia: `src/modules/example/` completo (controller, service, repository, dto) — copiar la estructura 1:1, adaptar campos.

### Tarea 1.D: NotificationSender — interface + Telegram/Twilio

- Archivo: `src/modules/notification/notification-sender.interface.ts` (crear) — `interface NotificationSender { send(residentId: string, message: string): Promise<void> }`
- Archivo: `src/modules/notification/telegram-notification.sender.ts` (crear)
- Archivo: `src/modules/notification/twilio-sandbox-notification.sender.ts` (crear)
- Archivo: `src/modules/notification/notification.module.ts` (crear) — provider factory que elige la implementación según env (`TELEGRAM_BOT_TOKEN` presente → Telegram, si no → Twilio sandbox)
- Que hacer: interface + 2 implementaciones intercambiables. Documentar la decisión (Telegram vs Twilio) en un ADR (ver Tarea 1.H).
- Referencia: `src/common/exceptions/domain.exceptions.ts` — `ExternalAPIError` para envolver fallos de la API externa (Telegram/Twilio).

### Tarea 1.E: BullMQ scheduler — motor de recordatorios

- Archivo: `src/modules/scheduler/scheduler.module.ts` (crear) — registra `BullModule.forRoot` (Redis de FASE 0) + queue `reminders`
- Archivo: `src/modules/scheduler/reminder.processor.ts` (crear) — cron-like: cada N minutos consulta `Task` con `nextRunAt <= now`, encola un job por tarea vencida
- Archivo: `src/modules/scheduler/reminder-job.consumer.ts` (crear) — procesa el job: llama `NotificationSender.send()`, recalcula `nextRunAt` vía strategy y actualiza el `Task`
- Archivo: `src/app.module.ts` (modificar) — registrar `SchedulerModule`
- Que hacer: separar "detectar vencidas" (producer) de "enviar + recalcular" (consumer) — dos responsabilidades, dos clases (SRP).
- **Retry explícito (cierra molécula "Resilience patterns... Retry" del inbox)**: configurar
  `attempts: 3` + `backoff: { type: 'exponential', delay: 1000 }` en las opciones del job
  al encolarlo (BullMQ lo soporta nativo, no hay que reimplementarlo) — si
  `NotificationSender.send()` falla por error transitorio de red, BullMQ reintenta solo.
  Documentar en el ADR de esta tarea qué errores SÍ ameritan retry (timeout/5xx del
  proveedor) vs cuáles no (número de telegram/whatsapp inválido — reintentar no ayuda).

### Tarea 1.F: Sentry — error tracking

- Archivo: `src/main.ts` (modificar) — inicializar Sentry con `SENTRY_DSN` (Tarea 0.E) antes de `NestFactory.create`
- Archivo: `src/common/filters/http-exception.filter.ts` (modificar) — capturar errores no-domain (5xx inesperados) y reportarlos a Sentry antes de responder
- Referencia: filtro existente en `src/common/filters/http-exception.filter.ts` — no reemplazar la lógica de envelope, solo agregar el side-effect de reporte.

### Tarea 1.G: Tests

- Archivo: `src/modules/task/recurrence/*.spec.ts` (crear) — unit tests puros de cada strategy (fechas límite: fin de mes, año bisiesto, etc.)
- Archivo: `src/modules/task/task.service.spec.ts` (crear) — siguiendo patrón de `src/modules/example/example.service.spec.ts`
- Archivo: `src/modules/notification/*.spec.ts` (crear) — mock del cliente HTTP externo (Telegram/Twilio), verificar que `ExternalAPIError` se lanza en fallo
- Archivo: `test/task.e2e-spec.ts` (crear) — CRUD completo de `/api/v1/tasks` contra DB real, siguiendo patrón de `test/app.e2e-spec.ts`

### Tarea 1.H: ADR — decisiones de esta fase

- Archivo: `docs/decisions/DECISION_recurrence-strategy-pattern.md` (crear) — por qué Strategy y no un switch gigante
- Archivo: `docs/decisions/DECISION_telegram-vs-twilio-sandbox.md` (crear) — por qué el canal elegido para F1
- Que hacer: no es tarea de código — documentar el POR QUÉ una vez tomada la decisión real durante 1.D/1.B.

## Criterios de Aceptacion

- [ ] Crear una `Task` con recurrencia "cada 7 días" y verificar que `nextRunAt` se calcula correctamente
- [ ] El scheduler detecta una tarea vencida y dispara el envío (verificable con mock/log en dev)
- [ ] Un fallo del proveedor de mensajería no tumba el proceso — se captura como `ExternalAPIError` y se reporta a Sentry
- [ ] `pnpm test` y `pnpm test:e2e` en verde
- [ ] Los patrones (Strategy/Repository/Factory) están nombrados explícitamente en comentarios de clase o ADR — no son "accidentales"
