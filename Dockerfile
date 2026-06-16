FROM oven/bun:1.1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY packages/core/package.json packages/core/
COPY packages/ui/package.json packages/ui/
COPY packages/sdk/package.json packages/sdk/
COPY provider-*/package.json ./

RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build UI
RUN cd packages/ui && bun run build

# Production stage
FROM oven/bun:1.1-slim AS production
WORKDIR /app

COPY --from=base /app .
COPY --from=base /app/packages/ui/dist ./packages/ui/dist

ENV NODE_ENV=production
ENV PORT=4123

EXPOSE 4123

CMD ["bun", "run", "packages/core/src/main.ts"]
