// Azure Deployment Cost Calculator & Optimizer
// Real-time cost analysis for AI Study Circle on Azure

class AzureDeploymentOptimizer {
    constructor() {
        this.baseConfig = {
            // Container Instance pricing (East US)
            pricing: {
                vCpu: 0.0375,        // $0.0375 per vCPU per hour
                memory: 0.004375,    // $0.004375 per GB per hour
                storage: 0.00014,    // $0.00014 per GB per hour
                publicIp: 3.65,      // $3.65 per month
                loadBalancer: 18.00, // $18 per month for Basic LB
                logAnalytics: 2.30,  // $2.30 per GB ingested
                acr: 5.00           // $5 per month for Basic registry
            },
            
            // Resource configurations
            services: {
                frontend: { cpu: 1.5, memory: 3, storage: 10 },
                backend: { cpu: 2, memory: 4, storage: 10 },
                elasticsearch: { cpu: 1, memory: 2, storage: 50 },
                logstash: { cpu: 0.5, memory: 1, storage: 10 },
                kibana: { cpu: 0.5, memory: 1, storage: 10 }
            }
        };
        
        this.deploymentScenarios = {
            dev: { scale: 0.5, availability: 0.6 },      // 60% uptime, 50% resources
            staging: { scale: 0.8, availability: 0.8 },  // 80% uptime, 80% resources  
            prod: { scale: 1.0, availability: 1.0 }      // 100% uptime, full resources
        };
    }
    
    // Calculate monthly cost for a service
    calculateServiceCost(service, environment = 'prod') {
        const config = this.baseConfig.services[service];
        const scenario = this.deploymentScenarios[environment];
        const hoursPerMonth = 730 * scenario.availability;
        
        const cpuCost = config.cpu * scenario.scale * this.baseConfig.pricing.vCpu * hoursPerMonth;
        const memoryCost = config.memory * scenario.scale * this.baseConfig.pricing.memory * hoursPerMonth;
        const storageCost = config.storage * this.baseConfig.pricing.storage * hoursPerMonth;
        
        return {
            service,
            environment,
            cpu: cpuCost,
            memory: memoryCost,
            storage: storageCost,
            total: cpuCost + memoryCost + storageCost,
            resources: {
                cpu: config.cpu * scenario.scale,
                memory: config.memory * scenario.scale,
                storage: config.storage
            }
        };
    }
    
    // Calculate total deployment cost
    calculateDeploymentCost(environment = 'prod', logVolumeGB = 100) {
        const services = ['frontend', 'backend', 'elasticsearch', 'logstash', 'kibana'];
        const serviceCosts = services.map(service => this.calculateServiceCost(service, environment));
        
        const totalServiceCost = serviceCosts.reduce((sum, service) => sum + service.total, 0);
        
        // Infrastructure costs
        const infrastructureCosts = {
            publicIp: this.baseConfig.pricing.publicIp,
            loadBalancer: this.baseConfig.pricing.loadBalancer,
            acr: this.baseConfig.pricing.acr,
            logIngestion: logVolumeGB * this.baseConfig.pricing.logAnalytics
        };
        
        const totalInfrastructureCost = Object.values(infrastructureCosts).reduce((sum, cost) => sum + cost, 0);
        const totalMonthlyCost = totalServiceCost + totalInfrastructureCost;
        
        return {
            environment,
            services: serviceCosts,
            infrastructure: infrastructureCosts,
            totals: {
                services: totalServiceCost,
                infrastructure: totalInfrastructureCost,
                monthly: totalMonthlyCost,
                annual: totalMonthlyCost * 12
            },
            optimization: this.getOptimizationRecommendations(serviceCosts, environment)
        };
    }
    
    // Get optimization recommendations
    getOptimizationRecommendations(serviceCosts, environment) {
        const recommendations = [];
        
        // Check for over-provisioning
        serviceCosts.forEach(service => {
            if (service.resources.cpu > 2 && environment !== 'prod') {
                recommendations.push({
                    type: 'cpu_optimization',
                    service: service.service,
                    suggestion: `Consider reducing CPU allocation by 25% for ${service.service}`,
                    potentialSavings: service.cpu * 0.25
                });
            }
            
            if (service.resources.memory > 4 && environment !== 'prod') {
                recommendations.push({
                    type: 'memory_optimization',
                    service: service.service,
                    suggestion: `Consider reducing memory allocation by 20% for ${service.service}`,
                    potentialSavings: service.memory * 0.20
                });
            }
        });
        
        // Environment-specific recommendations
        if (environment === 'dev') {
            recommendations.push({
                type: 'scheduling',
                suggestion: 'Implement auto-shutdown during non-business hours (60% additional savings)',
                potentialSavings: serviceCosts.reduce((sum, s) => sum + s.total, 0) * 0.6
            });
        }
        
        return recommendations;
    }
    
