# Log Analysis & Alerting System Configuration

This directory contains the complete configuration for **Phase 6: Implement Log Analysis & Alerting** of the AI Study Circle centralized logging framework.

## 🔔 Elasticsearch Watcher Configuration

### Alert Types Configured

#### 1. **Critical Error Rate Alert** (`critical-error-rate-alert.json`)
- **Trigger**: Every 1 minute
- **Condition**: >10 critical errors in 5 minutes
- **Actions**: Email, Webhook, Logging
- **Throttle**: 5 minutes
- **Recipients**: Admin, DevOps teams

#### 2. **Performance Degradation Alert** (`performance-degradation-alert.json`)
- **Trigger**: Every 30 seconds
- **Condition**: Avg response >2s OR Max response >10s OR P95 >5s
- **Severity Levels**: Medium, High, Critical
- **Actions**: Conditional email/webhook based on severity
- **Throttle**: 2 minutes

#### 3. **Security Threat Alert** (`security-threat-alert.json`)
- **Trigger**: Every 30 seconds
- **Condition**: ≥5 high-risk security events in 1 minute
- **Features**:
  - GeoIP threat source analysis
  - Attack type categorization
  - Risk score assessment
- **Actions**: Email, Webhook, SMS (critical), PagerDuty
- **Throttle**: 1 minute

#### 4. **Anomaly Detection Alert** (`anomaly-detection-alert.json`)
- **Trigger**: Every 2 minutes
- **Features**:
  - ML-based pattern detection
  - Error rate anomalies
  - Response time anomalies
  - User activity anomalies
- **Condition**: ≥3 anomalies in 10-minute window
- **Actions**: Email, Webhook notifications

## 🚀 Setup Instructions

### 1. **Install Watcher Alerts**
```bash
# Navigate to watcher directory
cd elk/watcher

# Make setup script executable (Linux/Mac)
chmod +x setup-watcher.sh

# Run setup script
./setup-watcher.sh

# Or specify custom Elasticsearch URL
./setup-watcher.sh --url http://your-elasticsearch:9200
```

### 2. **Verify Installation**
```bash
# Check watcher status
./setup-watcher.sh --status

# Verify specific watches
./setup-watcher.sh --verify

# Test watch execution
./setup-watcher.sh --test
```

### 3. **Manual Installation** (Alternative)
```bash
# Install individual watches
curl -X PUT "localhost:9200/_watcher/watch/critical-error-rate-alert" \
  -H "Content-Type: application/json" \
  -d @watches/critical-error-rate-alert.json

curl -X PUT "localhost:9200/_watcher/watch/performance-degradation-alert" \
  -H "Content-Type: application/json" \
  -d @watches/performance-degradation-alert.json

curl -X PUT "localhost:9200/_watcher/watch/security-threat-alert" \
  -H "Content-Type: application/json" \
  -d @watches/security-threat-alert.json

curl -X PUT "localhost:9200/_watcher/watch/anomaly-detection-alert" \
  -H "Content-Type: application/json" \
  -d @watches/anomaly-detection-alert.json
```

## 📧 Notification Configuration

### 1. **Email Configuration**
Configure SMTP settings in Elasticsearch:
```yaml
# Add to elasticsearch.yml
xpack.notification.email:
  default_account: standard
  account:
    standard:
      profile: gmail
      smtp:
        auth: true
        starttls.enable: true
        host: smtp.gmail.com
        port: 587
        user: alerts@ai-study-circle.com
```

Store email password in keystore:
```bash
bin/elasticsearch-keystore add xpack.notification.email.account.standard.smtp.password
```

### 2. **Slack Integration**
Set up Slack webhook in your environment:
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Update webhook URLs in watch configurations as needed.

### 3. **SMS & PagerDuty**
Configure additional notification channels:
```bash
export SMS_API_KEY="your-twilio-api-key"
export PAGERDUTY_INTEGRATION_KEY="your-pagerduty-integration-key"
```

## 🛡️ Backend Alert Handler

### Alert Webhook Endpoints
The backend now includes webhook endpoints to receive alerts from Elasticsearch Watcher:

- **POST** `/api/alerts/error-rate` - Critical error rate alerts
- **POST** `/api/alerts/performance` - Performance degradation alerts  
- **POST** `/api/alerts/security` - Security threat alerts
- **POST** `/api/alerts/anomaly` - System anomaly alerts
- **GET** `/api/alerts/status` - Alert system status

### Notification Service Features
- **Multi-channel notifications**: Email, Slack, SMS, PagerDuty
- **Severity-based routing**: Different channels for different alert severities
- **HTML email templates**: Rich formatted alert emails
- **Throttling**: Prevents alert spam with intelligent throttling
- **Error handling**: Robust error handling with fallback mechanisms

## 🔧 Configuration Files

### Watcher Setup (`setup-watcher.sh`)
Automated setup script with features:
- ✅ Elasticsearch health checking
- ✅ Watcher service verification
- ✅ Automated watch installation
- ✅ Installation verification
- ✅ Watch execution testing
- ✅ Status monitoring

