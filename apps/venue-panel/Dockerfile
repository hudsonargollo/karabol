FROM node:20-slim AS build
WORKDIR /workspace
COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/venue-panel ./apps/venue-panel
RUN npm install --workspace=apps/venue-panel --workspace=packages/shared
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/venue-panel

FROM nginx:1.27-alpine
COPY apps/venue-panel/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/venue-panel/dist /usr/share/nginx/html
