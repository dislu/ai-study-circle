const { PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const dynamoConfig = require('../../config/dynamodb');

class DynamoDBContentModel {
  constructor() {
    this.tableName = dynamoConfig.getTableName('content');
    this.docClient = dynamoConfig.getDocumentClient();
  }

  async create(contentData) {
    try {
      const content = {
        id: dynamoConfig.generateId(),
        ...contentData,
        createdAt: dynamoConfig.getTimestamp(),
        updatedAt: dynamoConfig.getTimestamp(),
        status: contentData.status || 'active',
        usage: {
          views: 0,
          summariesGenerated: 0,
          examsGenerated: 0,
          lastAccessed: null
        }
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: content,
        ConditionExpression: 'attribute_not_exists(id)'
      });

      await this.docClient.send(command);
      return content;

    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Content with this ID already exists');
      }
      throw error;
    }
  }

  async findById(id) {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id }
      });

      const result = await this.docClient.send(command);
      return result.Item || null;
    } catch (error) {
      throw error;
    }
  }

  async findByOwner(ownerId, limit = 50, lastEvaluatedKey = null) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'OwnerIndex',
        KeyConditionExpression: '#owner = :ownerId',
        ExpressionAttributeNames: {
          '#owner': 'owner'
        },
        ExpressionAttributeValues: {
          ':ownerId': ownerId
        },
        ScanIndexForward: false, // Sort by createdAt descending
        Limit: limit
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new QueryCommand(params);
      const result = await this.docClient.send(command);

      return {
        content: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey
      };
    } catch (error) {
      throw error;
    }
  }

  async updateById(id, updateData) {
    try {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      updateData.updatedAt = dynamoConfig.getTimestamp();

      Object.keys(updateData).forEach((key, index) => {
        const attributeName = `#attr${index}`;
        const valueName = `:val${index}`;
        
        updateExpressions.push(`${attributeName} = ${valueName}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[valueName] = updateData[key];
      });

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.docClient.send(command);
      return result.Attributes;
    } catch (error) {
      throw error;
    }
  }

  async deleteById(id) {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ReturnValues: 'ALL_OLD'
      });

      const result = await this.docClient.send(command);
      return result.Attributes || null;
    } catch (error) {
      throw error;
    }
  }

  async incrementViews(id) {
    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #usage.#views = #usage.#views + :increment, #usage.#lastAccessed = :now',
        ExpressionAttributeNames: {
          '#usage': 'usage',
          '#views': 'views',
          '#lastAccessed': 'lastAccessed'
        },
        ExpressionAttributeValues: {
          ':increment': 1,
          ':now': dynamoConfig.getTimestamp()
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.docClient.send(command);
      return result.Attributes;
    } catch (error) {
      throw error;
    }
  }

  async incrementSummariesGenerated(id) {
    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'ADD #usage.#summariesGenerated :increment',
        ExpressionAttributeNames: {
          '#usage': 'usage',
          '#summariesGenerated': 'summariesGenerated'
        },
        ExpressionAttributeValues: {
          ':increment': 1
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.docClient.send(command);
      return result.Attributes;
    } catch (error) {
      throw error;
    }
  }

  async incrementExamsGenerated(id) {
    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'ADD #usage.#examsGenerated :increment',
        ExpressionAttributeNames: {
          '#usage': 'usage',
          '#examsGenerated': 'examsGenerated'
        },
        ExpressionAttributeValues: {
          ':increment': 1
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.docClient.send(command);
      return result.Attributes;
    } catch (error) {
      throw error;
    }
  }

  async findByCategory(category, limit = 20, lastEvaluatedKey = null) {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category
        },
        Limit: limit
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new ScanCommand(params);
      const result = await this.docClient.send(command);

      return {
        content: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey
      };
    } catch (error) {
      throw error;
    }
  }

  async countByOwner(ownerId) {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'OwnerIndex',
        KeyConditionExpression: '#owner = :ownerId',
        ExpressionAttributeNames: {
          '#owner': 'owner'
        },
        ExpressionAttributeValues: {
          ':ownerId': ownerId
        },
        Select: 'COUNT'
      });

      const result = await this.docClient.send(command);
      return result.Count || 0;
    } catch (error) {
      throw error;
    }
  }

  async countDocuments(filter = {}) {
    try {
      let params = {
        TableName: this.tableName,
        Select: 'COUNT'
      };

      // Add filter conditions if provided
      if (Object.keys(filter).length > 0) {
        const filterExpressions = [];
        const expressionAttributeValues = {};

        Object.keys(filter).forEach((key, index) => {
          const valueName = `:val${index}`;
          filterExpressions.push(`${key} = ${valueName}`);
          expressionAttributeValues[valueName] = filter[key];
        });

        params.FilterExpression = filterExpressions.join(' AND ');
        params.ExpressionAttributeValues = expressionAttributeValues;
      }

      const command = new ScanCommand(params);
      const result = await this.docClient.send(command);
      return result.Count || 0;
    } catch (error) {
      throw error;
    }
  }

  async aggregate(pipeline) {
    // DynamoDB doesn't support aggregation pipelines like MongoDB
    // We'll need to implement basic aggregations manually
    throw new Error('Aggregation not directly supported in DynamoDB. Use specific methods for analytics.');
  }

  // Analytics helper methods for DynamoDB
  async getContentAnalytics(ownerId, startDate, endDate) {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'OwnerIndex',
        KeyConditionExpression: '#owner = :ownerId AND #createdAt BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
          '#owner': 'owner',
          '#createdAt': 'createdAt'
        },
        ExpressionAttributeValues: {
          ':ownerId': ownerId,
          ':startDate': startDate,
          ':endDate': endDate
        }
      };

      const command = new QueryCommand(params);
      const result = await this.docClient.send(command);

      // Process results to calculate analytics
      const content = result.Items || [];
      
      const analytics = {
        totalContent: content.length,
        totalWords: content.reduce((sum, item) => sum + (item.sourceMetadata?.wordCount || 0), 0),
        avgWordsPerContent: 0,
        categories: {},
        contentTypes: {}
      };

      if (content.length > 0) {
        analytics.avgWordsPerContent = Math.round(analytics.totalWords / content.length);

        // Count categories and content types
        content.forEach(item => {
          analytics.categories[item.category] = (analytics.categories[item.category] || 0) + 1;
          analytics.contentTypes[item.contentType] = (analytics.contentTypes[item.contentType] || 0) + 1;
        });
      }

      return analytics;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DynamoDBContentModel;