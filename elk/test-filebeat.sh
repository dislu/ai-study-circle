#!/bin/bash

# Filebeat Log Collection Testing Script
# This script tests various log scenarios to ensure proper collection and parsing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_LOG_DIR="../backend/logs"
FRONTEND_LOG_DIR="../frontend/logs" 
ELASTICSEARCH_URL="http://localhost:9200"
LOGSTASH_URL="http://localhost:5044"

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Filebeat Log Collection Test Suite   ${NC}" 
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create test log directories if they don't exist
setup_test_directories() {
    print_step "Setting up test directories..."
    
    mkdir -p "$BACKEND_LOG_DIR"
    mkdir -p "$FRONTEND_LOG_DIR"
    
    print_success "Test directories created"
}

# Generate sample backend logs
generate_backend_logs() {
    print_step "Generating sample backend logs..."
    
    local log_file="$BACKEND_LOG_DIR/test-backend.log"
    
    # Sample Winston-style JSON logs
    cat > "$log_file" << 'EOF'
{"timestamp":"2024-01-15T10:30:00.000Z","level":"info","message":"Server started","service":"backend","port":5000}
{"timestamp":"2024-01-15T10:30:15.123Z","level":"info","message":"User login attempt","service":"auth","userId":"user123","ip":"192.168.1.100","userAgent":"Mozilla/5.0 Chrome/120.0"}
{"timestamp":"2024-01-15T10:30:16.456Z","level":"info","message":"Login successful","service":"auth","userId":"user123","sessionId":"sess_abc123"}
{"timestamp":"2024-01-15T10:30:30.789Z","level":"info","message":"API request","service":"backend","method":"GET","url":"/api/dashboard","statusCode":200,"responseTime":150,"userId":"user123"}
{"timestamp":"2024-01-15T10:31:00.012Z","level":"warn","message":"Slow API response","service":"backend","method":"POST","url":"/api/translate","statusCode":200,"responseTime":3500,"userId":"user123"}
{"timestamp":"2024-01-15T10:31:15.345Z","level":"error","message":"Database connection failed","service":"backend","error":{"name":"ConnectionError","message":"Unable to connect to MongoDB","stack":"ConnectionError: Unable to connect\n    at Database.connect (db.js:45:12)"}}
{"timestamp":"2024-01-15T10:31:30.678Z","level":"info","message":"Translation request","service":"translation","sourceLanguage":"en","targetLanguage":"hi","textLength":150,"processingTime":800}
{"timestamp":"2024-01-15T10:32:00.901Z","level":"info","message":"AI model request","service":"ai","model":"gpt-3.5-turbo","tokensUsed":450,"estimatedCost":0.0009,"processingTime":1200}
{"timestamp":"2024-01-15T10:32:15.234Z","level":"error","message":"Rate limit exceeded","service":"auth","ip":"203.0.113.5","endpoint":"/auth/login","attempts":6,"timeWindow":"60s"}
{"timestamp":"2024-01-15T10:32:30.567Z","level":"info","message":"User logout","service":"auth","userId":"user123","sessionId":"sess_abc123","sessionDuration":120000}
EOF

    print_success "Backend logs generated: $(wc -l < "$log_file") lines"
}

