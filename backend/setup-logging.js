#!/usr/bin/env node

/**
 * Logging System Setup Script
 * Initializes directories, validates configuration, and sets up the logging infrastructure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Setting up AI Study Circle Logging System...\n');

// Create required directories
const directories = [
  'logs',
  'logs/archive',
  'elk',
  'elk/elasticsearch',
  'elk/logstash',
  'elk/logstash/pipeline',
  'elk/logstash/templates',
  'elk/kibana',
  'elk/filebeat'
];

console.log('📁 Creating log directories...');
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`   ✅ Created: ${dir}`);
  } else {
    console.log(`   ✓ Exists: ${dir}`);
  }
});

// Create .gitkeep files for empty directories
console.log('\n📝 Creating .gitkeep files...');
const gitkeepDirs = ['logs', 'logs/archive'];
gitkeepDirs.forEach(dir => {
  const gitkeepPath = path.join(__dirname, dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# This file ensures the directory is tracked by git\n');
    console.log(`   ✅ Created: ${dir}/.gitkeep`);
  }
});

// Check if logging dependencies are installed
console.log('\n📦 Checking logging dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'winston',
    'winston-daily-rotate-file',
    'winston-elasticsearch',
    'uuid'
  ];

  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );

  if (missingDeps.length > 0) {
    console.log('   ❌ Missing dependencies detected');
    console.log('   Installing required logging dependencies...');
    
    const installCommand = `npm install ${missingDeps.join(' ')}`;
    console.log(`   Running: ${installCommand}`);
    execSync(installCommand, { stdio: 'inherit' });
    
    console.log('   ✅ Dependencies installed successfully');
  } else {
    console.log('   ✅ All logging dependencies are installed');
  }
} catch (error) {
  console.log(`   ⚠️  Could not check dependencies: ${error.message}`);
}

// Create logging configuration if it doesn't exist
console.log('\n⚙️ Setting up logging configuration...');
const envLoggingExample = path.join(__dirname, '.env.logging.example');
const envFile = path.join(__dirname, '.env');

if (fs.existsSync(envLoggingExample)) {
  if (fs.existsSync(envFile)) {
    const existingEnv = fs.readFileSync(envFile, 'utf8');
    
    // Check if logging configuration already exists
    if (!existingEnv.includes('LOG_LEVEL')) {
      console.log('   📝 Adding logging configuration to existing .env file...');
      
      const loggingConfig = fs.readFileSync(envLoggingExample, 'utf8');
      const separator = '\n\n# ============================================\n# LOGGING CONFIGURATION (Auto-added)\n# ============================================\n';
      
      fs.appendFileSync(envFile, separator + loggingConfig);
      console.log('   ✅ Logging configuration added to .env file');
    } else {
      console.log('   ✓ Logging configuration already exists in .env file');
    }
  } else {
    console.log('   📝 Creating .env file with logging configuration...');
    fs.copyFileSync(envLoggingExample, envFile);
    console.log('   ✅ .env file created with logging configuration');
  }
} else {
  console.log('   ⚠️  .env.logging.example not found');
}

// Create logs directory structure in .gitignore
console.log('\n📝 Updating .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
const logIgnoreRules = [
  '',
  '# Logging files',
  'logs/*.log',
  'logs/archive/*',
  '!logs/.gitkeep',
  '!logs/archive/.gitkeep',
  '',
  '# ELK Stack data',
  'elk/data/',
  'elk/elasticsearch/data/',
  'elk/logstash/data/',
  'elk/kibana/data/',
  ''
].join('\n');

if (fs.existsSync(gitignorePath)) {
  const existingGitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!existingGitignore.includes('# Logging files')) {
    fs.appendFileSync(gitignorePath, logIgnoreRules);
    console.log('   ✅ Added logging rules to .gitignore');
  } else {
    console.log('   ✓ Logging rules already exist in .gitignore');
  }
} else {
  fs.writeFileSync(gitignorePath, logIgnoreRules);
  console.log('   ✅ Created .gitignore with logging rules');
}

// Test logging configuration
console.log('\n🧪 Testing logging configuration...');
try {
  // Test if we can load the logging configuration
  const { initializeLogging, validateConfig } = require('./src/config/loggingConfig');
  const config = initializeLogging();
  validateConfig(config);
  
  console.log('   ✅ Logging configuration is valid');
  
  // Test if we can create a logger instance
  const logger = require('./src/utils/Logger');
  logger.info('Test log message from setup script');
  
  console.log('   ✅ Logger instance created successfully');
  console.log('   ✅ Test log written to log files');
  
} catch (error) {
  console.log(`   ❌ Logging configuration test failed: ${error.message}`);
  console.log('   Please check your configuration and try again.');
}

// Create npm scripts
console.log('\n📜 Checking npm scripts...');
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const loggingScripts = {
    'logs:setup': 'node setup-logging.js',
    'logs:clear': 'rm -rf logs/*.log logs/archive/*',
    'logs:rotate': 'find logs -name "*.log" -type f -exec gzip {} \\; && mv logs/*.gz logs/archive/',
    'logs:tail': 'tail -f logs/combined-$(date +%Y-%m-%d).log',
    'logs:errors': 'tail -f logs/error-$(date +%Y-%m-%d).log'
  };

  let scriptsAdded = false;
  Object.entries(loggingScripts).forEach(([scriptName, command]) => {
    if (!packageJson.scripts[scriptName]) {
      packageJson.scripts[scriptName] = command;
      scriptsAdded = true;
      console.log(`   ✅ Added script: ${scriptName}`);
    }
  });

  if (scriptsAdded) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('   ✅ Package.json updated with logging scripts');
  } else {
    console.log('   ✓ Logging scripts already exist');
  }
  
} catch (error) {
  console.log(`   ⚠️  Could not update package.json: ${error.message}`);
}

// Create log analysis script
console.log('\n📊 Creating log analysis script...');
const logAnalysisScript = `#!/usr/bin/env node

/**
 * Simple log analysis script
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
const today = new Date().toISOString().split('T')[0];

console.log('📊 AI Study Circle Log Analysis');
console.log('===============================');

// Check if log files exist
const combinedLog = path.join(logDir, \`combined-\${today}.log\`);
const errorLog = path.join(logDir, \`error-\${today}.log\`);

if (fs.existsSync(combinedLog)) {
  const logs = fs.readFileSync(combinedLog, 'utf8').split('\\n').filter(line => line.trim());
  console.log(\`📝 Total logs today: \${logs.length}\`);
  
  // Count log levels
  const levels = { info: 0, warn: 0, error: 0, debug: 0 };
  logs.forEach(line => {
    try {
      const logEntry = JSON.parse(line);
      if (levels.hasOwnProperty(logEntry.level)) {
        levels[logEntry.level]++;
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  });
  
  console.log(\`ℹ️  Info: \${levels.info}\`);
  console.log(\`⚠️  Warn: \${levels.warn}\`);
  console.log(\`❌ Error: \${levels.error}\`);
  console.log(\`🐛 Debug: \${levels.debug}\`);
} else {
  console.log(\`📝 No logs found for today (\${today})\`);
}

if (fs.existsSync(errorLog)) {
  const errors = fs.readFileSync(errorLog, 'utf8').split('\\n').filter(line => line.trim());
  console.log(\`🚨 Total errors today: \${errors.length}\`);
} else {
  console.log('✅ No errors today');
}
`;

const analysisScriptPath = path.join(__dirname, 'analyze-logs.js');
if (!fs.existsSync(analysisScriptPath)) {
  fs.writeFileSync(analysisScriptPath, logAnalysisScript);
  fs.chmodSync(analysisScriptPath, '755');
  console.log('   ✅ Created log analysis script');
} else {
  console.log('   ✓ Log analysis script already exists');
}

console.log('\n🎉 Logging system setup completed successfully!');
console.log('\n📋 Quick Start:');
console.log('   • Start server: npm run dev');
console.log('   • View logs: npm run logs:tail');
console.log('   • View errors: npm run logs:errors');
console.log('   • Analyze logs: node analyze-logs.js');
console.log('   • Clear logs: npm run logs:clear');
console.log('\n📚 Next Steps:');
console.log('   1. Review .env file for logging configuration');
console.log('   2. Start the server to generate first logs');
console.log('   3. Check logs/ directory for log files');
console.log('   4. Set up ELK stack (optional) for advanced logging');
console.log('\n✨ Happy logging! 🪵');