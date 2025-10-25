#!/bin/bash

# Elasticsearch Watcher Setup Script
# Sets up alerting and monitoring watches for AI Study Circle

set -e

ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
WATCH_DIR="$(dirname "$0")/watches"
ELASTICSEARCH_TIMEOUT=30

echo "🔔 AI Study Circle - Watcher Setup Tool"
echo "======================================="

# Function to check if Elasticsearch is ready
check_elasticsearch_health() {
    echo "⏳ Checking Elasticsearch health..."
    
    local retries=0
    local max_retries=10
    
    while [ $retries -lt $max_retries ]; do
        if curl -sf "$ELASTICSEARCH_URL/_cluster/health" > /dev/null 2>&1; then
            echo "✅ Elasticsearch is healthy and ready"
            return 0
        fi
        
        retries=$((retries + 1))
        echo "   Attempt $retries/$max_retries - Waiting for Elasticsearch..."
        sleep 3
    done
    
    echo "❌ Elasticsearch is not responding after $max_retries attempts"
    echo "   Please ensure Elasticsearch is running at: $ELASTICSEARCH_URL"
    exit 1
}

# Function to check if Watcher is enabled
check_watcher_enabled() {
    echo "🔍 Checking Watcher status..."
    
    local watcher_status=$(curl -sf "$ELASTICSEARCH_URL/_watcher/stats" 2>/dev/null || echo "disabled")
    
    if echo "$watcher_status" | grep -q "watcher_state.*started" 2>/dev/null; then
        echo "✅ Watcher is enabled and running"
        return 0
    else
        echo "⚠️  Watcher is not enabled. Attempting to start..."
        
        # Try to start watcher
        local start_result=$(curl -sf -X POST "$ELASTICSEARCH_URL/_watcher/_start" 2>/dev/null || echo "failed")
        
        if echo "$start_result" | grep -q "acknowledged.*true" 2>/dev/null; then
            echo "✅ Watcher started successfully"
            return 0
        else
            echo "❌ Failed to start Watcher"
            echo "   Watcher may not be installed or configured properly"
            echo "   Please check your Elasticsearch configuration"
            exit 1
        fi
    fi
}

# Function to install a single watch
install_watch() {
    local watch_file="$1"
    local watch_name=$(basename "$watch_file" .json)
    
    echo "   🔔 Installing watch: $watch_name"
    
    # Check if watch already exists
    local watch_exists=$(curl -sf "$ELASTICSEARCH_URL/_watcher/watch/$watch_name" > /dev/null 2>&1 && echo "true" || echo "false")
    
    if [ "$watch_exists" = "true" ]; then
        echo "      ⚠️  Watch already exists, updating..."
    fi
    
    # Install or update the watch
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X PUT "$ELASTICSEARCH_URL/_watcher/watch/$watch_name" \
        -H "Content-Type: application/json" \
        -d @"$watch_file" 2>/dev/null)
    
    local http_status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3}).*/\1/')
    local response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')
    
    if [ "$http_status" -eq 200 ] || [ "$http_status" -eq 201 ]; then
        echo "      ✅ Successfully installed $watch_name"
        return 0
    else
        echo "      ❌ Failed to install $watch_name (HTTP $http_status)"
        echo "         Response: $response_body"
        return 1
    fi
}

# Function to install all watches
install_all_watches() {
    echo "🔔 Installing monitoring watches..."
    
    local success_count=0
    local total_count=0
    
    # Install watches in specific order
    local watches=(
        "critical-error-rate-alert.json"
        "performance-degradation-alert.json"
        "security-threat-alert.json"
        "anomaly-detection-alert.json"
    )
    
    for watch in "${watches[@]}"; do
        local watch_path="$WATCH_DIR/$watch"
        
        if [ -f "$watch_path" ]; then
            total_count=$((total_count + 1))
            
            if install_watch "$watch_path"; then
                success_count=$((success_count + 1))
            fi
        else
            echo "   ⚠️  Watch file not found: $watch"
        fi
    done
    
    echo ""
    echo "🔔 Installation Summary:"
    echo "   ✅ Successfully installed: $success_count/$total_count watches"
    
    if [ $success_count -eq $total_count ] && [ $total_count -gt 0 ]; then
        echo "   🎉 All watches installed successfully!"
        return 0
    else
        echo "   ⚠️  Some watches failed to install"
        return 1
    fi
}

# Function to verify watch installation
verify_watches() {
    echo "🔍 Verifying watch installation..."
    
    local watches=(
        "critical-error-rate-alert"
        "performance-degradation-alert"
        "security-threat-alert"
        "anomaly-detection-alert"
    )
    
    local verified_count=0
    
    for watch_name in "${watches[@]}"; do
        local exists=$(curl -sf "$ELASTICSEARCH_URL/_watcher/watch/$watch_name" > /dev/null 2>&1 && echo "true" || echo "false")
        
        if [ "$exists" = "true" ]; then
            echo "   ✅ $watch_name"
            verified_count=$((verified_count + 1))
        else
            echo "   ❌ $watch_name (not found)"
        fi
    done
    
    echo ""
    echo "🔍 Verification Summary: $verified_count/${#watches[@]} watches verified"
}

