FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts --legacy-peer-deps

FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1024"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN ./node_modules/.bin/next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/content ./content
# Copy gray-matter (and its deps) explicitly — Next.js standalone file-tracing
# misses packages used only inside cached API-route server functions.
COPY --from=builder /app/node_modules/gray-matter ./node_modules/gray-matter
COPY --from=builder /app/node_modules/js-yaml ./node_modules/js-yaml
COPY --from=builder /app/node_modules/kind-of ./node_modules/kind-of
COPY --from=builder /app/node_modules/section-matter ./node_modules/section-matter
COPY --from=builder /app/node_modules/strip-bom-string ./node_modules/strip-bom-string

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
