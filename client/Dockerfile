# ==========================================
# STAGE 1: Build React Vite Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first for optimal caching
COPY package*.json ./

# Install all dependencies (including devDependencies required for vite build)
RUN npm install

# Copy application source code
COPY . .

# Build the production bundle
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Nginx Server
# ==========================================
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration with SPA routing and API reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Start Nginx server in foreground
CMD ["nginx", "-g", "daemon off;"]
