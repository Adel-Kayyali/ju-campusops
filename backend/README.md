# CampusOps API (backend)

NestJS 11 + TypeScript + Prisma 6 + PostgreSQL. Layered, modular architecture.

## Architecture at a glance

| Concern | Where |
|---|---|
| HTTP endpoints | `@Controller()` classes in `controllers/` |
| Business logic / use cases | `@Injectable()` services in `services/` |
| Data access | repositories in `repositories/` extending `BaseRepository` (Prisma underneath) |
| Database tables | `prisma/schema.prisma` (one model = one table) + migrations |
| Reusable query conditions | `repositories/*.specifications.ts` (e.g. locker status filters) |
| Transactions | `@Transactional()` from `src/database/transactional.decorator.ts` (nested calls join the outer transaction) |
| Input validation | `class-validator` decorators on DTO classes + global `ValidationPipe` |
| Error handling | domain exceptions + `src/common/filters/global-exception.filter.ts` |
| Authentication & roles | JWT (`modules/auth`), global auth guard, `RolesGuard`, `@Roles(...)`, `@Public()` |
| Configuration | `src/config` (`AppConfigService`, fail-fast environment validation) |
| Cross-module reactions | domain events: `EventEmitter2.emitAsync` / `@OnEvent` (see `work-orders/listeners`) |
| API documentation | `@nestjs/swagger` at `/api/docs` |
| Tests | Jest unit tests (`*.spec.ts`) + Supertest end-to-end tests (`test/`) |

## Folder structure

```
src/
├── main.ts / bootstrap.ts     start-up (shared by the local server and the Vercel function)
├── app.module.ts              root module: infrastructure first, then one module per feature
├── config/                    typed, validated environment configuration
├── database/                  PrismaService, TransactionManager, @Transactional, BaseRepository, SequenceService
├── common/                    cross-cutting: guards, decorators, exceptions, filters, pagination, date helpers
└── modules/
    ├── auth/  users/  locations/  technicians/
    ├── lockers/               lockers, subscriptions, cash payments
    ├── service-requests/      request portal + lifecycle state machine
    ├── work-orders/           work orders, dependent tasks, materials, evidence
    ├── assets/  maintenance/  asset registry, preventive schedules
    ├── inventory/             stock, reservations, shortages, procurement
    ├── sla/  reports/         priority matrix, SLA targets, dashboards, performance reports
    ├── notifications/  audit/  storage/  jobs/  health/
```

Every feature module has the same shape:

```
modules/<feature>/
├── <feature>.module.ts   wiring (imports, providers, exports)
├── controllers/          HTTP only: routes, DTO validation, role checks → delegate to services
├── services/             use cases and transactions (business logic)
├── repositories/         data access (Prisma queries only)
├── domain/               PURE business rules – no I/O, unit tested (state machines, policies, value objects)
├── dto/                  request DTOs (validated) and response DTOs
├── mappers/              entity → response DTO
└── events/ listeners/    domain events (where needed)
```

Rules that keep the code clean:
- Controllers never touch the database; repositories never contain business rules.
- Business rules live in `domain/` as plain functions or classes (e.g. `SubscriptionPeriod`,
  `deriveLockerStatus`, `RequestStatusMachine`, `TaskRules`, `StockPolicy`, `calculatePriority`) and are unit tested.
- Services throw **domain exceptions** (`EntityNotFoundException`, `BusinessRuleViolationException`,
  `ResourceConflictException` …) with a stable `code`; the global filter turns them into consistent JSON errors.
- Modules depend on each other in one direction only (no cycles); cross-module reactions use events.
- Every write is audited (`AuditService`) and important changes notify users (`NotificationService`).

## Adding a new feature (checklist)

1. Add the model(s) to `prisma/schema.prisma`, then `npx prisma migrate dev --name <change>`.
2. Create `src/modules/<feature>/` with the folders above.
3. Put the rules in `domain/` and test them in a `*.spec.ts` next to them.
4. Repository extends `BaseRepository`; service methods that write use `@Transactional()`.
5. Controller: `@ApiTags`, `@Roles(...)`, DTOs with `class-validator`.
6. Register the module in `app.module.ts`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run start:dev` | API with hot reload on http://localhost:4000/api |
| `npm run build` / `npm start` | compile to `dist/` / run compiled code |
| `npm test` | unit tests |
| `npm run test:e2e` | API tests against the database in `DATABASE_URL` (seed it first) |
| `npm run db:migrate` | create + apply a migration (development) |
| `npm run db:deploy` | apply pending migrations (production) |
| `npm run db:seed` | wipe the database and load the demo data |
| `npm run lint` | type check |

## Environment variables

See `.env.example`. `DATABASE_URL`, `DIRECT_URL` and `JWT_SECRET` are required.
`STORAGE_DRIVER=local` stores uploads in `./uploads` (development); use `vercel-blob` in production.

## Business rules worth knowing

- A locker never has two ACTIVE subscriptions with overlapping dates. This is checked in
  `LockerSubscriptionService` **and** guaranteed by a PostgreSQL `EXCLUDE USING gist` constraint (see the migration).
- Locker status (available / reserved / occupied / expiring soon / expired-not-released / out of service)
  is **derived** from the dates, never stored, so it is always correct.
- Pricing: monthly fee × billable months (every started month counts). Presets of 1–4 months end the day
  before the same date N months later.
- Request priority = impact (severity) × urgency matrix; safety-related requests are at least P2.
  SLA targets per priority are editable by the administrator.
- A task can start only when the tasks it depends on are done/skipped; the repair cannot start
  while spare parts are missing (shortage); repair notes are required to finish the repair.
