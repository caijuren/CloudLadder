# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend + compile backend
RUN pnpm run build:api
RUN pnpm run build:client

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Rebuild better-sqlite3 to ensure native module is built for this environment
RUN pnpm rebuild better-sqlite3

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api/dist ./api/dist

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server (using compiled JS output)
CMD ["node", "api/dist/server.js"]
