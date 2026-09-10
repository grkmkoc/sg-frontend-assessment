FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_TIER_LIST_API_URL=/api/tier-lists
ENV VITE_TIER_LIST_API_URL=$VITE_TIER_LIST_API_URL
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/build-server ./build-server

EXPOSE 8080
USER node
CMD ["node", "build-server/server/server.js"]
