# Filebeat Configuration Guide for AI Study Circle

## 📋 Overview

This document provides comprehensive guidance on configuring Filebeat for the AI Study Circle logging infrastructure. Filebeat collects logs from various sources and ships them to Logstash for processing and enrichment.

## 🏗️ Architecture

```
[Application Logs] → [Filebeat] → [Logstash] → [Elasticsearch] → [Kibana]
```

## 📁 Configuration Structure

```
elk/filebeat/
├── filebeat.yml              # Main configuration
├── inputs.d/                 # Specialized input configurations
│   ├── performance-logs.yml  # Performance monitoring logs
│   ├── security-logs.yml     # Security event logs
│   └── user-activity-logs.yml# User behavior tracking logs
└── README-filebeat.md        # This documentation
```

## 🔧 Configuration Components

### 1. Main Configuration (`filebeat.yml`)

#### **Input Sources**
- **Backend Logs**: Winston JSON logs from Express server
- **Frontend Logs**: React application logs and user interactions
- **Docker Logs**: Container-based log collection
- **HTTP/TCP Inputs**: Real-time log streaming

#### **Log Processing Features**
- **Multiline Processing**: Stack trace consolidation
- **JSON Parsing**: Structured log data extraction
- **Field Enrichment**: Metadata and context addition
- **Performance Optimization**: Buffering and batching

### 2. Specialized Input Configurations

#### **Performance Logs (`performance-logs.yml`)**
- **Web Vitals Processing**: LCP, FID, CLS score calculation
- **Response Time Categorization**: Fast/Moderate/Slow/Very Slow
- **Performance Grade Assignment**: Good/Needs Improvement/Poor
- **Automated Tagging**: Performance issues identification

```yaml
# Performance scoring example
- script:
    source: |
      // LCP Score (Good: <=2.5s, Poor: >4.0s)
      if (perf.lcp <= 2500) {
        event.Put("performance.lcp_score", "good");
      } else if (perf.lcp <= 4000) {
        event.Put("performance.lcp_score", "needs_improvement");
      } else {
        event.Put("performance.lcp_score", "poor");
      }
```

#### **Security Logs (`security-logs.yml`)**
- **Authentication Event Detection**: Login/logout tracking
- **Authorization Monitoring**: Access control violations
- **Threat Analysis**: Suspicious activity patterns
- **Risk Scoring**: Automated security risk assessment

```yaml
# Risk scoring example
processors:
  - script:
      source: |
        var riskScore = 0;
        if (event.Get("auth_result") === "failure") riskScore += 3;
        if (event.Get("security_severity") === "high") riskScore += 5;
        event.Put("security.risk_score", riskScore);
```

#### **User Activity Logs (`user-activity-logs.yml`)**
- **Behavior Categorization**: Navigation/Interaction/Conversion
- **Engagement Scoring**: User activity value assessment
- **Session Analysis**: User journey tracking
- **Device Detection**: Mobile/Desktop/Tablet identification

### 3. Field Processing Pipeline

#### **Step 1: Input Collection**
```yaml
paths:
  - ../backend/logs/combined-*.log
  - ../frontend/logs/frontend-*.log
fields:
  service: backend
  log_source: file
  environment: development
```

#### **Step 2: JSON Parsing**
```yaml
json.keys_under_root: true
json.add_error_key: true
json.message_key: message
```

#### **Step 3: Multiline Processing**
```yaml
multiline.pattern: '^[[:space:]]+(at|Caused by|\.\.\.|more)'
multiline.negate: false
multiline.match: after
multiline.max_lines: 50
```

#### **Step 4: Field Enrichment**
```yaml
processors:
  - add_host_metadata
  - add_docker_metadata
  - user_agent:
      field: userAgent
      target_field: user_agent
  - geoip:
      field: ip
      target_field: geoip
```

#### **Step 5: Tagging and Classification**
```yaml
- add_tags:
    tags: [critical]
    when:
      equals:
        level: "error"
        
- add_tags:
    tags: [slow_response]
    when:
      range:
        responseTime:
          gte: 1000
```

## 📊 Log Data Structure

### **Expected Input Format**
```json
{
  "@timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info|warn|error",
  "message": "Log message",
  "service": "backend|frontend|auth|ai|translation",
  "userId": "user123",
  "sessionId": "session456",
  "ip": "192.168.1.1",
  "userAgent": "Browser info",
  "performance": {
    "lcp": 1200,
    "fid": 50,
    "cls": 0.1
  },
  "error": {
    "name": "ValidationError",
    "message": "Invalid input",
    "stack": "Error stack trace"
  }
}
```

### **Enhanced Output Format**
```json
{
  "@timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "message": "Authentication failed",
  "service": "auth",
  "log_source": "file",
  "environment": "development",
  "security_event_type": "authentication",
  "auth_result": "failure",
  "security": {
    "risk_score": 5,
    "risk_level": "medium"
  },
  "geoip": {
    "country_name": "United States",
    "city_name": "New York"
  },
  "user_agent": {
    "device": "Other",
    "name": "Chrome",
    "os": "Windows"
  },
  "tags": ["critical", "security_event", "auth_failure"]
}
```

