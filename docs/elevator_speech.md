# template-nest — Elevator Pitch

---

## Concepts Extracted

```
Structure     ✅ Module-per-domain + barrel exports + path aliases + 4-layer (Controller → Service → Repository → Prisma)
Resilience    ✅ Typed domain exceptions (DomainError hierarchy) + GlobalExceptionFilter + graceful DB degradation
Quality       ✅ 10 unit tests + 1 E2E (real DB) + strict DTO validation (whitelist + forbidNonWhitelisted) + CI pipeline
Security      ✅ Helmet + CORS (env-config) + Rate limiting as APP_GUARD + Joi fail-fast env validation
Observability ✅ Pino structured logging + crypto.randomUUID() per request + env-aware output (pretty/JSON)
Delivery      ✅ GitHub Actions (lint → build → test → migrate → E2E) + Docker + Husky/lint-staged pre-commit
```

**One Real Difficulty:**
APIs fail silently or leak stack traces. Structured domain exceptions + `GlobalExceptionFilter` solve this:
every failure path — domain, HTTP, or unknown — returns a typed, consistent error envelope (`code`, `message`, `meta`) that clients can handle programmatically.

---

## ENGLISH

**Context:** Starting a new NestJS backend project takes days before you can write your first real feature. You waste time configuring logging, wiring error handling, setting up validation, and deciding folder structure — before writing a single line of business logic. `template-nest` is an opinionated production-ready starter that eliminates that ramp-up.

**The Decision:** NestJS on Fastify instead of Express — Fastify handles 2–3× more requests per second under load, and the trade-off (fewer ecosystem examples, slightly steeper initial config) is worth it when this template will underpin multiple services. The second bet: Prisma 7 with the `PrismaPg` adapter over a traditional setup. The trade-off is less direct SQL control, but the gain is no native C bindings — Docker images build faster, cold starts are cleaner, and there is one fewer reason for a CI environment to fail.

**One Real Challenge:** APIs that fail inconsistently erode client trust. Every route in this template throws typed domain exceptions — `NotFoundError`, `ValidationError`, `ExternalAPIError` — all extending a common `DomainError` with a semantic `code` and an explicit HTTP status. A single `GlobalExceptionFilter` catches all three exception families and always returns the same error envelope: `{ statusCode, error, message, meta }`. No route leaks a stack trace. No client parses a different error shape depending on what broke.

**Why It's Production-Ready:**

- Validation is structural, not scattered: `whitelist + forbidNonWhitelisted` strips unknown fields on every DTO, Joi validates all env vars at startup and hard-fails if `DATABASE_URL` is absent — you can't accidentally run an unconfigured server.
- Observability is on by default: every HTTP request gets a `crypto.randomUUID()` correlation ID, Pino emits structured JSON in production and human-readable output in dev — no configuration required to have useful logs on day one.
- The CI pipeline is an acceptance gate, not a formality: lint → build → unit tests → `prisma migrate deploy` → E2E against a real PostgreSQL 16 instance. The E2E test bootstraps the actual NestJS + Fastify stack — if the app can't start, the pipeline fails.

**The Insight:** Every API eventually needs error envelopes, request correlation, and a CI gate that exercises a real database — the only question is whether you build them under pressure after launch or inherit them correctly from the start.

---

## ESPAÑOL

**Contexto:** Arrancar un proyecto backend nuevo en NestJS consume días antes de poder escribir la primera línea de lógica de negocio real. Hay que configurar logging, cablear el manejo de errores, instalar validación y decidir la estructura de carpetas — todo antes del primer feature. `template-nest` es una base de producción con opiniones claras que elimina ese tiempo muerto.

**La Decisión:** NestJS sobre Fastify en lugar de Express — Fastify maneja 2–3× más requests por segundo bajo carga, y el trade-off (menos ejemplos en el ecosistema, configuración inicial algo más exigente) vale la pena cuando este template va a ser la base de múltiples servicios. La segunda apuesta: Prisma 7 con el adaptador `PrismaPg` en lugar de un setup tradicional. El trade-off es menos control SQL directo, pero la ganancia es la eliminación de bindings nativos en C — las imágenes Docker se construyen más rápido, los cold starts son más limpios, y hay una razón menos para que falle un entorno de CI.

**Un Desafío Real:** Las APIs que fallan de forma inconsistente erosionan la confianza del cliente. Cada ruta en este template lanza excepciones de dominio tipadas — `NotFoundError`, `ValidationError`, `ExternalAPIError` — todas extendiendo un `DomainError` común con un `code` semántico y un HTTP status explícito. Un único `GlobalExceptionFilter` captura las tres familias de excepciones y siempre retorna el mismo envelope de error: `{ statusCode, error, message, meta }`. Ninguna ruta filtra un stack trace. Ningún cliente parsea una forma de error diferente dependiendo de qué rompió.

**Por Qué Está Listo para Producción:**

- La validación es estructural, no dispersa: `whitelist + forbidNonWhitelisted` elimina campos desconocidos en cada DTO, Joi valida todas las env vars al arranque y falla duro si `DATABASE_URL` no existe — no es posible correr un servidor mal configurado por accidente.
- La observabilidad está activa por defecto: cada request HTTP recibe un ID de correlación vía `crypto.randomUUID()`, Pino emite JSON estructurado en producción y output legible en desarrollo — no se necesita configuración adicional para tener logs útiles desde el día uno.
- El pipeline de CI es un gate de aceptación, no una formalidad: lint → build → tests unitarios → `prisma migrate deploy` → E2E contra una instancia real de PostgreSQL 16. El test E2E levanta el stack real de NestJS + Fastify — si la app no arranca, el pipeline falla.

**El Insight:** Toda API eventualmente necesita error envelopes, correlación de requests y un gate de CI que ejercite una base de datos real — la única pregunta es si los construís bajo presión después del lanzamiento o los heredás correctamente desde el inicio.
