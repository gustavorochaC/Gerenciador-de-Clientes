# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos do monorepo (root + backend)
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Instalar dependências do backend (workspace)
RUN npm install --workspace=apps/backend

COPY apps/backend ./apps/backend

# Build do backend
RUN npm run build --workspace=apps/backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copiar apenas o necessário para rodar
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

# Porta exposta (Coolify/Docker usam PORT do ambiente)
ENV NODE_ENV=production
EXPOSE 3001

# Comando explícito - evita "bash -c: option requires an argument"
CMD ["node", "dist/index.js"]
