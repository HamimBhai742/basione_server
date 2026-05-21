# Basione Server

A premium, production-ready e-commerce RESTful API backend designed for the **Basione** banner printing platform. 

The server is built with a state-of-the-art **Node.js, Express, TypeScript, Prisma ORM, and MongoDB** architecture. It implements dynamic AI banner variant generation, double payment integrations (Stripe + Mollie), asynchronous processing queues (BullMQ), comprehensive admin panel management, a rich content blog system, decoration categories, and a premium unified aggregation layer.

---

## 🚀 Key Features

*   **AI Banner Generation**: Connects to dynamic AI engines to generate distinct banner variants based on user inputs (occasions, styles, descriptions) with automatic pricing calculation.
*   **Dual Payment Integrations**: Dual processing support via Mollie (ideal for European markets like iDEAL) and Stripe with secure webhook synchronizations.
*   **Asynchronous Job Processing (BullMQ)**: Fully decoupled task queues for transactional email delivery, AI chat pipelines, database cleanups, and high-volume background tasks backed by Redis.
*   **Flexible Aggregation Layer**: A high-performance parallelized data aggregation endpoint (`/api/v1/aggregate`) that merges public catalogs (banners, blogs, decorations, FAQs) and optional authenticated user profiles/orders in a single parallel query (`Promise.all`).
*   **Secure Administration Interface**: Deep order lifecycle control (pending, processing, ready, shipped, delivered, cancelled, refunded) with automatic transactional customer notification emails.
*   **Rich Blog System**: Full publishing workflows with automated slug generation, cover image upload, tags, draft status, and category sorting.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Runtime & Language** | Node.js, TypeScript, TS-Node-Dev |
| **Web Server Framework** | Express v5.x (High performance, minimalist) |
| **Database & ORM** | MongoDB Atlas, Prisma ORM (Type-safe schemas) |
| **Authentication & Security** | JSON Web Tokens (JWT), Cookies, Bcrypt hashing |
| **Payment Gateways** | Mollie API, Stripe API, secure automated webhooks |
| **Queue & Job Runners** | BullMQ, Redis (ioredis) |
| **Cloud File Storage** | Amazon S3 (AWS SDK v3), Cloudinary (Image management) |
| **Automated Emails** | Nodemailer (HTML templates, custom SMTP) |
| **Validation Layer** | Zod (Runtime JSON schema validation) |
| **Build & Deployments** | TypeScript compiler (`tsc`), Vercel edge deployment |

---

## 📁 Project Directory Structure

```
src/
├── app/
│   ├── bullMQ/
│   │   ├── queues/          # BullMQ queue definitions (mail, order, AI chat, etc.)
│   │   └── workers/         # Redis job workers (mail processor)
│   ├── db/                  # DB bootstrap connection & admin seeding
│   ├── error/               # Centralized global error handling classes (AppError)
│   ├── lib/                 # Third-party client singletons (Prisma, Redis, Stripe, Mollie, Cloudinary)
│   ├── middleware/          # Security, token checking, validation, multer uploads
│   ├── modules/             # Modulized Feature Layers
│   │   ├── admin/           # Admin panel operations (users, orders, dashboards, FAQs, templates)
│   │   ├── aggregate/       # Unified public and user data aggregator
│   │   ├── auth/            # Standard session authentication & tokens
│   │   ├── banner/          # AI banners & templates generation
│   │   ├── blog/            # Dynamic blogging engine
│   │   ├── decorations/     # Catalog decoration items & categories
│   │   ├── invoice/         # PDF receipt/invoice creation (PDFKit)
│   │   ├── order/           # Order creation & cancel flow
│   │   ├── payment/         # Mollie transaction handler
│   │   └── stripe/          # Stripe transaction processing
│   ├── routes/              # Centralized route index & module attachment
│   └── utils/               # Formatting, verification, layout calculations, and email templates
├── config/                  # Configuration loaders (JWT, port, credentials)
├── app.ts                   # Express server config and error routing
└── server.ts                # App entrypoint
prisma/
└── schema.prisma            # Prisma MongoDB database schema definition
```

---

