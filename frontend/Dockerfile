# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations and install dependencies
COPY package.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy built HTML/JS assets to Nginx standard serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port 80 inside container
EXPOSE 80

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
