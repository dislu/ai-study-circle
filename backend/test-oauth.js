#!/usr/bin/env node

/**
 * OAuth Endpoints Test Script
 * Tests the social authentication endpoints to ensure they're properly configured
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000';

const endpoints = [
  '/api/social/google',
  '/api/social/facebook', 
  '/api/social/microsoft',
  '/api/social/profile',
  '/api/social/logout'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${endpoint}`;
    
    const req = http.get(url, (res) => {
      resolve({
        endpoint,
        status: res.statusCode,
        headers: res.headers,
        success: res.statusCode < 500
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 'ERROR',
        error: error.message,
        success: false
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 'TIMEOUT',
        success: false
      });
    });
  });
}

async function runTests() {
  console.log('🔐 Testing Social Authentication Endpoints...\n');
  
  console.log(`Base URL: ${BASE_URL}`);
  console.log('━'.repeat(60));
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status;
    
    console.log(`${status} ${endpoint.padEnd(30)} ${statusCode}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n━'.repeat(60));
  console.log('Note: OAuth endpoints should redirect (302) when accessed directly');
  console.log('Profile endpoint should return 401 without authentication');
  console.log('\nTo test OAuth flow:');
  console.log('1. Start the backend server: npm run dev');
  console.log('2. Start the frontend: npm start');  
  console.log('3. Visit http://localhost:3000 and try social login');
}

// Check if server is running first
async function checkServer() {
  try {
    const result = await testEndpoint('/api/health');
    if (result.success) {
      console.log('✅ Backend server is running\n');
      runTests();
    } else {
      console.log('❌ Backend server is not running');
      console.log('Please start the server with: npm run dev');
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend server');
    console.log('Please start the server with: npm run dev');
  }
}

if (require.main === module) {
  checkServer();
}

module.exports = { testEndpoint, runTests };