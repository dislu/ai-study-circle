#!/bin/bash

# Kibana Dashboard Import Script
# Imports all advanced dashboards into Kibana

set -e

KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
DASHBOARD_DIR="$(dirname "$0")"
KIBANA_TIMEOUT=30

echo "🚀 AI Study Circle - Kibana Dashboard Import Tool"
echo "================================================="

# Function to check if Kibana is ready
check_kibana_health() {
    echo "⏳ Checking Kibana health..."
    
    local retries=0
    local max_retries=10
    
    while [ $retries -lt $max_retries ]; do
        if curl -sf "$KIBANA_URL/api/status" > /dev/null 2>&1; then
            echo "✅ Kibana is healthy and ready"
            return 0
        fi
        
        retries=$((retries + 1))
        echo "   Attempt $retries/$max_retries - Waiting for Kibana..."
        sleep 3
    done
    
    echo "❌ Kibana is not responding after $max_retries attempts"
    echo "   Please ensure Kibana is running at: $KIBANA_URL"
    exit 1
}

# Function to create index pattern if it doesn't exist
create_index_pattern() {
    echo "📊 Setting up index pattern..."
    
    local index_pattern_exists=$(curl -sf "$KIBANA_URL/api/saved_objects/index-pattern/ai-study-logs-*" > /dev/null 2>&1 && echo "true" || echo "false")
    
    if [ "$index_pattern_exists" = "false" ]; then
        echo "   Creating ai-study-logs-* index pattern..."
        
        curl -X POST "$KIBANA_URL/api/saved_objects/index-pattern/ai-study-logs-*" \
            -H "Content-Type: application/json" \
            -H "kbn-xsrf: true" \
            -d '{
                "attributes": {
                    "title": "ai-study-logs-*",
                    "timeFieldName": "@timestamp",
                    "fields": "[]"
                }
            }' > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Index pattern created successfully"
        else
            echo "⚠️  Index pattern creation failed (may already exist)"
        fi
    else
        echo "✅ Index pattern already exists"
    fi
}

# Function to import a single dashboard
import_dashboard() {
    local dashboard_file="$1"
    local dashboard_name=$(basename "$dashboard_file" .json)
    
    echo "   📈 Importing $dashboard_name..."
    
    local temp_file=$(mktemp)
    
    # Import dashboard with proper error handling
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$KIBANA_URL/api/saved_objects/_import" \
        -H "kbn-xsrf: true" \
        --form "file=@$dashboard_file" 2>/dev/null)
    
    local http_status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3}).*/\1/')
    local response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]{3}$//')
    
    if [ "$http_status" -eq 200 ] || [ "$http_status" -eq 201 ]; then
        echo "      ✅ Successfully imported $dashboard_name"
        return 0
    else
        echo "      ❌ Failed to import $dashboard_name (HTTP $http_status)"
        echo "         Response: $response_body"
        return 1
    fi
}

# Function to import all dashboards
import_all_dashboards() {
    echo "📊 Importing advanced dashboards..."
    
    local success_count=0
    local total_count=0
    
    # Import dashboards in specific order for dependencies
    local dashboards=(
        "application-health-monitoring.json"
        "security-operations-center.json"
        "performance-analytics-hub.json"
        "user-behavior-analytics.json"
        "error-tracking-diagnostics.json"
    )
    
    for dashboard in "${dashboards[@]}"; do
        local dashboard_path="$DASHBOARD_DIR/$dashboard"
        
        if [ -f "$dashboard_path" ]; then
            total_count=$((total_count + 1))
            
            if import_dashboard "$dashboard_path"; then
                success_count=$((success_count + 1))
            fi
        else
            echo "   ⚠️  Dashboard file not found: $dashboard"
        fi
    done
    
    echo ""
    echo "📊 Import Summary:"
    echo "   ✅ Successfully imported: $success_count/$total_count dashboards"
    
    if [ $success_count -eq $total_count ] && [ $total_count -gt 0 ]; then
        echo "   🎉 All dashboards imported successfully!"
        return 0
    else
        echo "   ⚠️  Some dashboards failed to import"
        return 1
    fi
}

