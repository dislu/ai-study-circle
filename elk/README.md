# ELK Stack Deployment Guide

## 📋 Prerequisites

Before deploying the ELK stack, ensure you have:

- **Docker Desktop** installed and running
- **Docker Compose** v2.0+
- **Git Bash** (for Windows users running shell scripts)
- **curl** command available
- At least **4GB** of available RAM
- At least **10GB** of free disk space

## 🚀 Quick Start

### 1. Start the ELK Stack

```bash
# Navigate to ELK directory
cd elk

# Start all services (Linux/Mac)
./elk-manager.sh start

# OR Start all services (Windows)
elk-manager.bat start
```

### 2. Verify Services

```bash
# Check service status
./elk-manager.sh status

# View logs
./elk-manager.sh logs
```

### 3. Import Dashboards

```bash
# Wait for all services to be ready (about 2-3 minutes)
# Then import dashboards
./import-dashboards.sh

# OR on Windows
import-dashboards.bat
```

### 4. Access Kibana

Open your browser and navigate to:
- **Kibana Dashboard**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200
- **Logstash**: http://localhost:5044 (for log input)

## 🔧 Service Details

### Elasticsearch
- **Port**: 9200
- **Data Volume**: `elasticsearch-data`
- **Memory**: 1GB heap size
- **Index Templates**: Auto-created for `ai-study-logs-*`

### Logstash
- **HTTP Input**: Port 5044
- **TCP Input**: Port 5000
- **File Input**: Monitors log files
- **Pipeline**: Processes and enriches logs

### Kibana
- **Port**: 5601
- **Dashboards**: Pre-configured for system monitoring
- **Index Pattern**: `ai-study-logs-*`

### Filebeat
- **Log Collection**: Backend and frontend logs
- **Docker Logs**: Container log collection
- **Output**: Sends to Logstash

## 📊 Pre-configured Dashboards

### 1. System Overview
- Log levels distribution
- Error rate timeline
- Service-wise log counts
- Recent errors table

### 2. Performance Metrics
- API response times
- Web vitals (LCP, FID, CLS)
- Memory usage trends
- Endpoint performance analysis

### 3. User Activity
- User action distribution
- Page views timeline
- Session duration analysis
- Popular pages ranking

## 🔍 Log Data Structure

The system expects logs in the following format:

```json
{
  "@timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info|warn|error",
  "message": "Log message",
  "service": "backend|frontend|auth|ai|translation",
  "userId": "user123",
  "sessionId": "session456",
  "action": "page_view|click|form_submit|api_call",
  "page": "/dashboard",
  "url": "/api/translate",
  "method": "GET|POST|PUT|DELETE",
  "statusCode": 200,
  "responseTime": 150,
  "userAgent": "Browser info",
  "ip": "192.168.1.1",
  "performance": {
    "lcp": 1200,
    "fid": 50,
    "cls": 0.1,
    "memory": {
      "usedJSHeapSize": 50000000
    }
  },
  "error": {
    "name": "ValidationError",
    "message": "Invalid input",
    "stack": "Error stack trace"
  }
}
```

## 🛠️ Management Commands

### Start Services
```bash
./elk-manager.sh start
```

### Stop Services
```bash
./elk-manager.sh stop
```

### View Status
```bash
./elk-manager.sh status
```

### View Logs
```bash
./elk-manager.sh logs [service_name]
```

### Clean Up
```bash
./elk-manager.sh cleanup
```

### Restart Single Service
```bash
docker-compose restart elasticsearch
docker-compose restart logstash
docker-compose restart kibana
docker-compose restart filebeat
```

## 🔧 Configuration Files

### Elasticsearch
- `elasticsearch/elasticsearch.yml` - Main configuration
- `elasticsearch/ai-study-logs-template.json` - Index template

### Logstash
- `logstash/logstash.conf` - Pipeline configuration
- `logstash/patterns/` - Custom log patterns

### Kibana
- `kibana/kibana.yml` - Main configuration
- `kibana/dashboards/` - Pre-built dashboards

### Filebeat
- `filebeat/filebeat.yml` - Log collection configuration

## 🚨 Troubleshooting

### Services Won't Start
1. Check Docker is running
2. Verify port availability (5601, 9200, 5044, 5000)
3. Increase Docker memory limits
4. Check disk space

### Elasticsearch Issues
```bash
# Check Elasticsearch health
curl -X GET "localhost:9200/_cluster/health?pretty"

# View cluster status
curl -X GET "localhost:9200/_cat/nodes?v"
```

### Logstash Issues
```bash
# Check Logstash pipeline
curl -X GET "localhost:9600/_node/pipelines/main?pretty"

# View Logstash logs
docker-compose logs logstash
```

### Kibana Issues
```bash
# Check Kibana status
curl -X GET "localhost:5601/api/status"

# View Kibana logs
docker-compose logs kibana
```

### No Data in Dashboards
1. Verify log files are being generated
2. Check Filebeat is collecting logs
3. Confirm Logstash is processing logs
4. Verify Elasticsearch indices exist

```bash
# Check indices
curl -X GET "localhost:9200/_cat/indices?v"

# Check index data
curl -X GET "localhost:9200/ai-study-logs-*/_search?pretty"
```

## 📈 Performance Tuning

### Elasticsearch Optimization
- Increase heap size for large datasets
- Adjust refresh intervals
- Configure appropriate shards and replicas

### Logstash Optimization
- Increase worker threads
- Configure batch sizes
- Add pipeline parallelism

### Kibana Optimization
- Set appropriate refresh intervals
- Use time-based indices
- Optimize visualizations

## 🔐 Security Notes

**⚠️ Development Setup**: This configuration disables security for easier development. For production:

1. Enable Elasticsearch security
2. Configure SSL/TLS certificates
3. Set up authentication and authorization
4. Configure network security
5. Enable audit logging

## 📚 Additional Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Filebeat Documentation](https://www.elastic.co/guide/en/beats/filebeat/current/index.html)