# Function to show watch status
show_watch_status() {
    echo "📊 Watch Status Overview:"
    echo "========================="
    
    local watch_stats=$(curl -sf "$ELASTICSEARCH_URL/_watcher/stats" 2>/dev/null || echo "{}")
    
    if echo "$watch_stats" | grep -q "watcher_state" 2>/dev/null; then
        echo "• Watcher Service: ✅ Running"
        
        # Get individual watch statuses
        local watches=(
            "critical-error-rate-alert"
            "performance-degradation-alert" 
            "security-threat-alert"
            "anomaly-detection-alert"
        )
        
        echo "• Individual Watches:"
        for watch_name in "${watches[@]}"; do
            local watch_info=$(curl -sf "$ELASTICSEARCH_URL/_watcher/watch/$watch_name" 2>/dev/null)
            
            if echo "$watch_info" | grep -q "_id" 2>/dev/null; then
                local status=$(echo "$watch_info" | grep -o '"active":[^,]*' | cut -d':' -f2 | tr -d ' ')
                if [ "$status" = "true" ]; then
                    echo "  ✅ $watch_name (Active)"
                else
                    echo "  ⚠️  $watch_name (Inactive)"
                fi
            else
                echo "  ❌ $watch_name (Not Found)"
            fi
        done
    else
        echo "• Watcher Service: ❌ Not Running"
    fi
}

# Function to test watch functionality
test_watches() {
    echo "🧪 Testing watch functionality..."
    
    local watches=(
        "critical-error-rate-alert"
        "performance-degradation-alert"
        "security-threat-alert"
        "anomaly-detection-alert"
    )
    
    for watch_name in "${watches[@]}"; do
        echo "   🧪 Testing $watch_name..."
        
        local test_result=$(curl -s -X POST "$ELASTICSEARCH_URL/_watcher/watch/$watch_name/_execute" \
            -H "Content-Type: application/json" \
            -d '{"trigger_data": {"triggered_time": "now"}}' 2>/dev/null)
        
        if echo "$test_result" | grep -q "watch_record" 2>/dev/null; then
            echo "      ✅ Test execution successful"
        else
            echo "      ⚠️  Test execution failed or no response"
        fi
    done
}

# Function to setup email configuration
setup_email_config() {
    echo "📧 Setting up email configuration..."
    
    # Create email account configuration
    cat > /tmp/email_account.json << 'EOF'
{
  "profile": "standard",
  "email_defaults": {
    "from": "alerts@ai-study-circle.com",
    "subject": "AI Study Circle Alert"
  },
  "smtp": {
    "auth": true,
    "starttls": {
      "enable": true
    },
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "alerts@ai-study-circle.com"
  }
}
EOF
    
    echo "   📧 Email account configuration created"
    echo "   ⚠️  Please update email credentials in Elasticsearch keystore:"
    echo "      bin/elasticsearch-keystore add xpack.notification.email.account.standard.smtp.password"
}

# Main execution
main() {
    echo "🎯 Target Elasticsearch URL: $ELASTICSEARCH_URL"
    echo ""
    
    # Check if watch directory exists
    if [ ! -d "$WATCH_DIR" ]; then
        echo "❌ Watch directory not found: $WATCH_DIR"
        exit 1
    fi
    
    # Execute setup process
    check_elasticsearch_health
    check_watcher_enabled
    setup_email_config
    
    if install_all_watches; then
        echo ""
        verify_watches
        echo ""
        show_watch_status
        echo ""
        
        echo "🎉 Watcher setup completed successfully!"
        echo ""
        echo "📋 Configured Alerts:"
        echo "   🔥 Critical Error Rate Alert (>10 errors/5min)"
        echo "   🐌 Performance Degradation Alert (>2s avg response)"
        echo "   🔒 Security Threat Alert (high-risk security events)"
        echo "   🔍 Anomaly Detection Alert (ML-based pattern detection)"
        echo ""
        echo "💡 Next Steps:"
        echo "   1. Configure email SMTP credentials in Elasticsearch keystore"
        echo "   2. Test alert notifications by triggering conditions"
        echo "   3. Customize alert thresholds based on your requirements"
        echo "   4. Set up additional notification channels (Slack, PagerDuty)"
        echo "   5. Monitor watch execution history in Kibana"
        
        exit 0
    else
        echo ""
        echo "❌ Watcher setup failed"
        echo ""
        echo "🔧 Troubleshooting:"
        echo "   1. Verify Elasticsearch is running: $ELASTICSEARCH_URL"
        echo "   2. Check if X-Pack and Watcher are installed and licensed"
        echo "   3. Ensure proper cluster permissions for watcher operations"
        echo "   4. Review Elasticsearch logs for detailed error messages"
        echo "   5. Verify JSON syntax in watch configuration files"
        
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h              Show this help message"
        echo "  --verify, -v            Only verify existing watches"
        echo "  --status, -s            Show watch status overview"
        echo "  --test, -t              Test watch functionality"
        echo "  --url <elasticsearch_url> Specify Elasticsearch URL"
        echo ""
        echo "Environment Variables:"
        echo "  ELASTICSEARCH_URL       Elasticsearch server URL"
        echo ""
        echo "Examples:"
        echo "  $0                      # Install with default settings"
        echo "  $0 --status             # Check watch status"
        echo "  $0 --test               # Test watch execution"
        echo "  ELASTICSEARCH_URL=http://es:9200 $0  # Use custom URL"
        exit 0
        ;;
    --verify|-v)
        check_elasticsearch_health
        verify_watches
        exit 0
        ;;
    --status|-s)
        check_elasticsearch_health
        show_watch_status
        exit 0
        ;;
    --test|-t)
        check_elasticsearch_health
        test_watches
        exit 0
        ;;
    --url)
        if [ -n "${2:-}" ]; then
            ELASTICSEARCH_URL="$2"
            shift 2
        else
            echo "❌ --url requires a URL argument"
            exit 1
        fi
        ;;
    "")
        # No arguments, proceed with main execution
        ;;
    *)
        echo "❌ Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

# Run main function
main