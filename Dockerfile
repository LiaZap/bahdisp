# ─── Stage 1: Build frontend ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (cache layer)
COPY package*.json ./
RUN npm ci

# Build frontend
COPY . .
RUN npm run build

# ─── Stage 2: Production runtime ─────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server source + utils (needed at runtime)
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/utils ./src/utils

# Copy built frontend (served statically by Express)
COPY --from=builder /app/dist ./dist

# Non-root user for safety
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "src/server/server.js"]
