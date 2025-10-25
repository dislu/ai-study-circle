# Advanced Kibana Dashboards Configuration

This directory contains sophisticated Kibana dashboard configurations for comprehensive monitoring of the AI Study Circle application. These dashboards utilize the enriched log data from our enhanced Filebeat processing system.

## Available Dashboards

### 1. Application Health Monitoring (`application-health-monitoring.json`)
**Purpose**: Real-time application health overview with system status monitoring
**Key Features**:
- System Health Score gauge with performance indicators
- Error Rate trend analysis with threshold alerts
- Service Status grid showing individual component health
- Response Time heatmap for performance visualization
- Real-time log stream with live updates
- Critical Alerts timeline for incident tracking
- API Endpoint performance analysis
- Database Query performance metrics
- Memory & CPU usage monitoring

**Refresh Rate**: 5 seconds
**Time Range**: Last 24 hours

### 2. Security Operations Center (`security-operations-center.json`)
**Purpose**: Advanced security monitoring with threat detection and incident management
**Key Features**:
- Security Risk Score gauge based on threat assessment
- Threat Level Distribution pie chart
- Authentication Success Rate metrics
- Active Security Incidents counter
- Geographic Threat Map with GeoIP visualization
- Failed Authentication Timeline analysis
- Top Attack Vectors identification
- User Activity Anomalies detection
- Access Control Violations tracking
- Security Events log stream
- Rate Limiting Events monitoring

**Refresh Rate**: 5 seconds
**Time Range**: Last 24 hours
**Data Sources**: Enhanced security logs with risk scoring

### 3. Performance Analytics Hub (`performance-analytics-hub.json`)
**Purpose**: Comprehensive performance monitoring with Core Web Vitals and resource optimization
**Key Features**:
- Performance Score gauge for overall system performance
- Core Web Vitals Status table (LCP, FID, CLS)
- API Response Times analysis by endpoint
- Database Query Performance metrics
- Performance Trends over time
- Resource Usage Heatmap
- Slowest Endpoints identification
- Memory & CPU Utilization monitoring
- Network Performance analysis
- Performance Anomalies detection
- Page Load Metrics tracking

**Refresh Rate**: 10 seconds
**Time Range**: Last 24 hours
**Data Sources**: Performance logs with Core Web Vitals integration

### 4. User Behavior Analytics (`user-behavior-analytics.json`)
**Purpose**: User engagement tracking with session analytics and learning patterns
**Key Features**:
- Active User Sessions counter
- User Engagement Score gauge
- Session Duration Distribution histogram
- Learning Progress Score metrics
- User Journey Flow visualization
- Feature Usage Heatmap by time and feature
- Most Active Features analysis
- User Device & Browser Statistics
- Geographic User Distribution
- Recent User Activities log
- Learning Completion Rates tracking

**Refresh Rate**: 30 seconds
**Time Range**: Last 7 days
**Data Sources**: User behavior logs with engagement scoring

### 5. Error Tracking & Diagnostics (`error-tracking-diagnostics.json`)
**Purpose**: Comprehensive error monitoring with diagnostic insights and resolution tracking
**Key Features**:
- Error Rate gauge with percentage calculation
- Critical Error Count for recent incidents
- Error by Severity distribution
- Mean Time to Resolution metrics
- Error Trend Analysis over time
- Error Distribution by Service
- Top Error Messages identification
- Error Frequency by Endpoint analysis
- User Impact Analysis
- Recent Error Events log
- Error Stack Traces for debugging

**Refresh Rate**: 30 seconds
**Time Range**: Last 24 hours
**Data Sources**: Error logs with severity classification

## Installation Instructions

### 1. Import Dashboards via Kibana UI
```bash
# Navigate to Kibana Management
http://localhost:5601/app/management/kibana/objects

# Import each JSON file:
1. Click "Import"
2. Select dashboard JSON file
3. Choose "Create new objects" or "Check for existing objects"
4. Click "Import"
```

### 2. Import via Elasticsearch API
```bash
# Import all dashboards at once
for file in advanced/*.json; do
    curl -X POST "localhost:5601/api/saved_objects/_import" \
    -H "Content-Type: application/json" \
    -H "kbn-xsrf: true" \
    --form file=@"$file"
done
```

