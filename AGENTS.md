# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

A NestJS 11 starter template. `src/core/` holds pre-wired cross-cutting
infrastructure (config, cache, http, throttling, health checks); `src/modules/`
holds domain/feature modules. `CatModule` (`src/modules/cat/`) is the
reference example — it exercises every core piece (cache, http client,
throttling, Swagger docs) and is the pattern to copy when adding a new
feature module.

## Runtime & tooling

- Node `v22.14.0` (see `.nvmrc`), package manager is **pnpm** (`pnpm-lock.yaml`
  is the lockfile — don't use npm/yarn).
- TypeScript 5.7, ESLint 10 flat config (`eslint.config.mjs`), Prettier.
- Husky `pre-commit` hook runs `lint-staged` then `pnpm build` — a failing
  build blocks the commit.

## Commands

```bash
pnpm install          # install deps
pnpm start:dev         # watch mode
pnpm lint              # eslint --fix over src/apps/libs/test
pnpm format             # prettier --write
pnpm build              # nest build (also what pre-commit runs)
pnpm test               # jest unit tests
pnpm test:e2e            # jest e2e (test/jest-e2e.json)
```

There's no `dev` script that runs outside Nest's CLI; for a one-off manual
boot (e.g. to hit an endpoint with curl while iterating), use:

```bash
PORT=<free-port> npx ts-node -r tsconfig-paths/register src/main.ts
```

Port 3000 may already be occupied by an unrelated process on a dev machine —
always check (`lsof -nP -iTCP:3000 -sTCP:LISTEN`) before assuming it's free,
and prefer a scratch port for verification boots.

## Environment files

- `.env.example` is the checked-in template — every key `envConfig()` reads
  must have an entry here with a sane default.
- `.env.dev` / `.env.prod` are gitignored, developer-local. `getEnvFilePath()`
  in `src/core/config/config.config.ts` picks one based on `NODE_ENV`.
- All env vars are read once in `envConfig()` (`src/core/config/config.config.ts`)
  and exposed as camelCase keys via `ConfigService.get('camelCaseKey')`
  everywhere else — don't read `process.env` directly outside that file.
- After adding a new env var: add it to `envConfig()`, then to
  `.env.example`, `.env.dev`, and `.env.prod` (keep all three in sync).

## Architecture conventions

**`core/` vs `modules/`**: `core/` is for infrastructure other modules
inject from (Config, Http, Cache, Throttler) or that self-register app-wide
behavior (Schedule). `modules/` is for domain features (business logic,
controllers, DTOs). A module only belongs in `core/` if something else in
the app needs to import/inject it generically — otherwise it's a feature and
belongs in `modules/`.

**Global vs feature-scoped registration**: `ConfigModule`, `HttpModule`, and
`CacheModule` are registered with `isGlobal`/`global: true` in
`core.module.ts` because multiple unrelated feature modules inject
`ConfigService`/`HttpService`/`CACHE_MANAGER`. **`MulterModule` does NOT
support a global flag** (checked against its type definitions) — it must be
registered inside whichever feature module actually handles file uploads
(see `StorageModule`). Don't add it to `core.module.ts`; a `FileInterceptor`
outside the registering module silently falls back to Multer's in-memory
default (no `file.filename`) instead of erroring, which is an easy trap.

**`bootstrap()` in `main.ts`**: each step is a `setupX(app)` function pulled
from its own file (`src/common/{logger,middlewares,pipes,interceptors,filters,swagger,bootstrap}/`),
not inlined. When adding a new bootstrap-time concern, follow that pattern:
one function, one file, wired into `main.ts` in the appropriate order (logger
first, shutdown hooks/listen last).

**Module folder shape** (see `src/modules/cat/` or `src/modules/storage/`
as the template):
```
modules/<name>/
  <name>.module.ts
  <name>.controller.ts
  <name>.service.ts
  dto/
  entities/
  interfaces/
  constants/
```
Don't inline DTOs/interfaces/constants in the service or controller file —
each gets its own file in the matching subfolder, even for a single-field
interface or a one-line constant. Shared (not feature-specific) interfaces
go in `src/common/interfaces/`.

**Local file storage**: the local disk root is the `storage/` folder at the
repo root (config key `storageLocalDir`, default `storage`) — not `uploads`.
It's gitignored except `.gitkeep`. `StorageService`
(`src/modules/storage/`) is a thin driver abstraction (`StorageDriver`
interface + `LocalStorageDriver`) so an S3 driver can be added later without
reshaping the service or controller; it currently throws if `STORAGE_DRIVER`
is set to anything other than `local`, since only that driver is
implemented — the S3 env vars in `.env.example` are placeholders for that
future work.

## Testing new modules

`CatModule` and `StorageModule` are the reference examples for test
coverage — read their `*.spec.ts` files before writing new ones rather than
inventing a pattern. When adding a new module, add a `*.spec.ts` next to
each service/controller it introduces (jest's `rootDir` is `src`,
`testRegex` is `.*\.spec\.ts$`, so specs live beside the code they test, not
in a separate tree):

```text
modules/<name>/
  <name>.service.ts
  <name>.service.spec.ts
  <name>.controller.ts
  <name>.controller.spec.ts
```

Conventions established so far (`src/modules/cat/`, `src/modules/storage/`):

- Use `Test.createTestingModule({ providers: [...] }).compile()` and mock
  every injected dependency with `{ provide: Token, useValue: {...} }` —
  don't pull in real infra (`ConfigModule`, a real `CACHE_MANAGER`, etc).
- **If a controller method carries `@UseInterceptors(CacheInterceptor)`**
  (or any interceptor/guard that itself has constructor deps), the testing
  module needs a mock provider for *that* dependency too, even though the
  test never calls the interceptor directly — `Test.createTestingModule`
  instantiates class-level interceptors during `.compile()`. See
  `cat.controller.spec.ts`, which mocks `CACHE_MANAGER` for exactly this
  reason (`findAll()` is cached).
- Don't cast a plain `{ upload: jest.fn(), ... }` mock object to the real
  class type (e.g. `as unknown as LocalStorageDriver`) — referencing a
  cast object's methods in `expect(driver.upload).toHaveBeenCalledWith(...)`
  trips the `@typescript-eslint/unbound-method` lint rule. Leave the mock
  object untyped (or use `Partial<Record<keyof X, jest.Mock>>`) and only
  cast at the `useValue` boundary if TS needs it.
- Cover at minimum: each public service method (including error paths —
  e.g. `NotFoundException` on a missing id) and the controller wiring (mock
  the service, assert it's called with the right args).

Run `pnpm test` before considering a module done.

The one existing e2e test (`test/app.e2e-spec.ts`) is stale and currently
fails — it expects `GET /` to return `"Hello World!"`, but there's no root
controller anymore and the `v1` global prefix means that path wouldn't
resolve even if there were. Don't treat it as a working reference; either
fix it (e.g. point it at `/v1/health`) or replace it when e2e coverage
actually matters for the task at hand.

## Verifying changes

There's no running dev server to assume is live — after any change that
could affect bootstrap or routing, actually boot the app
(`PORT=<scratch> npx ts-node -r tsconfig-paths/register src/main.ts`,
backgrounded, `sleep` a few seconds, then `curl`) and check the log output
for `RoutesResolver`/errors before calling something done. `tsc --noEmit`
and `pnpm lint` catch type/style issues but not wiring mistakes (e.g. a
module that compiles fine but whose provider isn't actually reachable from
where it's injected — see the Multer trap above).
