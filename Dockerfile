# Build stage
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY package*.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1.3-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages ./packages
COPY package*.json ./
RUN bun install --production

ENV NODE_ENV=production
ENV PORT=4123
EXPOSE 4123

CMD ["bun", "run", "start"]