# Generate sample frontend logs
generate_frontend_logs() {
    print_step "Generating sample frontend logs..."
    
    local log_file="$FRONTEND_LOG_DIR/test-frontend.log"
    
    # Sample React frontend logs
    cat > "$log_file" << 'EOF'
{"timestamp":"2024-01-15T10:30:05.000Z","level":"info","message":"App initialized","service":"frontend","page":"/dashboard","userId":"user123","sessionId":"sess_abc123"}
{"timestamp":"2024-01-15T10:30:10.123Z","level":"info","message":"User action","service":"frontend","action":"page_view","page":"/dashboard","userId":"user123","sessionId":"sess_abc123","userAgent":"Mozilla/5.0 Chrome/120.0"}
{"timestamp":"2024-01-15T10:30:25.456Z","level":"info","message":"Performance metrics","service":"frontend","performance":{"lcp":1200,"fid":50,"cls":0.08,"memory":{"usedJSHeapSize":48000000}},"page":"/dashboard"}
{"timestamp":"2024-01-15T10:30:45.789Z","level":"info","message":"User interaction","service":"frontend","action":"click","element":"chat-button","page":"/dashboard","userId":"user123","coordinates":{"x":300,"y":150}}
{"timestamp":"2024-01-15T10:31:05.012Z","level":"info","message":"API call initiated","service":"frontend","action":"api_call","url":"/api/translate","method":"POST","userId":"user123"}
{"timestamp":"2024-01-15T10:31:08.345Z","level":"info","message":"API call completed","service":"frontend","action":"api_call","url":"/api/translate","method":"POST","statusCode":200,"responseTime":3200,"userId":"user123"}
{"timestamp":"2024-01-15T10:31:20.678Z","level":"warn","message":"Slow page load","service":"frontend","page":"/translate","performance":{"lcp":4500,"fid":150,"cls":0.15},"userId":"user123"}
{"timestamp":"2024-01-15T10:31:35.901Z","level":"error","message":"JavaScript error","service":"frontend","error":{"name":"TypeError","message":"Cannot read property of undefined","stack":"TypeError: Cannot read property\n    at Component.render (app.js:142:20)","componentStack":"    in TranslateComponent\n    in Router"}}
{"timestamp":"2024-01-15T10:32:00.234Z","level":"info","message":"Form submission","service":"frontend","action":"form_submit","form":"translation-form","page":"/translate","userId":"user123","formData":{"sourceText":"Hello world","targetLanguage":"hi"}}
{"timestamp":"2024-01-15T10:32:25.567Z","level":"info","message":"Navigation","service":"frontend","action":"navigation","from":"/translate","to":"/dashboard","userId":"user123","navigationTiming":{"loadTime":850}}
EOF

    print_success "Frontend logs generated: $(wc -l < "$log_file") lines"
}

# Generate performance test logs
generate_performance_logs() {
    print_step "Generating performance test logs..."
    
    local perf_log="$FRONTEND_LOG_DIR/test-performance.log"
    
    cat > "$perf_log" << 'EOF'
{"timestamp":"2024-01-15T10:35:00.000Z","level":"info","message":"Performance measurement","log_type":"performance","performance":{"lcp":800,"fid":30,"cls":0.05},"page":"/dashboard","performance_score":"good"}
{"timestamp":"2024-01-15T10:35:15.000Z","level":"warn","message":"Performance degradation","log_type":"performance","performance":{"lcp":3200,"fid":80,"cls":0.12},"page":"/chat","performance_score":"needs_improvement"}
{"timestamp":"2024-01-15T10:35:30.000Z","level":"error","message":"Poor performance","log_type":"performance","performance":{"lcp":5800,"fid":200,"cls":0.35},"page":"/translate","performance_score":"poor"}
{"timestamp":"2024-01-15T10:35:45.000Z","level":"info","message":"Memory usage","log_type":"performance","performance":{"memory":{"usedJSHeapSize":75000000,"totalJSHeapSize":100000000}},"page":"/dashboard"}
{"timestamp":"2024-01-15T10:36:00.000Z","level":"warn","message":"High memory usage","log_type":"performance","performance":{"memory":{"usedJSHeapSize":180000000,"totalJSHeapSize":200000000}},"page":"/chat","alert":"memory_high"}
EOF

    print_success "Performance logs generated: $(wc -l < "$perf_log") lines"
}