## 🗄️ Database Schema Models

The database is built on MongoDB using Prisma ORM. Key database models are:

1.  **User**: Represents registration data, roles (`user`, `admin`), account verification (OTPs), custom profile pictures, and addresses.
2.  **Banner**: The core banner designs. Can be saved as user-created banners or global templates (`isTemplate: true`) containing dimensions, occasion, styles, AI prompt history, and price calculations.
3.  **Order**: Links `User` and `Banner` for sales. Details exact banner sizes, quantity, VAT breakdowns (21%), delivery details (standard, express delivery, pickups), tracking numbers, and delivery statuses.
4.  **Invoice**: PDF invoice receipts generated upon successful payments (using `PDFKit`), uploaded to S3, and emailed to customers automatically.
5.  **Payment**: Links transactions to specific orders with complete raw payload responses from Stripe/Mollie hooks.
6.  **Address**: Houses precise billing/shipping addresses mapped specifically per order.
7.  **Decoration & DecorationCategory**: Contains catalog details of additional party decorations available to users.
8.  **Faq**: Houses categorized frequently asked questions displayed in the public frontend help desk.
9.  **Blog**: Contains articles for marketing, including unique slug lines, draft/publish status, cover photos, content bodies, SEO titles, and tags.

---

## 🛰️ Central API Reference

All routes are prefixed under `/api/v1`.

### 🛡️ Authentication & User Operations
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/user/register` | Public | Registers a new account and sends email verification OTP. |
| **POST** | `/user/verify-otp` | Public | Verifies OTP code to activate the registered user account. |
| **POST** | `/user/resend-otp` | Public | Resends account activation code email. |
| **POST** | `/user/forgot-password` | Public | Requests a password reset verification code email. |
| **POST** | `/user/verify-forgot-otp`| Public | Validates a password reset OTP. |
| **POST** | `/user/resend-forgot-password-otp`| Public| Resends forgot password OTP. |
| **GET** | `/user/me` | Authenticated | Gets profile details of the logged-in user. |
| **PATCH**| `/user/update-profile` | Authenticated | Updates profile details (supports direct avatar file upload). |
| **POST** | `/auth/login` | Public | Authenticates and returns a secure JWT payload. |
| **POST** | `/auth/logout` | Public | Logs out user and destroys sessions. |

### 🎨 Banner & Template Design APIs
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/banner/generate` | Public | Generates 4 custom banner variants via AI prompting. |
| **GET** | `/banner/my-banner` | Authenticated | Fetches banners created by the logged-in user. |
| **GET** | `/banner/all-banners` | Public | Lists all public banners (supports paginated requests). |
| **GET** | `/banner/templates` | Public | Returns a list of all official pre-designed banner templates. |
| **GET** | `/banner/:id` | Public | Fetches a single banner/variant design. |
| **POST** | `/banner/create-banner-by-template`| Public | Configures and creates a banner mapping to an official template. |
| **POST** | `/banner/create-banner-from-template`| Authenticated | Generates a user banner copy from a template. |
| **PATCH**| `/banner/update-banner/:id`| Public | Updates banner attributes or modifies files. |

### 📦 Order & Checkout Flow
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/order/create-order` | Authenticated | Creates a new order linking a custom banner and sizes. |
| **POST** | `/order/checkout` | Authenticated | Validates shipping details and returns a Mollie checkout session URL. |
| **GET** | `/order/my-orders` | Authenticated | Returns logged-in user's order history with status checks. |
| **GET** | `/order/my-designs` | Authenticated | Returns orders designed by the current user. |
| **GET** | `/order/:id` | Authenticated | Fetches details of a specific order. |
| **PATCH**| `/order/cancel/:id` | Authenticated | Cancels a pending or processing order (sends confirmation email). |

### 💳 Webhook & Payments Gateways
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/payment/create-payment` | Authenticated | Begins standard payment transaction session. |
| **POST** | `/payment/mollie/webhook` | Public | Mollie payment status webhooks (Processes paid/failed events). |
| **POST** | `/stripe/webhook` | Public | Handles Stripe hooks (raw body parse). |

