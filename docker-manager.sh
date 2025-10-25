#!/bin/bash

# Docker Management Script for AI Study Circle
# This script provides easy commands to manage the Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  AI Study Circle - Docker Manager${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed."
}

# Development environment
dev_up() {
    print_status "Starting development environment..."
    docker-compose -f docker-compose.dev.yml --env-file .env.docker up -d
    print_status "Development environment is running!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:5000"
    print_status "MongoDB: localhost:27017"
}

dev_down() {
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    print_status "Development environment stopped."
}

dev_logs() {
    docker-compose -f docker-compose.dev.yml logs -f "$@"
}

# Production environment
prod_up() {
    print_status "Starting production environment..."
    if [ ! -f .env.prod ]; then
        print_warning ".env.prod file not found. Creating from template..."
        cp .env.prod.example .env.prod
        print_warning "Please edit .env.prod with your production values before continuing."
        exit 1
    fi
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    print_status "Production environment is running!"
}

prod_down() {
    print_status "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod down
    print_status "Production environment stopped."
}

prod_logs() {
    docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f "$@"
}

# Simple environment (default docker-compose.yml)
simple_up() {
    print_status "Starting simple environment..."
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.docker .env
        print_warning "Please edit .env with your configuration values."
    fi
    docker-compose up -d
    print_status "Simple environment is running!"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:5000"
}

simple_down() {
    print_status "Stopping simple environment..."
    docker-compose down
    print_status "Simple environment stopped."
}

simple_logs() {
    docker-compose logs -f "$@"
}

# Build images
build_images() {
    print_status "Building all Docker images..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    print_status "Images built successfully!"
}

# Clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker system prune -f
    docker volume prune -f
    print_status "Cleanup completed!"
}

# Show status
status() {
    print_status "Docker containers status:"
    docker ps -a --filter "name=ai-study-circle"
    echo
    print_status "Docker volumes:"
    docker volume ls --filter "name=ai-study-circle"
}

# Show help
show_help() {
    print_header
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  dev-up      Start development environment"
    echo "  dev-down    Stop development environment"
    echo "  dev-logs    Show development logs"
    echo "  prod-up     Start production environment"
    echo "  prod-down   Stop production environment"
    echo "  prod-logs   Show production logs"
    echo "  simple-up   Start simple environment (docker-compose.yml)"
    echo "  simple-down Stop simple environment"
    echo "  simple-logs Show simple environment logs"
    echo "  build       Build all Docker images"
    echo "  status      Show containers and volumes status"
    echo "  cleanup     Clean up Docker resources"
    echo "  help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 dev-up          # Start development environment"
    echo "  $0 dev-logs backend # Show backend logs only"
    echo "  $0 prod-up         # Start production environment"
    echo "  $0 status          # Show current status"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        "dev-up")
            dev_up
            ;;
        "dev-down")
            dev_down
            ;;
        "dev-logs")
            shift
            dev_logs "$@"
            ;;
        "prod-up")
            prod_up
            ;;
        "prod-down")
            prod_down
            ;;
        "prod-logs")
            shift
            prod_logs "$@"
            ;;
        "simple-up")
            simple_up
            ;;
        "simple-down")
            simple_down
            ;;
        "simple-logs")
            shift
            simple_logs "$@"
            ;;
        "build")
            build_images
            ;;
        "status")
            status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run the main function with all arguments
main "$@"