    // Compare with AWS Fargate costs
    compareWithAWS(environment = 'prod', logVolumeGB = 100) {
        const azureCost = this.calculateDeploymentCost(environment, logVolumeGB);
        
        // AWS Fargate equivalent costs (from previous analysis)
        const awsCosts = {
            dev: { compute: 136.77, infrastructure: 57.10, total: 193.87 },
            staging: { compute: 203.09, infrastructure: 230.70, total: 433.79 },
            prod: { compute: 383.29, infrastructure: 1200.20, total: 1583.49 }
        };
        
        const awsEquivalent = awsCosts[environment] || awsCosts.prod;
        const savings = awsEquivalent.total - azureCost.totals.monthly;
        const savingsPercent = (savings / awsEquivalent.total) * 100;
        
        return {
            azure: azureCost.totals.monthly,
            aws: awsEquivalent.total,
            savings: savings,
            savingsPercent: savingsPercent,
            recommendation: savings > 0 ? 'Azure Container Instances' : 'AWS Fargate',
            yearlySavings: savings * 12
        };
    }
    
    // Generate deployment sizing recommendations
    getDeploymentSizing(expectedDAU, environment = 'prod') {
        let sizing = { ...this.baseConfig.services };
        
        // Scale based on user count
        const scalingFactors = {
            frontend: Math.max(0.5, Math.min(3, expectedDAU / 5000)),
            backend: Math.max(0.5, Math.min(4, expectedDAU / 2500)),
            elasticsearch: Math.max(0.5, Math.min(2, expectedDAU / 10000)),
            logstash: Math.max(0.25, Math.min(1, expectedDAU / 15000)),
            kibana: 0.5 // Kibana doesn't scale linearly with users
        };
        
        // Apply scaling
        Object.keys(sizing).forEach(service => {
            const factor = scalingFactors[service] || 1;
            sizing[service].cpu *= factor;
            sizing[service].memory *= factor;
        });
        
        // Environment adjustments
        const envFactor = this.deploymentScenarios[environment].scale;
        Object.keys(sizing).forEach(service => {
            sizing[service].cpu *= envFactor;
            sizing[service].memory *= envFactor;
        });
        
        return {
            expectedDAU,
            environment,
            sizing,
            estimatedLogVolume: Math.max(10, expectedDAU * 0.1), // 0.1GB per 100 DAU
            recommendedInstanceCount: Math.max(1, Math.ceil(expectedDAU / 5000))
        };
    }
    
    // Generate comprehensive deployment plan
    generateDeploymentPlan(options = {}) {
        const {
            environment = 'prod',
            expectedDAU = 1000,
            region = 'East US',
            enableAutoScaling = true,
            enableScheduling = false
        } = options;
        
        const sizing = this.getDeploymentSizing(expectedDAU, environment);
        const costs = this.calculateDeploymentCost(environment, sizing.estimatedLogVolume);
        const awsComparison = this.compareWithAWS(environment, sizing.estimatedLogVolume);
        
        return {
            deployment: {
                environment,
                region,
                expectedDAU,
                sizing: sizing.sizing,
                logVolume: sizing.estimatedLogVolume
            },
            costs: {
                monthly: costs.totals.monthly,
                annual: costs.totals.annual,
                breakdown: costs.services,
                infrastructure: costs.infrastructure
            },
            optimization: {
                recommendations: costs.optimization,
                awsComparison,
                autoScaling: enableAutoScaling ? {
                    enabled: true,
                    minInstances: 1,
                    maxInstances: Math.min(5, Math.ceil(expectedDAU / 2000)),
                    potentialSavings: costs.totals.monthly * 0.15 // 15% savings
                } : { enabled: false },
                scheduling: enableScheduling ? {
                    enabled: true,
                    potentialSavings: costs.totals.monthly * 0.4 // 40% savings for dev
                } : { enabled: false }
            },
            elkAdvantage: {
                yourCost: sizing.estimatedLogVolume * this.baseConfig.pricing.logAnalytics,
                managedServiceCost: sizing.estimatedLogVolume * 15, // $15/GB for managed
                monthlySavings: (sizing.estimatedLogVolume * 15) - (sizing.estimatedLogVolume * this.baseConfig.pricing.logAnalytics)
            }
        };
    }
}

