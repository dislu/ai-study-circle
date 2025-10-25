# AI Study Circle - Docker Implementation and Deployment Guide

**Document 4: Containerization, DevOps, and Production Deployment**

---

## Table of Contents

1. [Docker Implementation](#docker-implementation)
2. [Container Architecture](#container-architecture)
3. [Development Environment](#development-environment)
4. [Production Deployment](#production-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Security Configuration](#security-configuration)

---

## Docker Implementation

### 1. **Container Overview**

The AI Study Circle platform is fully containerized using Docker, providing:

- **Development Consistency**: Same environment across all development machines
- **Production Reliability**: Identical staging and production environments
- **Scalability**: Easy horizontal scaling with container orchestration
- **Isolation**: Secure separation of services and dependencies
- **Portability**: Deploy anywhere Docker is supported

### 2. **Container Architecture**

```
AI Study Circle Container Architecture
┌─────────────────────────────────────────────────────────┐
│                    Nginx Proxy                         │
│              (Load Balancer/SSL)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐            ┌─────▼──────┐
│ Frontend   │            │  Backend   │
│ Container  │            │ Container  │
│ (React +   │◄──────────►│ (Node.js + │
│  Nginx)    │   API      │ Express)   │
└────────────┘   Calls    └─────┬──────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
      ┌───▼────┐         ┌──────▼─────┐       ┌──────▼─────┐
      │MongoDB │         │   Redis    │       │   Network  │
      │Container│         │ Container  │       │   Bridge   │
      │        │         │(Sessions)  │       │            │
      └────────┘         └────────────┘       └────────────┘
```

### 3. **Docker Configuration Files**

#### Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Development stage
FROM base as development
ENV NODE_ENV=development

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

# Copy source code
COPY --chown=nodeuser:nodejs . .

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Development command with nodemon
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base as deps
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Production stage
FROM node:18-alpine as production
ENV NODE_ENV=production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy production dependencies
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodeuser:nodejs . .

# Install curl for health checks
RUN apk add --no-cache curl

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Production command
CMD ["npm", "start"]
```

#### Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Multi-stage build for optimized production
FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Development stage
FROM base as development
ENV NODE_ENV=development

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development server
CMD ["npm", "start"]

# Build stage for production
FROM base as build
ENV NODE_ENV=production

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine as production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Set ownership
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

# Start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration (`frontend/nginx.conf`)
```nginx
user nginx;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate proxy-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json
        application/xml
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
```

#### Nginx Default Configuration (`frontend/nginx-default.conf`)
```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Static assets with caching
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri $uri/ =404;
    }

    # API proxy (for development)
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache control for HTML
        location ~* \.(html)$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
        
        # Cache control for assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

#### Docker Compose Development (`docker-compose.dev.yml`)
```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: ai-study-circle-mongodb-dev
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_ROOT_PASSWORD:-password123}
      MONGO_INITDB_DATABASE: ${MONGODB_DATABASE:-ai-study-circle}
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data_dev:/data/db
      - ./backend/scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - ai-study-circle-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis Cache
  redis:
    image: redis:7.2-alpine
    container_name: ai-study-circle-redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data
    networks:
      - ai-study-circle-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: ai-study-circle-backend-dev
    restart: unless-stopped
    environment:
      - NODE_ENV=development
      - PORT=5000
      - MONGODB_URI=mongodb://${MONGODB_ROOT_USERNAME:-admin}:${MONGODB_ROOT_PASSWORD:-password123}@mongodb:27017/${MONGODB_DATABASE:-ai-study-circle}?authSource=admin
      - REDIS_URI=redis://redis:6379
      - SESSION_SECRET=${SESSION_SECRET:-dev-session-secret-change-in-production}
      - JWT_SECRET=${JWT_SECRET:-dev-jwt-secret-change-in-production}
      - FRONTEND_URL=http://localhost:3000
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
      - FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}
      - MICROSOFT_CLIENT_ID=${MICROSOFT_CLIENT_ID}
      - MICROSOFT_CLIENT_SECRET=${MICROSOFT_CLIENT_SECRET}
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - backend_logs_dev:/app/logs
    networks:
      - ai-study-circle-network
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: ai-study-circle-frontend-dev
    restart: unless-stopped
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:5000
      - REACT_APP_ENVIRONMENT=development
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - ai-study-circle-network
    depends_on:
      - backend
    stdin_open: true
    tty: true

volumes:
  mongodb_data_dev:
    driver: local
  redis_data_dev:
    driver: local
  backend_logs_dev:
    driver: local

networks:
  ai-study-circle-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

#### Docker Compose Production (`docker-compose.prod.yml`)
```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: ai-study-circle-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGODB_DATABASE}
    volumes:
      - mongodb_data:/data/db
      - ./backup:/backup
      - ./backend/scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - ai-study-circle-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis Cache
  redis:
    image: redis:7.2-alpine
    container_name: ai-study-circle-redis
    restart: always
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    networks:
      - ai-study-circle-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    command: redis-server /usr/local/etc/redis/redis.conf

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: ai-study-circle-backend
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://${MONGODB_ROOT_USERNAME}:${MONGODB_ROOT_PASSWORD}@mongodb:27017/${MONGODB_DATABASE}?authSource=admin
      - REDIS_URI=redis://redis:6379
      - SESSION_SECRET=${SESSION_SECRET}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
      - FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}
      - MICROSOFT_CLIENT_ID=${MICROSOFT_CLIENT_ID}
      - MICROSOFT_CLIENT_SECRET=${MICROSOFT_CLIENT_SECRET}
    volumes:
      - backend_logs:/app/logs
      - backend_uploads:/app/uploads
    networks:
      - ai-study-circle-network
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    container_name: ai-study-circle-frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
      - frontend_logs:/var/log/nginx
    networks:
      - ai-study-circle-network
    depends_on:
      backend:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local
  backend_logs:
    driver: local
  backend_uploads:
    driver: local
  frontend_logs:
    driver: local

networks:
  ai-study-circle-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
```

### 4. **Environment Configuration**

#### Development Environment (`.env.dev`)
```bash
# Application Settings
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_ROOT_USERNAME=admin
MONGODB_ROOT_PASSWORD=password123
MONGODB_DATABASE=ai-study-circle-dev
MONGODB_URI=mongodb://admin:password123@localhost:27017/ai-study-circle-dev?authSource=admin

# Redis Configuration
REDIS_URI=redis://localhost:6379

# Security Settings
SESSION_SECRET=dev-session-secret-change-in-production-please
JWT_SECRET=dev-jwt-secret-change-in-production-please

# API Keys (Development)
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Development Settings
DEBUG=true
LOG_LEVEL=debug
ENABLE_CORS=true
```

#### Production Environment (`.env.prod`)
```bash
# Application Settings
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Database Configuration (Use secure passwords)
MONGODB_ROOT_USERNAME=your_secure_username
MONGODB_ROOT_PASSWORD=your_secure_password_here
MONGODB_DATABASE=ai-study-circle
MONGODB_URI=mongodb://your_secure_username:your_secure_password_here@mongodb:27017/ai-study-circle?authSource=admin

# Redis Configuration
REDIS_URI=redis://redis:6379

# Security Settings (Generate strong secrets)
SESSION_SECRET=your_very_strong_session_secret_here_minimum_32_characters
JWT_SECRET=your_very_strong_jwt_secret_here_minimum_32_characters

# API Keys (Production)
OPENAI_API_KEY=your_production_openai_api_key
GOOGLE_TRANSLATE_API_KEY=your_production_google_translate_api_key
GOOGLE_CLOUD_PROJECT_ID=your_production_google_cloud_project_id

# OAuth Configuration (Production)
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

FACEBOOK_APP_ID=your_production_facebook_app_id
FACEBOOK_APP_SECRET=your_production_facebook_app_secret

MICROSOFT_CLIENT_ID=your_production_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_production_microsoft_client_secret

# Production Settings
DEBUG=false
LOG_LEVEL=info
ENABLE_CORS=false
```

### 5. **Docker Management Scripts**

#### Windows Docker Manager (`docker-manager.bat`)
```batch
@echo off
setlocal

REM AI Study Circle - Docker Management Script for Windows

if "%1"=="" (
    echo Usage: docker-manager.bat [command]
    echo.
    echo Available commands:
    echo   dev-up          Start development environment
    echo   dev-down        Stop development environment
    echo   prod-up         Start production environment
    echo   prod-down       Stop production environment
    echo   build-dev       Build development images
    echo   build-prod      Build production images
    echo   logs            Show container logs
    echo   clean           Clean up containers and images
    echo   backup          Backup database
    echo   restore         Restore database
    echo   health          Check container health
    exit /b 1
)

REM Set environment variables
set PROJECT_NAME=ai-study-circle

if "%1"=="dev-up" (
    echo Starting development environment...
    docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
    echo Development environment started!
    echo Frontend: http://localhost:3000
    echo Backend: http://localhost:5000
    echo MongoDB: localhost:27017
    echo Redis: localhost:6379
    goto end
)

if "%1"=="dev-down" (
    echo Stopping development environment...
    docker-compose -f docker-compose.dev.yml down
    echo Development environment stopped!
    goto end
)

if "%1"=="prod-up" (
    echo Starting production environment...
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    echo Production environment started!
    echo Application: http://localhost
    goto end
)

if "%1"=="prod-down" (
    echo Stopping production environment...
    docker-compose -f docker-compose.prod.yml down
    echo Production environment stopped!
    goto end
)

if "%1"=="build-dev" (
    echo Building development images...
    docker-compose -f docker-compose.dev.yml build --no-cache
    echo Development images built successfully!
    goto end
)

if "%1"=="build-prod" (
    echo Building production images...
    docker-compose -f docker-compose.prod.yml build --no-cache
    echo Production images built successfully!
    goto end
)

if "%1"=="logs" (
    if "%2"=="" (
        docker-compose -f docker-compose.dev.yml logs -f
    ) else (
        docker-compose -f docker-compose.dev.yml logs -f %2
    )
    goto end
)

if "%1"=="clean" (
    echo Cleaning up Docker resources...
    
    REM Stop all containers
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.prod.yml down
    
    REM Remove unused containers, networks, images
    docker system prune -f
    
    REM Remove project-specific volumes (optional)
    echo Do you want to remove all data volumes? This will delete all data! (Y/N)
    set /p CONFIRM=
    if /i "%CONFIRM%"=="Y" (
        docker volume rm %PROJECT_NAME%_mongodb_data_dev 2>nul
        docker volume rm %PROJECT_NAME%_redis_data_dev 2>nul
        docker volume rm %PROJECT_NAME%_mongodb_data 2>nul
        docker volume rm %PROJECT_NAME%_redis_data 2>nul
        echo Volumes removed!
    )
    
    echo Cleanup completed!
    goto end
)

if "%1"=="backup" (
    echo Creating database backup...
    set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set TIMESTAMP=%TIMESTAMP: =0%
    
    docker exec ai-study-circle-mongodb mongodump --host localhost --port 27017 --db ai-study-circle --out /backup/backup_%TIMESTAMP%
    echo Backup created: backup_%TIMESTAMP%
    goto end
)

if "%1"=="restore" (
    if "%2"=="" (
        echo Usage: docker-manager.bat restore [backup_folder]
        goto end
    )
    
    echo Restoring database from %2...
    docker exec ai-study-circle-mongodb mongorestore --host localhost --port 27017 --db ai-study-circle /backup/%2/ai-study-circle
    echo Database restored!
    goto end
)

if "%1"=="health" (
    echo Checking container health...
    echo.
    docker-compose -f docker-compose.dev.yml ps
    echo.
    echo Container health status:
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    goto end
)

echo Unknown command: %1
echo Run 'docker-manager.bat' without arguments to see available commands.

:end
endlocal
```

#### Linux/Mac Docker Manager (`docker-manager.sh`)
```bash
#!/bin/bash

# AI Study Circle - Docker Management Script for Linux/Mac

PROJECT_NAME="ai-study-circle"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "AI Study Circle - Docker Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Available commands:"
    echo "  dev-up          Start development environment"
    echo "  dev-down        Stop development environment"
    echo "  prod-up         Start production environment"
    echo "  prod-down       Stop production environment"
    echo "  build-dev       Build development images"
    echo "  build-prod      Build production images"
    echo "  rebuild-dev     Rebuild development images (no cache)"
    echo "  rebuild-prod    Rebuild production images (no cache)"
    echo "  logs [service]  Show container logs (optional service name)"
    echo "  clean           Clean up containers and images"
    echo "  backup          Backup database"
    echo "  restore [file]  Restore database from backup"
    echo "  health          Check container health"
    echo "  shell [service] Open shell in container"
    echo "  update          Update container images"
    echo "  status          Show container status"
    echo ""
}

