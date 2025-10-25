const databaseFactory = require('../config/database-factory');

// MongoDB Models
const MongoUser = require('./User');
const MongoContent = require('./Content');
const MongoSummary = require('./Summary');
const MongoExam = require('./Exam');
const MongoTemplate = require('./Template');

// DynamoDB Models
const DynamoDBUser = require('./dynamo/UserDynamo');
const DynamoDBContent = require('./dynamo/ContentDynamo');
// Additional DynamoDB models will be created similarly

class ModelFactory {
  constructor() {
    this.dbType = databaseFactory.getDbType();
    this.models = {};
    this.initializeModels();
  }

  initializeModels() {
    if (this.dbType === 'mongodb') {
      this.models = {
        User: MongoUser,
        Content: MongoContent,
        Summary: MongoSummary,
        Exam: MongoExam,
        Template: MongoTemplate
      };
    } else if (this.dbType === 'dynamodb') {
      this.models = {
        User: new DynamoDBUser(),
        Content: new DynamoDBContent(),
        // Summary: new DynamoDBSummary(),
        // Exam: new DynamoDBExam(),
        // Template: new DynamoDBTemplate()
      };
    }
  }

  getModel(modelName) {
    const model = this.models[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found for database type: ${this.dbType}`);
    }
    return model;
  }

  // Convenience methods
  get User() {
    return this.getModel('User');
  }

  get Content() {
    return this.getModel('Content');
  }

  get Summary() {
    return this.getModel('Summary');
  }

  get Exam() {
    return this.getModel('Exam');
  }

  get Template() {
    return this.getModel('Template');
  }

  // Database type info
  isUsingMongoDB() {
    return this.dbType === 'mongodb';
  }

  isUsingDynamoDB() {
    return this.dbType === 'dynamodb';
  }

  getDbType() {
    return this.dbType;
  }
}

module.exports = new ModelFactory();