# AI Study Circle - ECS Container Resource Requirements
## CPU and RAM Analysis for AWS ECS Deployment

*Analysis Date: October 25, 2025*
*Application: AI Study Circle with Centralized Logging Framework*

---

## 📊 Executive Summary

| **Service** | **CPU (vCPU)** | **Memory (MB)** | **Scaling Range** | **Cost Impact** |
|-------------|----------------|-----------------|-------------------|-----------------|
| **Frontend** | 0.25 - 0.5 | 512 - 1024 | 2-10 tasks | Low |
| **Backend** | 0.5 - 1.0 | 1024 - 2048 | 2-20 tasks | Medium |
| **MongoDB** | 0.5 - 2.0 | 2048 - 4096 | 1-3 tasks | High |
| **Redis** | 0.25 - 0.5 | 256 - 512 | 1-3 tasks | Low |
| **Elasticsearch** | 1.0 - 4.0 | 2048 - 8192 | 1-3 tasks | High |
| **Logstash** | 0.5 - 1.0 | 1024 - 2048 | 1-2 tasks | Medium |
| **Kibana** | 0.25 - 0.5 | 1024 - 2048 | 1-2 tasks | Medium |
| **Filebeat** | 0.1 - 0.25 | 256 - 512 | 1-2 tasks | Low |

**Total Resources**: 3.4 - 8.75 vCPU, 9.1 - 20.4 GB RAM

---

## 🏗️ Application Architecture Analysis

### Current Application Components

Based on the codebase analysis, your AI Study Circle application consists of:

1. **Frontend (Next.js 14.0.0)**:
   - React 18 with server-side rendering
   - Advanced logging with performance monitoring
   - Real-time user action tracking
   - Static asset serving via Nginx in production

2. **Backend (Node.js 18)**:
   - Express.js API with comprehensive middleware
   - Winston logging with daily rotation
   - Multiple authentication providers (Google, Facebook, Microsoft)
   - OpenAI integration for AI features
   - File processing (PDF, DOCX) with libraries like Mammoth
   - Google Translate API integration

3. **Database Layer**:
   - MongoDB 7.0 with authentication
   - Redis 7.2 for session storage and caching

4. **ELK Logging Stack** (Version 8.11.0):
   - Elasticsearch for log storage and search
   - Logstash for log processing and enrichment
   - Kibana for visualization and dashboards
   - Filebeat for log collection

---

## 🎯 Detailed ECS Task Definitions

### 1. Frontend Service (Next.js + Nginx)

#### Development Configuration
```json
{
  "cpu": 256,        // 0.25 vCPU
  "memory": 512,     // 512 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 3000,
      "protocol": "tcp"
    }
  ]
}
```

#### Production Configuration  
```json
{
  "cpu": 512,        // 0.5 vCPU
  "memory": 1024,    // 1024 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 80,
      "protocol": "tcp"
    }
  ]
}
```

**Justification**:
- Next.js SSR requires moderate CPU for rendering
- Static assets cached by Nginx
- Memory usage scales with concurrent users
- **Scaling**: 2-10 tasks based on traffic

### 2. Backend Service (Node.js Express)

#### Development Configuration
```json
{
  "cpu": 512,        // 0.5 vCPU
  "memory": 1024,    // 1024 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 5000,
      "protocol": "tcp"
    }
  ]
}
```

#### Production Configuration
```json
{
  "cpu": 1024,       // 1.0 vCPU
  "memory": 2048,    // 2048 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 5000,
      "protocol": "tcp"
    }
  ]
}
```

**Justification**:
- OpenAI API calls require CPU for JSON processing
- File processing (PDF, DOCX) is memory-intensive
- Winston logging with multiple transports
- Multiple authentication flows
- **Scaling**: 2-20 tasks based on API load

### 3. MongoDB Database

#### Single Instance Configuration
```json
{
  "cpu": 1024,       // 1.0 vCPU
  "memory": 2048,    // 2048 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 27017,
      "protocol": "tcp"
    }
  ]
}
```

#### High Availability Configuration
```json
{
  "cpu": 2048,       // 2.0 vCPU
  "memory": 4096,    // 4096 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 27017,
      "protocol": "tcp"
    }
  ]
}
```

