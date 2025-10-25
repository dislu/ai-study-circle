#!/bin/bash
# AI Study Circle - ECS Deployment Script
# Automates the deployment of the application to AWS ECS

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-study-circle"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
CLUSTER_NAME="${CLUSTER_NAME:-ai-study-circle-cluster}"
VPC_ID="${VPC_ID}"
SUBNET_IDS="${SUBNET_IDS}"

# Function to print colored output
print_info() {
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

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check required environment variables
    if [[ -z "$AWS_ACCOUNT_ID" ]]; then
        print_error "AWS_ACCOUNT_ID environment variable is not set"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create ECR repositories
create_ecr_repositories() {
    print_info "Creating ECR repositories..."
    
    local repositories=("frontend" "backend" "elasticsearch" "logstash" "kibana" "filebeat")
    
    for repo in "${repositories[@]}"; do
        local repo_name="${PROJECT_NAME}-${repo}"
        
        if aws ecr describe-repositories --repository-names "$repo_name" --region "$AWS_REGION" &> /dev/null; then
            print_warning "ECR repository $repo_name already exists"
        else
            aws ecr create-repository \
                --repository-name "$repo_name" \
                --region "$AWS_REGION" \
                --image-scanning-configuration scanOnPush=true
            print_success "Created ECR repository: $repo_name"
        fi
    done
}

# Function to build and push Docker images
build_and_push_images() {
    print_info "Building and pushing Docker images..."
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build and push frontend
    print_info "Building frontend image..."
    docker build -t "${PROJECT_NAME}-frontend:latest" \
        --target production \
        ./frontend/
    
    docker tag "${PROJECT_NAME}-frontend:latest" \
        "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-frontend:latest"
    
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-frontend:latest"
    print_success "Pushed frontend image"
    
    # Build and push backend
    print_info "Building backend image..."
    docker build -t "${PROJECT_NAME}-backend:latest" \
        --target production \
        ./backend/
    
    docker tag "${PROJECT_NAME}-backend:latest" \
        "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-backend:latest"
    
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-backend:latest"
    print_success "Pushed backend image"
    
    # Build and push ELK stack images (optional customizations)
    print_info "Preparing ELK stack images..."
    
    # Use official Elastic images with custom configurations
    docker pull docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    docker pull docker.elastic.co/logstash/logstash:8.11.0
    docker pull docker.elastic.co/kibana/kibana:8.11.0
    docker pull docker.elastic.co/beats/filebeat:8.11.0
    
    # Tag for ECR (optional, can use official images directly)
    docker tag docker.elastic.co/elasticsearch/elasticsearch:8.11.0 \
        "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-elasticsearch:latest"
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${PROJECT_NAME}-elasticsearch:latest"
    
    print_success "All images pushed to ECR"
}

# Function to create ECS cluster
create_ecs_cluster() {
    print_info "Creating ECS cluster..."
    
    if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_warning "ECS cluster $CLUSTER_NAME already exists"
    else
        aws ecs create-cluster \
            --cluster-name "$CLUSTER_NAME" \
            --capacity-providers FARGATE EC2 \
            --default-capacity-provider-strategy \
                capacityProvider=FARGATE,weight=1,base=2 \
                capacityProvider=EC2,weight=4,base=0 \
            --region "$AWS_REGION"
        print_success "Created ECS cluster: $CLUSTER_NAME"
    fi
}

# Function to create IAM roles
create_iam_roles() {
    print_info "Creating IAM roles..."
    
    # ECS Task Execution Role
    cat > task-execution-role-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # ECS Task Role
    cat > task-role-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create execution role
    aws iam create-role \
        --role-name "${PROJECT_NAME}-task-execution-role" \
        --assume-role-policy-document file://task-execution-role-policy.json \
        --region "$AWS_REGION" || true
    
    aws iam attach-role-policy \
        --role-name "${PROJECT_NAME}-task-execution-role" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
        --region "$AWS_REGION"
    
    # Create task role with additional permissions
    aws iam create-role \
        --role-name "${PROJECT_NAME}-task-role" \
        --assume-role-policy-document file://task-role-policy.json \
        --region "$AWS_REGION" || true
    
    # Attach policies for accessing other AWS services
    cat > custom-task-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name "${PROJECT_NAME}-task-role" \
        --policy-name "${PROJECT_NAME}-task-policy" \
        --policy-document file://custom-task-policy.json \
        --region "$AWS_REGION"
    
    print_success "IAM roles created"
    
    # Clean up policy files
    rm -f task-execution-role-policy.json task-role-policy.json custom-task-policy.json
}

# Function to create task definitions
create_task_definitions() {
    print_info "Creating ECS task definitions..."
    
    # Frontend task definition
    cat > frontend-task-def.json << EOF
{
  "family": "${PROJECT_NAME}-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-task-execution-role",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-task-role",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}/frontend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:80/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

    # Backend task definition
    cat > backend-task-def.json << EOF
{
  "family": "${PROJECT_NAME}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-task-execution-role",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-task-role",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${PROJECT_NAME}/openai-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}/backend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node healthcheck.js"
        ],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

    # Register task definitions
    aws ecs register-task-definition \
        --cli-input-json file://frontend-task-def.json \
        --region "$AWS_REGION"
    print_success "Frontend task definition created"
    
    aws ecs register-task-definition \
        --cli-input-json file://backend-task-def.json \
        --region "$AWS_REGION"
    print_success "Backend task definition created"
    
    # Clean up task definition files
    rm -f frontend-task-def.json backend-task-def.json
}

# Function to create services
create_ecs_services() {
    print_info "Creating ECS services..."
    
    # Frontend service
    aws ecs create-service \
        --cluster "$CLUSTER_NAME" \
        --service-name "${PROJECT_NAME}-frontend" \
        --task-definition "${PROJECT_NAME}-frontend" \
        --desired-count 2 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
        --region "$AWS_REGION"
    print_success "Frontend service created"
    
    # Backend service
    aws ecs create-service \
        --cluster "$CLUSTER_NAME" \
        --service-name "${PROJECT_NAME}-backend" \
        --task-definition "${PROJECT_NAME}-backend" \
        --desired-count 2 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
        --region "$AWS_REGION"
    print_success "Backend service created"
}

# Function to create Application Load Balancer
create_load_balancer() {
    print_info "Creating Application Load Balancer..."
    
    # Create ALB
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name "${PROJECT_NAME}-alb" \
        --subnets ${SUBNET_IDS//,/ } \
        --security-groups "$SECURITY_GROUP_ID" \
        --region "$AWS_REGION" \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text)
    
    # Create target groups
    FRONTEND_TG_ARN=$(aws elbv2 create-target-group \
        --name "${PROJECT_NAME}-frontend-tg" \
        --protocol HTTP \
        --port 80 \
        --vpc-id "$VPC_ID" \
        --target-type ip \
        --health-check-path "/health" \
        --region "$AWS_REGION" \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)
    
    BACKEND_TG_ARN=$(aws elbv2 create-target-group \
        --name "${PROJECT_NAME}-backend-tg" \
        --protocol HTTP \
        --port 5000 \
        --vpc-id "$VPC_ID" \
        --target-type ip \
        --health-check-path "/api/health" \
        --region "$AWS_REGION" \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)
    
    # Create listeners
    aws elbv2 create-listener \
        --load-balancer-arn "$ALB_ARN" \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn="$FRONTEND_TG_ARN" \
        --region "$AWS_REGION"
    
    aws elbv2 create-listener \
        --load-balancer-arn "$ALB_ARN" \
        --protocol HTTP \
        --port 5000 \
        --default-actions Type=forward,TargetGroupArn="$BACKEND_TG_ARN" \
        --region "$AWS_REGION"
    
    print_success "Load balancer created"
    
    # Update services to use target groups
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "${PROJECT_NAME}-frontend" \
        --load-balancers targetGroupArn="$FRONTEND_TG_ARN",containerName=frontend,containerPort=80 \
        --region "$AWS_REGION"
    
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "${PROJECT_NAME}-backend" \
        --load-balancers targetGroupArn="$BACKEND_TG_ARN",containerName=backend,containerPort=5000 \
        --region "$AWS_REGION"
    
    print_success "Services updated with load balancer configuration"
}

# Function to set up auto scaling
setup_auto_scaling() {
    print_info "Setting up auto scaling..."
    
    # Register scalable targets
    aws application-autoscaling register-scalable-target \
        --service-namespace ecs \
        --scalable-dimension ecs:service:DesiredCount \
        --resource-id "service/${CLUSTER_NAME}/${PROJECT_NAME}-frontend" \
        --min-capacity 2 \
        --max-capacity 10 \
        --region "$AWS_REGION"
    
    aws application-autoscaling register-scalable-target \
        --service-namespace ecs \
        --scalable-dimension ecs:service:DesiredCount \
        --resource-id "service/${CLUSTER_NAME}/${PROJECT_NAME}-backend" \
        --min-capacity 2 \
        --max-capacity 20 \
        --region "$AWS_REGION"
    
    # Create scaling policies
    cat > frontend-scaling-policy.json << EOF
{
  "PolicyName": "${PROJECT_NAME}-frontend-cpu-scaling",
  "ServiceNamespace": "ecs",
  "ResourceId": "service/${CLUSTER_NAME}/${PROJECT_NAME}-frontend",
  "ScalableDimension": "ecs:service:DesiredCount",
  "PolicyType": "TargetTrackingScaling",
  "TargetTrackingScalingPolicyConfiguration": {
    "TargetValue": 60.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 300
  }
}
EOF

    aws application-autoscaling put-scaling-policy \
        --cli-input-json file://frontend-scaling-policy.json \
        --region "$AWS_REGION"
    
    print_success "Auto scaling configured"
    
    # Clean up
    rm -f frontend-scaling-policy.json
}

# Function to display deployment information
display_info() {
    print_info "Deployment completed successfully!"
    print_info "Cluster: $CLUSTER_NAME"
    print_info "Region: $AWS_REGION"
    
    # Get load balancer DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names "${PROJECT_NAME}-alb" \
        --region "$AWS_REGION" \
        --query 'LoadBalancers[0].DNSName' \
        --output text 2>/dev/null || echo "Not available")
    
    print_success "Application URLs:"
    print_success "  Frontend: http://$ALB_DNS"
    print_success "  Backend API: http://$ALB_DNS:5000"
    
    print_info "Next steps:"
    print_info "  1. Set up your secrets in AWS Secrets Manager"
    print_info "  2. Configure your domain and SSL certificate"
    print_info "  3. Deploy the ELK logging stack"
    print_info "  4. Monitor the application using CloudWatch"
}

# Main deployment function
main() {
    print_info "Starting AI Study Circle ECS deployment..."
    
    check_prerequisites
    create_ecr_repositories
    build_and_push_images
    create_ecs_cluster
    create_iam_roles
    create_task_definitions
    create_ecs_services
    
    if [[ -n "$VPC_ID" && -n "$SUBNET_IDS" ]]; then
        create_load_balancer
        setup_auto_scaling
    else
        print_warning "VPC_ID and SUBNET_IDS not provided. Skipping load balancer setup."
        print_warning "Please configure these manually or re-run with the required parameters."
    fi
    
    display_info
}

# Script usage
usage() {
    echo "Usage: $0"
    echo ""
    echo "Required environment variables:"
    echo "  AWS_ACCOUNT_ID    - Your AWS account ID"
    echo "  VPC_ID           - VPC ID for resources"
    echo "  SUBNET_IDS       - Comma-separated subnet IDs"
    echo "  SECURITY_GROUP_ID - Security group ID"
    echo ""
    echo "Optional environment variables:"
    echo "  AWS_REGION       - AWS region (default: us-east-1)"
    echo "  CLUSTER_NAME     - ECS cluster name (default: ai-study-circle-cluster)"
    echo ""
    echo "Example:"
    echo "  export AWS_ACCOUNT_ID=123456789012"
    echo "  export VPC_ID=vpc-12345678"
    echo "  export SUBNET_IDS=subnet-12345678,subnet-87654321"
    echo "  export SECURITY_GROUP_ID=sg-12345678"
    echo "  ./deploy-ecs.sh"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Run main function
main "$@"