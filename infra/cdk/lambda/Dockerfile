FROM public.ecr.aws/lambda/nodejs:24 AS build

WORKDIR /var/task
ENV CI=true
RUN npm install --global pnpm@11.25.0

COPY . .
RUN pnpm install --frozen-lockfile \
    --filter dashivo \
    --filter @dashivo/infra-cdk... \
    --filter @dashivo/client... \
  && pnpm exec esbuild infra/cdk/lambda/handler.ts \
    --bundle --platform=node --target=node24 --format=cjs --minify \
    '--external:@dashivo/server-exporter/*' \
    --outfile=app/server/packages/exporter/handler.cjs

# Keep Vite, its native dependencies and the Viewer sources together.
# Viewer compilation embeds Python source; it does not execute user Python here.
RUN pnpm install --prod --frozen-lockfile \
    --filter @dashivo/server-exporter... \
    --filter @dashivo/client... \
  && rm -rf infra node_modules/.cache

FROM public.ecr.aws/lambda/nodejs:24
WORKDIR /var/task
COPY --from=build /var/task /var/task

ENV NODE_OPTIONS="--max-old-space-size=1536"
CMD ["app/server/packages/exporter/handler.handler"]