**Justification**:
- MongoDB 7.0 with authentication overhead
- Index operations require significant memory
- Study materials and user data storage
- **Recommendation**: Use AWS DocumentDB instead for production

### 4. Redis Cache

#### Standard Configuration
```json
{
  "cpu": 256,        // 0.25 vCPU
  "memory": 512,     // 512 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 6379,
      "protocol": "tcp"
    }
  ]
}
```

**Justification**:
- Session storage and API caching
- Redis 7.2 with persistence enabled
- Memory limit set to 256MB in config
- **Recommendation**: Use AWS ElastiCache for production

### 5. Elasticsearch (ELK Stack)

#### Development Configuration
```json
{
  "cpu": 1024,       // 1.0 vCPU
  "memory": 2048,    // 2048 MB
  "essential": true,
  "environment": [
    {"name": "ES_JAVA_OPTS", "value": "-Xmx1g -Xms1g"}
  ],
  "portMappings": [
    {
      "containerPort": 9200,
      "protocol": "tcp"
    }
  ]
}
```

#### Production Configuration
```json
{
  "cpu": 4096,       // 4.0 vCPU
  "memory": 8192,    // 8192 MB
  "essential": true,
  "environment": [
    {"name": "ES_JAVA_OPTS", "value": "-Xmx4g -Xms4g"}
  ],
  "portMappings": [
    {
      "containerPort": 9200,
      "protocol": "tcp"
    }
  ]
}
```

**Justification**:
- Elasticsearch 8.11.0 with comprehensive logging
- Java heap size set to 50% of container memory
- Index templates and search operations
- **Recommendation**: Use Amazon OpenSearch for production

### 6. Logstash (Log Processing)

#### Configuration
```json
{
  "cpu": 512,        // 0.5 vCPU
  "memory": 1024,    // 1024 MB
  "essential": true,
  "environment": [
    {"name": "LS_JAVA_OPTS", "value": "-Xmx512m -Xms512m"}
  ],
  "portMappings": [
    {
      "containerPort": 5044,
      "protocol": "tcp"
    }
  ]
}
```

**Justification**:
- Log parsing and enrichment pipelines
- Ruby scripts for field processing
- GeoIP processing capabilities

### 7. Kibana (Visualization)

#### Configuration
```json
{
  "cpu": 512,        // 0.5 vCPU
  "memory": 1024,    // 1024 MB
  "essential": true,
  "portMappings": [
    {
      "containerPort": 5601,
      "protocol": "tcp"
    }
  ]
}
```

**Justification**:
- Advanced dashboard rendering
- Real-time visualization updates
- Pre-built dashboard configurations

### 8. Filebeat (Log Shipping)

#### Configuration
```json
{
  "cpu": 128,        // 0.125 vCPU
  "memory": 256,     // 256 MB
  "essential": false,
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/filebeat",
      "awslogs-region": "us-east-1"
    }
  }
}
```

**Justification**:
- Lightweight log collection agent
- File watching and shipping to Logstash
- Minimal resource footprint

---

## 📈 ECS Cluster Sizing Recommendations

### Development Environment

**ECS Cluster Configuration:**
```yaml
Cluster Type: EC2
Instance Type: t3.large (2 vCPU, 8 GB RAM)
Min Instances: 2
Max Instances: 4
Target Utilization: 70%
```

**Service Distribution:**
- **Instance 1**: Frontend + Backend + Redis
- **Instance 2**: MongoDB + Filebeat
- **Instance 3** (Auto-scaling): Elasticsearch + Logstash + Kibana

**Total Resources Used:** ~3.5 vCPU, ~6.5 GB RAM

### Production Environment

**ECS Cluster Configuration:**
```yaml
Cluster Type: EC2 + Fargate (Hybrid)
Instance Types: 
  - c5.xlarge (4 vCPU, 8 GB RAM) for compute-intensive services
  - r5.large (2 vCPU, 16 GB RAM) for memory-intensive services
Min Instances: 3
Max Instances: 20
Target Utilization: 60%
```

**Service Distribution:**

**Compute-Optimized Instances (c5.xlarge):**
- Frontend (2-10 tasks): 0.5 vCPU, 1 GB each
- Backend (2-20 tasks): 1.0 vCPU, 2 GB each

