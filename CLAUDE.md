# CLAUDE.md — convivencia-api

NestJS + Fastify + Prisma + pnpm. Reglas de toolchain aprendidas en este repo.

## pnpm

- **pnpm 11+ ignora el campo `pnpm` en `package.json`.** `overrides`, `onlyBuiltDependencies` e `ignoredBuiltDependencies` van en `pnpm-workspace.yaml`. Si están en `package.json`, pnpm los descarta silenciosamente (solo un `[WARN]`) y el lock no se regenera con ellos.
- **Los overrides por rango (`^5.8.5`) no siempre colapsan versiones transitivas duplicadas.** Si dos versiones de un paquete coexisten (ej: `@nestjs/platform-fastify` fija `fastify` a una patch menor), pinear la versión exacta en el override (`fastify: 5.8.5`) para forzar una sola. Versiones duplicadas de `fastify` rompen el type-check de `@fastify/helmet` por `FastifyInstance` incompatible.
- **Tras deduplicar/cambiar overrides, borrar `dist/tsconfig.tsbuildinfo`.** `tsconfig.json` usa `incremental: true`: la caché guarda las rutas de módulos ya resueltas y un dep recién deduplicado sigue dando error de tipos hasta limpiarla, aunque el lock y `node_modules` ya estén correctos.

## Prisma

- **Correr `pnpm prisma:generate` antes de `type-check`/`build`.** El cliente Prisma se genera en `node_modules`, no se commitea. Sin generar, `tsc` falla al resolver `@prisma/client` (`Example`, `Prisma`).
