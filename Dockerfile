###############################################################################
# Multi-stage build for Next.js app with server runtime (SSR + API routes).
# Target: Timeweb Cloud Docker deployment.
###############################################################################

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Install full dependency set (dev deps needed for the build step)
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy runtime essentials only
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Trim dev dependencies to shrink final image size
RUN npm prune --omit=dev && npm cache clean --force

EXPOSE 3000
CMD ["npm", "run", "start"]
