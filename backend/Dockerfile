# Use official Node.js LTS image
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

# Remove dev dependencies for smaller image
RUN npm prune --production

# Expose port (Cloud Run sets PORT env var, defaults to 8080)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
