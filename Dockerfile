# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
# NOTE: `.env` is ignored by `.dockerignore` and is not included in the image build context.
COPY . .

# Build args for API URLs
ARG VITE_API_URL=/api/v1
ARG VITE_AI_API_URL=/ai-api
ARG VITE_AI_API_WEBSOCKET_URL=/ai-api

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AI_API_URL=${VITE_AI_API_URL}
ENV VITE_AI_API_WEBSOCKET_URL=${VITE_AI_API_WEBSOCKET_URL}

# Build the app
RUN npm run build

# --- Production stage ---
FROM nginx:alpine

# Copy built files from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configs (templates selected at container start)
COPY nginx.conf /etc/nginx/templates/default.https.conf
COPY nginx.http.conf /etc/nginx/templates/default.http.conf

# Select HTTPS config if certs exist, otherwise start HTTP-only
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