# Function to verify dashboard import
verify_dashboards() {
    echo "🔍 Verifying dashboard import..."
    
    local dashboards=(
        "application-health-monitoring"
        "security-operations-center"
        "performance-analytics-hub"
        "user-behavior-analytics-dashboard"
        "error-tracking-dashboard"
    )
    
    local verified_count=0
    
    for dashboard_id in "${dashboards[@]}"; do
        local exists=$(curl -sf "$KIBANA_URL/api/saved_objects/dashboard/$dashboard_id" > /dev/null 2>&1 && echo "true" || echo "false")
        
        if [ "$exists" = "true" ]; then
            echo "   ✅ $dashboard_id"
            verified_count=$((verified_count + 1))
        else
            echo "   ❌ $dashboard_id (not found)"
        fi
    done
    
    echo ""
    echo "🔍 Verification Summary: $verified_count/${#dashboards[@]} dashboards verified"
}

# Function to display dashboard URLs
show_dashboard_urls() {
    echo "🌐 Dashboard URLs:"
    echo "=================="
    echo "• Application Health:    $KIBANA_URL/app/kibana#/dashboard/application-health-monitoring"
    echo "• Security Operations:   $KIBANA_URL/app/kibana#/dashboard/security-operations-center"
    echo "• Performance Analytics: $KIBANA_URL/app/kibana#/dashboard/performance-analytics-dashboard"
    echo "• User Behavior:         $KIBANA_URL/app/kibana#/dashboard/user-behavior-analytics-dashboard"
    echo "• Error Tracking:        $KIBANA_URL/app/kibana#/dashboard/error-tracking-dashboard"
    echo ""
    echo "📋 Kibana Home:         $KIBANA_URL/app/kibana#/home"
}

# Main execution
main() {
    echo "🎯 Target Kibana URL: $KIBANA_URL"
    echo ""
    
    # Check if dashboard directory exists
    if [ ! -d "$DASHBOARD_DIR" ]; then
        echo "❌ Dashboard directory not found: $DASHBOARD_DIR"
        exit 1
    fi
    
    # Execute import process
    check_kibana_health
    create_index_pattern
    
    if import_all_dashboards; then
        echo ""
        verify_dashboards
        echo ""
        show_dashboard_urls
        echo ""
        echo "🎉 Dashboard import completed successfully!"
        echo ""
        echo "💡 Next Steps:"
        echo "   1. Start your application to generate logs"
        echo "   2. Access the dashboards using the URLs above"
        echo "   3. Configure alerting for critical metrics"
        echo "   4. Set up automated reporting schedules"
        
        exit 0
    else
        echo ""
        echo "❌ Dashboard import failed"
        echo ""
        echo "🔧 Troubleshooting:"
        echo "   1. Verify Kibana is running: $KIBANA_URL"
        echo "   2. Check Elasticsearch cluster health"
        echo "   3. Ensure proper permissions for dashboard import"
        echo "   4. Review Kibana logs for detailed error messages"
        
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --verify, -v        Only verify existing dashboards"
        echo "  --url <kibana_url>  Specify Kibana URL (default: http://localhost:5601)"
        echo ""
        echo "Environment Variables:"
        echo "  KIBANA_URL          Kibana server URL"
        echo ""
        echo "Examples:"
        echo "  $0                           # Import with default settings"
        echo "  $0 --url http://kibana:5601  # Import to custom Kibana URL"
        echo "  KIBANA_URL=http://kibana:5601 $0  # Use environment variable"
        exit 0
        ;;
    --verify|-v)
        check_kibana_health
        verify_dashboards
        exit 0
        ;;
    --url)
        if [ -n "${2:-}" ]; then
            KIBANA_URL="$2"
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