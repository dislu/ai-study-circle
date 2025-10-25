#!/bin/bash
# ELK Stack Management Script for AI Study Circle
# Manages Elasticsearch, Logstash, Kibana, and Filebeat services

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ELK_DIR="$SCRIPT_DIR"
COMPOSE_FILE="$ELK_DIR/docker-compose.yml"
ENV_FILE="$ELK_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check if Docker Compose is available
check_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        if ! docker compose version >/dev/null 2>&1; then
            error "Docker Compose is not available. Please install Docker Compose."
            exit 1
        fi
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
}

# Create environment file if it doesn't exist
create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log "Creating environment file..."
        cat > "$ENV_FILE" << EOF
# ELK Stack Environment Configuration
COMPOSE_PROJECT_NAME=ai-study-elk
ELASTIC_VERSION=8.11.0
ELASTICSEARCH_HEAP=1g
LOGSTASH_HEAP=512m
KIBANA_ENCRYPTION_KEY=a7a6311933d3503b89bc2dbc36572c33a6c10925682e591bffcab6911c06786d
ENVIRONMENT=development
TZ=UTC
EOF
        log "Environment file created at $ENV_FILE"
    fi
}

# Set system requirements for Elasticsearch
set_system_requirements() {
    log "Setting system requirements for Elasticsearch..."
    
    # Increase virtual memory map areas (Linux)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo sysctl -w vm.max_map_count=262144
        echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
    fi
    
    # Set file descriptor limits
    if command -v ulimit >/dev/null 2>&1; then
        ulimit -n 65536
    fi
}

# Wait for service to be healthy
wait_for_health() {
    local service=$1
    local max_attempts=60
    local attempt=0
    
    log "Waiting for $service to become healthy..."
    
    while [ $attempt -lt $max_attempts ]; do
        if $COMPOSE_CMD -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy"; then
            log "$service is healthy!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 5
    done
    
    error "$service failed to become healthy after $((max_attempts * 5)) seconds"
    return 1
}

# Start ELK stack
start_elk() {
    log "Starting ELK Stack..."
    check_docker
    check_compose
    create_env_file
    set_system_requirements
    
    # Pull latest images
    log "Pulling latest Docker images..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" pull
    
    # Start services in order
    log "Starting Elasticsearch..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d elasticsearch
    wait_for_health elasticsearch
    
    log "Starting Logstash..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d logstash
    wait_for_health logstash
    
    log "Starting Kibana..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d kibana
    wait_for_health kibana
    
    log "Starting Filebeat..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d filebeat
    
    log "Starting additional services..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d elasticsearch-head cerebro
    
    log "ELK Stack started successfully!"
    print_urls
}

# Stop ELK stack
stop_elk() {
    log "Stopping ELK Stack..."
    check_docker
    check_compose
    
    $COMPOSE_CMD -f "$COMPOSE_FILE" down
    log "ELK Stack stopped successfully!"
}

# Restart ELK stack
restart_elk() {
    log "Restarting ELK Stack..."
    stop_elk
    start_elk
}

# Show status
show_status() {
    check_docker
    check_compose
    
    log "ELK Stack Status:"
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps
    
    echo ""
    info "Service Health Status:"
    
    # Check Elasticsearch
    if curl -s -f http://localhost:9200/_cluster/health >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Elasticsearch: http://localhost:9200"
    else
        echo -e "  ${RED}✗${NC} Elasticsearch: Not responding"
    fi
    
    # Check Kibana
    if curl -s -f http://localhost:5601/api/status >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Kibana: http://localhost:5601"
    else
        echo -e "  ${RED}✗${NC} Kibana: Not responding"
    fi
    
    # Check Logstash
    if curl -s -f http://localhost:9600 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Logstash: http://localhost:9600"
    else
        echo -e "  ${RED}✗${NC} Logstash: Not responding"
    fi
}

# View logs
view_logs() {
    local service=${1:-}
    check_docker
    check_compose
    
    if [ -z "$service" ]; then
        log "Showing logs for all ELK services..."
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
    else
        log "Showing logs for $service..."
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f "$service"
    fi
}

# Clean up volumes and data
cleanup() {
    warn "This will remove all ELK data and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log "Cleaning up ELK Stack..."
        check_docker
        check_compose
        
        $COMPOSE_CMD -f "$COMPOSE_FILE" down -v
        docker volume prune -f
        log "ELK Stack cleaned up successfully!"
    else
        log "Cleanup cancelled."
    fi
}

# Setup index templates and dashboards
setup_templates() {
    log "Setting up Elasticsearch index templates..."
    
    # Wait for Elasticsearch to be ready
    while ! curl -s -f http://localhost:9200/_cluster/health >/dev/null 2>&1; do
        echo -n "."
        sleep 2
    done
    
    # Apply index template
    if [ -f "$ELK_DIR/elasticsearch/index-templates/ai-study-logs-template.json" ]; then
        curl -X PUT "http://localhost:9200/_index_template/ai-study-logs" \
             -H "Content-Type: application/json" \
             -d @"$ELK_DIR/elasticsearch/index-templates/ai-study-logs-template.json"
        log "Index template applied successfully!"
    else
        warn "Index template file not found"
    fi
}

# Print service URLs
print_urls() {
    echo ""
    info "ELK Stack URLs:"
    echo "  📊 Kibana Dashboard: http://localhost:5601"
    echo "  🔍 Elasticsearch: http://localhost:9200"
    echo "  📈 Logstash Monitoring: http://localhost:9600"
    echo "  🧠 Elasticsearch Head: http://localhost:9100"
    echo "  🔧 Cerebro (ES Admin): http://localhost:9000"
    echo ""
    info "Useful Elasticsearch endpoints:"
    echo "  📊 Cluster Health: http://localhost:9200/_cluster/health"
    echo "  📝 List Indices: http://localhost:9200/_cat/indices"
    echo "  🔍 Search Logs: http://localhost:9200/ai-study-logs-*/_search"
}

# Show help
show_help() {
    cat << EOF
ELK Stack Management Script for AI Study Circle

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    start           Start the ELK stack
    stop            Stop the ELK stack
    restart         Restart the ELK stack
    status          Show status of all services
    logs [service]  Show logs (all services or specific service)
    cleanup         Remove all data and volumes
    setup           Setup index templates and dashboards
    urls            Show service URLs
    help            Show this help message

Services:
    elasticsearch   Elasticsearch search engine
    logstash       Logstash log processor
    kibana         Kibana dashboard
    filebeat       Filebeat log shipper
    
Examples:
    $0 start                    # Start all services
    $0 logs elasticsearch       # Show Elasticsearch logs
    $0 status                   # Show service status
    $0 cleanup                  # Clean all data (with confirmation)

EOF
}

# Main command handler
main() {
    case "${1:-help}" in
        start)
            start_elk
            ;;
        stop)
            stop_elk
            ;;
        restart)
            restart_elk
            ;;
        status)
            show_status
            ;;
        logs)
            view_logs "${2:-}"
            ;;
        cleanup)
            cleanup
            ;;
        setup)
            setup_templates
            ;;
        urls)
            print_urls
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"