// Usage examples and cost analysis
function runCostAnalysis() {
    const optimizer = new AzureDeploymentOptimizer();
    
    console.log('🚀 Azure Container Instances Cost Analysis for AI Study Circle');
    console.log('===========================================================\n');
    
    // Analyze different environments
    ['dev', 'staging', 'prod'].forEach(env => {
        console.log(`📊 ${env.toUpperCase()} Environment Analysis:`);
        console.log('─'.repeat(40));
        
        const plan = optimizer.generateDeploymentPlan({
            environment: env,
            expectedDAU: env === 'dev' ? 100 : env === 'staging' ? 1000 : 5000,
            enableAutoScaling: true,
            enableScheduling: env === 'dev'
        });
        
        console.log(`💰 Monthly Cost: $${plan.costs.monthly.toFixed(2)}`);
        console.log(`📈 Annual Cost: $${plan.costs.annual.toFixed(2)}`);
        console.log(`🎯 Expected DAU: ${plan.deployment.expectedDAU.toLocaleString()}`);
        console.log(`📊 Log Volume: ${plan.deployment.logVolume}GB/month`);
        
        if (plan.optimization.awsComparison.savings > 0) {
            console.log(`💸 Savings vs AWS: $${plan.optimization.awsComparison.savings.toFixed(2)}/month (${plan.optimization.awsComparison.savingsPercent.toFixed(1)}%)`);
            console.log(`🎉 Annual Savings: $${plan.optimization.awsComparison.yearlySavings.toFixed(2)}`);
        }
        
        console.log(`🔍 ELK Stack Advantage: $${plan.elkAdvantage.monthlySavings.toFixed(2)}/month saved vs managed services`);
        console.log('');
    });
    
    // Detailed production analysis
    console.log('🎯 PRODUCTION DEPLOYMENT DETAILS:');
    console.log('═'.repeat(50));
    
    const prodPlan = optimizer.generateDeploymentPlan({
        environment: 'prod',
        expectedDAU: 1000,
        enableAutoScaling: true
    });
    
    console.log('\n💻 Resource Allocation:');
    Object.entries(prodPlan.deployment.sizing).forEach(([service, config]) => {
        console.log(`   ${service}: ${config.cpu} vCPU, ${config.memory}GB RAM`);
    });
    
    console.log('\n💰 Cost Breakdown:');
    prodPlan.costs.breakdown.forEach(service => {
        console.log(`   ${service.service}: $${service.total.toFixed(2)}/month`);
    });
    
    console.log('\n🏗️ Infrastructure Costs:');
    Object.entries(prodPlan.costs.infrastructure).forEach(([item, cost]) => {
        console.log(`   ${item}: $${cost.toFixed(2)}/month`);
    });
    
    console.log('\n🚀 Optimization Opportunities:');
    prodPlan.optimization.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec.suggestion}`);
        if (rec.potentialSavings) {
            console.log(`      Potential savings: $${rec.potentialSavings.toFixed(2)}/month`);
        }
    });
    
    console.log('\n🎯 FINAL RECOMMENDATION:');
    console.log('═'.repeat(30));
    console.log(`✅ Deploy on Azure Container Instances`);
    console.log(`💰 Total monthly cost: $${prodPlan.costs.monthly.toFixed(2)}`);
    console.log(`🎉 Annual savings vs AWS: $${prodPlan.optimization.awsComparison.yearlySavings.toFixed(2)}`);
    console.log(`🔥 ELK stack value: $${(prodPlan.elkAdvantage.monthlySavings * 12).toFixed(2)}/year`);
    console.log(`\n📞 Next step: Run ./deploy-aci.ps1 to deploy!`);
}

// Run the analysis
if (require.main === module) {
    runCostAnalysis();
}

module.exports = AzureDeploymentOptimizer;