## 🚀 Deployment and Testing

### **1. Start Filebeat**
```bash
# Using Docker Compose (recommended)
docker-compose up filebeat

# Or run the test
./test-filebeat.sh        # Linux/Mac
test-filebeat.bat         # Windows
```

### **2. Generate Test Logs**
```bash
# Backend test logs
echo '{"timestamp":"2024-01-15T10:30:00Z","level":"error","message":"Test error","service":"backend"}' >> ../backend/logs/test.log

# Frontend test logs  
echo '{"timestamp":"2024-01-15T10:30:00Z","level":"info","message":"Page view","action":"page_view","page":"/dashboard"}' >> ../frontend/logs/test.log
```

### **3. Verify Log Collection**
```bash
# Check Elasticsearch for collected logs
curl "http://localhost:9200/ai-study-logs-*/_search?q=message:Test&pretty"

# Check Kibana dashboards
# Open http://localhost:5601
```

## 🔍 Monitoring and Troubleshooting

### **Health Monitoring**
```bash
# Filebeat status endpoint
curl http://localhost:5066

# Registry status
docker exec filebeat filebeat export config

# View Filebeat logs
docker logs filebeat
```

### **Common Issues and Solutions**

#### **1. No Logs Appearing in Elasticsearch**
```bash
# Check Filebeat is reading files
docker logs filebeat | grep "Harvester started"

# Check Logstash connectivity
telnet localhost 5044

# Verify log file permissions
ls -la ../backend/logs/
```

#### **2. Multiline Logs Not Processing Correctly**
```yaml
# Adjust multiline pattern
multiline.pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
multiline.negate: true
multiline.match: after
```

#### **3. High Memory Usage**
```yaml
# Optimize queue settings
queue.mem:
  events: 2048
  flush.min_events: 256
  flush.timeout: 1s
```

#### **4. Slow Log Processing**
```yaml
# Increase harvest buffer
harvester_buffer_size: 32768

# Adjust scan frequency
scan_frequency: 5s

# Enable bulk processing
output.logstash:
  bulk_max_size: 2048
```

## 🔧 Performance Tuning

### **Resource Optimization**
```yaml
# Memory settings
queue.mem:
  events: 4096
  flush.min_events: 512
  flush.timeout: 1s

# CPU optimization
max_procs: 2

# Network optimization
output.logstash:
  compression_level: 3
  timeout: 30s
  bulk_max_size: 1000
```

### **Log Rotation Handling**
```yaml
# Close inactive files quickly
close_inactive: 5m

# Handle renamed files
close_renamed: true

# Clean old registry entries
clean_inactive: 24h
```

## 📈 Metrics and Analytics

### **Built-in Metrics**
- Harvester statistics
- Registry file counts
- Processing rates
- Error counts

### **Custom Metrics via Tags**
```yaml
# Tag slow logs
- add_tags:
    tags: [slow_processing]
    when:
      range:
        processing_time:
          gte: 1000

# Count by service
- add_fields:
    target: metrics
    fields:
      service_counter: 1
```

## 🔐 Security Considerations

### **File Permissions**
```bash
# Secure Filebeat configuration
chmod 600 filebeat.yml
chown filebeat:filebeat filebeat.yml

# Secure log directories
chmod 755 ../backend/logs/
chmod 644 ../backend/logs/*.log
```

### **Network Security**
```yaml
# TLS for Logstash connection
output.logstash:
  hosts: ["logstash:5044"]
  ssl.enabled: true
  ssl.certificate_authorities: ["/etc/ssl/certs/ca.crt"]
```

### **Data Privacy**
```yaml
# Exclude sensitive fields
processors:
  - drop_fields:
      fields: ["password", "credit_card", "ssn"]
  
# Hash user IDs
  - fingerprint:
      fields: ["userId"]
      target_field: "user_hash"
```

## 📚 Advanced Configuration

### **Custom Processors**
```yaml
processors:
  # Custom timestamp parsing
  - timestamp:
      field: custom_time
      layouts:
        - '2006-01-02 15:04:05'
      test:
        - '2024-01-15 10:30:45'

  # Conditional processing
  - if:
      equals:
        service: "frontend"
    then:
      - add_tags:
          tags: ["client-side"]
```

### **Multiple Outputs**
```yaml
# Send to both Logstash and file
output:
  logstash:
    hosts: ["logstash:5044"]
  file:
    path: "/backup/logs"
    filename: "backup-%{+yyyy-MM-dd}.log"
```

## 🎯 Best Practices

1. **Log Structure**: Use consistent JSON structure across all services
2. **Field Naming**: Follow ECS (Elastic Common Schema) conventions
3. **Performance**: Monitor Filebeat resource usage regularly
4. **Testing**: Use test scripts to validate configuration changes
5. **Monitoring**: Set up alerts for Filebeat health and performance
6. **Security**: Implement proper access controls and encryption
7. **Maintenance**: Regularly clean up old registry files and logs

## 📖 Related Documentation

- [ELK Stack Setup Guide](./README.md)
- [Logstash Configuration](./logstash/README.md)
- [Kibana Dashboards](./kibana/README.md)
- [Performance Monitoring](../docs/performance-monitoring.md)