# Function to start development environment
dev_up() {
    print_status "Starting development environment..."
    check_docker
    check_docker_compose
    
    # Create .env.dev if it doesn't exist
    if [ ! -f .env.dev ]; then
        print_warning ".env.dev not found. Creating from template..."
        cp .env.example .env.dev
        print_info "Please edit .env.dev with your configuration before running again."
        exit 1
    fi
    
    docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
    
    if [ $? -eq 0 ]; then
        print_status "Development environment started successfully!"
        print_info "Frontend: http://localhost:3000"
        print_info "Backend: http://localhost:5000"
        print_info "MongoDB: localhost:27017"
        print_info "Redis: localhost:6379"
        print_info ""
        print_info "Use '$0 logs' to see container logs"
        print_info "Use '$0 health' to check container health"
    else
        print_error "Failed to start development environment"
        exit 1
    fi
}

# Function to stop development environment
dev_down() {
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    print_status "Development environment stopped!"
}

# Function to start production environment
prod_up() {
    print_status "Starting production environment..."
    check_docker
    check_docker_compose
    
    # Check if .env.prod exists
    if [ ! -f .env.prod ]; then
        print_error ".env.prod not found. Please create production configuration."
        exit 1
    fi
    
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    if [ $? -eq 0 ]; then
        print_status "Production environment started successfully!"
        print_info "Application: http://localhost"
        print_info "Use '$0 logs' to monitor the application"
    else
        print_error "Failed to start production environment"
        exit 1
    fi
}

