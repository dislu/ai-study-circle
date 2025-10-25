# 🐳 Docker Deployment Guide for AI Study Circle

## Overview

This guide provides comprehensive Docker configurations for the AI Study Circle platform, supporting development, staging, and production deployments with containerized services.

## 📋 Prerequisites

### Required Software
- **Docker Desktop**: Version 4.0+ (Windows/Mac) or Docker Engine 20.10+ (Linux)
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)
- **Git**: For source code management
- **Node.js**: 18+ (for local development, optional)

### System Requirements
- **Memory**: Minimum 4GB RAM, Recommended 8GB+
- **Storage**: Minimum 10GB free space for images and volumes
- **CPU**: 2+ cores recommended for optimal performance

## 🏗️ Architecture

### Container Services
```
┌─────────────────────────────────────────────────────┐
│                   Load Balancer                     │
│                   (Nginx/Traefik)                  │
└─────────────────┬───────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐                 ┌────▼────┐
│Frontend│                 │ Backend │
│(React) │                 │(Node.js)│
│        │                 │         │
└────────┘                 └─────┬───┘
                                 │
               ┌─────────────────┼─────────────────┐
               │                 │                 │
           ┌───▼────┐       ┌────▼────┐       ┌────▼────┐
           │MongoDB │       │  Redis  │       │  Logs   │
           │        │       │(Session)│       │ Volume  │
           └────────┘       └─────────┘       └─────────┘
```

### Service Breakdown
- **Frontend**: React application served by Nginx
- **Backend**: Node.js API with Express framework  
- **MongoDB**: Primary database for user data and content
- **Redis**: Session storage and caching
- **Nginx**: Reverse proxy and static file serving

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd AI-Study-Circle

# Copy environment template
cp .env.docker .env

# Edit .env file with your configuration
# At minimum, add your API keys:
# OPENAI_API_KEY=your_openai_key
# GOOGLE_TRANSLATE_API_KEY=your_google_key
```

### 2. Start Development Environment
```bash
# Windows
docker-manager.bat dev-up

# Linux/Mac
./docker-manager.sh dev-up

# Or manually
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## 📁 File Structure

```
AI-Study-Circle/
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── .dockerignore          # Backend ignore patterns
│   ├── healthcheck.js         # Health check script
│   └── ...
├── frontend/
│   ├── Dockerfile             # Frontend container definition
│   ├── .dockerignore         # Frontend ignore patterns
│   ├── nginx.conf            # Nginx configuration
│   └── ...
├── docker-compose.yml         # Simple development setup
├── docker-compose.dev.yml     # Full development environment
├── docker-compose.prod.yml    # Production environment
├── .env.docker               # Development environment template
├── .env.prod.example         # Production environment template
├── docker-manager.sh         # Linux/Mac management script
├── docker-manager.bat        # Windows management script
└── DOCKER_GUIDE.md           # This guide
```

## 🔧 Environment Configurations

### Development (.env.docker)
```env
# Database
MONGODB_USERNAME=admin
MONGODB_PASSWORD=password123
REDIS_PASSWORD=redis123

# JWT Secrets (use simple values for development)
JWT_SECRET=dev-jwt-secret
JWT_REFRESH_SECRET=dev-refresh-secret
SESSION_SECRET=dev-session-secret

# API Keys (required)
OPENAI_API_KEY=your_openai_key
GOOGLE_TRANSLATE_API_KEY=your_google_key

# OAuth (for social authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Production (.env.prod)
```env
# Database (use strong passwords)
MONGODB_USERNAME=admin
MONGODB_PASSWORD=super-strong-password-change-me
REDIS_PASSWORD=super-strong-redis-password-change-me

# JWT Secrets (generate strong random values)
JWT_SECRET=generate-super-strong-jwt-secret-256-bits
JWT_REFRESH_SECRET=generate-super-strong-refresh-secret-256-bits
SESSION_SECRET=generate-super-strong-session-secret-256-bits

# Production URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

## 🛠️ Docker Compose Configurations

### Simple Development (docker-compose.yml)
- **Purpose**: Quick development setup
- **Services**: MongoDB, Backend, Frontend
- **Features**: Hot reload, development ports
- **Best for**: Local development and testing

### Full Development (docker-compose.dev.yml)  
- **Purpose**: Complete development environment
- **Services**: MongoDB, Redis, Backend, Frontend, Nginx
- **Features**: Health checks, logging, development tools
- **Best for**: Team development, integration testing

### Production (docker-compose.prod.yml)
- **Purpose**: Production deployment
- **Services**: All services with production configs
- **Features**: Multi-replica backend, SSL support, monitoring
- **Best for**: Production deployment, staging environment

## 🔍 Service Details

### Backend Service
```yaml
# Multi-stage build for optimization
FROM node:18-alpine AS base
FROM base AS development  # Development with hot reload
FROM base AS production   # Optimized production build
```

**Features:**
- Multi-stage build for size optimization
- Health checks for service monitoring
- Non-root user for security
- Volume mounts for development hot-reload

### Frontend Service
```yaml
# Development: React dev server
# Production: Nginx with built static files
```