### 3. Automated Import Script
```bash
#!/bin/bash
# create-dashboards.sh

KIBANA_URL="http://localhost:5601"
DASHBOARD_DIR="./advanced"

echo "Importing Kibana dashboards..."

for dashboard in "$DASHBOARD_DIR"/*.json; do
    echo "Importing $(basename "$dashboard")..."
    
    curl -X POST "$KIBANA_URL/api/saved_objects/_import" \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        --form file=@"$dashboard"
    
    echo "✓ Imported $(basename "$dashboard")"
done

echo "All dashboards imported successfully!"
```

## Configuration Requirements

### Index Patterns
Ensure the following index patterns exist in Kibana:
- `ai-study-logs-*` - Main log index pattern
- Field mappings should include:
  - `@timestamp` (date)
  - `level` (keyword)
  - `service` (keyword)
  - `performance.*` (nested objects)
  - `security.*` (nested objects)
  - `user_behavior.*` (nested objects)

### Field Mappings
Critical fields for dashboard functionality:
```json
{
  "performance": {
    "score": "float",
    "core_web_vitals": {
      "lcp": "float",
      "fid": "float",
      "cls": "float"
    },
    "database": {
      "query_time": "float"
    }
  },
  "security": {
    "risk_score": "float",
    "risk_level": "keyword"
  },
  "user_behavior": {
    "engagement_score": "float",
    "session_duration": "integer",
    "learning_progress": "float"
  },
  "geoip": {
    "location": "geo_point"
  }
}
```

## Customization Guide

### 1. Modify Refresh Rates
Edit the `refreshInterval` property in each dashboard:
```json
"refreshInterval": {
  "pause": false,
  "value": 30000  // 30 seconds
}
```

### 2. Adjust Time Ranges
Modify the `timeFrom` and `timeTo` properties:
```json
"timeFrom": "now-24h",
"timeTo": "now"
```

### 3. Add Custom Visualizations
1. Create visualization in Kibana UI
2. Export the visualization object
3. Add to dashboard's `references` array
4. Update `panelsJSON` with new panel configuration

### 4. Configure Alerts
Set up Watcher alerts for critical thresholds:
```json
{
  "trigger": {
    "schedule": {
      "interval": "1m"
    }
  },
  "input": {
    "search": {
      "request": {
        "indices": ["ai-study-logs-*"],
        "body": {
          "query": {
            "bool": {
              "must": [
                {"terms": {"level": ["error", "critical"]}},
                {"range": {"@timestamp": {"gte": "now-5m"}}}
              ]
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.hits.total": {
        "gt": 10
      }
    }
  }
}
```

## Best Practices

### 1. Performance Optimization
- Use appropriate time ranges for each dashboard
- Implement data lifecycle management
- Configure index rollover policies
- Use sampling for high-volume logs

### 2. Security Considerations
- Implement role-based access control
- Use Kibana Spaces for multi-tenancy
- Enable audit logging
- Configure field-level security

### 3. Maintenance
- Regular dashboard performance reviews
- Update visualizations based on new log fields
- Monitor Elasticsearch cluster health
- Backup dashboard configurations

### 4. Alerting Strategy
- Set up critical error rate thresholds
- Configure performance degradation alerts
- Implement security incident notifications
- Create SLA monitoring alerts

## Troubleshooting

### Common Issues
1. **Missing Data**: Verify Filebeat is running and index patterns exist
2. **Slow Dashboards**: Check time ranges and add filters to reduce data volume
3. **Visualization Errors**: Ensure field mappings match visualization requirements
4. **Authentication Issues**: Verify Elasticsearch security settings

### Debug Commands
```bash
# Check index health
curl -X GET "localhost:9200/_cat/indices/ai-study-logs-*?v"

# Verify field mappings
curl -X GET "localhost:9200/ai-study-logs-*/_mapping"

# Test search query
curl -X GET "localhost:9200/ai-study-logs-*/_search?q=level:error"
```

## Next Steps

After importing these dashboards, proceed with:
1. **Phase 6: Implement Log Analysis & Alerting**
2. Set up automated anomaly detection
3. Configure notification channels (Slack, email, PagerDuty)
4. Implement SLA monitoring and reporting
5. Create custom alert rules for business metrics