### 📝 Blogs Catalog
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/blog/` | Public | Lists published blog posts (supports category and keyword searches). |
| **GET** | `/blog/categories-tags` | Public | Returns unique tags and categories active in blogs. |
| **GET** | `/blog/id/:id` | Public | Fetches a single article post by its ID. |
| **GET** | `/blog/:slug` | Public | Fetches a single article by its SEO slug string. |

### 🎈 Decoration Catalogs
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/decorations/` | Public | Returns lists of party decoration catalog listings. |

### ⚡ Unified Aggregation Endpoint
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/aggregate/` | Public / Optional Auth | Returns all public lists (templates, banners, blogs, blog tags/categories, decorations, decoration categories, FAQs) in parallel. **If a JWT is provided, it dynamically adds the logged-in user's profile, custom banners, and order history.** |

### 🛠️ Administrative Interfaces (Admin Role Only)
All administration endpoints are grouped under `/admin`.
*   `GET /admin/total-orders` - Returns all orders in the system (paginated, with search filters).
*   `PATCH /admin/update-order/:id` - Progresses order states (`processing`, `ready`, `shipped`, `delivered`, `refunded`, `cancelled`) and sends transaction updates.
*   `GET /admin/total-users` - Returns registered users.
*   `PATCH /admin/update-user/:id` - Updates user status flags (`active`, `inactive`, `blocked`).
*   `GET /admin/dashboard-stats` - High-level metrics (total revenue, active user counts, pending queue count, deliveries).
*   `GET /admin/total-transaction` - Complete transaction payment records.
*   `GET /admin/decorations` - Admin list of decorations.
*   `POST /admin/create-decoration` - Creates a party decoration card (supports multer upload).
*   `POST /admin/create-decoration-category` - Adds a classification grouping name.
*   `GET /admin/faqs` - Returns all FAQs.
*   `POST /admin/create-faq` - Adds public FAQs.
*   `POST /admin/create-template` - Uploads a standard banner design template.

---

## 📈 Background Tasks (BullMQ & Redis)

Decoupled queues process asynchronous workloads through Redis workers to maximize Express throughput:

*   `mailQueue`: Processes email rendering and delivery templates asynchronously (OTPs, Order confirmations, Refund announcements).
*   `aiChatQueue`: Manages AI conversational context.
*   `cleanQueues`: Periodically flushes expired jobs in Redis storage to free RAM.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas connection string
*   Redis server instance

### Local Installation
1.  Clone the repository and install standard packages:
    ```bash
    npm install
    ```
2.  Set up environment configurations by creating a `.env` file in the root matching the layout described below.
3.  Synthesize Prisma database client types:
    ```bash
    npx prisma generate
    ```
4.  Launch local development servers:
    ```bash
    npm run dev
    ```

---

## 🔒 Configuration Layout (.env)

```env
PORT=5000
NODE_ENV=development

DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/basione_db"

JWT_SECRET="JWT_SECRET_SIGNING_KEY"
JWT_EXPIRES_IN="7d"
PASSWORD_SALT=10

SMTP_USER="smtp-client@basione.com"
SMTP_PASS="secure_smtp_password"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

MOLLIE_API_KEY="test_..."

CLOUDINARY_CLOUD_NAME="cloud-name"
CLOUDINARY_API_KEY="api-key"
CLOUDINARY_API_SECRET="api-secret"

S3_REGION="eu-central-1"
S3_ENDPOINT="https://s3.eu-central-1.amazonaws.com"
S3_BUCKET_NAME="basione-storage"
S3_ACCESS_KEY_ID="AWS_KEY_ID"
S3_SECRET_ACCESS_KEY="AWS_SECRET_KEY"

BASE_URL="http://localhost:5000"
CLIENT_URL="http://localhost:3000"
```

---

## 🏁 Building & Deployment

### Production Compilation
Transpile TypeScript source trees to optimized ES modules:
```bash
npm run build
```
Launch the node server bundle:
```bash
node dist/server.js
```

### Vercel Deployment
Deploy as serverless functions utilizing `vercel.json` edge configurations:
```bash
npm install -g vercel
vercel --prod
```
