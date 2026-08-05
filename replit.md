# Scanner Pro

Scanner Pro is a local-first Android QR and barcode scanner and QR generator built with React, Vite, Capacitor, and AdMob.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- Scan QR codes and common retail/industrial barcode formats with the device camera
- Generate and save QR codes for URLs, text, Wi-Fi, contacts, phone, email, SMS, locations, and social profiles
- Store scan history and favorites locally on the device
- Build signed Android release artifacts through Codemagic

## User preferences

- Diagnose release failures from evidence and complete builds; do not claim physical-device behavior was verified without device logs or hardware testing.
- After release fixes, verify that the pushed GitHub branch matches the local commit.

## Gotchas

- Android release builds require JDK 21, Android API 36, a PKCS12 keystore, and the `keystore_credentials` Codemagic group.
- Run the scanner artifact typecheck before Vite and Gradle builds; Vite transpilation alone does not catch missing React imports.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