### Enhanced Docker Compose (`docker-compose.override.yml`)
Extended ELK stack with:
- **Watcher enabled** in Elasticsearch
- **MetricBeat** for system monitoring
- **APM Server** for application performance monitoring
- **Elasticsearch Head** for cluster management
- **Alertmanager** for external alert routing
- **Enhanced health checks** and dependency management

## 📊 Alert Thresholds

### Default Thresholds (Customizable)
```javascript
// Critical Error Rate
error_threshold: 10 errors / 5 minutes

// Performance Degradation  
response_time_warning: 2000ms average
response_time_critical: 5000ms average
max_response_critical: 10000ms

// Security Threats
high_risk_threshold: 5 events / 1 minute
critical_risk_score: 8.0 / 10.0

// Anomaly Detection
anomaly_threshold: 3 anomalies / 10 minutes
error_rate_anomaly: >5% error rate
response_anomaly: >3000ms response time
```

### Customizing Thresholds
Edit the watch JSON files and update condition values:
```json
{
  "condition": {
    "compare": {
      "ctx.payload.hits.total": {
        "gt": 10  // Change this value
      }
    }
  }
}
```

## 🔍 Monitoring & Troubleshooting

### Watch Execution History
View watch execution in Kibana:
```
GET _watcher/watch/critical-error-rate-alert/_history
```

### Common Issues

1. **Watcher Not Enabled**
   ```bash
   # Start watcher service
   POST _watcher/_start
   ```

2. **Email Notifications Failing**
   - Check SMTP credentials in keystore
   - Verify firewall settings
   - Test email configuration manually

3. **Watch Execution Errors**
   ```bash
   # Check watch execution status
   GET _watcher/stats
   
   # View specific watch details
   GET _watcher/watch/watch-name
   ```

4. **High Alert Volume**
   - Adjust throttle periods in watch configurations
   - Review and optimize alert conditions
   - Implement alert suppression rules

### Debug Commands
```bash
# Test watch execution manually
POST _watcher/watch/critical-error-rate-alert/_execute

# View cluster watcher statistics  
GET _watcher/stats

# List all configured watches
GET _watcher/_query/watches

# Delete a watch
DELETE _watcher/watch/watch-name
```

## 📈 Performance Considerations

### Elasticsearch Configuration
- **Minimum heap**: 2GB for Elasticsearch with Watcher
- **Watch frequency**: Balance between responsiveness and resource usage
- **Index patterns**: Use specific index patterns to reduce query scope
- **Field caching**: Ensure frequently queried fields are properly cached

### Alert Optimization
- **Aggregation queries**: Use efficient aggregations for better performance
- **Time ranges**: Limit time ranges to reduce query complexity
- **Throttling**: Implement appropriate throttling to prevent alert storms
- **Conditional actions**: Use conditions to prevent unnecessary notifications

## 🚨 Production Deployment

### Security Considerations
1. **Enable X-Pack Security** for production environments
2. **Use HTTPS** for all Elasticsearch communications
3. **Secure webhook endpoints** with authentication
4. **Rotate API keys** regularly for external services
5. **Limit watch privileges** to minimum required permissions

### High Availability
1. **Multi-node Elasticsearch cluster** for redundancy
2. **Load balancer** for Kibana and Elasticsearch
3. **Backup configurations** for watches and dashboards
4. **Monitor watch execution** and set up meta-alerts

### Scaling Considerations
1. **Dedicated watcher nodes** for large deployments
2. **Separate clusters** for logging vs alerting
3. **External notification services** for better reliability
4. **Alert aggregation** to reduce notification volume

## 📋 Next Steps

After setting up alerting:

1. **Test Alert Scenarios**
   - Trigger test conditions to verify alert delivery
   - Test different severity levels and notification channels

2. **Fine-tune Thresholds**
   - Monitor false positive rates
   - Adjust thresholds based on application behavior

3. **Implement SLA Monitoring**
   - Set up availability and performance SLA alerts
   - Create executive dashboards for SLA reporting

4. **Advanced Analytics**
   - Implement predictive alerting using ML features
   - Set up capacity planning alerts

5. **Incident Management Integration**
   - Connect to ITSM tools (ServiceNow, Jira)
   - Implement auto-remediation for common issues

## 🎯 Success Metrics

Track these metrics to measure alerting effectiveness:

- **Mean Time to Detection (MTTD)**: How quickly issues are detected
- **Mean Time to Resolution (MTTR)**: How quickly issues are resolved
- **False Positive Rate**: Percentage of alerts that are not actionable
- **Alert Coverage**: Percentage of incidents caught by monitoring
- **Notification Delivery Rate**: Success rate of alert notifications

The complete logging and alerting system is now ready for production use with comprehensive monitoring, intelligent alerting, and multi-channel notifications! 🎉