FROM node:22-alpine AS base
WORKDIR /app

COPY .env* package*.json tsconfig*.json next.config.mjs ./
COPY src/ ./src/

RUN npm ci --ignore-scripts
RUN npm run build


FROM base AS runner
WORKDIR /app

RUN ls -la

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base --chown=nextjs:nodejs /app/next.config.mjs ./
COPY --from=base --chown=nextjs:nodejs /app/.next ./.next
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 8080

ENV PORT 8080

CMD ["npm", "start"]