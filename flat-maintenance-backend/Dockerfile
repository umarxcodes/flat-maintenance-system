FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root nodeuser
RUN addgroup -S nodejs && \
    adduser -S nodeuser -G nodejs

# Copy package metadata with nodeuser ownership
COPY --chown=nodeuser:nodejs package.json yarn.lock ./

# Switch to non-root user
USER nodeuser

# Install production dependencies using Yarn
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy application source code
COPY --chown=nodeuser:nodejs src ./src

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node --input-type=module -e "import http from 'node:http'; const req = http.get('http://localhost:5000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1));"

CMD ["node", "src/server.js"]
