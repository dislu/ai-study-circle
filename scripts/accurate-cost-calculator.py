# Cloud Cost Calculator - AI Study Circle (Corrected)
# Interactive Cost Estimation Tool

import json

def calculate_costs():
    """Calculate realistic costs for AWS vs Azure serverless deployment"""
    
    # Define usage scenarios
    scenarios = {
        'low': {
            'name': 'Low Usage (100 DAU, 1.5K req/day)',
            'monthly_requests': 45000,
            'data_transfer_gb': 200,
            'storage_gb': 50,
            'log_volume_gb': 10,
            'users': 100
        },
        'medium': {
            'name': 'Medium Usage (1K DAU, 50K req/day)',
            'monthly_requests': 1500000,
            'data_transfer_gb': 1000,
            'storage_gb': 200,
            'log_volume_gb': 100,
            'users': 1000
        },
        'high': {
            'name': 'High Usage (10K DAU, 500K req/day)',
            'monthly_requests': 15000000,
            'data_transfer_gb': 10000,
            'storage_gb': 1000,
            'log_volume_gb': 1000,
            'users': 10000
        }
    }
    
    print("=== AI Study Circle - Cloud Cost Analysis ===\n")
    
    for scenario_key, scenario in scenarios.items():
        print(f"📊 {scenario['name']}")
        
        # AWS Costs
        aws_costs = calculate_aws_costs(scenario)
        print(f"   AWS Total: ${aws_costs['total']:.0f}/month")
        print(f"   └─ Compute: ${aws_costs['compute']:.0f}, Storage: ${aws_costs['storage']:.0f}, Database: ${aws_costs['database']:.0f}")
        print(f"   └─ Logging: ${aws_costs['logging']:.0f} ({aws_costs['logging_pct']:.1f}%)")
        
        # Azure Costs
        azure_costs = calculate_azure_costs(scenario)
        print(f"   Azure Total: ${azure_costs['total']:.0f}/month")
        print(f"   └─ Compute: ${azure_costs['compute']:.0f}, Storage: ${azure_costs['storage']:.0f}, Database: ${azure_costs['database']:.0f}")
        print(f"   └─ Logging: ${azure_costs['logging']:.0f} ({azure_costs['logging_pct']:.1f}%)")
        
        # Comparison
        savings = aws_costs['total'] - azure_costs['total']
        savings_pct = (savings / aws_costs['total']) * 100
        
        if savings > 0:
            print(f"   💰 Azure saves ${savings:.0f}/month ({savings_pct:.1f}%)")
        else:
            print(f"   💰 AWS saves ${-savings:.0f}/month ({-savings_pct:.1f}%)")
        
        print()

def calculate_aws_costs(scenario):
    """Calculate AWS serverless costs"""
    costs = {}
    
    # Lambda + API Gateway
    requests = scenario['monthly_requests']
    lambda_cost = max(0, (requests - 1000000) * 0.0000002)  # Free tier: 1M requests
    api_gateway_cost = requests * 0.0000035
    costs['compute'] = lambda_cost + api_gateway_cost
    
    # S3 + CloudFront
    storage_cost = scenario['storage_gb'] * 0.023
    transfer_cost = scenario['data_transfer_gb'] * 0.085
    costs['storage'] = storage_cost + transfer_cost
    
    # DocumentDB (MongoDB-compatible)
    if scenario['users'] <= 100:
        costs['database'] = 65  # t3.medium
    elif scenario['users'] <= 1000:
        costs['database'] = 156  # r5.large
    else:
        costs['database'] = 625  # r5.2xlarge cluster
    
    # CloudWatch + OpenSearch
    log_gb = scenario['log_volume_gb']
    cloudwatch_cost = log_gb * 0.50 + log_gb * 0.03  # ingestion + storage
    
    if scenario['users'] <= 100:
        opensearch_cost = 28  # t3.small
    elif scenario['users'] <= 1000:
        opensearch_cost = 145  # m5.large + r5.large
    else:
        opensearch_cost = 567  # c5.2xlarge cluster
    
    costs['logging'] = cloudwatch_cost + opensearch_cost
    
    # Additional services
    additional = 20  # Cognito, SNS, WAF, etc.
    
    total = costs['compute'] + costs['storage'] + costs['database'] + costs['logging'] + additional
    
    return {
        'compute': costs['compute'],
        'storage': costs['storage'],
        'database': costs['database'],
        'logging': costs['logging'],
        'total': total,
        'logging_pct': (costs['logging'] / total) * 100
    }

