# Basione Server

A production-ready RESTful API backend for the **Basione** banner printing e-commerce platform. Built with Node.js, Express, TypeScript, Prisma ORM, and MongoDB — featuring JWT authentication, dual payment gateway integration (Stripe + Mollie), background job processing, and cloud media management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express v5 |
| Database | MongoDB (via Prisma ORM) |
| Auth | JWT + bcrypt |
| Payments | Stripe + Mollie |
| Queue / Jobs | BullMQ + Redis (ioredis) |
| File Uploads | Multer + Cloudinary |
| Email | Nodemailer (SMTP) |
| AI | OpenAI SDK |
| Validation | Zod |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── bullMQ/
│   │   ├── queues/          # BullMQ queue definitions (mail, order, AI chat, etc.)
│   │   └── workers/         # Queue workers (mail processing)
│   ├── db/                  # DB connection + admin seeding
│   ├── error/               # Custom AppError class
│   ├── lib/                 # Third-party client instances (Prisma, Redis, Stripe, Mollie, Cloudinary)
│   ├── middleware/          # Auth, validation, error handling, file upload
│   ├── modules/
│   │   ├── auth/            # Login / logout
│   │   ├── user/            # Registration, OTP, password reset, profile
│   │   ├── banner/          # Banner CRUD
│   │   ├── order/           # Order lifecycle management
│   │   ├── payment/         # Payment creation + Mollie webhook
│   │   └── stripe/          # Stripe webhook handler
│   ├── routes/              # Central route aggregator
│   └── utils/               # Helpers: pagination, tokens, OTP, email templates, Cloudinary upload
├── config/                  # Env-based config
├── app.ts                   # Express app setup
└── server.ts                # Server entry point
prisma/
└── schema.prisma            # Data models: User, Banner, Order, Payment, Address
```

---

## Data Models

- **User** — authentication, roles (`user` | `admin`), OTP verification, profile
- **Banner** — custom banner product with category, size, design, and price
- **Order** — links user + banner, tracks delivery type, status, and payment status
- **Payment** — transaction record tied to an order (Stripe / Mollie)
- **Address** — delivery address per order

---

## API Reference

Base URL: `/api/v1`

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login with email & password |
| POST | `/auth/logout` | User | Logout and clear session |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/users/register` | Public | Register a new account |
| POST | `/users/verify-otp` | Public | Verify registration OTP |
| POST | `/users/resend-otp` | Public | Resend registration OTP |
| POST | `/users/forgot-password` | Public | Request password reset OTP |
| POST | `/users/verify-forgot-otp` | Public | Verify forgot password OTP |
| POST | `/users/reset-password` | Public | Set new password |
| POST | `/users/resend-forgot-password-otp` | Public | Resend forgot password OTP |
| GET | `/users/me` | User | Get authenticated user profile |
| PATCH | `/users/update-profile` | User | Update profile + avatar upload |

### Banners

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/banners/create-banner` | User | Create a new banner |
| GET | `/banners/my-banner` | User | Get current user's banners |
| GET | `/banners/all-banners` | Public | List all banners |

### Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders/create-order` | User | Place a new order |
| POST | `/orders/checkout` | User | Initiate checkout |
| GET | `/orders/my-orders` | User | Get user's order history |
| GET | `/orders/:id` | User | Get single order details |
| POST | `/orders/cancel/:id` | User | Cancel an order |
| POST | `/orders/confirm/:id` | Admin | Confirm/process an order |

### Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments/create-payment` | Public | Initiate a payment |
| POST | `/payments/mollie/webhook` | Public | Mollie payment webhook |
| POST | `/webhook` | Public | Stripe payment webhook (raw body) |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB instance (Atlas or local)
- Redis instance
- Stripe account
- Mollie account
- Cloudinary account
- SMTP credentials

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=5000

DATABASE_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/basione

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

PASSWORD_SALT=10

SMTP_USER=your@email.com
SMTP_PASS=your_smtp_password

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

MOLLIE_API_KEY=live_...

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

REDIS_URL=redis://localhost:6379

ADMIN_EMAIL=admin@basione.com
ADMIN_PASSWORD=securepassword
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
node dist/server.js
```

---

## Background Jobs (BullMQ)

The server uses BullMQ backed by Redis for async processing:

| Queue | Purpose |
|---|---|
| `mailQueue` | Transactional email delivery |
| `aiChatQueue` | AI chat processing |
| `assignJobQueue` | Job assignment logic |
| `conversationListQueue` | Conversation management |
| `messagePersistenceQueue` | Message storage |
| `cleanQueues` | Periodic queue cleanup |

---

## Email Notifications

Automated emails are sent for the following events:

- Registration OTP
- Registration success
- Forgot password OTP
- Password changed
- Reset password success
- Order confirmation
- Order cancelled
- Payment success
- Payment failed
- Payment cancelled

---

## Deployment

The project is configured for **Vercel** deployment via `vercel.json`. Prisma client is auto-generated on `postinstall`.

```bash
vercel --prod
```