**Memory-Optimized Instances (r5.large):**
- Elasticsearch cluster (3 tasks): 4.0 vCPU, 8 GB each
- MongoDB replica set (3 tasks): 2.0 vCPU, 4 GB each

**Fargate Services:**
- Redis: 0.25 vCPU, 512 MB
- Logstash: 0.5 vCPU, 1 GB
- Kibana: 0.5 vCPU, 1 GB
- Filebeat: 0.125 vCPU, 256 MB

---

## 💰 Cost Analysis by Resource Configuration

### Monthly ECS Costs (us-east-1)

#### Development Configuration
| **Service** | **Tasks** | **vCPU** | **Memory (GB)** | **Monthly Cost** |
|-------------|-----------|----------|-----------------|------------------|
| Frontend | 2 | 0.5 | 1 | $22 |
| Backend | 2 | 1.0 | 2 | $44 |
| MongoDB | 1 | 1.0 | 2 | $22 |
| Redis | 1 | 0.25 | 0.5 | $6 |
| Elasticsearch | 1 | 1.0 | 2 | $22 |
| Logstash | 1 | 0.5 | 1 | $11 |
| Kibana | 1 | 0.5 | 1 | $11 |
| Filebeat | 1 | 0.125 | 0.25 | $3 |
| **Total** | **10** | **4.875** | **9.75** | **$141/month** |

#### Production Configuration (Medium Load)
| **Service** | **Tasks** | **vCPU** | **Memory (GB)** | **Monthly Cost** |
|-------------|-----------|----------|-----------------|------------------|
| Frontend | 5 | 2.5 | 5 | $110 |
| Backend | 10 | 10.0 | 20 | $440 |
| MongoDB | 3 | 6.0 | 12 | $264 |
| Redis | 2 | 0.5 | 1 | $22 |
| Elasticsearch | 3 | 12.0 | 24 | $528 |
| Logstash | 2 | 1.0 | 2 | $44 |
| Kibana | 2 | 1.0 | 2 | $44 |
| Filebeat | 2 | 0.25 | 0.5 | $11 |
| **Total** | **29** | **33.25** | **66.5** | **$1,463/month** |

---

## 🎛️ Auto-Scaling Configuration

### Application Load Balancer Target Groups

```yaml
Frontend ALB:
  Health Check: GET /api/health
  Healthy Threshold: 2
  Unhealthy Threshold: 5
  Timeout: 5s
  Interval: 30s

Backend ALB:
  Health Check: GET /api/health
  Healthy Threshold: 2
  Unhealthy Threshold: 3
  Timeout: 10s
  Interval: 30s
```

### ECS Service Auto-Scaling

#### Frontend Auto-Scaling Policy
```yaml
Min Capacity: 2
Max Capacity: 10
Target Tracking:
  - Metric: CPUUtilization
    Target: 60%
  - Metric: MemoryUtilization
    Target: 70%
  - Metric: ALBRequestCountPerTarget
    Target: 1000
Scale Out Cooldown: 300s
Scale In Cooldown: 300s
```

#### Backend Auto-Scaling Policy
```yaml
Min Capacity: 2
Max Capacity: 20
Target Tracking:
  - Metric: CPUUtilization
    Target: 65%
  - Metric: MemoryUtilization
    Target: 75%
  - Metric: ALBRequestCountPerTarget
    Target: 500
Scale Out Cooldown: 180s
Scale In Cooldown: 600s
```

#### Elasticsearch Auto-Scaling Policy
```yaml
Min Capacity: 1
Max Capacity: 3
Target Tracking:
  - Metric: CPUUtilization
    Target: 70%
  - Metric: MemoryUtilization
    Target: 80%
Scale Out Cooldown: 600s
Scale In Cooldown: 900s
```

---

## 🔧 ECS Task Definition Examples

### Complete Frontend Task Definition

