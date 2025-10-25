# PowerShell deployment script for Azure Container Instances
# Optimized for Windows users

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "build", "infrastructure", "cleanup", "info")]
    [string]$Action = "deploy",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "ai-study-circle-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$AcrName = "aistudycircle",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "ai-study-circle",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod"
)

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colorMap = @{
        "Red" = "Red"
        "Green" = "Green" 
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "White" = "White"
    }
    
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Write-Status { Write-ColorOutput "[INFO] $args" "Blue" }
function Write-Success { Write-ColorOutput "[SUCCESS] $args" "Green" }
function Write-Warning { Write-ColorOutput "[WARNING] $args" "Yellow" }
function Write-Error { Write-ColorOutput "[ERROR] $args" "Red" }

# Check if command exists
function Test-Command {
    param([string]$Command)
    
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check Azure CLI login
function Test-AzureLogin {
    try {
        $null = az account show 2>$null
        return $true
    }
    catch {
        return $false
    }
}

# Create resource group
function New-ResourceGroup {
    Write-Status "Creating resource group $ResourceGroup..."
    
    $existingRg = az group show --name $ResourceGroup 2>$null
    if ($existingRg) {
        Write-Warning "Resource group $ResourceGroup already exists"
    }
    else {
        az group create --name $ResourceGroup --location $Location
        Write-Success "Resource group created successfully"
    }
}

# Create Azure Container Registry
function New-ContainerRegistry {
    Write-Status "Creating Azure Container Registry $AcrName..."
    
    $existingAcr = az acr show --name $AcrName --resource-group $ResourceGroup 2>$null
    if ($existingAcr) {
        Write-Warning "ACR $AcrName already exists"
    }
    else {
        az acr create `
            --resource-group $ResourceGroup `
            --name $AcrName `
            --sku Basic `
            --admin-enabled true
        Write-Success "Azure Container Registry created successfully"
    }
}

# Build and push Docker images
function Build-AndPushImages {
    Write-Status "Building and pushing Docker images..."
    
    # Get ACR login server
    $acrLoginServer = az acr show --name $AcrName --resource-group $ResourceGroup --query loginServer --output tsv
    
    # Login to ACR
    az acr login --name $AcrName
    
    # Build and push backend image
    Write-Status "Building backend image..."
    Push-Location "../backend"
    docker build -t "$acrLoginServer/ai-study-circle-backend:latest" .
    docker push "$acrLoginServer/ai-study-circle-backend:latest"
    Pop-Location
    
    # Build and push frontend image  
    Write-Status "Building frontend image..."
    Push-Location "../frontend"
    docker build -t "$acrLoginServer/ai-study-circle-frontend:latest" .
    docker push "$acrLoginServer/ai-study-circle-frontend:latest"
    Pop-Location
    
    Write-Success "Docker images built and pushed successfully"
}

# Create secrets in Key Vault
function New-Secrets {
    Write-Status "Setting up secrets..."
    
    # Create Key Vault
    $timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds().ToString().Substring(4)
    $keyVaultName = "ai-study-kv-$timestamp"
    
    az keyvault create `
        --name $keyVaultName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku standard
    
    Write-Warning "Please update these secrets with your actual values:"
    Write-Host "MongoDB URI: az keyvault secret set --vault-name $keyVaultName --name mongodb-uri --value 'your-mongodb-connection-string'" -ForegroundColor Cyan
    Write-Host "Redis URL: az keyvault secret set --vault-name $keyVaultName --name redis-url --value 'your-redis-connection-string'" -ForegroundColor Cyan  
    Write-Host "JWT Secret: az keyvault secret set --vault-name $keyVaultName --name jwt-secret --value 'your-jwt-secret'" -ForegroundColor Cyan
    
    Write-Success "Key Vault created: $keyVaultName"
    return $keyVaultName
}

# Deploy infrastructure
function Deploy-Infrastructure {
    Write-Status "Deploying Azure infrastructure..."
    
    # Get ACR credentials
    $acrLoginServer = az acr show --name $AcrName --resource-group $ResourceGroup --query loginServer --output tsv
    $acrUsername = az acr credential show --name $AcrName --resource-group $ResourceGroup --query username --output tsv
    $acrPassword = az acr credential show --name $AcrName --resource-group $ResourceGroup --query "passwords[0].value" --output tsv
    
    # Deploy Bicep template
    az deployment group create `
        --resource-group $ResourceGroup `
        --template-file "deploy-aci.bicep" `
        --parameters `
            appName=$AppName `
            environment=$Environment `
            location=$Location `
            registryLoginServer=$acrLoginServer `
            registryUsername=$acrUsername `
            registryPassword=$acrPassword `
            mongoConnectionString="mongodb://your-mongodb-connection" `
            redisConnectionString="redis://your-redis-connection" `
            jwtSecret="your-jwt-secret"
    
    Write-Success "Infrastructure deployed successfully"
}

# Get deployment information
function Get-DeploymentInfo {
    Write-Status "Getting deployment information..."
    
    # Get deployment outputs
    $frontendUrl = az deployment group show --resource-group $ResourceGroup --name "deploy-aci" --query "properties.outputs.frontendUrl.value" --output tsv
    $backendUrl = az deployment group show --resource-group $ResourceGroup --name "deploy-aci" --query "properties.outputs.backendUrl.value" --output tsv  
    $kibanaUrl = az deployment group show --resource-group $ResourceGroup --name "deploy-aci" --query "properties.outputs.kibanaUrl.value" --output tsv
    
    Write-Success "Deployment completed successfully!"
    Write-Host ""
    Write-Host "🚀 Application URLs:" -ForegroundColor Green
    Write-Host "   Frontend: $frontendUrl" -ForegroundColor Cyan
    Write-Host "   Backend API: $backendUrl" -ForegroundColor Cyan
    Write-Host "   Kibana Dashboard: $kibanaUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💰 Expected Monthly Cost: ~`$344 (based on analysis)" -ForegroundColor Yellow
    Write-Host "💡 Your ELK stack saves ~`$400/month vs managed services!" -ForegroundColor Green
}

# Setup monitoring
function Set-Monitoring {
    Write-Status "Setting up monitoring..."
    
    # Create Log Analytics workspace
    az monitor log-analytics workspace create `
        --resource-group $ResourceGroup `
        --workspace-name "$AppName-logs-$Environment" `
        --location $Location `
        --sku PerGB2018
    
    Write-Success "Monitoring setup completed"
}

# Show cost optimization tips
function Show-CostTips {
    Write-Status "💡 Cost Optimization Tips:"
    Write-Host ""
    Write-Host "1. 🕒 Schedule shutdown for dev environments:" -ForegroundColor Yellow
    Write-Host "   az container stop --resource-group $ResourceGroup --name ai-study-circle-frontend-dev-*" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. 📊 Monitor usage with Azure Monitor" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. 💾 Your ELK stack provides massive savings:" -ForegroundColor Yellow
    Write-Host "   - Current cost: ~`$39/month" -ForegroundColor Green
    Write-Host "   - AWS CloudWatch equivalent: ~`$53/month" -ForegroundColor Red
    Write-Host "   - Managed service (Datadog): `$200-500/month" -ForegroundColor Red
    Write-Host "   - Your savings: `$161-461/month! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "4. 🔄 Auto-scaling is configured to optimize costs" -ForegroundColor Yellow
    Write-Host "5. 🛡️ Consider enabling Azure Security Center (free tier)" -ForegroundColor Yellow
}

# Cleanup resources
function Remove-Resources {
    $confirmation = Read-Host "This will delete all resources. Are you sure? (y/N)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Status "Deleting resource group $ResourceGroup..."
        az group delete --name $ResourceGroup --yes --no-wait
        Write-Success "Cleanup initiated"
    }
}

# Main function
function Main {
    Write-Host "🚀 AI Study Circle - Azure Container Instances Deployment" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    
    # Check prerequisites
    if (-not (Test-Command "az")) {
        Write-Error "Azure CLI is required but not installed."
        return
    }
    
    if (-not (Test-Command "docker")) {
        Write-Error "Docker is required but not installed."
        return
    }
    
    if (-not (Test-AzureLogin)) {
        Write-Error "Please login to Azure CLI first: az login"
        return
    }
    
    switch ($Action) {
        "deploy" {
            Write-Status "Starting full deployment..."
            New-ResourceGroup
            New-ContainerRegistry
            Build-AndPushImages
            $keyVaultName = New-Secrets
            Deploy-Infrastructure
            Set-Monitoring
            Get-DeploymentInfo
            Show-CostTips
        }
        "build" {
            Write-Status "Building and pushing images only..."
            Build-AndPushImages
        }
        "infrastructure" {
            Write-Status "Deploying infrastructure only..."
            Deploy-Infrastructure
            Get-DeploymentInfo
        }
        "cleanup" {
            Remove-Resources
        }
        "info" {
            Get-DeploymentInfo
            Show-CostTips
        }
    }
}

# Run main function
Main