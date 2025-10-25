#!/usr/bin/env node
/**
 * ECS Resource Calculator
 * Calculates CPU and RAM requirements for AI Study Circle on ECS
 */

const readline = require('readline');

class ECSResourceCalculator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.userCount = 0;
    this.requestsPerDay = 0;
    this.environment = 'dev';
    this.includeLogging = true;
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async gatherRequirements() {
    console.log('🎯 AI Study Circle - ECS Resource Calculator\n');
    
    // Get user requirements
    this.userCount = parseInt(await this.askQuestion('Expected daily active users (DAU): ')) || 100;
    this.requestsPerDay = parseInt(await this.askQuestion('Expected API requests per day: ')) || (this.userCount * 15);
    
    const envAnswer = await this.askQuestion('Environment (dev/staging/prod) [dev]: ');
    this.environment = envAnswer.toLowerCase() || 'dev';
    
    const loggingAnswer = await this.askQuestion('Include ELK logging stack? (y/n) [y]: ');
    this.includeLogging = !loggingAnswer.toLowerCase().startsWith('n');
    
    console.log('\n📊 Calculating resource requirements...\n');
  }

  calculateResources() {
    const multiplier = this.environment === 'prod' ? 2 : 1;
    const concurrency = Math.ceil(this.userCount * 0.1); // 10% concurrent users
    
    // Base resource calculations
    const resources = {
      frontend: this.calculateFrontend(concurrency, multiplier),
      backend: this.calculateBackend(this.requestsPerDay, multiplier),
      mongodb: this.calculateMongoDB(this.userCount, multiplier),
      redis: this.calculateRedis(concurrency),
      elasticsearch: this.includeLogging ? this.calculateElasticsearch(this.requestsPerDay) : null,
      logstash: this.includeLogging ? this.calculateLogstash() : null,
      kibana: this.includeLogging ? this.calculateKibana() : null,
      filebeat: this.includeLogging ? this.calculateFilebeat() : null
    };

    return resources;
  }

  calculateFrontend(concurrency, multiplier) {
    const baseCPU = 0.25;
    const baseMemory = 512;
    
    // Scale based on concurrent users
    const cpu = Math.max(baseCPU, Math.min(1.0, baseCPU + (concurrency / 200))) * multiplier;
    const memory = Math.max(baseMemory, Math.min(2048, baseMemory + (concurrency * 2))) * multiplier;
    const tasks = Math.max(1, Math.ceil(concurrency / 50));

    return {
      cpu: parseFloat(cpu.toFixed(2)),
      memory: Math.round(memory),
      tasks: Math.min(tasks, 10),
      reasoning: `Based on ${concurrency} concurrent users, SSR requirements`
    };
  }

  calculateBackend(requestsPerDay, multiplier) {
    const baseCPU = 0.5;
    const baseMemory = 1024;
    
    const requestsPerSecond = requestsPerDay / (24 * 60 * 60);
    
    // Scale based on requests per second
    const cpu = Math.max(baseCPU, Math.min(2.0, baseCPU + (requestsPerSecond / 10))) * multiplier;
    const memory = Math.max(baseMemory, Math.min(4096, baseMemory + (requestsPerSecond * 50))) * multiplier;
    const tasks = Math.max(1, Math.ceil(requestsPerSecond / 5));

    return {
      cpu: parseFloat(cpu.toFixed(2)),
      memory: Math.round(memory),
      tasks: Math.min(tasks, 20),
      reasoning: `Based on ${requestsPerSecond.toFixed(1)} RPS, AI processing, file handling`
    };
  }

  calculateMongoDB(userCount, multiplier) {
    const baseCPU = 0.5;
    const baseMemory = 1024;
    
    // Scale based on data size and user count
    const cpu = Math.max(baseCPU, Math.min(2.0, baseCPU + (userCount / 1000))) * multiplier;
    const memory = Math.max(baseMemory, Math.min(8192, baseMemory + (userCount * 2))) * multiplier;

    return {
      cpu: parseFloat(cpu.toFixed(2)),
      memory: Math.round(memory),
      tasks: 1,
      reasoning: `Based on ${userCount} users, document storage, indexing requirements`
    };
  }

  calculateRedis(concurrency) {
    return {
      cpu: 0.25,
      memory: Math.max(256, Math.min(1024, 256 + (concurrency * 2))),
      tasks: 1,
      reasoning: `Session storage for ${concurrency} concurrent users`
    };
  }

  calculateElasticsearch(requestsPerDay) {
    const logVolume = requestsPerDay * 0.5; // KB per day
    const cpu = Math.max(1.0, Math.min(4.0, 1.0 + (logVolume / 100000)));
    const memory = Math.max(2048, Math.min(8192, 2048 + (logVolume / 1000)));

    return {
      cpu: parseFloat(cpu.toFixed(2)),
      memory: Math.round(memory),
      tasks: 1,
      reasoning: `Based on ${(logVolume/1000).toFixed(1)}MB daily log volume`
    };
  }

  calculateLogstash() {
    return {
      cpu: 0.5,
      memory: 1024,
      tasks: 1,
      reasoning: 'Log processing pipeline with Ruby scripts'
    };
  }

  calculateKibana() {
    return {
      cpu: 0.5,
      memory: 1024,
      tasks: 1,
      reasoning: 'Dashboard visualization and management'
    };
  }

  calculateFilebeat() {
    return {
      cpu: 0.25,
      memory: 256,
      tasks: 1,
      reasoning: 'Lightweight log shipping agent'
    };
  }

  calculateCosts(resources) {
    // AWS Fargate pricing (us-east-1)
    const fargateVCpuPrice = 0.04048; // per vCPU per hour
    const fargateMemoryPrice = 0.004445; // per GB per hour
    const hoursPerMonth = 730;

    let totalCosts = {};
    let totalVCpu = 0;
    let totalMemory = 0;

    Object.entries(resources).forEach(([service, config]) => {
      if (!config) return;
      
      const vcpu = config.cpu * config.tasks;
      const memory = (config.memory / 1024) * config.tasks; // Convert MB to GB
      
      const monthlyCpuCost = vcpu * fargateVCpuPrice * hoursPerMonth;
      const monthlyMemoryCost = memory * fargateMemoryPrice * hoursPerMonth;
      const totalMonthlyCost = monthlyCpuCost + monthlyMemoryCost;

      totalCosts[service] = {
        vcpu: vcpu,
        memory: memory,
        cost: totalMonthlyCost
      };

      totalVCpu += vcpu;
      totalMemory += memory;
    });

    return {
      services: totalCosts,
      totals: {
        vcpu: totalVCpu,
        memory: totalMemory,
        cost: Object.values(totalCosts).reduce((sum, service) => sum + service.cost, 0)
      }
    };
  }

  displayResults(resources, costs) {
    console.log('📋 ECS Resource Requirements\n');
    console.log('┌─────────────────┬─────────┬────────────┬───────┬──────────────────────────────┐');
    console.log('│ Service         │ vCPU    │ Memory(MB) │ Tasks │ Reasoning                    │');
    console.log('├─────────────────┼─────────┼────────────┼───────┼──────────────────────────────┤');

    Object.entries(resources).forEach(([service, config]) => {
      if (!config) return;
      
      const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
      const cpu = config.cpu.toString().padEnd(7);
      const memory = config.memory.toString().padEnd(10);
      const tasks = config.tasks.toString().padEnd(5);
      const reasoning = config.reasoning.length > 28 ? 
        config.reasoning.substring(0, 25) + '...' : 
        config.reasoning.padEnd(28);
      
      console.log(`│ ${serviceName.padEnd(15)} │ ${cpu} │ ${memory} │ ${tasks} │ ${reasoning} │`);
    });

    console.log('└─────────────────┴─────────┴────────────┴───────┴──────────────────────────────┘');

    // Cost breakdown
    console.log('\n💰 Monthly Cost Breakdown (AWS Fargate - us-east-1)\n');
    console.log('┌─────────────────┬─────────┬────────────┬─────────────┐');
    console.log('│ Service         │ vCPU    │ Memory(GB) │ Cost/Month  │');
    console.log('├─────────────────┼─────────┼────────────┼─────────────┤');

    Object.entries(costs.services).forEach(([service, cost]) => {
      const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
      const vcpu = cost.vcpu.toFixed(2).padEnd(7);
      const memory = cost.memory.toFixed(2).padEnd(10);
      const monthlyCost = `$${cost.cost.toFixed(2)}`.padStart(11);
      
      console.log(`│ ${serviceName.padEnd(15)} │ ${vcpu} │ ${memory} │ ${monthlyCost} │`);
    });

    console.log('├─────────────────┼─────────┼────────────┼─────────────┤');
    const totalVCpu = costs.totals.vcpu.toFixed(2).padEnd(7);
    const totalMemory = costs.totals.memory.toFixed(2).padEnd(10);
    const totalCost = `$${costs.totals.cost.toFixed(2)}`.padStart(11);
    console.log(`│ ${'TOTAL'.padEnd(15)} │ ${totalVCpu} │ ${totalMemory} │ ${totalCost} │`);
    console.log('└─────────────────┴─────────┴────────────┴─────────────┘');

    // Recommendations
    console.log('\n🎯 Recommendations\n');
    
    if (this.userCount < 500) {
      console.log('• Consider EC2 instances instead of Fargate for cost savings');
      console.log('• Use t3.medium or t3.large instances with spot pricing');
    } else {
      console.log('• Fargate is recommended for this scale');
      console.log('• Consider reserved capacity for predictable workloads');
    }
    
    if (this.includeLogging) {
      console.log('• Your ELK stack provides excellent value vs managed services');
      console.log('• Consider Amazon OpenSearch for production (managed ELK)');
    }
    
    if (costs.totals.cost > 1000) {
      console.log('• Implement auto-scaling policies to optimize costs');
      console.log('• Use AWS Savings Plans for additional discounts');
    }

    console.log('\n🔧 Next Steps\n');
    console.log('1. Review the generated ECS task definitions');
    console.log('2. Set up your VPC, subnets, and security groups');
    console.log('3. Create ECR repositories for your Docker images');
    console.log('4. Deploy using the provided deployment script');
    console.log('5. Monitor resource utilization and adjust as needed');
  }

  async run() {
    try {
      await this.gatherRequirements();
      const resources = this.calculateResources();
      const costs = this.calculateCosts(resources);
      this.displayResults(resources, costs);
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      this.rl.close();
    }
  }
}

// Run the calculator
if (require.main === module) {
  const calculator = new ECSResourceCalculator();
  calculator.run();
}

module.exports = ECSResourceCalculator;