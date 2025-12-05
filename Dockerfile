# ============================================
# Stage 1: Production Dependencies
# ============================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

# Copy package files (lock file is optional but preferred)
COPY package.json ./
COPY package-lock.json* ./

# Install only production dependencies
# Use npm ci if lock file exists, otherwise fall back to npm install
RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm install --omit=dev --no-audit --no-fund; \
    fi && \
    npm cache clean --force

# ============================================
# Stage 2: Final Production Image
# ============================================
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files directly (no build step needed for plain JS)
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs public ./public

# Copy and set up entrypoint script
COPY --chown=root:root docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Don't switch user here - entrypoint script will handle it
# This allows the script to fix permissions if needed
USER root

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use entrypoint script to fix permissions, then run the app
ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]

# Run the application
CMD ["node", "src/server.js"]
