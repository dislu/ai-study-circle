#!/bin/bash

# Complete ELK Stack Setup and Deployment Script
# This script sets up the entire logging infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
KIBANA_URL="http://localhost:5601"
ELASTICSEARCH_URL="http://localhost:9200"

print_header() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}    AI Study Circle - ELK Stack Setup      ${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
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

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

setup_elk_stack() {
    print_step "Setting up ELK Stack..."
    
    # Stop any existing containers
    docker compose down --remove-orphans 2>/dev/null || true
    
    # Start the services
    print_step "Starting ELK services..."
    docker compose up -d
    
    if [ $? -eq 0 ]; then
        print_success "ELK services started successfully"
    else
        print_error "Failed to start ELK services"
        exit 1
    fi
}

wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    # Wait for Elasticsearch
    echo "   ⏳ Waiting for Elasticsearch..."
    local retries=0
    local max_retries=60
    
    while ! curl -sf "$ELASTICSEARCH_URL/_cluster/health" >/dev/null 2>&1; do
        retries=$((retries + 1))
        if [ $retries -gt $max_retries ]; then
            print_error "Elasticsearch failed to start within timeout"
            docker compose logs elasticsearch
            exit 1
        fi
        echo "      Attempt $retries/$max_retries..."
        sleep 10
    done
    print_success "Elasticsearch is ready"
    
    # Wait for Kibana
    echo "   ⏳ Waiting for Kibana..."
    retries=0
    max_retries=60
    
    while ! curl -sf "$KIBANA_URL/api/status" >/dev/null 2>&1; do
        retries=$((retries + 1))
        if [ $retries -gt $max_retries ]; then
            print_error "Kibana failed to start within timeout"
            docker compose logs kibana
            exit 1
        fi
        echo "      Attempt $retries/$max_retries..."
        sleep 10
    done
    print_success "Kibana is ready"
    
    # Give services a moment to fully initialize
    sleep 10
}

create_index_template() {
    print_step "Creating Elasticsearch index template..."
    
    local template_response=$(curl -s -X PUT "$ELASTICSEARCH_URL/_index_template/ai-study-logs-template" \
        -H "Content-Type: application/json" \
        -d @elasticsearch/ai-study-logs-template.json)
    
    if [[ $template_response == *"acknowledged"* && $template_response == *"true"* ]]; then
        print_success "Index template created successfully"
    else
        print_warning "Index template creation response: $template_response"
    fi
}

import_kibana_objects() {
    print_step "Importing Kibana index pattern and dashboards..."
    
    # Import index pattern first
    if [ -f "kibana/index-pattern.json" ]; then
        local pattern_response=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/_import" \
            -H "kbn-xsrf: true" \
            --form file=@"kibana/index-pattern.json")
        
        if [[ $pattern_response == *"success"* ]]; then
            print_success "Index pattern imported successfully"
        else
            print_warning "Index pattern import response: $pattern_response"
        fi
    fi
    
    # Import dashboards
    for dashboard_file in kibana/dashboards/*.json; do
        if [ -f "$dashboard_file" ]; then
            local dashboard_name=$(basename "$dashboard_file" .json)
            echo "   📊 Importing dashboard: $dashboard_name"
            
            local dashboard_response=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/_import" \
                -H "kbn-xsrf: true" \
                --form file=@"$dashboard_file")
            
            if [[ $dashboard_response == *"success"* ]]; then
                echo "      ✅ Successfully imported $dashboard_name"
            else
                echo "      ⚠️  Import response for $dashboard_name: $dashboard_response"
            fi
        fi
    done
}

show_service_status() {
    print_step "Service Status:"
    docker compose ps
    echo ""
}

show_access_info() {
    print_step "Access Information:"
    echo ""
    echo -e "${GREEN}🌐 Kibana Dashboard:${NC}     $KIBANA_URL"
    echo -e "${GREEN}🔍 Elasticsearch API:${NC}    $ELASTICSEARCH_URL"
    echo -e "${GREEN}📊 Logstash Input:${NC}       http://localhost:5044"
    echo ""
    
    print_step "Available Dashboards:"
    echo "   • System Overview - Application health and errors"
    echo "   • Performance Metrics - Response times and web vitals"
    echo "   • User Activity - User interactions and engagement"
    echo ""
    
    print_step "Quick Health Check:"
    echo "   curl $ELASTICSEARCH_URL/_cluster/health?pretty"
    echo "   curl $KIBANA_URL/api/status"
    echo ""
}

show_next_steps() {
    print_step "Next Steps:"
    echo ""
    echo "1. 🔧 Start your application to generate logs"
    echo "2. 📊 Open Kibana: $KIBANA_URL"
    echo "3. 🔍 Explore the pre-configured dashboards"
    echo "4. 📈 Monitor your application in real-time"
    echo ""
    
    print_step "Management Commands:"
    echo "   ./elk-manager.sh status    - Check service status"
    echo "   ./elk-manager.sh logs      - View service logs"
    echo "   ./elk-manager.sh stop      - Stop all services"
    echo "   ./elk-manager.sh cleanup   - Remove all data"
    echo ""
}

main() {
    print_header
    
    check_prerequisites
    setup_elk_stack
    wait_for_services
    create_index_template
    import_kibana_objects
    
    echo ""
    print_success "🎉 ELK Stack setup completed successfully!"
    echo ""
    
    show_service_status
    show_access_info
    show_next_steps
    
    echo -e "${PURPLE}📚 For detailed documentation, see: ./README.md${NC}"
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"