# Backlog — convivencia-api

Backlog generado a partir de `docs/_CONCEPTO.md` (2026-07-15). Base: scaffold `template-nest` (NestJS 11 + Fastify + Prisma 7 + PostgreSQL 16), adaptado al dominio de convivencia en viviendas compartidas.

## Fases

| Fase                                         | Nombre                                                  | Prioridad | Depende de |
| -------------------------------------------- | ------------------------------------------------------- | --------- | ---------- |
| [FASE_0](./FASE_0_BASE.md)                   | Rebrand + setup (Redis, schema base, deps nuevas)       | Alta      | —          |
| [FASE_1](./FASE_1_MVP_FREDDY.md)             | MVP Freddy — recordatorios sin login                    | Alta      | FASE_0     |
| [FASE_2](./FASE_2_DOMINIO_OBSERVABILIDAD.md) | Dominio completo + RLS + observabilidad + WhatsApp real | Media     | FASE_1     |
| [FASE_3](./FASE_3_MULTI_RESIDENTE.md)        | Multi-residente real — Google OAuth                     | Baja      | FASE_2     |

Nota: el frontend Next.js (F2/F3, ver `_CONCEPTO.md`) consume esta API pero vive en repo aparte — no tiene fase acá.

## Diagramas de Referencia

| Archivo                                | Tipo       | Contenido             |
| -------------------------------------- | ---------- | --------------------- |
| `../diagrams/DIAGRAMAS_COMPONENTES.md` | Flowcharts | Topologia del sistema |

Este diagrama es referencia estructural estable. Las fases lo referencian pero no lo repiten. Actualizar solo ante cambios de topologia (agregar/quitar servicios o cambiar frontera cliente/servidor).

## Decisiones Tecnicas

Carpeta `../decisions/` — documentar aqui decisiones arquitectonicas cuando surjan durante el desarrollo.
Formato: `DECISION_[TEMA].md` — explica el POR QUE, no el QUE.

## Validación de Flujos

| Archivo       | Propósito                                                       |
| ------------- | --------------------------------------------------------------- |
| `../flows.md` | Flujos de usuario documentados manualmente. Guía para QA y E2E. |

Llenar después de probar cada feature. Usar como referencia con `/tools:testing:run-browser-testing`.
