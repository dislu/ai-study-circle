# Cloud Cost Calculator - AI Study Circle
# Interactive Cost Estimation Tool
# This script helps calculate detailed costs for different usage scenarios.

import json
import math

class CloudCostCalculator:
    def __init__(self):
        self.aws_pricing = {
            'lambda': {
                'requests': 0.0000002,  # per request
                'gb_seconds': 0.0000166667  # per GB-second
            },
            'api_gateway': {
                'requests': 0.0000035  # per request
            },
            's3': {
                'storage': 0.023,  # per GB/month
                'requests_put': 0.0005,  # per 1K requests
                'requests_get': 0.0004,  # per 1K requests
                'transfer': 0.09  # per GB
            },
            'cloudfront': {
                'transfer': 0.085,  # per GB
                'requests': 0.0075  # per 10K requests
            },
            'documentdb': {
                't3_medium': 65,  # per month
                'r5_large': 156,  # per month
                'r5_2xlarge': 625  # per month
            },
            'cloudwatch': {
                'ingestion': 0.50,  # per GB
                'storage': 0.03,  # per GB/month
                'metrics': 0.30,  # per metric/month
                'alarms': 0.10  # per alarm/month
            },
            'opensearch': {
                't3_small': 28,  # per month
                'm5_large': 89,  # per month
                'c5_2xlarge': 567  # per month
            }
        }
        
        self.azure_pricing = {
            'functions': {
                'requests': 0.0000002,  # per request
                'gb_seconds': 0.000016  # per GB-second
            },
            'apim': {
                'developer': 48,  # per month
                'standard': 268,  # per month
                'premium': 2845  # per month
            },
            'static_web_apps': {
                'standard': 9,  # per month
                'storage': 0.18,  # per GB/month
                'bandwidth': 0.15  # per GB
            },
            'cosmos_db': {
                'ru_per_second': 0.008  # per RU/s per hour
            },
            'monitor': {
                'ingestion': 0.27,  # per GB
                'retention_basic': 0.12,  # per GB/month
                'retention_premium': 0.25  # per GB/month
            },
            'cognitive_search': {
                'basic': 25,  # per month
                'standard_s1': 89,  # per month
                'standard_s3': 445  # per month
            }
        }

    def calculate_aws_costs(self, scenario):
        costs = {}
        
        # Lambda costs
        lambda_requests = scenario['requests_per_month']
        lambda_duration = scenario['avg_duration_seconds']
        lambda_memory_gb = scenario['memory_gb']
        
        gb_seconds = lambda_requests * lambda_duration * lambda_memory_gb
        
        costs['lambda'] = {
            'requests': max(0, (lambda_requests - 1000000) * self.aws_pricing['lambda']['requests']),
            'execution': max(0, (gb_seconds - 400000) * self.aws_pricing['lambda']['gb_seconds']),
            'total': 0
        }
        costs['lambda']['total'] = costs['lambda']['requests'] + costs['lambda']['execution']
        
        # API Gateway
        costs['api_gateway'] = lambda_requests * self.aws_pricing['api_gateway']['requests']
        
        # S3 + CloudFront
        storage_gb = scenario['storage_gb']
        transfer_gb = scenario['cdn_transfer_gb']
        
        costs['s3_cloudfront'] = {
            'storage': storage_gb * self.aws_pricing['s3']['storage'],
            'transfer': transfer_gb * self.aws_pricing['cloudfront']['transfer'],
            'total': 0
        }
        costs['s3_cloudfront']['total'] = costs['s3_cloudfront']['storage'] + costs['s3_cloudfront']['transfer']
        
        # Database
        costs['database'] = scenario['database_cost']
        
        # CloudWatch
        log_volume_gb = scenario['log_volume_gb']
        metrics_count = scenario['metrics_count']
        alarms_count = scenario['alarms_count']
        
        costs['cloudwatch'] = {
            'ingestion': log_volume_gb * self.aws_pricing['cloudwatch']['ingestion'],
            'storage': log_volume_gb * self.aws_pricing['cloudwatch']['storage'],
            'metrics': metrics_count * self.aws_pricing['cloudwatch']['metrics'],
            'alarms': alarms_count * self.aws_pricing['cloudwatch']['alarms'],
            'total': 0
        }
        costs['cloudwatch']['total'] = (costs['cloudwatch']['ingestion'] + 
                                      costs['cloudwatch']['storage'] + 
                                      costs['cloudwatch']['metrics'] + 
                                      costs['cloudwatch']['alarms'])
        
        # OpenSearch
        costs['opensearch'] = scenario['opensearch_cost']
        
        # Additional services
        costs['additional'] = {
            'cognito': scenario.get('cognito_cost', 0),
            'sns_ses': scenario.get('notification_cost', 2),
            'waf': scenario.get('waf_cost', 6),
            'data_transfer': scenario.get('data_transfer_cost', 18)
        }
        
        # Calculate total
        total_cost = (costs['lambda']['total'] + costs['api_gateway'] + 
                     costs['s3_cloudfront']['total'] + costs['database'] + 
                     costs['cloudwatch']['total'] + costs['opensearch'] +
                     sum(costs['additional'].values()))
        
        return {
            'breakdown': costs,
            'total': total_cost,
            'logging_percentage': (costs['cloudwatch']['total'] + costs['opensearch']) / total_cost * 100
        }

    def calculate_azure_costs(self, scenario):
        costs = {}
        
        # Azure Functions
        function_requests = scenario['requests_per_month']
        function_duration = scenario['avg_duration_seconds']
        function_memory_gb = scenario['memory_gb']
        
        gb_seconds = function_requests * function_duration * function_memory_gb
        
        costs['functions'] = {
            'requests': max(0, (function_requests - 1000000) * self.azure_pricing['functions']['requests']),
            'execution': max(0, (gb_seconds - 400000) * self.azure_pricing['functions']['gb_seconds']),
            'total': 0
        }
        costs['functions']['total'] = costs['functions']['requests'] + costs['functions']['execution']
        
        # API Management
        costs['apim'] = scenario['apim_tier_cost']
        
        # Static Web Apps
        storage_gb = scenario['storage_gb']
        transfer_gb = scenario['cdn_transfer_gb']
        
        costs['static_web_apps'] = {
            'base': self.azure_pricing['static_web_apps']['standard'],
            'storage': storage_gb * self.azure_pricing['static_web_apps']['storage'],
            'bandwidth': transfer_gb * self.azure_pricing['static_web_apps']['bandwidth'],
            'total': 0
        }
        costs['static_web_apps']['total'] = (costs['static_web_apps']['base'] + 
                                           costs['static_web_apps']['storage'] + 
                                           costs['static_web_apps']['bandwidth'])
        
        # Cosmos DB
        ru_per_second = scenario['cosmos_ru_per_second']
        hours_per_month = 730
        costs['cosmos_db'] = ru_per_second * self.azure_pricing['cosmos_db']['ru_per_second'] * hours_per_month
        
        # Azure Monitor
        log_volume_gb = scenario['log_volume_gb']
        
        costs['monitor'] = {
            'ingestion': log_volume_gb * self.azure_pricing['monitor']['ingestion'],
            'retention': log_volume_gb * self.azure_pricing['monitor']['retention_basic'],
            'total': 0
        }
        costs['monitor']['total'] = costs['monitor']['ingestion'] + costs['monitor']['retention']
        
        # Cognitive Search
        costs['search'] = scenario['search_tier_cost']
        
        # Additional services
        costs['additional'] = {
            'ad_b2c': scenario.get('ad_b2c_cost', 0),
            'logic_apps': scenario.get('logic_apps_cost', 1),
            'app_gateway': scenario.get('app_gateway_cost', 18),
            'key_vault': scenario.get('key_vault_cost', 1),
            'data_transfer': scenario.get('data_transfer_cost', 16)
        }
        
        # Calculate total
        total_cost = (costs['functions']['total'] + costs['apim'] + 
                     costs['static_web_apps']['total'] + costs['cosmos_db'] + 
                     costs['monitor']['total'] + costs['search'] +
                     sum(costs['additional'].values()))
        
        return {
            'breakdown': costs,
            'total': total_cost,
            'logging_percentage': (costs['monitor']['total'] + costs['search']) / total_cost * 100
        }

    def generate_scenarios(self):
        scenarios = {
            'low_usage': {
                'name': 'Low Usage (100 DAU)',
                'requests_per_month': 50000,
                'avg_duration_seconds': 2,
                'memory_gb': 0.5,
                'storage_gb': 50,
                'cdn_transfer_gb': 100,
                'log_volume_gb': 10,
                'metrics_count': 50,
                'alarms_count': 10,
                'database_cost': 65,  # AWS DocumentDB t3.medium
                'opensearch_cost': 28,  # AWS t3.small
                'apim_tier_cost': 48,  # Azure Developer
                'cosmos_ru_per_second': 1000,
                'search_tier_cost': 25  # Azure Basic
            },
            'medium_usage': {
                'name': 'Medium Usage (1K DAU)',
                'requests_per_month': 1500000,
                'avg_duration_seconds': 2,
                'memory_gb': 0.5,
                'storage_gb': 200,
                'cdn_transfer_gb': 500,
                'log_volume_gb': 100,
                'metrics_count': 200,
                'alarms_count': 25,
                'database_cost': 156,  # AWS DocumentDB r5.large
                'opensearch_cost': 145,  # AWS m5.large + r5.large
                'apim_tier_cost': 268,  # Azure Standard
                'cosmos_ru_per_second': 5000,
                'search_tier_cost': 89,  # Azure Standard S1
                'cognito_cost': 27.5,
                'notification_cost': 12,
                'waf_cost': 15,
                'data_transfer_cost': 89,
                'ad_b2c_cost': 15,
                'logic_apps_cost': 28,
                'app_gateway_cost': 45,
                'key_vault_cost': 3
            },
            'high_usage': {
                'name': 'High Usage (10K DAU)',
                'requests_per_month': 15000000,
                'avg_duration_seconds': 3,
                'memory_gb': 1.0,
                'storage_gb': 1000,
                'cdn_transfer_gb': 5000,
                'log_volume_gb': 1000,
                'metrics_count': 1000,
                'alarms_count': 50,
                'database_cost': 625,  # AWS DocumentDB r5.2xlarge
                'opensearch_cost': 567,  # AWS c5.2xlarge
                'apim_tier_cost': 2845,  # Azure Premium
                'cosmos_ru_per_second': 25000,
                'search_tier_cost': 445,  # Azure Standard S3
                'cognito_cost': 275,
                'notification_cost': 89,
                'waf_cost': 3000,  # AWS Shield Advanced
                'data_transfer_cost': 856,
                'ad_b2c_cost': 150,
                'logic_apps_cost': 234,
                'app_gateway_cost': 334,
                'key_vault_cost': 12
            }
        }
        return scenarios

    def compare_all_scenarios(self):
        scenarios = self.generate_scenarios()
        results = {}
        
        for scenario_name, scenario_data in scenarios.items():
            aws_costs = self.calculate_aws_costs(scenario_data)
            azure_costs = self.calculate_azure_costs(scenario_data)
            
            results[scenario_name] = {
                'scenario': scenario_data['name'],
                'aws': aws_costs,
                'azure': azure_costs,
                'savings_azure': aws_costs['total'] - azure_costs['total'],
                'savings_percentage': ((aws_costs['total'] - azure_costs['total']) / aws_costs['total']) * 100
            }
        
        return results

    def generate_report(self):
        results = self.compare_all_scenarios()
        
        print("=== AI Study Circle - Cloud Cost Analysis ===\n")
        
        for scenario_name, data in results.items():
            print(f"📊 {data['scenario']}")
            print(f"   AWS Total Cost: ${data['aws']['total']:.2f}/month")
            print(f"   Azure Total Cost: ${data['azure']['total']:.2f}/month")
            print(f"   Azure Savings: ${data['savings_azure']:.2f}/month ({data['savings_percentage']:.1f}%)")
            print(f"   AWS Logging %: {data['aws']['logging_percentage']:.1f}%")
            print(f"   Azure Logging %: {data['azure']['logging_percentage']:.1f}%")
            print()
        
        # Summary recommendations
        print("🎯 Recommendations:")
        avg_azure_savings = sum([data['savings_percentage'] for data in results.values()]) / len(results)
        print(f"   Average Azure Savings: {avg_azure_savings:.1f}%")
        
        if avg_azure_savings > 5:
            print("   ✅ Azure is more cost-effective across all scenarios")
        elif avg_azure_savings > 0:
            print("   ✅ Azure offers moderate savings")
        else:
            print("   ⚠️  AWS may be more cost-effective")
        
        print(f"\n   Logging represents 20-35% of total costs in both platforms")
        print(f"   Consider logging optimization strategies for significant savings")

if __name__ == "__main__":
    calculator = CloudCostCalculator()
    calculator.generate_report()