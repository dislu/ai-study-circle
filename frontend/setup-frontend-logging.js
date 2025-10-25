/**
 * Frontend Logging Setup Script
 * Initializes and configures the frontend logging system
 */

const fs = require('fs');
const path = require('path');

class FrontendLoggingSetup {
  constructor() {
    this.frontendPath = process.cwd();
    this.srcPath = path.join(this.frontendPath, 'src');
    this.setupComplete = false;
  }

  /**
   * Run the complete setup process
   */
  async setup() {
    console.log('🚀 Setting up Frontend Logging System...\n');

    try {
      // Check if we're in the right directory
      this.validateEnvironment();
      
      // Update package.json with dependencies
      this.updatePackageJson();
      
      // Create environment configuration
      this.createEnvironmentConfig();
      
      // Update Next.js configuration
      this.updateNextConfig();
      
      // Create example usage components
      this.createExampleComponents();
      
      // Update main App component
      this.updateAppComponent();
      
      // Create documentation
      this.createDocumentation();
      
      // Create test files
      this.createTestFiles();
      
      console.log('✅ Frontend Logging System setup completed successfully!\n');
      console.log('📖 Next steps:');
      console.log('   1. Run: npm install');
      console.log('   2. Update your .env.local file with logging configuration');
      console.log('   3. Wrap your app with FrontendLoggingProvider');
      console.log('   4. Start using logging hooks in your components');
      console.log('   5. Check the documentation in docs/frontend-logging.md\n');
      
      this.setupComplete = true;
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate that we're in a Next.js frontend project
   */
  validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found. Make sure you\'re in the frontend directory.');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.dependencies?.next) {
      throw new Error('This doesn\'t appear to be a Next.js project.');
    }

    if (!fs.existsSync(this.srcPath)) {
      fs.mkdirSync(this.srcPath, { recursive: true });
    }