**Features:**
- Development server with hot reload
- Production build with Nginx serving
- Security headers and SSL configuration
- API proxy to backend service

### Database Services
```yaml
# MongoDB with authentication
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password123

# Redis for sessions and caching  
redis:
  command: redis-server --requirepass password123
```

## 🎛️ Management Commands

### Using Docker Manager Scripts

**Windows (docker-manager.bat):**
```cmd
docker-manager.bat dev-up      # Start development
docker-manager.bat dev-logs    # View logs
docker-manager.bat status      # Check status
docker-manager.bat cleanup     # Clean resources
```

**Linux/Mac (docker-manager.sh):**
```bash
chmod +x docker-manager.sh
./docker-manager.sh dev-up     # Start development
./docker-manager.sh prod-up    # Start production
./docker-manager.sh build      # Rebuild images
```

### Manual Docker Commands
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Scale backend service
docker-compose up -d --scale backend=3

# Stop services
docker-compose down

# Remove volumes (destructive)
docker-compose down -v
```

## 🔒 Security Best Practices

### Development Environment
- Use simple passwords for local development
- Never commit real API keys to version control
- Use `.env` files for configuration
- Enable Docker content trust for image verification

### Production Environment
- Generate strong random secrets (32+ characters)
- Use Docker secrets for sensitive data
- Enable firewall and restrict network access
- Regular security updates for base images
- Monitor container resource usage

### Container Security
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001
USER backend

# Security headers in Nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## 📊 Monitoring and Logging

### Health Checks
```yaml
healthcheck:
  test: ["CMD", "node", "healthcheck.js"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Log Management
- Structured logging with JSON format
- Log rotation to prevent disk space issues
- Centralized logging with ELK stack (optional)
- Container logs via `docker logs`

### Monitoring Tools
- **Portainer**: Docker container management UI
- **Grafana**: Metrics visualization
- **Prometheus**: Metrics collection
- **Jaeger**: Distributed tracing (optional)

## 🚀 Production Deployment

### 1. Server Setup
```bash
# Install Docker on production server
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. SSL Configuration
```bash
# Create SSL directory
mkdir -p ssl

# Copy SSL certificates
cp /path/to/your/cert.pem ssl/
cp /path/to/your/private.key ssl/

# Or use Let's Encrypt with Certbot
```

### 3. Environment Setup
```bash
# Copy and configure production environment
cp .env.prod.example .env.prod

# Edit with production values
nano .env.prod

# Generate strong secrets
openssl rand -hex 32  # For JWT secrets
```

### 4. Deploy Application
```bash
# Start production environment
./docker-manager.sh prod-up

# Verify deployment
docker ps -a
./docker-manager.sh status
```

## 🔧 Troubleshooting

### Common Issues

**Port Conflicts:**
```bash
# Check which process is using port
netstat -tulpn | grep :3000
lsof -i :3000

# Change ports in docker-compose.yml if needed
```

**Memory Issues:**
```bash
# Check Docker memory usage
docker stats

# Increase Docker Desktop memory limit
# Or optimize container resource limits
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker socket permissions (Linux)
sudo usermod -aG docker $USER
```

**Database Connection:**
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker exec -it ai-study-circle-mongodb mongosh -u admin -p password123
```

### Debug Commands
```bash
# Enter container shell
docker exec -it ai-study-circle-backend sh

# Check container logs
docker logs ai-study-circle-backend --tail 100 -f

# Inspect container details
docker inspect ai-study-circle-backend

# Check network connectivity
docker network ls
docker network inspect ai-study-circle-network
```

## 📈 Performance Optimization

### Image Optimization
- Multi-stage builds to reduce image size
- `.dockerignore` files to exclude unnecessary files
- Alpine Linux base images for smaller footprint
- Layer caching for faster builds

### Runtime Optimization
- Resource limits and reservations
- Health checks for automatic recovery
- Redis caching for session storage
- Nginx compression and caching

### Scaling Considerations
```yaml
# Horizontal scaling
deploy:
  replicas: 3
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build and Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Deploy
        run: |
          docker-compose -f docker-compose.prod.yml build
          docker-compose -f docker-compose.prod.yml up -d
```

### Automated Testing
```bash
# Test container health
docker-compose exec backend npm test

# Integration tests
docker-compose exec frontend npm run test:integration
```

## 🆘 Support and Resources

### Documentation Links
- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

### Getting Help
1. Check container logs: `docker-compose logs [service]`
2. Verify service health: `docker-compose ps`
3. Review environment configuration
4. Consult troubleshooting section above

### Useful Commands Reference
```bash
# Container Management
docker ps -a                    # List all containers
docker images                   # List images
docker system df                # Disk usage
docker system prune             # Clean unused resources

# Volume Management
docker volume ls                # List volumes
docker volume inspect [name]    # Volume details
docker volume prune             # Remove unused volumes

# Network Management
docker network ls               # List networks
docker network inspect [name]   # Network details
```

---

**🐳 The AI Study Circle platform is now fully containerized and ready for deployment at any scale!**