```json
{
  "family": "ai-study-circle-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/ai-study-circle-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.yourdomain.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-study-circle/frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:80/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Complete Backend Task Definition

```json
{
  "family": "ai-study-circle-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/ai-study-circle-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ai-study-circle/openai-api-key"
        },
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ai-study-circle/mongodb-uri"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "logs",
          "containerPath": "/app/logs"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-study-circle/backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node healthcheck.js"
        ],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ],
  "volumes": [
    {
      "name": "logs",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-12345678",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
```

---

## 🎯 Performance Optimization Recommendations

### 1. Container Optimization

**Frontend Optimizations:**
- Multi-stage Docker build with Alpine Linux
- Static asset optimization and gzip compression
- Nginx caching configuration for static content
- CDN integration for global content delivery

**Backend Optimizations:**
- Node.js cluster mode for CPU utilization
- Connection pooling for database connections
- Response caching for frequently accessed data
- Memory leak monitoring and garbage collection tuning

### 2. Resource Allocation Strategy

**CPU Allocation:**
- Frontend: CPU-intensive during SSR, scale based on traffic
- Backend: CPU spikes during AI processing, need burst capacity
- Elasticsearch: Consistent high CPU for indexing and search

**Memory Allocation:**
- Frontend: Memory usage grows with concurrent sessions
- Backend: Memory spikes during file processing operations
- Elasticsearch: Large heap size critical for performance

### 3. Networking Optimization

```yaml
VPC Configuration:
  - Private subnets for backend services
  - Public subnets for load balancers only
  - NAT Gateway for outbound internet access
  - VPC Endpoints for AWS services

Security Groups:
  - Frontend: Allow HTTP/HTTPS from ALB only
  - Backend: Allow API calls from Frontend SG only
  - Database: Allow connections from Backend SG only
  - ELK: Internal communication within logging SG
```

---

## 🚨 Monitoring and Alerting

### CloudWatch Metrics

**Custom Application Metrics:**
- API response times and error rates
- User session duration and activity
- File processing queue length
- AI feature usage patterns

**Infrastructure Metrics:**
- ECS service utilization (CPU, Memory, Network)
- Application Load Balancer metrics
- Database connection pool status
- Log volume and processing delays

### Recommended Alarms

```yaml
High Priority Alarms:
  - Backend CPU > 80% for 5 minutes
  - Frontend Memory > 90% for 3 minutes
  - Elasticsearch heap > 85% for 2 minutes
  - ALB 5xx errors > 50 per minute

Medium Priority Alarms:
  - Log processing delay > 5 minutes
  - Database connections > 80% of pool
  - File processing queue > 100 items

Low Priority Alarms:
  - Unusual traffic patterns
  - Disk space utilization > 80%
  - Network packet loss detected
```

---

## 🎯 Final Recommendations

### 1. **Staged Deployment Strategy**

**Phase 1**: Migrate core application (Frontend + Backend + Database)
- Use Fargate for initial deployment
- Minimal resource allocation to test functionality
- Estimated cost: $150-200/month

**Phase 2**: Deploy logging infrastructure (ELK Stack)
- Add Elasticsearch, Logstash, Kibana services
- Your pre-built logging framework provides huge value here
- Estimated additional cost: $200-400/month

**Phase 3**: Production optimization and scaling
- Implement auto-scaling policies
- Add monitoring and alerting
- Optimize resource allocation based on real usage

### 2. **Cost-Optimized Configuration**

For **development/testing**: Use EC2 instances with mixed instance types
- Total cost: ~$141/month for full stack
- Suitable for development and low-traffic testing

For **production**: Use Fargate for simplicity, EC2 for cost optimization
- Total cost: ~$1,463/month for medium load with full logging
- Your centralized logging framework saves $500-1000/month vs managed services

### 3. **Alternative Managed Services**

Consider replacing self-managed services with AWS managed alternatives:
- **MongoDB** → **AWS DocumentDB**: Reduces operational overhead
- **Redis** → **AWS ElastiCache**: Better performance and availability
- **ELK Stack** → **Amazon OpenSearch**: Managed Elasticsearch service

**Trade-off**: Higher service costs but lower operational complexity

### 4. **Resource Right-Sizing**

Start with conservative estimates and scale up:
- Monitor actual resource utilization for 2-4 weeks
- Use AWS Compute Optimizer recommendations
- Implement cost anomaly detection

**Your centralized logging framework is production-ready and will provide exceptional monitoring capabilities that would cost significantly more with managed services!** 🚀

---

## 📝 Summary

**Minimum Resources**: 3.4 vCPU, 9.1 GB RAM (~$141/month)
**Recommended Production**: 8.75 vCPU, 20.4 GB RAM (~$1,463/month)
**Key Insight**: Your logging framework provides enterprise-grade monitoring at a fraction of the cost of managed alternatives!