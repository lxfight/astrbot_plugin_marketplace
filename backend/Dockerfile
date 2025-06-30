# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
FROM base AS dependencies
COPY package.json ./
RUN npm install

# ---- Build Stage ----
FROM base AS builder
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package.json .
# Expose the port the app runs on
EXPOSE 3001
# Command to run the application
CMD ["node", "dist/main"]