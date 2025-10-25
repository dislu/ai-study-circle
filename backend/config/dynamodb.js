const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

class DynamoDBConfig {
  constructor() {
    this.client = null;
    this.docClient = null;
    this.isConnected = false;
  }

  connect() {
    try {
      const config = {
        region: process.env.AWS_REGION || 'us-east-1',
      };

      // Add credentials if provided
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        config.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      }

      // For local development with DynamoDB Local
      if (process.env.DYNAMODB_ENDPOINT) {
        config.endpoint = process.env.DYNAMODB_ENDPOINT;
      }

      this.client = new DynamoDBClient(config);
      this.docClient = DynamoDBDocumentClient.from(this.client);
      this.isConnected = true;

      console.log('✅ Connected to DynamoDB');
      return this.docClient;
    } catch (error) {
      console.error('❌ DynamoDB connection error:', error);
      throw error;
    }
  }

  getDocumentClient() {
    if (!this.isConnected) {
      this.connect();
    }
    return this.docClient;
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isConnected = false;
      console.log('🔌 Disconnected from DynamoDB');
    }
  }

  // Table naming convention
  getTableName(modelName) {
    const prefix = process.env.DYNAMODB_TABLE_PREFIX || 'ai-study-circle';
    const env = process.env.NODE_ENV || 'development';
    return `${prefix}-${env}-${modelName.toLowerCase()}`;
  }

  // Common DynamoDB operations helper
  createTableParams(tableName, keySchema, attributeDefinitions, globalSecondaryIndexes = []) {
    const params = {
      TableName: tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      BillingMode: 'PAY_PER_REQUEST', // On-demand billing
    };

    if (globalSecondaryIndexes.length > 0) {
      params.GlobalSecondaryIndexes = globalSecondaryIndexes;
    }

    return params;
  }

  // Generate consistent timestamps
  getTimestamp() {
    return new Date().toISOString();
  }

  // Generate UUID for items without explicit ID
  generateId() {
    return require('uuid').v4();
  }
}

module.exports = new DynamoDBConfig();