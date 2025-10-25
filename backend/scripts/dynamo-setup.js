#!/usr/bin/env node

const { DynamoDBTableManager } = require('../config/dynamodb-tables');
const dynamoConfig = require('../config/dynamodb');
require('dotenv').config();

async function setupDynamoDB() {
  console.log('🚀 Setting up DynamoDB for AI Study Circle...\n');

  try {
    // Connect to DynamoDB
    dynamoConfig.connect();

    // Create table manager
    const tableManager = new DynamoDBTableManager();

    // Create all tables
    await tableManager.createTables();

    console.log('\n✅ DynamoDB setup completed successfully!');
    console.log('\n📊 You can now use the application with DynamoDB as the backend.');
    console.log('\n💡 To use DynamoDB, set DB_TYPE=dynamodb in your .env file');

  } catch (error) {
    console.error('\n❌ DynamoDB setup failed:', error.message);
    
    if (error.message.includes('UnrecognizedClientException')) {
      console.log('\n💡 Tip: Make sure your AWS credentials are configured correctly');
      console.log('   You can use AWS CLI: aws configure');
      console.log('   Or set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    }
    
    if (error.message.includes('Cannot resolve hostname')) {
      console.log('\n💡 Tip: If using DynamoDB Local, make sure it\'s running on the correct endpoint');
      console.log('   Set DYNAMODB_ENDPOINT=http://localhost:8000 in your .env file');
    }
    
    process.exit(1);
  }
}

async function listTables() {
  try {
    dynamoConfig.connect();
    const tableManager = new DynamoDBTableManager();
    await tableManager.listTables();
  } catch (error) {
    console.error('❌ Error listing tables:', error.message);
    process.exit(1);
  }
}

async function deleteTables() {
  try {
    console.log('⚠️  WARNING: This will delete all AI Study Circle tables from DynamoDB!');
    console.log('⚠️  This action cannot be undone.\n');

    // Simple confirmation (in a real app, you might want a better confirmation mechanism)
    if (process.argv.includes('--confirm')) {
      dynamoConfig.connect();
      const tableManager = new DynamoDBTableManager();
      await tableManager.deleteTables();
      console.log('\n✅ All tables deleted successfully!');
    } else {
      console.log('❌ Operation cancelled. Use --confirm flag to proceed with deletion.');
      console.log('   Example: npm run dynamo:delete -- --confirm');
    }
  } catch (error) {
    console.error('❌ Error deleting tables:', error.message);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupDynamoDB();
    break;
  case 'list':
    listTables();
    break;
  case 'delete':
    deleteTables();
    break;
  default:
    console.log('🔧 DynamoDB Management Tool for AI Study Circle\n');
    console.log('Usage:');
    console.log('  node scripts/dynamo-setup.js setup   - Create all DynamoDB tables');
    console.log('  node scripts/dynamo-setup.js list    - List existing tables');
    console.log('  node scripts/dynamo-setup.js delete  - Delete all tables (use --confirm)');
    console.log('\nEnvironment Variables:');
    console.log('  AWS_REGION              - AWS region (default: us-east-1)');
    console.log('  AWS_ACCESS_KEY_ID       - AWS access key');
    console.log('  AWS_SECRET_ACCESS_KEY   - AWS secret key');
    console.log('  DYNAMODB_ENDPOINT       - DynamoDB endpoint (for local development)');
    console.log('  DYNAMODB_TABLE_PREFIX   - Table name prefix (default: ai-study-circle)');
    console.log('\nExamples:');
    console.log('  # Setup with AWS credentials');
    console.log('  AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy node scripts/dynamo-setup.js setup');
    console.log('');
    console.log('  # Setup with DynamoDB Local');
    console.log('  DYNAMODB_ENDPOINT=http://localhost:8000 node scripts/dynamo-setup.js setup');
    break;
}