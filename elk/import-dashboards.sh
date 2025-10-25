#!/bin/bash

# Dashboard Import Script for Kibana
# This script imports pre-configured dashboards into Kibana

KIBANA_URL="http://localhost:5601"
DASHBOARD_DIR="./kibana/dashboards"

echo "🚀 Starting Kibana Dashboard Import..."

# Wait for Kibana to be available
echo "⏳ Waiting for Kibana to be ready..."
until curl -f "$KIBANA_URL/api/status" > /dev/null 2>&1; do
    echo "   Kibana not ready yet, waiting 10 seconds..."
    sleep 10
done

echo "✅ Kibana is ready!"

# Import dashboards
import_dashboard() {
    local dashboard_file=$1
    local dashboard_name=$(basename "$dashboard_file" .json)
    
    echo "📊 Importing dashboard: $dashboard_name"
    
    response=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/_import" \
        -H "kbn-xsrf: true" \
        -H "Content-Type: application/json" \
        --form file=@"$dashboard_file" 2>&1)
    
    if [[ $? -eq 0 ]]; then
        echo "   ✅ Successfully imported $dashboard_name"
    else
        echo "   ❌ Failed to import $dashboard_name"
        echo "   Error: $response"
    fi
}

# Import all dashboard files
if [ -d "$DASHBOARD_DIR" ]; then
    for dashboard_file in "$DASHBOARD_DIR"/*.json; do
        if [ -f "$dashboard_file" ]; then
            import_dashboard "$dashboard_file"
        fi
    done
else
    echo "❌ Dashboard directory not found: $DASHBOARD_DIR"
    exit 1
fi

echo ""
echo "🎉 Dashboard import completed!"
echo "📊 Access your dashboards at: $KIBANA_URL/app/dashboards"
echo ""
echo "Available dashboards:"
echo "   • System Overview - Application health and errors"
echo "   • Performance Metrics - Response times and web vitals"
echo "   • User Activity - User interactions and engagement"