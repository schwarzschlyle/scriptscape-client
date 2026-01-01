# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code and .env
COPY . .

# Build arg for API URL
ARG VITE_API_URL=/api/v1

# Set environment variable for build
ENV VITE_API_URL=${VITE_API_URL}

# Build the app
RUN npm run build

# --- Production stage ---
FROM nginx:alpine

# Copy built files from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]