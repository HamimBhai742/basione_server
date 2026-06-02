FROM node:20-alpine

# Install fontconfig and standard fonts for SVG text rendering with sharp/librsvg
RUN apk add --no-cache fontconfig ttf-dejavu

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]