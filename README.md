# basione_server

Express + TypeScript API server for Basione.

## Tech stack

- Node.js + Express (`src/app.ts`, `src/server.ts`)
- TypeScript (`tsconfig.json`)
- Prisma + MongoDB (`prisma/schema.prisma`)
- Payments: Stripe webhooks + Mollie (`src/app/modules/stripe`, `src/app/modules/payment`)
- Background jobs: BullMQ + Redis (mail worker is loaded on startup)
- Media: Cloudinary (`src/app/lib/cloudinary.ts`)

## Project structure (high level)

```
prisma/
  schema.prisma
src/
  server.ts              # starts server + connects DB + seeds admin
  app.ts                 # express app + middleware + route mounting
  config/index.ts        # env-based config
  app/
    routes/index.ts      # /api/v1 route table
    modules/             # auth, user, banner, order, payment, stripe
    bullMQ/workers/      # background workers (email queue)
    lib/                 # prisma, redis, cloudinary, mollie
```

## Requirements

- Node.js (18+ recommended)
- MongoDB (for `DATABASE_URL`)
- Redis (for BullMQ workers)
- Stripe + Mollie credentials (if using payments)
- SMTP credentials (for outgoing email)
- Cloudinary credentials (if uploading media)

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create a `.env` file in the repo root.

This project reads (at least) the following environment variables:

```bash
PORT=3000
NODE_ENV=development

DATABASE_URL="mongodb://USER:PASSWORD@HOST:27017/DB_NAME?authSource=admin"

JWT_SECRET="change-me"
JWT_EXPIRES_IN="7d"
PASSWORD_SALT=10

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me"

SMTP_USER="smtp-user"
SMTP_PASS="smtp-pass"

REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""

STRIPE_SECRET_KEY="sk_live_or_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

MOLLIE_API_KEY="test_..."

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

Notes:
- On startup, the server connects to MongoDB and seeds an admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`src/app/db/connected.db.ts`).
- A BullMQ email worker is loaded on startup (`src/server.ts` imports `src/app/bullMQ/workers/mailWorkers.ts`), so Redis should be available.

3) Generate Prisma client:

```bash
npx prisma generate
```

For MongoDB, schema syncing is commonly done via:

```bash
npx prisma db push
```

## Run locally

```bash
npm run dev
```

Server starts on `http://localhost:${PORT}` (defaults to `3000`).

## Build + run (production)

```bash
npm run build
node dist/server.js
```

## API

Base URL: `/api/v1`

Mounted route groups (`src/app/routes/index.ts`):

- `/auth`
- `/user`
- `/banner`
- `/order`
- `/payment`

Webhooks:

- Stripe: `POST /api/v1/webhook` (expects raw body; used by `src/app/modules/stripe/stripeWebhook.ts`)
- Mollie: `POST /api/v1/payment/mollie/webhook` (URL-encoded form payload; see `src/app/modules/payment/payment.routes.ts`)

## Deployment

`vercel.json` is included and maps all routes to `src/server.ts` via `@vercel/node`. If deploying to Vercel, configure the same environment variables in your Vercel project settings.