# Generate security test logs  
generate_security_logs() {
    print_step "Generating security test logs..."
    
    local security_log="$BACKEND_LOG_DIR/test-security.log"
    
    cat > "$security_log" << 'EOF'
{"timestamp":"2024-01-15T10:40:00.000Z","level":"warn","message":"Failed authentication attempt","log_type":"security","service":"auth","ip":"203.0.113.15","endpoint":"/auth/login","auth_result":"failure","security_event_type":"authentication"}
{"timestamp":"2024-01-15T10:40:15.000Z","level":"error","message":"Multiple failed login attempts","log_type":"security","service":"auth","ip":"203.0.113.15","attempts":5,"security_event_type":"suspicious_activity","security_severity":"high"}
{"timestamp":"2024-01-15T10:40:30.000Z","level":"warn","message":"Rate limit triggered","log_type":"security","service":"auth","ip":"203.0.113.15","endpoint":"/auth/login","security_event_type":"rate_limiting"}
{"timestamp":"2024-01-15T10:40:45.000Z","level":"error","message":"Unauthorized access attempt","log_type":"security","service":"backend","ip":"198.51.100.25","endpoint":"/admin/users","statusCode":403,"security_event_type":"authorization"}
{"timestamp":"2024-01-15T10:41:00.000Z","level":"warn","message":"Invalid token provided","log_type":"security","service":"auth","ip":"192.168.1.50","token_type":"JWT","security_event_type":"token_validation","auth_result":"failure"}
{"timestamp":"2024-01-15T10:41:15.000Z","level":"info","message":"Successful authentication","log_type":"security","service":"auth","ip":"192.168.1.100","userId":"user123","auth_result":"success","security_event_type":"authentication"}
EOF

    print_success "Security logs generated: $(wc -l < "$security_log") lines"
}

