#!/bin/bash

# Azure Container Instances Deployment Script
# Optimized for AI Study Circle application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="ai-study-circle-rg"
LOCATION="eastus"
SUBSCRIPTION_ID=""
ACR_NAME="aistudycircle"
APP_NAME="ai-study-circle"
ENVIRONMENT="prod"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is required but not installed."
        exit 1
    fi
}

# Function to check Azure CLI login
check_azure_login() {
    if ! az account show &> /dev/null; then
        print_error "Please login to Azure CLI first: az login"
        exit 1
    fi
}

# Function to create resource group
create_resource_group() {
    print_status "Creating resource group $RESOURCE_GROUP..."
    if az group show --name $RESOURCE_GROUP &> /dev/null; then
        print_warning "Resource group $RESOURCE_GROUP already exists"
    else
        az group create --name $RESOURCE_GROUP --location $LOCATION
        print_success "Resource group created successfully"
    fi
}

# Function to create Azure Container Registry
create_acr() {
    print_status "Creating Azure Container Registry $ACR_NAME..."
    if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        print_warning "ACR $ACR_NAME already exists"
    else
        az acr create \
            --resource-group $RESOURCE_GROUP \
            --name $ACR_NAME \
            --sku Basic \
            --admin-enabled true
        print_success "Azure Container Registry created successfully"
    fi
}

# Function to build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Get ACR login server
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
    
    # Login to ACR
    az acr login --name $ACR_NAME
    
    # Build and push backend image
    print_status "Building backend image..."
    cd ../backend
    docker build -t $ACR_LOGIN_SERVER/ai-study-circle-backend:latest .
    docker push $ACR_LOGIN_SERVER/ai-study-circle-backend:latest
    
    # Build and push frontend image
    print_status "Building frontend image..."
    cd ../frontend
    docker build -t $ACR_LOGIN_SERVER/ai-study-circle-frontend:latest .
    docker push $ACR_LOGIN_SERVER/ai-study-circle-frontend:latest
    
    cd ../azure
    print_success "Docker images built and pushed successfully"
}

# Function to create secrets
create_secrets() {
    print_status "Setting up secrets..."
    
    # Create Key Vault
    KEYVAULT_NAME="ai-study-kv-$(date +%s | tail -c 6)"
    az keyvault create \
        --name $KEYVAULT_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku standard
    
    # Store secrets (replace with your actual values)
    print_warning "Please update these secrets with your actual values:"
    echo "MongoDB URI: az keyvault secret set --vault-name $KEYVAULT_NAME --name mongodb-uri --value 'your-mongodb-connection-string'"
    echo "Redis URL: az keyvault secret set --vault-name $KEYVAULT_NAME --name redis-url --value 'your-redis-connection-string'"
    echo "JWT Secret: az keyvault secret set --vault-name $KEYVAULT_NAME --name jwt-secret --value 'your-jwt-secret'"
    
    print_success "Key Vault created: $KEYVAULT_NAME"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying Azure infrastructure..."
    
    # Get ACR credentials
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
    ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query username --output tsv)
    ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query passwords[0].value --output tsv)
    
    # Deploy Bicep template
    az deployment group create \
        --resource-group $RESOURCE_GROUP \
        --template-file deploy-aci.bicep \
        --parameters \
            appName=$APP_NAME \
            environment=$ENVIRONMENT \
            location=$LOCATION \
            registryLoginServer=$ACR_LOGIN_SERVER \
            registryUsername=$ACR_USERNAME \
            registryPassword=$ACR_PASSWORD \
            mongoConnectionString="mongodb://your-mongodb-connection" \
            redisConnectionString="redis://your-redis-connection" \
            jwtSecret="your-jwt-secret"
    
    print_success "Infrastructure deployed successfully"
}

# Function to get deployment outputs
get_deployment_info() {
    print_status "Getting deployment information..."
    
    # Get public IP and URLs
    FRONTEND_URL=$(az deployment group show --resource-group $RESOURCE_GROUP --name deploy-aci --query properties.outputs.frontendUrl.value --output tsv)
    BACKEND_URL=$(az deployment group show --resource-group $RESOURCE_GROUP --name deploy-aci --query properties.outputs.backendUrl.value --output tsv)
    KIBANA_URL=$(az deployment group show --resource-group $RESOURCE_GROUP --name deploy-aci --query properties.outputs.kibanaUrl.value --output tsv)
    
    print_success "Deployment completed successfully!"
    echo
    echo "🚀 Application URLs:"
    echo "   Frontend: $FRONTEND_URL"
    echo "   Backend API: $BACKEND_URL"
    echo "   Kibana Dashboard: $KIBANA_URL"
    echo
    echo "💰 Expected Monthly Cost: ~\$344 (based on analysis)"
    echo "💡 Your ELK stack saves ~\$400/month vs managed services!"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create Log Analytics workspace for basic monitoring
    az monitor log-analytics workspace create \
        --resource-group $RESOURCE_GROUP \
        --workspace-name "${APP_NAME}-logs-${ENVIRONMENT}" \
        --location $LOCATION \
        --sku PerGB2018
    
    print_success "Monitoring setup completed"
}

# Function to show cost optimization tips
show_cost_tips() {
    print_status "💡 Cost Optimization Tips:"
    echo
    echo "1. 🕒 Schedule shutdown for dev environments:"
    echo "   az container stop --resource-group $RESOURCE_GROUP --name ai-study-circle-frontend-dev-*"
    echo
    echo "2. 📊 Monitor usage with:"
    echo "   az monitor metrics list --resource /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
    echo
    echo "3. 💾 Your ELK stack provides massive savings:"
    echo "   - Current cost: ~\$39/month"
    echo "   - AWS CloudWatch equivalent: ~\$53/month"
    echo "   - Managed service (Datadog): \$200-500/month"
    echo "   - Your savings: \$161-461/month! 🎉"
    echo
    echo "4. 🔄 Auto-scaling is configured to optimize costs"
    echo "5. 🛡️ Consider enabling Azure Security Center (free tier)"
}

# Function to cleanup (optional)
cleanup() {
    print_warning "This will delete all resources. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Deleting resource group $RESOURCE_GROUP..."
        az group delete --name $RESOURCE_GROUP --yes --no-wait
        print_success "Cleanup initiated"
    fi
}

# Main deployment function
main() {
    echo "🚀 AI Study Circle - Azure Container Instances Deployment"
    echo "==========================================================="
    echo
    
    # Check prerequisites
    check_command "az"
    check_command "docker"
    check_azure_login
    
    case "${1:-deploy}" in
        "deploy")
            print_status "Starting full deployment..."
            create_resource_group
            create_acr
            build_and_push_images
            create_secrets
            deploy_infrastructure
            setup_monitoring
            get_deployment_info
            show_cost_tips
            ;;
        "build")
            print_status "Building and pushing images only..."
            build_and_push_images
            ;;
        "infrastructure")
            print_status "Deploying infrastructure only..."
            deploy_infrastructure
            get_deployment_info
            ;;
        "cleanup")
            cleanup
            ;;
        "info")
            get_deployment_info
            show_cost_tips
            ;;
        *)
            echo "Usage: $0 {deploy|build|infrastructure|cleanup|info}"
            echo "  deploy        - Full deployment (default)"
            echo "  build         - Build and push Docker images only"
            echo "  infrastructure- Deploy infrastructure only"
            echo "  cleanup       - Delete all resources"
            echo "  info          - Show deployment information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"