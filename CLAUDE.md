# CLAUDE.md — AI Assistant Guide for Ppcsim

This document provides context, conventions, and workflows for AI assistants working on the Ppcsim codebase.

---

## Project Overview

**Ppcsim** is an educational Amazon PPC (Pay-Per-Click) advertising simulator. It is a web-based training platform where aspiring Virtual Assistants (VAs) and PPC managers can learn to manage Amazon Sponsored Products campaigns using virtual budgets, without spending real money.

**Core value:** Replaces the $2,000–$5,000 in real ad spend needed to gain meaningful hands-on experience.

**Tech stack:** TypeScript monorepo — React + Vite (frontend) / Express.js + Prisma + PostgreSQL (backend).

---

## Repository Structure

```
Ppcsim/
├── src/
│   ├── backend/              # Express.js REST API server
│   │   └── src/
│   │       ├── __tests__/    # Jest unit tests
│   │       ├── app.ts        # Express app factory (middleware + routes)
│   │       ├── server.ts     # Entry point (DB connect, graceful shutdown)
│   │       ├── config/       # Env-var-based config singleton
│   │       ├── controllers/  # HTTP handlers (thin — delegate to services)
│   │       ├── database/     # Prisma client, schema, seed data
│   │       ├── middleware/   # auth, errorHandler, rateLimiter, validation
│   │       ├── routes/       # Express routers
│   │       ├── services/     # Business logic (campaign, keyword, adGroup)
│   │       └── utils/        # errors.ts, logger.ts
│   └── frontend/             # React + Vite SPA
│       └── src/
│           ├── components/   # Reusable MUI-based React components
│           ├── pages/        # Route-level page components
│           ├── services/     # Axios API client functions
│           ├── store/        # Redux Toolkit store + slices
│           └── types/        # TypeScript interface definitions
├── docs/                     # Architecture, API, schema, and user docs
├── codev/                    # AI-assisted development protocols
├── .gemini/agents/           # Gemini agent configurations
├── docker-compose.yml        # PostgreSQL 15 + Redis 7 dev services
├── package.json              # Root monorepo config (npm workspaces)
├── tsconfig.json             # Root TypeScript config
├── scripts/setup.sh          # Automated dev environment setup
└── .env.example              # Environment variable template
```

---

## Development Environment Setup

### Prerequisites
- Node.js >= 18
- Docker and Docker Compose

### First-time Setup
```bash
# Automated setup (recommended)
bash scripts/setup.sh

# Manual setup
cp .env.example .env
npm install
docker-compose up -d
npm run migrate:dev
npm run seed
```

### Running the App
```bash
npm run dev           # Backend (port 3001) + Frontend (port 3000) concurrently
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only (Vite HMR)
```

### Key URLs (development)
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- The Vite dev server proxies `/api` to `localhost:3001` — no CORS issues in dev.

---

## Common Commands

```bash
# Testing
npm run test              # All workspaces
npm run test:backend      # Jest with coverage

# Code quality
npm run lint              # ESLint all workspaces
npm run lint:fix          # Auto-fix lint issues
npm run format            # Prettier formatting

# Database
npm run migrate:dev       # Prisma dev migration (creates migration files)
npm run migrate           # Prisma deploy migration (production)
npm run seed              # Seed database with demo data

# Build
npm run build             # Build all workspaces (tsc + vite build)
```

---

## Architecture and Key Patterns

### Backend: Layered Architecture
```
HTTP Request → Route → Middleware → Controller → Service → Prisma → PostgreSQL
```

- **Routes** (`routes/`): Define URL patterns and middleware chains only.
- **Controllers** (`controllers/`): Thin HTTP handlers. Extract request data, call one service method, return response. Use try/catch/next(error).
- **Services** (`services/`): All business logic lives here. Import Prisma client directly.
- **Middleware** (`middleware/`): Cross-cutting concerns (auth, validation, rate limiting, error handling).

### Error Handling
Use the custom error hierarchy in `src/utils/errors.ts`:

```typescript
throw new NotFoundError('Campaign not found');        // 404
throw new ValidationError('Invalid bid amount');      // 400
throw new UnauthorizedError('Authentication required'); // 401
throw new ForbiddenError('Access denied');            // 403
throw new ConflictError('Campaign name already exists'); // 409
```

The global error handler in `middleware/errorHandler.ts` catches all thrown errors and formats consistent JSON:
```json
{ "status": "error", "message": "..." }
```

### API Response Format
All successful responses use this envelope:
```json
{ "status": "success", "data": { "campaign": { ... } } }
```
For lists: `{ "status": "success", "data": { "campaigns": [...] } }`

### Soft Deletes
`DELETE` endpoints do **not** physically delete records. They set `status: 'ARCHIVED'`. Always filter by status when listing active records.

### Frontend: Redux + MUI
- **Redux Toolkit** (`store/slices/`) manages all async state with `createAsyncThunk`.
- Slice pattern: `pending → loading=true`, `fulfilled → update state`, `rejected → error string`.
- **MUI** is the only UI component library — no custom CSS files.
- All API calls go through service files in `src/frontend/src/services/`.
- `useAuth()` hook (currently hardcoded `{id: 1}`) is the single source of the current user ID.

---

## Naming Conventions

### Files
| Type | Convention | Example |
|------|-----------|---------|
| Backend service | `camelCase.service.ts` | `campaign.service.ts` |
| Backend controller | `camelCase.controller.ts` | `campaign.controller.ts` |
| Backend routes | `camelCase.routes.ts` | `campaign.routes.ts` |
| Frontend component | `PascalCase.tsx` | `CampaignFormDialog.tsx` |
| Redux slice | `camelCaseSlice.ts` | `campaignSlice.ts` |
| Frontend service | `camelCaseApi.ts` | `campaignApi.ts` |
| Type definitions | `camelCase.ts` | `campaign.ts` |

### TypeScript
- **Classes**: PascalCase — `CampaignService`, `CampaignController`
- **Singletons**: Export instance alongside class — `export const campaignService = new CampaignService()`
- **DTOs**: `CreateEntityDto`, `UpdateEntityDto` — e.g., `CreateCampaignDto`
- **Enums**: SCREAMING_SNAKE_CASE — `SPONSORED_PRODUCTS`, `DYNAMIC_UP_DOWN`, `BROAD`
- **Strict mode**: Enabled in all tsconfig files. No `any` unless explicitly necessary and commented.

### Database (Prisma)
- **TypeScript fields**: camelCase → mapped to `snake_case` columns via `@map`
- **Tables**: snake_case via `@@map` — `campaigns`, `ad_groups`, `keywords`
- **IDs**: Auto-increment integers
- **Timestamps**: All models have `createdAt` and `updatedAt` (`@updatedAt` for automatic updates)

---

## Database Schema Summary

Seven Prisma models (in `src/backend/src/database/schema.prisma`):

| Model | Purpose |
|-------|---------|
| `User` | Account — email, password hash, name |
| `Campaign` | Top-level ad campaign with budget, status, metrics cache |
| `AdGroup` | Groups keywords within a campaign |
| `Keyword` | Individual keywords with match type, bid, metrics cache |
| `Product` | Products being advertised |
| `PerformanceMetric` | Daily performance snapshots per campaign |
| `TutorialProgress` | Tracks tutorial completion per user |

Performance metrics (impressions, clicks, conversions, spend, CTR, CVR, ACOS, ROAS) are **denormalized** onto Campaign and Keyword models for fast reads. The `PerformanceMetric` table stores daily history.

---

## Testing

### Backend Tests (Jest + ts-jest)
- Tests live in `src/backend/src/__tests__/*.test.ts`
- Mock Prisma with `jest.mock('../database/client')`
- Test services in isolation — no HTTP layer, no real DB
- Run: `npm run test:backend`

### Frontend Tests (Vitest + Testing Library)
- Framework is installed but no tests are written yet
- Run: `cd src/frontend && npm test`

### Test Conventions
- One test file per service
- Describe blocks group by method name: `describe('CampaignService', () => { describe('createCampaign', () => { ... }) })`
- Always reset mocks between tests with `jest.clearAllMocks()` or `beforeEach`