def calculate_azure_costs(scenario):
    """Calculate Azure serverless costs"""
    costs = {}
    
    # Azure Functions + API Management
    requests = scenario['monthly_requests']
    functions_cost = max(0, (requests - 1000000) * 0.0000002)  # Free tier: 1M requests
    
    if scenario['users'] <= 100:
        apim_cost = 48  # Developer tier
    elif scenario['users'] <= 1000:
        apim_cost = 268  # Standard tier
    else:
        apim_cost = 2845  # Premium tier
    
    costs['compute'] = functions_cost + apim_cost
    
    # Static Web Apps + Blob Storage
    storage_cost = scenario['storage_gb'] * 0.18
    transfer_cost = scenario['data_transfer_gb'] * 0.15
    static_app_cost = 9  # Standard tier
    costs['storage'] = storage_cost + transfer_cost + static_app_cost
    
    # Cosmos DB (Request Units model)
    if scenario['users'] <= 100:
        ru_cost = 1000 * 0.008 * 730  # 1000 RU/s
    elif scenario['users'] <= 1000:
        ru_cost = 5000 * 0.008 * 730  # 5000 RU/s
    else:
        ru_cost = 25000 * 0.008 * 730  # 25000 RU/s
    
    costs['database'] = ru_cost
    
    # Azure Monitor + Cognitive Search
    log_gb = scenario['log_volume_gb']
    monitor_cost = log_gb * 0.27 + log_gb * 0.12  # ingestion + retention
    
    if scenario['users'] <= 100:
        search_cost = 25  # Basic tier
    elif scenario['users'] <= 1000:
        search_cost = 89  # Standard S1
    else:
        search_cost = 445  # Standard S3
    
    costs['logging'] = monitor_cost + search_cost
    
    # Additional services
    additional = 15  # AD B2C, Logic Apps, Key Vault, etc.
    
    total = costs['compute'] + costs['storage'] + costs['database'] + costs['logging'] + additional
    
    return {
        'compute': costs['compute'],
        'storage': costs['storage'],
        'database': costs['database'],
        'logging': costs['logging'],
        'total': total,
        'logging_pct': (costs['logging'] / total) * 100
    }

def print_recommendations():
    """Print cost optimization recommendations"""
    print("🎯 Cost Optimization Recommendations:")
    print("\n1. Logging Strategy:")
    print("   • Set log retention to 30 days for application logs")
    print("   • Use 7 days for debug logs")
    print("   • Archive audit logs to cheaper storage")
    print("\n2. Database Optimization:")
    print("   • Monitor and right-size database resources")
    print("   • Use read replicas for analytics workloads")
    print("   • Consider DynamoDB/Table Storage for simple data")
    print("\n3. Compute Efficiency:")
    print("   • Optimize function memory allocation")
    print("   • Use API caching to reduce function calls")
    print("   • Implement connection pooling")
    print("\n4. Storage Savings:")
    print("   • Use CDN caching effectively")
    print("   • Compress assets and enable gzip")
    print("   • Archive old files to glacier/archive storage")

def migration_timeline():
    """Print migration timeline and costs"""
    print("\n📅 Migration Timeline & Costs:")
    print("\nPhase 1 (Weeks 1-2): Infrastructure Setup")
    print("   • Set up cloud accounts and basic services")
    print("   • Estimated effort: 40 hours")
    print("\nPhase 2 (Weeks 3-4): Frontend Migration")
    print("   • Deploy React app to static hosting")
    print("   • Configure CDN and domain")
    print("   • Estimated effort: 30 hours")
    print("\nPhase 3 (Weeks 5-6): Backend Migration")
    print("   • Convert Express routes to serverless functions")
    print("   • Set up API management")
    print("   • Estimated effort: 60 hours")
    print("\nPhase 4 (Weeks 7-8): Database Migration")
    print("   • Migrate MongoDB to cloud database")
    print("   • Data validation and testing")
    print("   • Estimated effort: 40 hours")
    print("\nPhase 5 (Weeks 9-10): Logging & Monitoring")
    print("   • Set up centralized logging")
    print("   • Configure dashboards and alerts")
    print("   • Estimated effort: 35 hours")
    print("\nTotal Migration Cost: $25,000 - $35,000")
    print("Expected ROI: 6-8 months")

if __name__ == "__main__":
    calculate_costs()
    print_recommendations()
    migration_timeline()