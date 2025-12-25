# Multi-stage Dockerfile for Bakalr CMS Frontend (Next.js)
# Optimized for production with standalone output

# =============================================================================
# Stage 1: Dependencies - Install all dependencies
# =============================================================================
FROM node:20-alpine AS deps

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# =============================================================================
# Stage 2: Builder - Build the application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Next.js public environment variables
# These are baked into the JS bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_PLATFORM_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_INVENTORY_QUERY_URL=http://localhost:8080
ARG NEXT_PUBLIC_INVENTORY_COMMAND_URL=http://localhost:8080

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment variables for build
# NEXT_PUBLIC_* vars must be set during build for Next.js to inline them
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_PLATFORM_API_URL=${NEXT_PUBLIC_PLATFORM_API_URL} \
    NEXT_PUBLIC_INVENTORY_QUERY_URL=${NEXT_PUBLIC_INVENTORY_QUERY_URL} \
    NEXT_PUBLIC_INVENTORY_COMMAND_URL=${NEXT_PUBLIC_INVENTORY_COMMAND_URL}

# Build Next.js application with optimizations
RUN npm run build && \
    # Remove source maps to reduce size
    find .next -name '*.map' -type f -delete

# =============================================================================
# Stage 3: Runner - Create minimal production image
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy necessary files from builder with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
