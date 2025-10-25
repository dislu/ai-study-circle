const mongoConfig = require('./database');
const dynamoConfig = require('./dynamodb');

class DatabaseFactory {
  constructor() {
    this.dbType = process.env.DB_TYPE || 'mongodb'; // 'mongodb' or 'dynamodb'
    this.connection = null;
  }

  async connect() {
    try {
      if (this.dbType === 'mongodb') {
        await mongoConfig();
        console.log('🍃 Using MongoDB as primary database');
      } else if (this.dbType === 'dynamodb') {
        this.connection = dynamoConfig.connect();
        console.log('⚡ Using DynamoDB as primary database');
      } else {
        throw new Error(`Unsupported database type: ${this.dbType}`);
      }
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  getDbType() {
    return this.dbType;
  }

  getDynamoClient() {
    if (this.dbType !== 'dynamodb') {
      throw new Error('DynamoDB client requested but not using DynamoDB');
    }
    return dynamoConfig.getDocumentClient();
  }

  async disconnect() {
    if (this.dbType === 'dynamodb') {
      await dynamoConfig.disconnect();
    }
    // MongoDB disconnection is handled by mongoose
  }
}

module.exports = new DatabaseFactory();