# Generate user activity test logs
generate_user_activity_logs() {
    print_step "Generating user activity test logs..."
    
    local activity_log="$FRONTEND_LOG_DIR/test-user-activity.log"
    
    cat > "$activity_log" << 'EOF'
{"timestamp":"2024-01-15T10:45:00.000Z","level":"info","message":"Page view","log_type":"user_activity","action":"page_view","page":"/dashboard","userId":"user123","sessionId":"sess_abc123","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
{"timestamp":"2024-01-15T10:45:15.000Z","level":"info","message":"Button click","log_type":"user_activity","action":"click","element":"ai-chat-button","page":"/dashboard","userId":"user123","coordinates":{"x":250,"y":100},"engagement_score":3}
{"timestamp":"2024-01-15T10:45:30.000Z","level":"info","message":"Search performed","log_type":"user_activity","action":"search","query":"translate hello","page":"/translate","userId":"user123","engagement_score":5}
{"timestamp":"2024-01-15T10:45:45.000Z","level":"info","message":"Form submission","log_type":"user_activity","action":"form_submit","form":"translation","page":"/translate","userId":"user123","engagement_score":6}
{"timestamp":"2024-01-15T10:46:00.000Z","level":"info","message":"Page navigation","log_type":"user_activity","action":"navigation","from":"/translate","to":"/history","userId":"user123","navigationMethod":"click"}
{"timestamp":"2024-01-15T10:46:15.000Z","level":"info","message":"Session end","log_type":"user_activity","action":"session_end","userId":"user123","sessionId":"sess_abc123","sessionDuration":300000,"totalActions":15}
EOF

    print_success "User activity logs generated: $(wc -l < "$activity_log") lines"
}

# Test Elasticsearch connectivity
test_elasticsearch() {
    print_step "Testing Elasticsearch connectivity..."
    
    if curl -sf "$ELASTICSEARCH_URL/_cluster/health" >/dev/null 2>&1; then
        local health=$(curl -s "$ELASTICSEARCH_URL/_cluster/health" | jq -r '.status // "unknown"')
        print_success "Elasticsearch is accessible (status: $health)"
        return 0
    else
        print_error "Elasticsearch is not accessible"
        return 1
    fi
}

# Test Logstash connectivity  
test_logstash() {
    print_step "Testing Logstash connectivity..."
    
    # Test HTTP input
    local test_log='{"timestamp":"2024-01-15T10:50:00.000Z","level":"info","message":"Test log entry","service":"test","test":true}'
    
    if curl -sf -X POST "$LOGSTASH_URL" -H "Content-Type: application/json" -d "$test_log" >/dev/null 2>&1; then
        print_success "Logstash HTTP input is accessible"
        return 0
    else
        print_warning "Logstash HTTP input may not be accessible (this is normal if using Filebeat only)"
        return 1
    fi
}

# Wait for log ingestion and check results
check_log_ingestion() {
    print_step "Checking log ingestion (waiting 30 seconds for processing)..."
    
    sleep 30
    
    # Check if logs are in Elasticsearch
    local total_docs=$(curl -s "$ELASTICSEARCH_URL/ai-study-logs-*/_count" | jq -r '.count // 0' 2>/dev/null || echo "0")
    
    if [ "$total_docs" -gt 0 ]; then
        print_success "Found $total_docs documents in Elasticsearch"
        
        # Check log types
        local backend_logs=$(curl -s "$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=service:backend&size=0" | jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
        local frontend_logs=$(curl -s "$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=service:frontend&size=0" | jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
        local security_logs=$(curl -s "$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=log_type:security&size=0" | jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
        local perf_logs=$(curl -s "$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=log_type:performance&size=0" | jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
        
        echo "   📊 Backend logs: $backend_logs"
        echo "   🌐 Frontend logs: $frontend_logs" 
        echo "   🔒 Security logs: $security_logs"
        echo "   ⚡ Performance logs: $perf_logs"
        
        return 0
    else
        print_error "No logs found in Elasticsearch"
        print_warning "Check Filebeat and Logstash configurations"
        return 1
    fi
}

# Sample queries to test data
run_sample_queries() {
    print_step "Running sample queries..."
    
    echo "📋 Sample Elasticsearch queries:"
    echo ""
    echo "1. All error logs:"
    echo "   curl '$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=level:error&pretty'"
    echo ""
    echo "2. Performance issues:"
    echo "   curl '$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=log_type:performance AND performance.grade:poor&pretty'"
    echo ""
    echo "3. Security events:"
    echo "   curl '$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=log_type:security AND security.risk_level:high&pretty'"
    echo ""
    echo "4. Slow API responses:"
    echo "   curl '$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=responseTime:>3000&pretty'"
    echo ""
    echo "5. User activity by page:"
    echo "   curl '$ELASTICSEARCH_URL/ai-study-logs-*/_search?q=action:page_view&size=0&aggs={\"pages\":{\"terms\":{\"field\":\"page.keyword\"}}}&pretty'"
    
    print_success "Query examples provided"
}

# Cleanup function
cleanup_test_logs() {
    print_step "Cleaning up test logs..."
    
    rm -f "$BACKEND_LOG_DIR/test-*.log"
    rm -f "$FRONTEND_LOG_DIR/test-*.log"
    
    print_success "Test logs cleaned up"
}

# Main test execution
main() {
    print_header
    
    setup_test_directories
    generate_backend_logs
    generate_frontend_logs
    generate_performance_logs
    generate_security_logs
    generate_user_activity_logs
    
    test_elasticsearch
    # test_logstash  # Optional
    
    check_log_ingestion
    run_sample_queries
    
    echo ""
    print_success "🎉 Filebeat log collection test completed!"
    echo ""
    echo "📊 Next steps:"
    echo "   1. Check Kibana dashboards: http://localhost:5601"
    echo "   2. Run the sample queries above"
    echo "   3. Monitor real application logs"
    echo ""
    
    read -p "Clean up test logs? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_test_logs
    fi
}

# Handle script interruption
trap 'print_error "Test interrupted"; exit 1' INT TERM

# Run main function
main "$@"