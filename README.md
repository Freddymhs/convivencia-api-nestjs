# template-nest

Plantilla backend con NestJS + Fastify + Prisma + PostgreSQL.

Sirve como base para construir APIs y futuros frontends.

## Quick Start

```bash
# 1. Clonar y copiar variables
cp .env.example .env

# 2. Instalar dependencias
pnpm install

# 3. Levantar todo con Docker (api + postgres)
docker-compose up

# O solo la DB con Docker y la app en local:
docker-compose up postgres
pnpm prisma:generate
pnpm dev
```

La app arranca en `http://localhost:3000` y Swagger en `http://localhost:3000/docs`.

## Stack

| Capa          | Tecnologia                          |
| ------------- | ----------------------------------- |
| Framework     | NestJS 11                           |
| HTTP adapter  | Fastify                             |
| ORM           | Prisma 7                            |
| Base de datos | PostgreSQL 16                       |
| Validacion    | class-validator + class-transformer |
| Documentacion | Swagger (GET /docs)                 |
| Logging       | Pino (nestjs-pino)                  |
| Testing       | Jest + Supertest                    |
| CI            | GitHub Actions                      |

## Scripts

| Script                 | Descripcion                    |
| ---------------------- | ------------------------------ |
| `pnpm dev`             | Desarrollo con watch mode      |
| `pnpm build`           | Build de produccion            |
| `pnpm start:prod`      | Ejecutar build                 |
| `pnpm lint`            | ESLint + Prettier con auto-fix |
| `pnpm test`            | Tests unitarios                |
| `pnpm test:cov`        | Tests con coverage             |
| `pnpm test:e2e`        | Tests end-to-end               |
| `pnpm prisma:generate` | Generar Prisma client          |
| `pnpm prisma:migrate`  | Ejecutar migraciones           |
| `pnpm prisma:studio`   | Prisma Studio (GUI de DB)      |

## Endpoints

| Metodo | Path                   | Descripcion                   |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/api/v1/health`       | Health check con estado de DB |
| GET    | `/api/v1/examples`     | Listar recursos (paginado)    |
| GET    | `/api/v1/examples/:id` | Obtener recurso por ID        |
| POST   | `/api/v1/examples`     | Crear recurso                 |
| PUT    | `/api/v1/examples/:id` | Actualizar recurso            |
| DELETE | `/api/v1/examples/:id` | Eliminar recurso              |
| GET    | `/docs`                | Swagger UI                    |

## Documentacion

| Documento                               | Contenido                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [IDEA](docs/IDEA.md)                    | Documentacion completa: arquitectura, configuracion, contrato API, convenciones, deploy, testing, guia de modulos, roadmap |
| [Fuentes de datos](docs/fuentes-datos/) | Investigacion de APIs externas verificadas                                                                                 |

## Variables de entorno

Ver `.env.example` para la lista completa. Las variables requeridas se validan al arrancar con Joi (fail-fast).

## Docker

```bash
# Desarrollo (api + postgres con hot-reload)
docker-compose up

# Solo build de imagen
docker build -t template-nest-api .

# Produccion
docker build -t template-nest-api .
docker run -p 3000:3000 --env-file .env template-nest-api
```

## Licencia

Privado. Todos los derechos reservados.

---

## Verificación

Todo lo siguiente está comprobado y funcionando al 100%.

### Calidad de código

| Check                          | Comando                |
| ------------------------------ | ---------------------- |
| Lint + formato                 | `pnpm lint`            |
| Tipado estricto                | `pnpm type-check`      |
| Build (nest build + tsc-alias) | `pnpm build`           |
| Prisma client generation       | `pnpm prisma:generate` |

### Tests unitarios (10/10)

```bash
pnpm test
```

| Suite                       | Cubre                                                                   |
| --------------------------- | ----------------------------------------------------------------------- |
| `health.controller.spec.ts` | HTTP 200 (DB ok), HTTP 503 (DB caída), uptime y timestamp en respuesta  |
| `example.service.spec.ts`   | Lógica CRUD, NotFoundError en ID inexistente, delegación al repositorio |

### Tests e2e (1/1)

```bash
DATABASE_URL="postgresql://template_nest:template_nest@localhost:5432/template_nest?schema=public" \
  pnpm test:e2e
```

| Suite             | Cubre                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `app.e2e-spec.ts` | Ciclo completo NestJS: bootstrap real de AppModule + Fastify, `GET /api/v1/health` con DB conectada |

### Runtime

```bash
docker compose up -d postgres
DATABASE_URL="..." pnpm prisma migrate deploy
DATABASE_URL="..." PORT=3300 ... node dist/main.js
```

| Endpoint                        | Resultado verificado                                     |
| ------------------------------- | -------------------------------------------------------- |
| `GET /api/v1/health` (DB ok)    | HTTP 200 `{"status":"ok","db":"connected","uptime":...}` |
| `GET /api/v1/health` (DB caída) | HTTP 503 `{"status":"degraded",...}`                     |
| `GET /api/v1/examples`          | HTTP 200 con paginación                                  |
| `POST /api/v1/examples`         | HTTP 201 con entidad creada                              |
| `GET /api/v1/examples/:id`      | HTTP 200 con entidad                                     |
| `PUT /api/v1/examples/:id`      | HTTP 200 con campos actualizados                         |
| `DELETE /api/v1/examples/:id`   | HTTP 204                                                 |
| `GET /docs`                     | HTTP 200 Swagger UI                                      |

### Docker

```bash
docker build -t template-nest .
# prisma generate corre en el stage deps, sin necesidad de DB
```

### CI (GitHub Actions)

`pnpm install` → `pnpm prisma:generate` → `pnpm lint` → `pnpm build` → `pnpm test` → `pnpm prisma migrate deploy` → `pnpm test:e2e`  
Postgres 16 disponible como service en el job.

### Pipeline de commits (local)

`git commit` → husky → lint-staged → `eslint --fix` + `prettier --write` (solo archivos staged)

### Seguridad verificada

| Aspecto                             | Estado                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Rate limiting (`@nestjs/throttler`) | Activo — in-memory store (ver gap abajo)                                              |
| CORS (`@fastify/cors`)              | Activo — orígenes desde env                                                           |
| Helmet (`@fastify/helmet`)          | Activo — CSP, HSTS, X-Frame-Options en cada respuesta                                 |
| Body size (Fastify default)         | 1 MB por defecto — ajustar `bodyLimit` en `FastifyAdapter` si el proyecto lo requiere |

### Gaps conocidos

- **Throttler en multi-instancia** _(medio)_: el store es in-memory por defecto — cada pod tiene su propio contador. Para producción con múltiples réplicas, reemplazar con `ThrottlerStorageRedisService` (`@nestjs-throttler-storage-redis`)
- **Tests e2e CRUD**: el e2e actual solo cubre health — añadir endpoints de examples por proyecto
- **Auth/guards**: no incluido en el template — se agrega por proyecto
