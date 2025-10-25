# AI Study Circle - ECS Container Resource Requirements
## Quick Reference Guide

### 📊 **Resource Requirements Summary**

Your AI Study Circle application requires the following CPU and RAM for ECS containers:

## **Core Application Services**

| Service | CPU (vCPU) | Memory (MB) | Purpose |
|---------|------------|-------------|---------|
| **Frontend (Next.js + Nginx)** | 0.25 - 0.5 | 512 - 1024 | React SSR, static assets |
| **Backend (Node.js Express)** | 0.5 - 1.0 | 1024 - 2048 | API, AI processing, file handling |
| **MongoDB** | 0.5 - 2.0 | 2048 - 4096 | Document database with auth |
| **Redis** | 0.25 | 256 - 512 | Session storage & caching |

## **ELK Logging Stack**

| Service | CPU (vCPU) | Memory (MB) | Purpose |
|---------|------------|-------------|---------|
| **Elasticsearch** | 1.0 - 4.0 | 2048 - 8192 | Log storage & search |
| **Logstash** | 0.5 | 1024 | Log processing pipeline |
| **Kibana** | 0.5 | 1024 | Visualization dashboards |
| **Filebeat** | 0.25 | 256 | Log collection agent |

---

## **💰 Cost Breakdown (AWS Fargate - us-east-1)**

### **Small Deployment** (100 DAU)
- **Total Resources**: 3.75 vCPU, 8 GB RAM
- **Monthly Cost**: **$137**
- **Use Case**: Development, testing, small production

### **Medium Deployment** (1,000 DAU)
- **Total Resources**: 5.5 vCPU, 12.5 GB RAM  
- **Monthly Cost**: **$203**
- **Use Case**: Production with moderate traffic

### **Large Deployment** (10,000 DAU)
- **Total Resources**: 10.5 vCPU, 22.5 GB RAM
- **Monthly Cost**: **$383**
- **Use Case**: High-traffic production

---

## **🎯 Key Insights & Recommendations**

### **Your Logging Framework Value**
- **ELK Stack Cost**: ~$80/month additional infrastructure
- **Managed Service Equivalent**: $800-2000/month (CloudWatch Insights, Datadog, etc.)
- **NET SAVINGS**: $720-1920/month 🚀
- **Your centralized logging framework provides exceptional ROI!**

### **Resource Optimization by Scale**

| User Scale | Recommended Setup | Monthly Cost | Best Strategy |
|------------|------------------|--------------|---------------|
| **< 500 users** | EC2 t3.large instances | $150-250 | EC2 + Self-managed ELK |
| **1K-5K users** | Mixed Fargate deployment | $400-800 | Fargate + Your ELK Stack |
| **5K+ users** | ECS + EC2 hybrid | $800-2000 | Hybrid + Amazon OpenSearch |

---

## **🔧 ECS Task Definition Examples**

### **Frontend Task (Production)**
```json
{
  "cpu": "512",           // 0.5 vCPU
  "memory": "1024",       // 1 GB RAM
  "essential": true,
  "image": "your-frontend:latest",
  "portMappings": [{"containerPort": 80}]
}
```

### **Backend Task (Production)**
```json
{
  "cpu": "1024",          // 1.0 vCPU  
  "memory": "2048",       // 2 GB RAM
  "essential": true,
  "image": "your-backend:latest",
  "portMappings": [{"containerPort": 5000}]
}
```

### **Elasticsearch Task**
```json
{
  "cpu": "1024",          // 1.0 vCPU
  "memory": "2048",       // 2 GB RAM
  "environment": [
    {"name": "ES_JAVA_OPTS", "value": "-Xmx1g -Xms1g"}
  ]
}
```

---

## **📈 Auto-Scaling Configuration**

### **Frontend Auto-Scaling**
```yaml
Min Tasks: 2
Max Tasks: 10
CPU Target: 60%
Memory Target: 70%
Scale Out: 300s
Scale In: 300s
```

### **Backend Auto-Scaling**  
```yaml
Min Tasks: 2
Max Tasks: 20
CPU Target: 65%
Memory Target: 75%
Scale Out: 180s
Scale In: 600s
```

---

## **🚀 Deployment Strategy**

### **Phase 1: Core Application** 
- Deploy Frontend + Backend + Database
- **Resources**: ~3 vCPU, 6 GB RAM
- **Cost**: ~$120/month

### **Phase 2: Add Logging**
- Deploy your ELK stack  
- **Additional**: +2.25 vCPU, +4.25 GB RAM
- **Additional Cost**: +$80/month
- **Value**: Replaces $800+ managed logging services!

### **Phase 3: Production Optimization**
- Implement auto-scaling
- Add monitoring & alerting
- Fine-tune resource allocation

---

## **🛠️ Quick Start Commands**

### **1. Build & Push Images**
```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ai-study-circle-frontend:latest
docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ai-study-circle-backend:latest
```

### **2. Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name ai-study-circle-cluster
```

### **3. Register Task Definitions**
```bash
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json
aws ecs register-task-definition --cli-input-json file://backend-task-def.json
```

### **4. Create Services**
```bash
aws ecs create-service --cluster ai-study-circle-cluster --service-name frontend --task-definition frontend
aws ecs create-service --cluster ai-study-circle-cluster --service-name backend --task-definition backend
```

---

## **📊 Resource Calculator**

Use the provided calculator to determine exact requirements for your use case:

```bash
node scripts/ecs-resource-calculator.js
```

**Input your**:
- Expected daily active users
- API requests per day  
- Environment (dev/staging/prod)
- Include ELK stack (recommended: Yes!)

---

## **⚡ Performance Considerations**

### **CPU Intensive Operations**
- **Frontend**: Server-side rendering (Next.js)
- **Backend**: OpenAI API processing, file parsing (PDF, DOCX)
- **Elasticsearch**: Index operations, search queries

### **Memory Intensive Operations**  
- **Backend**: File uploads, document processing
- **MongoDB**: Working set, indexes
- **Elasticsearch**: Java heap, field data cache

### **Network Considerations**
- **Frontend**: CDN integration for static assets
- **Backend**: Connection pooling for database
- **ELK**: Internal log shipping between components

---

## **🎯 Bottom Line**

**For a typical production deployment (1,000 DAU):**

- **Minimum Resources**: 5.5 vCPU, 12.5 GB RAM
- **Monthly Cost**: ~$203 on AWS Fargate  
- **Including**: Full application + comprehensive logging & monitoring
- **Value**: Your ELK stack saves $600-1400/month vs managed alternatives

**Your centralized logging framework is production-ready and provides enterprise-grade monitoring at a fraction of managed service costs!** 

Start with the medium configuration and scale based on actual usage patterns. The auto-scaling policies will handle traffic spikes automatically.

🚀 **Ready to deploy? Use the provided deployment scripts and task definitions to get started!**