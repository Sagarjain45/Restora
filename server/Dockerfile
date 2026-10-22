# ==========================================
# RESTORA SERVER - DOCKERFILE
# ==========================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies if needed for native modules (bcryptjs)
RUN apk add --no-cache python3 make g++

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy server application source code
COPY . .

# Expose default backend port
EXPOSE 5000

# Set production environment default
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server.js"]
