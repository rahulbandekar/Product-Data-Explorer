# Product Data Explorer

Full-stack scraping and data storage system built with:
- NestJS
- Prisma
- PostgreSQL
- Playwright

## Features
- Navigation scraping
- Category hierarchy
- Safe upserts
- Retry-safe workers

## Setup
```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run start


### Scraping Safety & Ethics

- All scrapes are cached using DB-backed TTL
- Repeated requests do not re-scrape unless expired
- Crawlers use rate limiting and retries
- All scraping jobs are logged in `scrape_job`
- Seed data provided for reviewer fallback
