# Mantle Estate - AI Agent Rules

## Project Overview

Mantle Estate is a platform for trading synthetic real estate. Users can open long/short positions on real estate markets of various cities.

**Tech Stack:**
- Backend: Encore.dev (TypeScript)
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Smart Contracts: Solidity ^0.8.20
- Database: PostgreSQL
- Package Manager: Bun
- Authentication: Clerk

## Main Rules

### Backend (Encore.dev)

1. All backend files in `backend/`
2. Use `api()` to create endpoints with types
3. Use `db.exec\`...\`` for SQL queries (parameterized)
4. Services in separate directories with `encore.service.ts`
5. Cron jobs via `CronJob` from `encore.dev/cron`
6. Authentication via Clerk (`@clerk/backend`)
7. After changing API: `encore gen client --target leap`

### Frontend (React)

1. All frontend files in `frontend/`
2. Use `useBackend()` hook for API calls
3. Types from `~backend/...` (auto-generated)
4. Components in `frontend/components/`, UI components in `frontend/components/ui/`
5. Use shadcn/ui components from `ui/`
6. Tailwind CSS for styling, dark mode support
7. React Router for navigation
8. Clerk via `@clerk/clerk-react` for authentication

### Database

1. Migrations in `backend/db/migrations/` (format: `NNN_description.up/down.sql`)
2. Always create both migration versions (up and down)
3. Parameterized queries via template literals
4. Result typing: `db.queryAll<Type>`
5. Indexes for frequently used fields
6. Use transactions for critical operations

### Smart Contracts

1. Contracts in `contracts/`
2. Solidity ^0.8.20, OpenZeppelin contracts
3. Use `SafeERC20`, `ReentrancyGuard`, `Ownable`, `Pausable`
4. NatSpec comments for public functions
5. Custom errors instead of require strings for gas efficiency

### General

1. **Package Manager**: Bun (not npm/yarn)
2. **Comment Language**: English
3. **Code Style**: TypeScript strict mode, always use types
4. **Security**: input validation, parameterized queries, environment variables
5. **Error Handling**: try-catch, clear messages, logging

## Commonly Used Commands

```bash
# Backend
cd backend
encore run                                    # Start dev server
encore gen client --target leap              # Generate client for frontend

# Frontend
cd frontend
bun install                                   # Install dependencies
npx vite dev                                  # Start dev server

# Install dependencies (root)
bun install                                   # Install all dependencies
```

## Key Directory Structure

- `backend/[service]/` - Encore services (auth, city, trading, prices, user)
- `backend/db/migrations/` - database migrations
- `backend/scripts/` - utility scripts
- `frontend/components/` - React components
- `frontend/components/ui/` - shadcn/ui components
- `frontend/lib/` - utilities and hooks
- `contracts/` - Solidity contracts
- `docs/` - project documentation

## Important Notes

- Always generate frontend client when changing backend API
- Use types from Encore generated client, don't create duplicate types
- Follow existing patterns in code
- Check error handling in all API calls
- Use existing UI components before creating new ones

