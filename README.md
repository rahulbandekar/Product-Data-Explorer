# Product Data Explorer

**Product Data Explorer** is a full‑stack system for scraping, storing, and exploring product data (books from World of Books) with:

- **Backend**: NestJS, Prisma, PostgreSQL, Crawlee + Playwright, BullMQ + Redis, Swagger
- **Frontend**: Next.js App Router, React, Tailwind CSS, TanStack Query, Zustand

The frontend lets you trigger scrapes on demand, browse navigation headings and category hierarchies, and inspect rich product details and reviews stored in PostgreSQL.

---

## Architecture

- **`backend/`** (NestJS)
  - REST API for navigation, categories, products, reviews, and scrape jobs
  - Scraping workers using Crawlee + Playwright, orchestrated via BullMQ + Redis
  - Prisma ORM against PostgreSQL with a normalized schema for:
    - `Navigation`, `Category`, `Product`, `ProductDetail`, `Review`, `ScrapeJob`, `ViewHistory`
  - Swagger docs exposed at **`/api-docs`**
- **`frontend/`** (Next.js)
  - App Router (`app/`) with pages such as:
    - `/` – Dashboard for navigation headings and scrape status
    - `/categories/[id]` – Category hierarchy and product listings
    - `/products/[id]` or `/product/[id]` – Product detail views (price, description, specs, reviews)
    - `/about`, `/contact`, `/readme` – Auxiliary pages
  - Data fetching with TanStack Query and Axios against the backend API
  - Tailwind‑styled UI for a modern, responsive experience

---

## Tech Stack

- **Backend**
  - NestJS 11 (`@nestjs/core`, `@nestjs/swagger`, `@nestjs/throttler`)
  - Prisma 6 (`@prisma/client`, `prisma`)
  - PostgreSQL (primary data store)
  - Redis + BullMQ for background scraping queues
  - Crawlee + Playwright for web scraping
  - Jest + Supertest for testing
- **Frontend**
  - Next.js 16 (App Router)
  - React 19
  - Tailwind CSS
  - TanStack React Query, SWR
  - Zustand for state management

---

## Project Structure

- `backend/`
  - `src/main.ts` – NestJS bootstrap, CORS, validation, Swagger
  - `src/app.module.ts` – Root module wiring API, Prisma, and scraping
  - `src/api/controllers`
    - `navigation.controller.ts` – `GET /navigation`
    - `categories.controller.ts` – `GET /categories/by-navigation/:navigationId`, `GET /categories/:id`
    - `products.controller.ts` – `GET /products`, `GET /products/:id`, `POST /products/:id/refresh`
    - `scrape.controller.ts` – `POST /scrape/...` endpoints to queue scrapes
  - `src/scrape` – Scrape services and workers (navigation, categories, products, product details)
  - `src/prisma` – Prisma service & module
  - `prisma/schema.prisma` – Database schema
  - `prisma/seed.ts` – Seed data for local development
- `frontend/`
  - `app/page.tsx` – Landing page showing navigation headings and scrape status
  - `app/categories/[id]/page.tsx` – Category hierarchy and products for a navigation id
  - `app/products/[id]/page.tsx` / `app/product/[id]/page.tsx` – Product detail view
  - `app/about`, `app/contact`, `app/readme` – Auxiliary pages and docs

---

## Prerequisites

- **Node.js** ≥ 20.x (recommended)
- **PostgreSQL** (local instance or managed)
- **Redis** (for BullMQ queues)
- **npm** (or another Node package manager)

Alternatively, you can use **Docker** via `backend/docker-compose.yml` to spin up the backend + DB + Redis.

---

## Environment Configuration

### Backend (`backend/.env`)

Start from the example file:

```bash
cd backend
cp .env.example .env
```

Key variables:

- `DATABASE_URL` – PostgreSQL connection string, e.g.  
  `postgresql://user:password@localhost:5432/product_explorer`
- `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` – Redis connection settings
- `PORT` – API port (default in `.env.example` is `4000`; fallback in code is `10000`)
- `FRONTEND_URL` – Local frontend URL, typically `http://localhost:3000`
- `SCRAPE_DELAY_MS`, `SCRAPE_CACHE_TTL_HOURS` – Scraping delay and cache TTL

