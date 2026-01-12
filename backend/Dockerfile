# Use official Node.js LTS image
# Fixed path-to-regexp error with app.options('*') - Build 3
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Keep dev dependencies (needed for tsx/migrations at startup)
# Copy migrations to dist folder
RUN cp -r src/database/migrations dist/database/migrations

# Expose port (Cloud Run sets PORT env var, defaults to 8080)
EXPOSE 8080

# Create startup script that skips migrations
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Skipping migrations - using existing schema..."' >> /app/start.sh && \
    echo 'echo "Starting server..."' >> /app/start.sh && \
    echo 'exec node dist/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application without migrations
CMD ["/app/start.sh"]
