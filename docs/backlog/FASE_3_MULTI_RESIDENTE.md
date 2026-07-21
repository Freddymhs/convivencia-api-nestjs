# FASE 3: MULTI-RESIDENTE REAL — Google OAuth + enforcement

**Status**: ⏸️ PENDIENTE
**Prioridad**: Baja
**Dependencias**: FASE_2_DOMINIO_OBSERVABILIDAD

Objetivo (de `docs/_CONCEPTO.md`): login vía Google OAuth, roles enforced de verdad (reemplaza el header temporal de FASE 2), otros residents pueden entrar a la casa. Se construye igual aunque la adopción real sea incierta — el objetivo declarado es practicar OAuth+RLS+auth como señal senior.

## Orden de ejecución

1. Tarea 3.A — Google OAuth login (independiente, es la puerta de entrada)
2. Tarea 3.B — depende de 3.A — link cuenta OAuth ↔ `Resident` existente
3. Tarea 3.C — depende de 3.B — JWT guard reemplaza el header temporal de FASE 2 (Tarea 2.B)
4. Tarea 3.D — depende de 3.C — RLS ahora lee el resident autenticado, no un valor sembrado
5. Tarea 3.E — depende de 3.B — invitación de nuevos residents por el owner

## Tareas

### Tarea 3.A: Google OAuth login

- Archivo: `src/modules/auth/auth.module.ts` (crear)
- Archivo: `src/modules/auth/strategies/google.strategy.ts` (crear) — `passport-google-oauth20`
- Archivo: `src/modules/auth/auth.controller.ts` (crear) — `GET /api/v1/auth/google`, `GET /api/v1/auth/google/callback`
- Que hacer: agregar `@nestjs/passport`, `passport-google-oauth20` a dependencias. Env vars `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CALLBACK_URL` en `src/config/env.constants.ts`.

### Tarea 3.B: Link cuenta OAuth ↔ Resident

- Archivo: `prisma/schema.prisma` (modificar) — agregar `googleId`/`email` a `Resident` (nullable, se llena al primer login)
- Archivo: `src/modules/auth/auth.service.ts` (crear) — al callback de Google, buscar `Resident` por email/invitación pendiente; si no existe, rechazar (no auto-crear residents — el owner los invita, ver Tarea 3.E)

### Tarea 3.C: JWT guard — reemplaza header temporal

- Archivo: `src/modules/auth/guards/jwt-auth.guard.ts` (crear)
- Archivo: `src/common/guards/role.guard.ts` (modificar) — leer el resident desde el JWT decodificado en vez del header `x-resident-id` (FASE 2, Tarea 2.B) — **esta tarea cierra la deuda documentada en esa fase**
- Archivo: `src/modules/task/task.controller.ts` (modificar) — quitar dependencia del header temporal

### Tarea 3.D: RLS con resident autenticado

- Archivo: `src/database/prisma.service.ts` (modificar) — el `SET app.current_resident` (FASE 2, Tarea 2.C) ahora toma el valor del JWT decodificado por request, no de un contexto fijo
- Que hacer: verificar que el `SET` corre por-request (no por-conexión-compartida) — riesgo real de fuga entre requests si el pool de conexiones no aísla esto. Investigar `Prisma.$extends` con contexto de request (`AsyncLocalStorage` o interceptor NestJS).

### Tarea 3.E: Invitación de residents

- Archivo: `src/modules/resident/resident.controller.ts` (modificar o crear) — `POST /api/v1/residents/invite` (solo `OWNER`/`MANAGER`), genera invitación pendiente (email + token)
- Que hacer: al aceptar invitación (login Google con ese email), el `Resident` pendiente pasa a activo y se linkea (Tarea 3.B).

## Criterios de Aceptacion

- [ ] Login con Google funciona end-to-end contra un `Resident` invitado previamente
- [ ] Un usuario Google sin invitación pendiente no puede entrar (403/404 explícito, no crash)
- [ ] El header temporal `x-resident-id` de FASE 2 ya no existe en el código
- [ ] RLS aislado correctamente verificado con 2 residents concurrentes en tests de integración (uno no ve filas del otro)
