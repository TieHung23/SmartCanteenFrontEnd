FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy env vars
ENV NEXTAUTH_SECRET="dummy_secret_for_docker_build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_API_URL="http://localhost:8080/api"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
