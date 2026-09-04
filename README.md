# SaveTrack -- Savings Tracker

A full-stack savings tracker that lets users set savings goals, log deposits and withdrawals, and watch their progress in real time. Built with a React (Vite) single-page app, an Express REST API, and PostgreSQL.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Getting Started (Local Development)](#getting-started-local-development)
- [API Reference](#api-reference)
- [Client Architecture](#client-architecture)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts)
- [Disclaimer](#disclaimer)

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React 19, React Router 7, Vite 8, Axios |
| Backend      | Node.js 18+, Express 5, JWT (`jsonwebtoken`), `bcryptjs` |
| Database     | PostgreSQL 13+ (`pg` driver) |
| Deployment   | Vercel (client), Railway (server + PostgreSQL) |

## Features

- **Authentication** -- Registration and login with JWT tokens; bcrypt password hashing (work factor 12); session rehydration from `localStorage`
- **Protected Routes** -- Goals and transactions endpoints require a valid `Bearer` token; client-side `PrivateRoute` guard redirects unauthenticated users to login
- **Savings Goals** -- Create, edit, and delete goals with a title, target amount, category (Emergency, Travel, Tech, Education, Health, Home, Other), and optional deadline
- **Transactions** -- Log deposits and withdrawals per goal with optional notes and dates; withdrawal balance protection prevents overdrafts
- **Live Progress** -- Progress bars and summary statistics update instantly; `computed_amount` is derived server-side via SQL aggregation for accuracy
- **Currency Formatting** -- Amounts displayed in NGN (Nigerian Naira) with locale-aware formatting
- **Category Theming** -- Each goal category has a distinct accent color for visual differentiation

## Project Structure

```
savings-tracker/
├── client/                        # React SPA (Vite)
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.js   # Axios instance with JWT interceptor, snake→camelCase conversion
│   │   ├── assets/                # Images, fonts, etc.
│   │   ├── components/
│   │   │   ├── GoalCard.jsx       # Card displaying a single goal with progress
│   │   │   ├── Navbar.jsx         # Top navigation bar
│   │   │   ├── PrivateRoute.jsx   # Auth guard for protected routes
│   │   │   ├── ProgressBar.jsx    # Animated progress bar component
│   │   │   ├── SummaryStats.jsx   # Aggregate savings statistics
│   │   │   ├── TransactionForm.jsx  # Form to add deposits/withdrawals
│   │   │   └── TransactionList.jsx  # List of transactions for a goal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state, login/register/logout
│   │   │   └── GoalsContext.jsx   # Goals & transactions CRUD + local state sync
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx  # Main dashboard with all goals
│   │   │   ├── GoalDetailPage.jsx # Single goal view with transactions
│   │   │   ├── GoalFormPage.jsx   # Create/edit goal form
│   │   │   ├── LoginPage.jsx      # Login form
│   │   │   └── RegisterPage.jsx   # Registration form
│   │   ├── utils/
│   │   │   └── helpers.js         # formatCurrency, formatDate, daysLeft, categoryColor
│   │   ├── App.jsx                # Route definitions and context providers
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── index.html                 # HTML shell
│   ├── vite.config.js             # Vite config with /api proxy
│   └── vercel.json                # SPA rewrite rules for Vercel
├── server/                        # Express REST API
│   ├── config/
│   │   ├── db.js                  # PostgreSQL connection pool (supports DATABASE_URL or DB_* vars)
│   │   ├── env.js                 # Centralized .env loader (resolves relative to server/)
│   │   └── schema.sql             # Full database schema with indexes and triggers
│   ├── controllers/
│   │   ├── authController.js      # register, login, getMe
│   │   ├── goalsController.js     # CRUD for savings goals
│   │   └── transactionsController.js  # Create, list, delete transactions (with balance protection)
│   ├── middleware/
│   │   ├── auth.js                # JWT verification middleware
│   │   ├── errorHandler.js        # Centralized error handler (PG error codes, generic 500)
│   │   └── validate.js            # express-validator result handler (422 responses)
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── goals.js               # /api/goals/*
│   │   └── transactions.js        # /api/transactions/*
│   ├── index.js                   # Express app setup, CORS, body parsing, route mounting
│   ├── .env.example               # Environment variable template
│   └── railway.json               # Railway build/deploy config
├── package.json                   # Monorepo root scripts
├── .gitignore
└── README.md
```

## Architecture Overview

### Backend

The server follows a classic **MVC-like** pattern:

- **Routes** define endpoints and wire up validation rules using `express-validator`.
- **Middleware** handles JWT auth verification, request validation, and centralized error handling.
- **Controllers** contain the business logic, executing parameterized SQL queries against a PostgreSQL connection pool.

Key design decisions:

- **`DATABASE_URL` support**: The DB pool accepts either a full connection string (ideal for Railway, Neon, Render) or individual `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` variables.
- **Transactional writes**: Transaction creation and deletion use a dedicated `pool.connect()` client with `BEGIN`/`COMMIT`/`ROLLBACK` to ensure atomicity when updating both the `transactions` table and the `current_amount` on `savings_goals`.
- **Computed balance**: The `computed_amount` field is derived server-side via `SUM(CASE WHEN type = 'deposit' THEN amount ...) - SUM(CASE WHEN type = 'withdrawal' THEN amount ...)` rather than relying solely on the denormalized `current_amount` column, providing an accurate running total.
- **Withdrawal protection**: Before inserting a withdrawal, the controller computes the actual balance and rejects the request with a `400` if funds are insufficient.
- **Ownership enforcement**: Every goal and transaction query includes a `user_id` check, so users can only access their own data.
- **Centralized error handling**: The error handler middleware maps PostgreSQL error codes (`23505` unique violation, `23503` FK violation, `23514` check constraint) to user-friendly HTTP responses.

### Frontend

The client is a single-page application built with React 19 and React Router 7:

- **Axios instance** (`src/api/axiosInstance.js`): A shared Axios instance that automatically attaches the JWT from `localStorage` to every request, converts all snake_case response keys to camelCase, and handles 401 errors by clearing the session and redirecting to login (except on auth pages).
- **Context providers**: `AuthProvider` manages user session state (login, register, logout, rehydration from `localStorage`). `GoalsProvider` manages goals and transactions CRUD, keeping local state in sync after every mutation for instant UI updates.
- **Vite proxy**: In local development, Vite proxies `/api` requests to `http://localhost:5000`, so no API URL configuration is needed.
- **Route guards**: `PrivateRoute` wraps protected pages and redirects to `/login` if the user is not authenticated.

## Database Schema

The schema is defined in `server/config/schema.sql`. Three tables:

### `users`

| Column        | Type         | Constraints |
|---------------|--------------|-------------|
| `id`          | UUID         | PRIMARY KEY, default `gen_random_uuid()` |
| `name`        | VARCHAR(100) | NOT NULL |
| `email`       | VARCHAR(150) | NOT NULL, UNIQUE |
| `password_hash` | TEXT       | NOT NULL |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, default `NOW()` |

### `savings_goals`

| Column           | Type           | Constraints |
|------------------|----------------|-------------|
| `id`             | UUID           | PRIMARY KEY, default `gen_random_uuid()` |
| `user_id`        | UUID           | NOT NULL, FK -> `users(id)` ON DELETE CASCADE |
| `title`          | VARCHAR(100)   | NOT NULL |
| `target_amount`  | NUMERIC(15,2)  | NOT NULL, CHECK > 0 |
| `current_amount` | NUMERIC(15,2)  | NOT NULL, default 0, CHECK >= 0 |
| `category`       | VARCHAR(50)    | NOT NULL, default 'Other' |
| `deadline`       | DATE           | nullable |
| `created_at`     | TIMESTAMPTZ    | NOT NULL, default `NOW()` |
| `updated_at`     | TIMESTAMPTZ    | NOT NULL, default `NOW()` |

A trigger (`set_updated_at`) automatically sets `updated_at = NOW()` on every UPDATE.

### `transactions`

| Column      | Type           | Constraints |
|-------------|----------------|-------------|
| `id`        | UUID           | PRIMARY KEY, default `gen_random_uuid()` |
| `goal_id`   | UUID           | NOT NULL, FK -> `savings_goals(id)` ON DELETE CASCADE |
| `user_id`   | UUID           | NOT NULL, FK -> `users(id)` ON DELETE CASCADE |
| `amount`    | NUMERIC(15,2)  | NOT NULL, CHECK > 0 |
| `type`      | VARCHAR(10)    | NOT NULL, CHECK IN ('deposit', 'withdrawal') |
| `note`      | VARCHAR(200)   | nullable |
| `date`      | DATE           | NOT NULL, default `CURRENT_DATE` |
| `created_at`| TIMESTAMPTZ    | NOT NULL, default `NOW()` |

### Indexes

- `idx_goals_user_id` on `savings_goals(user_id)`
- `idx_transactions_goal_id` on `transactions(goal_id)`
- `idx_transactions_user_id` on `transactions(user_id)`

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 13+

### 1. Set up the database

```sql
CREATE DATABASE savings_tracker;
```

```bash
psql -U postgres -d savings_tracker -f server/config/schema.sql
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local    # optional; leave blank for local dev
```

**`server/.env`**

| Variable          | Description | Default |
|-------------------|-------------|---------|
| `PORT`            | Server port | `5000` |
| `DB_HOST`         | Database host | `localhost` |
| `DB_PORT`         | Database port | `5432` |
| `DB_NAME`         | Database name | `savings_tracker` |
| `DB_USER`         | Database user | `postgres` |
| `DB_PASSWORD`     | Database password | *(required)* |
| `JWT_SECRET`      | Secret for signing JWT tokens | *(required)* |
| `JWT_EXPIRES_IN`  | Token lifetime | `7d` |
| `CLIENT_ORIGIN`   | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |

> `DATABASE_URL` can be used in place of the individual `DB_*` variables.

**`client/.env.local`**

| Variable       | Description |
|----------------|-------------|
| `VITE_API_URL` | Backend URL, e.g. `http://localhost:5000/api`. Leave blank for local dev (Vite proxies `/api`). |

### 3. Install dependencies

```bash
npm run install:all
```

### 4. Start the app

In two terminals:

```bash
npm run dev:server    # API on http://localhost:5000
npm run dev:client    # Client on http://localhost:5173
```

Open http://localhost:5173, register an account, and start tracking savings goals.

## API Reference

All routes except `POST /api/auth/register` and `POST /api/auth/login` require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint              | Body                                            | Response |
|--------|-----------------------|------------------------------------------------|----------|
| POST   | `/api/auth/register`  | `{ name, email, password }`                    | 201 `{ token, user }` |
| POST   | `/api/auth/login`     | `{ email, password }`                          | 200 `{ token, user }` |
| GET    | `/api/auth/me`        | --                                             | 200 `{ user }` |

**Validation rules:**
- Register: `name` required (max 100 chars), `email` must be valid, `password` min 6 chars
- Login: `email` must be valid, `password` required

### Goals

| Method | Endpoint              | Body / Query                          | Response |
|--------|-----------------------|---------------------------------------|----------|
| GET    | `/api/goals`          | --                                    | 200 `{ goals: [...] }` |
| GET    | `/api/goals/:id`      | --                                    | 200 `{ goal }` |
| POST   | `/api/goals`          | `{ title, target_amount, category?, deadline? }` | 201 `{ goal }` |
| PUT    | `/api/goals/:id`      | `{ title?, target_amount?, category?, deadline? }` | 200 `{ goal }` |
| DELETE | `/api/goals/:id`      | --                                    | 200 `{ message, id }` |

**Validation rules:**
- Create: `title` required (max 100), `target_amount` must be > 0
- Update: all fields optional; `target_amount` must be > 0 if provided

Each goal response includes a `computed_amount` field derived from the sum of its transactions.

### Transactions

| Method | Endpoint                  | Body / Query                          | Response |
|--------|---------------------------|---------------------------------------|----------|
| GET    | `/api/transactions`       | `?goalId=<uuid>` (optional filter)   | 200 `{ transactions: [...] }` |
| POST   | `/api/transactions`       | `{ goal_id, amount, type, note?, date? }` | 201 `{ transaction }` |
| DELETE | `/api/transactions/:id`   | --                                    | 200 `{ message, id }` |

**Validation rules:**
- Create: `goal_id` required (UUID), `amount` must be > 0, `type` must be `'deposit'` or `'withdrawal'`
- `note` max 200 chars (optional), `date` format YYYY-MM-DD (optional, defaults to today)

**Business logic:**
- Withdrawals are rejected with 400 if the computed balance is less than the requested amount.
- Creating or deleting a transaction atomically updates `current_amount` on the associated goal within a database transaction.
- All queries enforce `user_id` ownership.

### Health Check

| Method | Endpoint      | Response |
|--------|---------------|----------|
| GET    | `/api/health` | `{ status: "ok", timestamp: "..." }` |

### Error Responses

All errors follow a consistent shape:

```json
{ "message": "Description of the error." }
```

| Status | Meaning |
|--------|---------|
| 401    | Missing or invalid/expired JWT token |
| 404    | Resource not found |
| 409    | Duplicate email on registration |
| 422    | Validation failure (includes `errors` array with `field` and `message`) |
| 500    | Internal server error |

## Client Architecture

### Routes

| Path                | Component        | Auth Required |
|---------------------|------------------|---------------|
| `/login`            | LoginPage        | No            |
| `/register`         | RegisterPage     | No            |
| `/dashboard`        | DashboardPage    | Yes           |
| `/goals/new`        | GoalFormPage     | Yes           |
| `/goals/:id`        | GoalDetailPage   | Yes           |
| `/goals/:id/edit`   | GoalFormPage     | Yes           |
| `*` (fallback)      | Redirect to `/dashboard` | -- |

### Context Providers

- **`AuthProvider`**: Wraps the app. Exposes `user`, `loading`, `register()`, `login()`, `logout()`. Rehydrates session from `localStorage` on page load.
- **`GoalsProvider`**: Wraps the app inside `AuthProvider`. Manages `goals` and `transactions` arrays. Exposes CRUD methods (`addGoal`, `updateGoal`, `deleteGoal`, `addTransaction`, `deleteTransaction`) that perform API calls and update local state optimistically.

### Axios Interceptors

1. **Request**: Attaches `Authorization: Bearer <token>` from `localStorage`.
2. **Response**: Converts all response keys from `snake_case` to `camelCase`. On 401 (outside auth pages), clears `localStorage` and redirects to `/login`.

### Utility Helpers (`src/utils/helpers.js`)

- `formatCurrency(amount)` -- Formats as NGN (Nigerian Naira) using `Intl.NumberFormat`
- `formatDate(dateStr)` -- Formats date as "5 Sep 2026" (en-NG locale)
- `daysLeft(deadline)` -- Returns the number of days remaining until the deadline
- `categoryColor(category)` -- Returns `{ accent, dim }` color pair for a goal category

## Deployment

### Server (Railway)

1. Create a new Railway project from this repo.
2. Set the **Root Directory** to `server` (the build config lives in `server/railway.json`).
3. Add a **PostgreSQL** database to the project.
4. On the API service, set these environment variables:
   - `DATABASE_URL` -- use `${{Postgres.DATABASE_URL}}` (replace `Postgres` with your DB service name)
   - `JWT_SECRET` -- a long random string
   - `CLIENT_ORIGIN` -- your deployed client origin (no trailing slash)
5. Run `server/config/schema.sql` against the Railway Postgres to create the tables.
6. Deploy. The healthcheck hits `GET /api/health`.

### Client (Vercel)

1. Create a Vercel project from this repo.
2. Set **Root Directory** to `client` and Framework Preset to **Vite**.
3. Set the environment variable:
   - `VITE_API_URL` -- `https://<your-railway-app>.up.railway.app/api`
4. Deploy.

> **Important:** Without `VITE_API_URL`, the built client calls `/api` on its own domain, which `vercel.json` rewrites to `index.html`. The app then receives HTML instead of JSON, and login/registration shows a generic failure.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Missing database configuration" at startup | Server env lacks `DATABASE_URL` or all five `DB_*` vars | Set them in Railway service variables or `server/.env` |
| "JWT_SECRET is not set" | `JWT_SECRET` is missing | Add to `server/.env` or Railway env vars; server refuses to start without it |
| Login shows generic "Login failed." | Request returns HTML instead of JSON | Set `VITE_API_URL` in Vercel env vars to point at your Railway API |
| 401 loop after login | Token expired or `VITE_API_URL` misconfigured | Verify `VITE_API_URL` ends with `/api` and the server is reachable |
| Vercel build fails | Root Directory not set correctly | Set Root Directory to `client` so Vercel runs `vite build` |
| Withdrawal fails with 400 | Insufficient balance | The balance computed from transactions is less than the withdrawal amount |

## Scripts

| Script               | Command | Description |
|----------------------|---------|-------------|
| `dev:server`         | `npm run dev --prefix server` | Start the API with nodemon on port 5000 |
| `dev:client`         | `npm run dev --prefix client` | Start the Vite dev server on port 5173 |
| `build`              | `npm run build --prefix client` | Production build of the client |
| `install:all`        | `npm install --prefix server && npm install --prefix client` | Install dependencies for both packages |

## Disclaimer

This project is a learning demonstration of a full-stack application. It is not hardened for production financial use -- there is no rate limiting, no server-side token revocation, and no CSRF protection. Do not use it to store real financial data.
