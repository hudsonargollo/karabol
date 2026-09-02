FROM node:20-slim AS build
WORKDIR /workspace
COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm install --workspace=apps/api --workspace=packages/shared
RUN npm run build --workspace=apps/api
RUN npm run prisma:generate --workspace=apps/api

FROM node:20-slim
WORKDIR /workspace
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/packages/shared ./packages/shared
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json

WORKDIR /workspace/apps/api
EXPOSE 4000
CMD ["node", "dist/server.js"]