    console.log('✅ Environment validation passed\n');
  }

  /**
   * Update package.json with logging dependencies
   */
  updatePackageJson() {
    console.log('📦 Updating package.json dependencies...');
    
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Add logging-related dependencies
    const newDependencies = {
      // Web Vitals for performance monitoring
      'web-vitals': '^3.5.0',
      // UUID for generating unique IDs
      'uuid': '^9.0.0'
    };

    const newDevDependencies = {
      // Jest for testing
      '@testing-library/jest-dom': '^6.1.4',
      '@testing-library/react': '^13.4.0',
      '@testing-library/user-event': '^14.5.1',
      'jest': '^29.7.0',
      'jest-environment-jsdom': '^29.7.0'
    };

    // Merge dependencies
    packageJson.dependencies = { ...packageJson.dependencies, ...newDependencies };
    packageJson.devDependencies = { ...packageJson.devDependencies, ...newDevDependencies };

    // Add logging scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'test': 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'logs:analyze': 'node scripts/analyze-logs.js',
      'logs:clean': 'node scripts/clean-logs.js'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated\n');
  }

  /**
   * Create environment configuration
   */
  createEnvironmentConfig() {
    console.log('⚙️  Creating environment configuration...');
    
    const envExample = `# Frontend Logging Configuration
# Copy this to .env.local and update values as needed

# Log Level (debug, info, warn, error)
NEXT_PUBLIC_LOG_LEVEL=info

# Backend API URL for sending logs
NEXT_PUBLIC_API_URL=http://localhost:5000

# App version for logging context
NEXT_PUBLIC_APP_VERSION=1.0.0

# Enable/disable logging features
NEXT_PUBLIC_ENABLE_LOGGING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ENABLE_USER_TRACKING=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true

# Development settings
NEXT_PUBLIC_LOG_TO_CONSOLE=true
NEXT_PUBLIC_INCLUDE_REQUEST_DATA=false
NEXT_PUBLIC_INCLUDE_RESPONSE_DATA=false
`;

    fs.writeFileSync(path.join(this.frontendPath, '.env.example'), envExample);
    
    // Create .env.local if it doesn't exist
    const envLocalPath = path.join(this.frontendPath, '.env.local');
    if (!fs.existsSync(envLocalPath)) {
      fs.writeFileSync(envLocalPath, envExample);
    }

    console.log('✅ Environment configuration created\n');
  }

  /**
   * Update Next.js configuration
   */
  updateNextConfig() {
    console.log('⚙️  Updating Next.js configuration...');
    
    const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Logging configuration
  env: {
    LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Performance monitoring
  experimental: {
    instrumentationHook: true,
  },

  // Webpack configuration for logging
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add performance monitoring in production
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          '__BUILD_ID__': JSON.stringify(buildId),
          '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
        })
      );
    }

    return config;
  },

  // Headers for better logging
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Request-ID',
            value: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;

    fs.writeFileSync(nextConfigPath, nextConfigContent);
    console.log('✅ Next.js configuration updated\n');
  }

  /**
   * Create example usage components
   */
  createExampleComponents() {
    console.log('📝 Creating example components...');
    
    // Create components directory if it doesn't exist
    const componentsPath = path.join(this.srcPath, 'components');
    if (!fs.existsSync(componentsPath)) {
      fs.mkdirSync(componentsPath, { recursive: true });
    }

    // Example component with logging
    const exampleComponentContent = `/**
 * Example Component with Frontend Logging
 * Demonstrates how to use logging hooks in components
 */

import React, { useEffect, useState } from 'react';
import { useLogging, useComponentTracking } from './FrontendLoggingProvider';

const ExampleComponent = () => {
  const { log, warn, error, trackAction } = useLogging();
  const { trackRender, trackUserAction } = useComponentTracking('ExampleComponent');
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Track component mount
    log('ExampleComponent mounted', { initialCount: count });
    trackRender();
  }, []);

  useEffect(() => {
    // Track state changes
    if (count > 0) {
      log('Count updated', { newCount: count });
    }
  }, [count]);

  const handleClick = () => {
    trackUserAction('button_click', { buttonType: 'increment', currentCount: count });
    setCount(prev => prev + 1);
    
    if (count >= 10) {
      warn('High count reached', { count: count + 1 });
    }
  };

  const handleError = () => {
    try {
      throw new Error('This is a test error');
    } catch (err) {
      error('Test error occurred', err, { triggeredBy: 'user_action' });
    }
  };

  const handleApiCall = async () => {
    trackUserAction('api_call_initiated', { endpoint: '/api/test' });
    
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      log('API call successful', { response: data });
    } catch (err) {
      error('API call failed', err, { endpoint: '/api/test' });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Logging Example</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-gray-700">Count: {count}</p>
          <button
            onClick={handleClick}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment (Logged)
          </button>
        </div>
        
        <button
          onClick={handleError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Trigger Error (Logged)
        </button>
        
        <button
          onClick={handleApiCall}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          API Call (Logged)
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Check the browser console and network tab to see logs in action.
      </div>
    </div>
  );
};

export default ExampleComponent;
`;

    fs.writeFileSync(path.join(componentsPath, 'ExampleComponent.jsx'), exampleComponentContent);

    // Create a logging dashboard component
    const loggingDashboardContent = `/**
 * Logging Dashboard Component
 * Shows current logging status and metrics
 */

import React, { useState, useEffect } from 'react';
import { useLogging } from './FrontendLoggingProvider';

const LoggingDashboard = () => {
  const { 
    isInitialized, 
    getMetrics, 
    getSessionSummary, 
    flush,
    logger,
    performanceMonitor,
    userTracker
  } = useLogging();
  
  const [metrics, setMetrics] = useState([]);
  const [sessionSummary, setSessionSummary] = useState({});
  const [logQueue, setLogQueue] = useState(0);

  useEffect(() => {
    if (isInitialized) {
      const updateData = () => {
        setMetrics(getMetrics() || []);
        setSessionSummary(getSessionSummary() || {});
        setLogQueue(logger?.logQueue?.length || 0);
      };

      updateData();
      const interval = setInterval(updateData, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  const handleFlush = async () => {
    if (flush) {
      await flush();
      setLogQueue(0);
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-yellow-800">Logging system is initializing...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Logging Dashboard</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded">
          <h4 className="font-medium text-blue-900">System Status</h4>
          <p className="text-sm text-blue-700">
            Status: {isInitialized ? 'Active' : 'Inactive'}
          </p>
          <p className="text-sm text-blue-700">
            Queue: {logQueue} logs
          </p>
        </div>
        
        <div className="p-4 bg-green-50 rounded">
          <h4 className="font-medium text-green-900">Session Info</h4>
          <p className="text-sm text-green-700">
            Actions: {sessionSummary.actions || 0}
          </p>
          <p className="text-sm text-green-700">
            Time: {Math.round((sessionSummary.timeOnPage || 0) / 1000)}s
          </p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded">
          <h4 className="font-medium text-purple-900">Performance</h4>
          <p className="text-sm text-purple-700">
            Metrics: {metrics.length}
          </p>
          <p className="text-sm text-purple-700">
            Scroll: {Math.round(sessionSummary.scrollDepth || 0)}%
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleFlush}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={logQueue === 0}
        >
          Flush Logs ({logQueue})
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Recent Performance Metrics</h4>
          <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-sm">
            {metrics.slice(-5).map((metric, index) => (
              <div key={index} className="text-gray-700">
                {metric.name}: {metric.value}ms
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingDashboard;
`;

    fs.writeFileSync(path.join(componentsPath, 'LoggingDashboard.jsx'), loggingDashboardContent);
    console.log('✅ Example components created\n');
  }

  /**
   * Update main App component
   */
  updateAppComponent() {
    console.log('🔄 Updating App component...');
    
    const appPath = path.join(this.srcPath, 'App.jsx');
    
    // Check if App.jsx exists, if not create it
    if (!fs.existsSync(appPath)) {
      const appContent = `/**
 * Main App Component with Frontend Logging
 */

import React from 'react';
import FrontendLoggingProvider from './components/FrontendLoggingProvider';
import ExampleComponent from './components/ExampleComponent';
import LoggingDashboard from './components/LoggingDashboard';
import { frontendLoggingConfig } from './config/loggingConfig';

function App() {
  return (
    <FrontendLoggingProvider config={frontendLoggingConfig}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 py-4">
              AI Study Circle - Frontend Logging Demo
            </h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ExampleComponent />
            <LoggingDashboard />
          </div>
        </main>
      </div>
    </FrontendLoggingProvider>
  );
}

export default App;
`;

      fs.writeFileSync(appPath, appContent);
      console.log('✅ App component created\n');
    } else {
      console.log('ℹ️  App.jsx already exists. Please manually integrate FrontendLoggingProvider\n');
    }
  }

  /**
   * Create documentation
   */
  createDocumentation() {
    console.log('📚 Creating documentation...');
    
    const docsPath = path.join(this.frontendPath, 'docs');
    if (!fs.existsSync(docsPath)) {
      fs.mkdirSync(docsPath, { recursive: true });
    }

    const documentationContent = `# Frontend Logging System Documentation

## Overview

The Frontend Logging System provides comprehensive client-side logging for React/Next.js applications with the following features:

- **Structured Logging**: JSON-formatted logs with metadata
- **Performance Monitoring**: Web Vitals and custom metrics
- **User Action Tracking**: Clicks, navigation, form interactions
- **Error Boundaries**: React error catching and logging
- **API Logging**: HTTP request/response monitoring
- **Batch Processing**: Efficient log queue management

## Quick Start

### 1. Installation

\`\`\`bash
npm install
\`\`\`

### 2. Configuration

Update your \`.env.local\` file:

\`\`\`env
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENABLE_LOGGING=true
\`\`\`

### 3. Setup Provider

Wrap your app with the logging provider:

\`\`\`jsx
import FrontendLoggingProvider from './components/FrontendLoggingProvider';
import { frontendLoggingConfig } from './config/loggingConfig';

function App() {
  return (
    <FrontendLoggingProvider config={frontendLoggingConfig}>
      {/* Your app components */}
    </FrontendLoggingProvider>
  );
}
\`\`\`

### 4. Use Logging Hooks

\`\`\`jsx
import { useLogging, useComponentTracking } from './components/FrontendLoggingProvider';

const MyComponent = () => {
  const { log, error, trackAction } = useLogging();
  const { trackUserAction } = useComponentTracking('MyComponent');

  const handleClick = () => {
    trackUserAction('button_click', { buttonId: 'submit' });
    log('Button clicked', { timestamp: Date.now() });
  };

  return <button onClick={handleClick}>Click me</button>;
};
\`\`\`

## API Reference

### useLogging Hook

- \`log(message, data, context)\` - Info level logging
- \`warn(message, data, context)\` - Warning level logging
- \`error(message, error, context)\` - Error level logging
- \`debug(message, data, context)\` - Debug level logging
- \`trackAction(action, data)\` - User action tracking
- \`setUser(userId, userData)\` - Set user context
- \`flush()\` - Manually flush log queue

### useComponentTracking Hook

- \`trackRender()\` - Track component render
- \`trackUserAction(action, data)\` - Track user action with component context

### useApiTracking Hook

- \`trackApiCall(apiCall)\` - Wrap and track API calls

## Configuration Options

### Logger Configuration

\`\`\`javascript
{
  enabled: true,
  logLevel: 'info', // debug, info, warn, error
  apiEndpoint: 'http://localhost:5000',
  batchSize: 10,
  flushInterval: 30000,
  maxQueueSize: 100,
  enableConsole: false,
  enableStorage: true
}
\`\`\`

### Performance Monitoring

\`\`\`javascript
{
  enabled: true,
  trackWebVitals: true,
  trackNavigation: true,
  trackResources: true,
  trackLongTasks: true,
  trackMemory: true
}
\`\`\`

### User Tracking

\`\`\`javascript
{
  enabled: true,
  trackClicks: true,
  trackFormSubmissions: true,
  trackNavigation: true,
  trackScrolling: true,
  trackFocus: true,
  debounceDelay: 100,
  idleTimeout: 300000
}
\`\`\`

## Best Practices

### 1. Log Levels

- **Debug**: Development information, verbose logging
- **Info**: General application flow, user actions
- **Warn**: Unexpected situations that don't break functionality
- **Error**: Errors that need attention

### 2. Privacy

- Never log sensitive information (passwords, tokens, personal data)
- Use data masking for sensitive fields
- Be mindful of GDPR/privacy regulations

### 3. Performance

- Use appropriate batch sizes and flush intervals
- Avoid logging in tight loops
- Monitor log queue size

### 4. Error Handling

- Always wrap components with Error Boundaries
- Log errors with sufficient context
- Provide fallback UI for error states

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check API endpoint configuration
2. **High memory usage**: Reduce batch size or flush interval
3. **Missing logs**: Verify log level configuration
4. **Performance impact**: Disable verbose tracking in production

### Debugging

Enable debug mode:

\`\`\`env
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_LOG_TO_CONSOLE=true
\`\`\`

## Examples

See the \`ExampleComponent\` and \`LoggingDashboard\` components for usage examples.

## Integration with Backend

Logs are sent to the backend \`/api/logs\` endpoint. Ensure your backend Winston logger is properly configured to receive and process frontend logs.

## Testing

Run tests with:

\`\`\`bash
npm test
npm run test:coverage
\`\`\`

## Scripts

- \`npm run logs:analyze\` - Analyze log patterns
- \`npm run logs:clean\` - Clean old logs
- \`npm run test\` - Run tests
- \`npm run test:coverage\` - Run tests with coverage
`;

    fs.writeFileSync(path.join(docsPath, 'frontend-logging.md'), documentationContent);
    console.log('✅ Documentation created\n');
  }

  /**
   * Create test files
   */
  createTestFiles() {
    console.log('🧪 Creating test files...');
    
    const testsPath = path.join(this.frontendPath, '__tests__');
    if (!fs.existsSync(testsPath)) {
      fs.mkdirSync(testsPath, { recursive: true });
    }

    // Jest configuration
    const jestConfig = `const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
`;

    fs.writeFileSync(path.join(this.frontendPath, 'jest.config.js'), jestConfig);

    // Jest setup
    const jestSetup = `import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
};
`;

    fs.writeFileSync(path.join(this.frontendPath, 'jest.setup.js'), jestSetup);

    // Example test
    const exampleTest = `import { render, screen, fireEvent } from '@testing-library/react';
import FrontendLoggingProvider from '../src/components/FrontendLoggingProvider';
import ExampleComponent from '../src/components/ExampleComponent';
import { frontendLoggingConfig } from '../src/config/loggingConfig';

// Mock fetch
global.fetch = jest.fn();

const renderWithLogging = (component) => {
  return render(
    <FrontendLoggingProvider config={frontendLoggingConfig}>
      {component}
    </FrontendLoggingProvider>
  );
};

describe('Frontend Logging System', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders ExampleComponent with logging', () => {
    renderWithLogging(<ExampleComponent />);
    expect(screen.getByText('Logging Example')).toBeInTheDocument();
  });

  test('tracks user actions when button is clicked', () => {
    renderWithLogging(<ExampleComponent />);
    
    const button = screen.getByText('Increment (Logged)');
    fireEvent.click(button);
    
    // Verify that the count updated
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  test('handles errors gracefully', () => {
    renderWithLogging(<ExampleComponent />);
    
    const errorButton = screen.getByText('Trigger Error (Logged)');
    fireEvent.click(errorButton);
    
    // Component should still be rendered after error
    expect(screen.getByText('Logging Example')).toBeInTheDocument();
  });
});
`;

    fs.writeFileSync(path.join(testsPath, 'logging.test.js'), exampleTest);
    console.log('✅ Test files created\n');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new FrontendLoggingSetup();
  setup.setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = FrontendLoggingSetup;