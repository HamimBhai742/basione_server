# ---------------------
# Stage 1: Install build dependencies
# ---------------------
FROM node:20-alpine AS deps

# Install libc6-compat and openssl for Prisma engines, plus fontconfig and standard fonts for SVG/PDF rendering
RUN apk add --no-cache libc6-compat openssl fontconfig ttf-dejavu

WORKDIR /app

COPY package*.json ./
# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# ---------------------
# Stage 2: Build application
# ---------------------
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl fontconfig ttf-dejavu

WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Prisma requires DATABASE_URL to generate the client
ARG DATABASE_URL="mongodb://localhost:27017/dummy"
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Remove development dependencies to keep production image light
RUN npm prune --production

# ---------------------
# Stage 3: Production runner image
# ---------------------
FROM node:20-alpine AS runner

# Install runtime dependencies for fonts/PDF generation and Prisma client
RUN apk add --no-cache libc6-compat openssl fontconfig ttf-dejavu

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary runtime files
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/app/assets ./src/app/assets
COPY --from=builder /app/public ./public

# Use the non-root node user for safety
RUN chown -R node:node /app
USER node

EXPOSE 5000

ENV PORT=5000

CMD ["node", "dist/server.js"]