### Frontend (`frontend/.env.local`)

```bash
cd frontend
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_API_URL` – Backend API base URL (e.g. `http://localhost:4000`)
- `NEXT_PUBLIC_SITE_URL` – Frontend site URL (e.g. `http://localhost:3000`)

---

## Running Locally – Backend

From the repo root:

```bash
cd backend
npm install

# Generate Prisma client & run migrations
npm run prisma:migrate

# (Optional) seed database with sample data
npm run db:seed

# Start API server (watch mode)
npm run start:dev
```

The API will be available at:

- **REST API**: `http://localhost:4000`
- **Swagger UI**: `http://localhost:4000/api-docs`

### Running Scrape Workers

To process scraping jobs (navigation, categories, products, product details), start the workers:

```bash
cd backend
npm run start:workers
```

This runs multiple workers in parallel using BullMQ and Redis.

---

## Running Locally – Frontend

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

Then open:

- **Frontend**: `http://localhost:3000`

The home page will:

- Load navigation headings from the backend (`/navigation`)
- Show helpful error messages if the backend or DB are not reachable
- Allow you to trigger a navigation scrape directly from the UI

---

## Core Features

- **Navigation scraping**
  - Scrapes top‑level navigation headings from World of Books
  - Persists to `Navigation` + `Category` tables
- **Category hierarchy**
  - Parent/child `Category` relations with product counts
  - Browseable in the frontend by navigation and category
- **Product catalog**
  - Products linked to categories with pricing, author, and image data
  - Rich details and reviews via `ProductDetail` and `Review` models
- **Scrape jobs and workers**
  - Queue‑based scraping via BullMQ (navigation, categories, products, product details)
  - `ScrapeJob` table tracks job status and timings
- **View history**
  - `ViewHistory` model tracks anonymized browsing paths for analytics

---

## API Overview

Key endpoints (all return a `{ success, data, ... }` envelope):

- **Navigation**
  - `GET /navigation` – List navigation headings with category counts
- **Categories**
  - `GET /categories/by-navigation/:navigationId` – Categories for a navigation
  - `GET /categories/:id` – Single category with children and recent products
- **Products**
  - `GET /products` – Paginated products (`page`, `limit`, `categoryId`)
  - `GET /products/:id` – Single product with category, detail, and reviews
  - `POST /products/:id/refresh` – Queue product detail re‑scrape
- **Scraping**
  - `POST /scrape/navigation` – Queue navigation scrape
  - `POST /scrape/categories/:navigationId` – Queue category scrape for a navigation
  - `POST /scrape/products/:categoryId` – Queue product scrape for a category
  - `POST /scrape/product-detail/:productId` – Queue product detail scrape

For full request/response schemas, use Swagger at `/api-docs`.

---

## Scraping Safety & Ethics

- All scrapes are cached using DB‑backed TTL
- Repeated requests do not re‑scrape unless expired
- Crawlers use rate limiting and retries
- All scraping jobs are logged in `ScrapeJob`
- Seed data is provided for reviewer fallback

Additional guidance:

- **DB‑backed caching** avoids unnecessary repeat requests.
- **Rate limiting & retries** reduce load on the target site and make scraping more robust.
- **Job logging** via the `ScrapeJob` table gives observability and auditability.
- **Seed data** allows demos without hitting the live site.

Always respect the target website’s **robots.txt**, **terms of service**, and legal restrictions when scraping.

---

## Docker (Optional)

Inside `backend/` you’ll find Docker helpers:

```bash
cd backend

# Build backend image
npm run docker:build

# Run backend container with .env
npm run docker:run

# Or use docker-compose (backend + DB + Redis)
npm run docker:compose-up
```

See `backend/docker-compose.yml` and `backend/render.yaml` for deployment configuration hints.

---

## Notes on Folder READMEs

The `backend/README.md` and `frontend/README.md` are mostly framework boilerplate.
Treat **this root README** as the single source of truth for how to run and understand the system end‑to‑end.