# Function to stop production environment
prod_down() {
    print_status "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    print_status "Production environment stopped!"
}

# Function to build development images
build_dev() {
    print_status "Building development images..."
    docker-compose -f docker-compose.dev.yml build
    print_status "Development images built successfully!"
}

# Function to build production images
build_prod() {
    print_status "Building production images..."
    docker-compose -f docker-compose.prod.yml build
    print_status "Production images built successfully!"
}

# Function to rebuild development images without cache
rebuild_dev() {
    print_status "Rebuilding development images (no cache)..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    print_status "Development images rebuilt successfully!"
}

# Function to rebuild production images without cache
rebuild_prod() {
    print_status "Rebuilding production images (no cache)..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    print_status "Production images rebuilt successfully!"
}

# Function to show logs
show_logs() {
    if [ -z "$2" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.dev.yml logs -f "$2"
    fi
}

# Function to clean up Docker resources
clean() {
    print_warning "This will clean up Docker resources..."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping all containers..."
        docker-compose -f docker-compose.dev.yml down 2>/dev/null
        docker-compose -f docker-compose.prod.yml down 2>/dev/null
        
        print_status "Cleaning up unused Docker resources..."
        docker system prune -f
        
        print_warning "Do you want to remove all data volumes? This will delete all data!"
        read -p "Remove volumes? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker volume rm ${PROJECT_NAME}_mongodb_data_dev 2>/dev/null || true
            docker volume rm ${PROJECT_NAME}_redis_data_dev 2>/dev/null || true
            docker volume rm ${PROJECT_NAME}_mongodb_data 2>/dev/null || true
            docker volume rm ${PROJECT_NAME}_redis_data 2>/dev/null || true
            docker volume rm ${PROJECT_NAME}_backend_logs_dev 2>/dev/null || true
            docker volume rm ${PROJECT_NAME}_backend_logs 2>/dev/null || true
            docker volume rm ${PROJECT_NAME}_backend_uploads 2>/dev/null || true
            docker volume rm ${PROJECT_NAME}_frontend_logs 2>/dev/null || true
            print_status "Volumes removed!"
        fi
        
        print_status "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Function to backup database
backup() {
    print_status "Creating database backup..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    CONTAINER_NAME="${PROJECT_NAME}-mongodb-dev"
    
    # Check if container exists and is running
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        CONTAINER_NAME="${PROJECT_NAME}-mongodb"
        if ! docker ps | grep -q "$CONTAINER_NAME"; then
            print_error "MongoDB container is not running"
            exit 1
        fi
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p ./backup
    
    # Perform backup
    docker exec "$CONTAINER_NAME" mongodump --host localhost --port 27017 --db ai-study-circle --out /backup/backup_$TIMESTAMP
    
    if [ $? -eq 0 ]; then
        print_status "Backup created: backup_$TIMESTAMP"
    else
        print_error "Backup failed"
        exit 1
    fi
}

# Function to restore database
restore() {
    if [ -z "$2" ]; then
        print_error "Usage: $0 restore [backup_folder]"
        exit 1
    fi
    
    print_status "Restoring database from $2..."
    
    CONTAINER_NAME="${PROJECT_NAME}-mongodb-dev"
    
    # Check if container exists and is running
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        CONTAINER_NAME="${PROJECT_NAME}-mongodb"
        if ! docker ps | grep -q "$CONTAINER_NAME"; then
            print_error "MongoDB container is not running"
            exit 1
        fi
    fi
    
    docker exec "$CONTAINER_NAME" mongorestore --host localhost --port 27017 --db ai-study-circle /backup/$2/ai-study-circle
    
    if [ $? -eq 0 ]; then
        print_status "Database restored successfully!"
    else
        print_error "Restore failed"
        exit 1
    fi
}

# Function to check container health
health() {
    print_status "Checking container health..."
    echo ""
    
    # Check if development or production is running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_info "Development environment status:"
        docker-compose -f docker-compose.dev.yml ps
    elif docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_info "Production environment status:"
        docker-compose -f docker-compose.prod.yml ps
    else
        print_warning "No AI Study Circle containers are currently running"
    fi
    
    echo ""
    print_info "All container health status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "${PROJECT_NAME}"
}

# Function to open shell in container
shell() {
    if [ -z "$2" ]; then
        print_error "Usage: $0 shell [service_name]"
        print_info "Available services: backend, frontend, mongodb, redis"
        exit 1
    fi
    
    CONTAINER_NAME="${PROJECT_NAME}-$2-dev"
    
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        CONTAINER_NAME="${PROJECT_NAME}-$2"
        if ! docker ps | grep -q "$CONTAINER_NAME"; then
            print_error "Container $2 is not running"
            exit 1
        fi
    fi
    
    print_status "Opening shell in $2 container..."
    
    case "$2" in
        "mongodb")
            docker exec -it "$CONTAINER_NAME" mongosh
            ;;
        "redis")
            docker exec -it "$CONTAINER_NAME" redis-cli
            ;;
        *)
            docker exec -it "$CONTAINER_NAME" /bin/sh
            ;;
    esac
}

