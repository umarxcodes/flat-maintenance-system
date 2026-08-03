# =========================
# Builder Stage
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile && \
    yarn cache clean

COPY . .

# =========================
# Runner Stage
# =========================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup -S nodejs && \
    adduser -S nodeuser -G nodejs

COPY --from=builder --chown=nodeuser:nodejs /app ./

EXPOSE 5000

USER nodeuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node --input-type=module -e "import http from 'node:http'; const req = http.get('http://localhost:5000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1));"

CMD ["node", "src/server.js"]
