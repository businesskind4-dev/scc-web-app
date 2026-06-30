# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files first (for caching)
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy the rest of the backend code
COPY backend/ ./backend/

# Copy frontend files (optional – if you want to serve them)
COPY frontend/ ./frontend/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "backend/src/server.js"]