# Function to update container images
update() {
    print_status "Updating container images..."
    docker-compose -f docker-compose.dev.yml pull
    docker-compose -f docker-compose.prod.yml pull
    print_status "Images updated successfully!"
}

# Function to show status
status() {
    print_info "AI Study Circle Container Status:"
    echo ""
    
    # Development environment
    print_info "Development Environment:"
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.dev.yml ps
    else
        echo "  Not running"
    fi
    
    echo ""
    
    # Production environment
    print_info "Production Environment:"
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.prod.yml ps
    else
        echo "  Not running"
    fi
    
    echo ""
    
    # Docker resources
    print_info "Docker Resources:"
    echo "  Images: $(docker images | grep "${PROJECT_NAME}" | wc -l)"
    echo "  Volumes: $(docker volume ls | grep "${PROJECT_NAME}" | wc -l)"
    echo "  Networks: $(docker network ls | grep "${PROJECT_NAME}" | wc -l)"
}

# Main script logic
case "$1" in
    "dev-up")
        dev_up
        ;;
    "dev-down")
        dev_down
        ;;
    "prod-up")
        prod_up
        ;;
    "prod-down")
        prod_down
        ;;
    "build-dev")
        build_dev
        ;;
    "build-prod")
        build_prod
        ;;
    "rebuild-dev")
        rebuild_dev
        ;;
    "rebuild-prod")
        rebuild_prod
        ;;
    "logs")
        show_logs "$@"
        ;;
    "clean")
        clean
        ;;
    "backup")
        backup
        ;;
    "restore")
        restore "$@"
        ;;
    "health")
        health
        ;;
    "shell")
        shell "$@"
        ;;
    "update")
        update
        ;;
    "status")
        status
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
```

---

**Document Status**: Complete  
**Last Updated**: October 25, 2025  
**Version**: 1.0  
**Next Document**: API Documentation and Testing Guide