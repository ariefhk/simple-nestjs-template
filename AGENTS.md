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
- **`src/common/logger/winston.config.ts`'s `setupLogger` reads `APP_NAME`
  and `LOG_PATH` via `ConfigService.getOrThrow(...)`** (the raw env var
  names, not `envConfig()`'s camelCase keys) — it throws if `.env.dev`
  doesn't exist to provide them. That means `main.ts`'s real `bootstrap()`
  cannot start in a fresh clone or CI unless `.env.dev` (or `.env.prod`) is
  present, since it's gitignored. This is a known gap, not something to
  silently work around — the e2e test helper (`test/utils/create-test-app.ts`)
  sidesteps it by not calling `setupLogger` at all, which is fine for tests
  but doesn't fix running the app for real without a local env file.

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

```text
modules/<name>/
  <name>.module.ts
  <name>.controller.ts
  <name>.service.ts
  dto/
  entities/
  interfaces/
  constants/
  spec/
```

Don't inline DTOs/interfaces/constants in the service or controller file —
each gets its own file in the matching subfolder, even for a single-field
interface or a one-line constant. Shared (not feature-specific) interfaces
go in `src/common/interfaces/`. Tests live under `spec/`, not beside the
source file — see the next section.

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
coverage — read their `spec/` folders before writing new ones rather than
inventing a pattern. Tests live in a `spec/` subfolder inside the module,
**mirroring the module's own subfolder layout** (so a spec for
`drivers/local-storage.driver.ts` goes in `spec/drivers/local-storage.driver.spec.ts`,
not flat in `spec/`) — this keeps the module's top level to source files
only. jest's `rootDir` is `src` and `testRegex` is `.*\.spec\.ts$`, which
matches any path depth, so this works without config changes:

```text
modules/<name>/
  <name>.service.ts
  <name>.controller.ts
  drivers/
    some.driver.ts
  spec/
    <name>.service.spec.ts
    <name>.controller.spec.ts
    drivers/
      some.driver.spec.ts
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
  `spec/cat.controller.spec.ts`, which mocks `CACHE_MANAGER` for exactly this
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

### e2e tests (`test/`)

`test/health.e2e-spec.ts`, `test/cat.e2e-spec.ts`, and
`test/storage.e2e-spec.ts` are the reference examples — one per
domain/infra surface, each boots the real `AppModule` through
`test/utils/create-test-app.ts` and drives it with `supertest`. Add a new
`test/<name>.e2e-spec.ts` when a module's HTTP surface needs
end-to-end coverage (routing + validation + interceptors + filters all
wired together), not as a default alongside every unit spec — unit tests in
`spec/` are cheaper and should cover the logic itself.

- `create-test-app.ts` intentionally does **not** call `setupLogger` (avoids
  writing log files during test runs, and sidesteps `winston.config.ts`'s
  `getOrThrow('APP_NAME')`/`getOrThrow('LOG_PATH')`, which would throw in a
  fresh clone/CI without a local `.env.dev`) or `setupShutdownHooks`/
  `startServer` (e2e tests hit the app in-process via `app.getHttpServer()`,
  they never bind a real port). Every other bootstrap step — global prefix,
  helmet, cors, static assets, validation pipe, interceptors, filters,
  swagger — is applied, so the tests exercise the same wiring as production.
- Type `app` as `INestApplication<App>` (`App` from `supertest/types`) and
  cast `response.body` to the real shape (e.g. the shared
  `Response<T>` interceptor interface for success responses) — don't leave
  it as `any`, `@typescript-eslint/no-unsafe-*` will flag every property
  access on it.
- **Import `supertest` as `import request = require('supertest')`**, not
  `import * as request from 'supertest'`. Its `.d.ts` uses `export =`, so a
  namespace import types as a non-callable module-namespace object (a real
  `tsc`/IDE error — `This expression is not callable`) even though it
  happens to work at runtime under `commonjs` output. Same pattern already
  used for `winston-daily-rotate-file` in `winston.config.ts`; needs the
  matching `// eslint-disable-next-line @typescript-eslint/no-require-imports`.
- **The `/v1/health` endpoint's `memory_heap` and `memory_rss` indicators
  are not safe to assert on in e2e tests** — a jest/ts-jest process's own
  memory footprint can trip `health.controller.ts`'s fixed thresholds even
  when the app is otherwise fine, and confirmed flaky in practice during
  development (RSS tripped on one run, heap on another). Assert only on the
  `redis` indicator (a real cache round-trip, unaffected by process memory)
  and tolerate either `200` or `503` as the overall status code.
- `/v1/cats/fact` (a real call to `catfact.ninja`) is deliberately **not**
  covered by the Cat e2e test, to keep e2e coverage deterministic and
  offline — `CatFactService`'s unit spec already covers its success/failure
  branches against a mocked `HttpService`.
- Any file an e2e test uploads to `storage/` must be deleted by the test
  itself (see `storage.e2e-spec.ts`) — nothing else cleans that folder up.

## Verifying changes

There's no running dev server to assume is live — after any change that
could affect bootstrap or routing, actually boot the app
(`PORT=<scratch> npx ts-node -r tsconfig-paths/register src/main.ts`,
backgrounded, `sleep` a few seconds, then `curl`) and check the log output
for `RoutesResolver`/errors before calling something done. `tsc --noEmit`
and `pnpm lint` catch type/style issues but not wiring mistakes (e.g. a
module that compiles fine but whose provider isn't actually reachable from
where it's injected — see the Multer trap above).