---

## Environment Variables

All vars defined in `.env.example`. Key ones:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | Backend server port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/ppcsim` | Prisma connection |
| `REDIS_HOST` | `localhost` | Redis host |
| `JWT_SECRET` | (required) | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `LOG_LEVEL` | `debug` | Winston log level |
| `NODE_ENV` | `development` | Environment |

---

## What Is and Is Not Yet Implemented

### Working
- Full CRUD API for Campaigns, Ad Groups, and Keywords
- Bulk keyword creation endpoint
- Negative keyword management
- Three-tier rate limiting (API, write, bulk)
- Input validation via `express-validator`
- Structured logging with Winston (file + console)
- React UI for all three entities with filtering, sorting, dialogs
- Redux state management for all entities
- Docker dev environment (PostgreSQL + Redis)
- Database seed with demo data

### Not Yet Implemented (TODOs)
- **Authentication**: `auth.ts` middleware hardcodes `userId=1`. JWT/Passport are installed but not wired. No login/register pages.
- **PPC Simulation Engine**: The core simulation logic (simulating impressions, clicks, spend over time) does not exist yet.
- **Redis**: Installed but not used.
- **Swagger docs**: Installed (`swagger-jsdoc`, `swagger-ui-express`) but not mounted in `app.ts`.
- **Performance charts**: UI shows "coming soon" placeholder. Chart libraries (`chart.js`, `recharts`) are installed.
- **Frontend tests**: Vitest + Testing Library installed, no test files written.
- **GitHub Actions CI/CD**: Referenced in README but `.github/workflows/` does not exist.
- **Tutorial system**: Schema exists (`TutorialProgress`), no UI or logic.
- **Achievement system**: Referenced in docs, not started.

---

## Key Files Quick Reference

| Task | File |
|------|------|
| Add a new API endpoint | `routes/`, `controllers/`, `services/` |
| Change DB schema | `src/backend/src/database/schema.prisma`, then `npm run migrate:dev` |
| Add input validation | `src/backend/src/middleware/validation.ts` |
| Change error responses | `src/backend/src/utils/errors.ts`, `src/backend/src/middleware/errorHandler.ts` |
| Add a new Redux slice | `src/frontend/src/store/slices/`, register in `src/frontend/src/store/index.ts` |
| Add a new page/route | `src/frontend/src/pages/`, register in `src/frontend/src/App.tsx` |
| Update shared TS types | `src/frontend/src/types/` (frontend) or controller/service types (backend) |
| Change rate limits | `src/backend/src/middleware/rateLimiter.ts` |
| Configure the app | `src/backend/src/config/index.ts` + `.env` |
| Update seed data | `src/backend/src/database/seeds/seed.ts` |

---

## Development Workflow

1. **Branch**: All work on feature branches off `master`. Follow Conventional Commits format for commit messages (`feat:`, `fix:`, `chore:`, `docs:`, etc.).
2. **Lint before committing**: Husky + lint-staged enforce this automatically on `git commit`.
3. **Migrations**: Always run `npm run migrate:dev` after changing `schema.prisma`. Commit the generated migration files.
4. **No hardcoded user IDs in new code**: The `userId=1` hardcode in `auth.ts` is a temporary placeholder. New features should be ready to receive `req.user.id` from the auth middleware once authentication is implemented.
5. **Prefer editing existing patterns**: Follow the existing service/controller/route pattern for new entities rather than introducing new architectural patterns.

---

## Documentation References

| Document | Location |
|----------|----------|
| Architecture | `docs/technical/ARCHITECTURE.md` |
| API reference | `docs/api/API_DOCUMENTATION.md` |
| Database schemas | `docs/schemas/DATABASE_SCHEMAS.md` |
| Developer guide | `docs/DEVELOPER_GUIDE.md` |
| Product requirements | `docs/PRD.md` |
| Technical roadmap | `docs/technical/TECHNICAL_DEVELOPMENT_PLAN.md` |
| User guide | `docs/user-guide/USER_GUIDE.md` |
| Logging strategy | `logs/LOGGING_STRATEGY.md` |
