FROM node:20 AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20 AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
# Aseguramos permisos de escritura incluso cuando se monta el volumen sqlite_data
RUN chown -R node:node /app

# Ejecutar migraciones (si aplica) antes de iniciar y arrancar Next.js
CMD ["sh", "-c", "npx prisma migrate deploy || true && npm run start -- -H 0.0.0.0 -p 3000"]
