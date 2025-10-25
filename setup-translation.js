#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class TranslationSystemSetup {
  constructor() {
    this.rootDir = process.cwd();
    this.backendDir = path.join(this.rootDir, 'backend');
    this.frontendDir = path.join(this.rootDir, 'frontend');
  }

  async run() {
    console.log('🌏 AI Study Circle - Indian Language Translation Setup');
    console.log('====================================================\n');

    try {
      await this.checkDirectories();
      await this.installBackendDependencies();
      await this.installFrontendDependencies();
      await this.createEnvFiles();
      await this.runHealthCheck();
      
      console.log('\n✅ Translation system setup complete!');
      console.log('\nNext steps:');
      console.log('1. Add your Google Cloud API credentials to .env');
      console.log('2. Start the backend: cd backend && npm run dev');
      console.log('3. Start the frontend: cd frontend && npm run dev');
      console.log('4. Visit http://localhost:3000 to test translation features\n');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkDirectories() {
    console.log('📁 Checking project structure...');
    
    const backendExists = await this.directoryExists(this.backendDir);
    const frontendExists = await this.directoryExists(this.frontendDir);
    
    if (!backendExists) {
      throw new Error(`Backend directory not found: ${this.backendDir}`);
    }
    
    if (!frontendExists) {
      throw new Error(`Frontend directory not found: ${this.frontendDir}`);
    }
    
    console.log('✓ Project directories found\n');
  }

  async installBackendDependencies() {
    console.log('📦 Installing backend dependencies...');
    
    const packageJsonPath = path.join(this.backendDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    // Check if translation dependencies are already in package.json
    const requiredDeps = [
      '@google-cloud/translate',
      'franc',
      'google-translate-api-x',
      'transliteration'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length > 0) {
      console.log(`   Installing missing dependencies: ${missingDeps.join(', ')}`);
      await this.runCommand('npm', ['install', ...missingDeps], this.backendDir);
    } else {
      console.log('   All translation dependencies already installed');
    }
    
    console.log('✓ Backend dependencies ready\n');
  }

  async installFrontendDependencies() {
    console.log('📦 Installing frontend dependencies...');
    
    // For frontend, we mainly need to ensure React and related packages are installed
    const packageJsonPath = path.join(this.frontendDir, 'package.json');
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (!packageJson.dependencies?.react) {
        console.log('   Installing React dependencies...');
        await this.runCommand('npm', ['install', 'react', 'react-dom'], this.frontendDir);
      }
      
      if (!packageJson.dependencies?.['lucide-react']) {
        console.log('   Installing Lucide React icons...');
        await this.runCommand('npm', ['install', 'lucide-react'], this.frontendDir);
      }
      
    } catch (error) {
      console.log('   Frontend package.json not found, skipping dependency check');
    }
    
    console.log('✓ Frontend dependencies ready\n');
  }

  async createEnvFiles() {
    console.log('⚙️  Setting up environment configuration...');
    
    const envExamplePath = path.join(this.backendDir, '.env.example');
    const envPath = path.join(this.backendDir, '.env');
    
    try {
      const envExists = await this.fileExists(envPath);
      
      if (!envExists) {
        const envExample = await fs.readFile(envExamplePath, 'utf8');
        await fs.writeFile(envPath, envExample);
        console.log('   Created .env file from example');
      } else {
        console.log('   .env file already exists');
      }
      
      // Check if translation config is in .env
      const envContent = await fs.readFile(envPath, 'utf8');
      
      if (!envContent.includes('GOOGLE_TRANSLATE_API_KEY')) {
        console.log('   ⚠️  Google Translate API key not configured');
        console.log('   Please add your credentials to .env file');
      }
      
    } catch (error) {
      console.log('   Could not setup .env file:', error.message);
    }
    
    console.log('✓ Environment configuration ready\n');
  }

  async runHealthCheck() {
    console.log('🔍 Running translation system health check...');
    
    try {
      // Start backend server temporarily for health check
      console.log('   Starting backend server...');
      
      const server = spawn('node', ['server.js'], {
        cwd: this.backendDir,
        detached: true,
        stdio: 'pipe'
      });
      
      // Wait for server to start
      await this.sleep(5000);
      
      // Make health check request
      const response = await this.makeHttpRequest('http://localhost:3001/api/translation/health');
      
      if (response.success) {
        console.log('✓ Translation service is healthy');
      } else {
        console.log('⚠️  Translation service has issues:', response.data?.configuration?.message);
      }
      
      // Stop the server
      process.kill(-server.pid);
      
    } catch (error) {
      console.log('   Could not run health check:', error.message);
      console.log('   Please test manually after starting the servers');
    }
    
    console.log('✓ Health check completed\n');
  }

  async runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd,
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed: ${errorOutput || output}`));
        }
      });
    });
  }

  async makeHttpRequest(url) {
    const https = require('https');
    const http = require('http');
    
    const client = url.startsWith('https') ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async directoryExists(dir) {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async fileExists(file) {
    try {
      await fs.access(file);
      return true;
    } catch {
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new TranslationSystemSetup();
  setup.run().catch(console.error);
}

module.exports = TranslationSystemSetup;