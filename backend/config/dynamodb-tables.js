const { CreateTableCommand, DescribeTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const dynamoConfig = require('./dynamodb');

const tables = {
  users: {
    tableName: 'users',
    keySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    attributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'username', AttributeType: 'S' }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'UsernameIndex',
        KeySchema: [
          { AttributeName: 'username', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  },

  content: {
    tableName: 'content',
    keySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    attributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'owner', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: 'OwnerIndex',
        KeySchema: [
          { AttributeName: 'owner', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  },

  summaries: {
    tableName: 'summaries',
    keySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    attributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'owner', AttributeType: 'S' },
      { AttributeName: 'contentId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: 'OwnerIndex',
        KeySchema: [
          { AttributeName: 'owner', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'ContentIndex',
        KeySchema: [
          { AttributeName: 'contentId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  },

  exams: {
    tableName: 'exams',
    keySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    attributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'owner', AttributeType: 'S' },
      { AttributeName: 'contentId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: 'OwnerIndex',
        KeySchema: [
          { AttributeName: 'owner', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'ContentIndex',
        KeySchema: [
          { AttributeName: 'contentId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  },

  templates: {
    tableName: 'templates',
    keySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    attributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'createdBy', AttributeType: 'S' },
      { AttributeName: 'type', AttributeType: 'S' },
      { AttributeName: 'category', AttributeType: 'S' },
      { AttributeName: 'isPublic', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    globalSecondaryIndexes: [
      {
        IndexName: 'CreatedByIndex',
        KeySchema: [
          { AttributeName: 'createdBy', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'TypeCategoryIndex',
        KeySchema: [
          { AttributeName: 'type', KeyType: 'HASH' },
          { AttributeName: 'category', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      },
      {
        IndexName: 'PublicTemplatesIndex',
        KeySchema: [
          { AttributeName: 'isPublic', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ]
  }
};

class DynamoDBTableManager {
  constructor() {
    this.client = dynamoConfig.client;
  }

  async createTables() {
    console.log('🔧 Creating DynamoDB tables...');

    for (const [modelName, tableConfig] of Object.entries(tables)) {
      try {
        const tableName = dynamoConfig.getTableName(tableConfig.tableName);
        
        // Check if table already exists
        const exists = await this.tableExists(tableName);
        if (exists) {
          console.log(`✅ Table ${tableName} already exists`);
          continue;
        }

        // Create table
        const params = dynamoConfig.createTableParams(
          tableName,
          tableConfig.keySchema,
          tableConfig.attributeDefinitions,
          tableConfig.globalSecondaryIndexes
        );

        const command = new CreateTableCommand(params);
        await this.client.send(command);
        
        console.log(`✅ Created table: ${tableName}`);
        
        // Wait for table to be active
        await this.waitForTableActive(tableName);
        
      } catch (error) {
        console.error(`❌ Error creating table for ${modelName}:`, error);
        throw error;
      }
    }

    console.log('🎉 All DynamoDB tables created successfully!');
  }

  async tableExists(tableName) {
    try {
      const command = new DescribeTableCommand({ TableName: tableName });
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        return false;
      }
      throw error;
    }
  }

  async waitForTableActive(tableName, maxWaitTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const command = new DescribeTableCommand({ TableName: tableName });
        const result = await this.client.send(command);
        
        if (result.Table.TableStatus === 'ACTIVE') {
          console.log(`✅ Table ${tableName} is active`);
          return;
        }
        
        console.log(`⏳ Waiting for table ${tableName} to become active...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error checking table status:`, error);
        throw error;
      }
    }
    
    throw new Error(`⏰ Timeout waiting for table ${tableName} to become active`);
  }

  async listTables() {
    try {
      const command = new ListTablesCommand({});
      const result = await this.client.send(command);
      
      const prefix = process.env.DYNAMODB_TABLE_PREFIX || 'ai-study-circle';
      const env = process.env.NODE_ENV || 'development';
      const tablePrefix = `${prefix}-${env}`;
      
      const ourTables = result.TableNames.filter(name => name.startsWith(tablePrefix));
      
      console.log('📋 AI Study Circle DynamoDB Tables:');
      ourTables.forEach(table => console.log(`  - ${table}`));
      
      return ourTables;
    } catch (error) {
      console.error('❌ Error listing tables:', error);
      throw error;
    }
  }

  async deleteTables() {
    console.log('🗑️  Deleting DynamoDB tables...');
    
    const { DeleteTableCommand } = require('@aws-sdk/client-dynamodb');
    
    for (const [modelName, tableConfig] of Object.entries(tables)) {
      try {
        const tableName = dynamoConfig.getTableName(tableConfig.tableName);
        
        const exists = await this.tableExists(tableName);
        if (!exists) {
          console.log(`⚠️  Table ${tableName} does not exist`);
          continue;
        }

        const command = new DeleteTableCommand({ TableName: tableName });
        await this.client.send(command);
        
        console.log(`✅ Deleted table: ${tableName}`);
        
      } catch (error) {
        console.error(`❌ Error deleting table for ${modelName}:`, error);
      }
    }

    console.log('🎉 All DynamoDB tables deleted!');
  }
}

module.exports = { DynamoDBTableManager, tables };