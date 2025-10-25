const { PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const dynamoConfig = require('../../config/dynamodb');
const bcrypt = require('bcryptjs');

class DynamoDBUserModel {
  constructor() {
    this.tableName = dynamoConfig.getTableName('users');
    this.docClient = dynamoConfig.getDocumentClient();
  }

  async create(userData) {
    try {
      // Hash password
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      const user = {
        id: dynamoConfig.generateId(),
        ...userData,
        createdAt: dynamoConfig.getTimestamp(),
        updatedAt: dynamoConfig.getTimestamp(),
        role: userData.role || 'user',
        subscriptionPlan: userData.subscriptionPlan || 'free',
        apiUsage: {
          requestsThisMonth: 0,
          lastRequestDate: null,
          totalRequests: 0
        },
        preferences: userData.preferences || {
          defaultSummaryStyle: 'bullet_points',
          defaultExamDifficulty: 'intermediate',
          emailNotifications: true
        }
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: user,
        ConditionExpression: 'attribute_not_exists(id)'
      });

      await this.docClient.send(command);
      
      // Remove password from returned object
      delete user.password;
      return user;

    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('User with this ID already exists');
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
      
      if (result.Item) {
        delete result.Item.password;
      }
      
      return result.Item || null;
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      });

      const result = await this.docClient.send(command);
      
      if (result.Items && result.Items.length > 0) {
        return result.Items[0];
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'UsernameIndex',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username
        }
      });

      const result = await this.docClient.send(command);
      
      if (result.Items && result.Items.length > 0) {
        return result.Items[0];
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  }

  async updateById(id, updateData) {
    try {
      // Prepare update expression
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      updateData.updatedAt = dynamoConfig.getTimestamp();

      // Hash password if provided
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

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
      
      if (result.Attributes) {
        delete result.Attributes.password;
      }
      
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

  async incrementApiUsage(id) {
    try {
      const now = new Date();
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #apiUsage.#totalRequests = #apiUsage.#totalRequests + :increment, #apiUsage.#lastRequestDate = :now ADD #apiUsage.#requestsThisMonth :increment',
        ExpressionAttributeNames: {
          '#apiUsage': 'apiUsage',
          '#totalRequests': 'totalRequests',
          '#lastRequestDate': 'lastRequestDate',
          '#requestsThisMonth': 'requestsThisMonth'
        },
        ExpressionAttributeValues: {
          ':increment': 1,
          ':now': now.toISOString()
        },
        ReturnValues: 'ALL_NEW'
      });

      const result = await this.docClient.send(command);
      return result.Attributes;
    } catch (error) {
      throw error;
    }
  }

  async findAll(limit = 50, lastEvaluatedKey = null) {
    try {
      const params = {
        TableName: this.tableName,
        Limit: limit
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new ScanCommand(params);
      const result = await this.docClient.send(command);

      // Remove passwords from all users
      if (result.Items) {
        result.Items.forEach(user => delete user.password);
      }

      return {
        users: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey
      };
    } catch (error) {
      throw error;
    }
  }

  async countDocuments(filter = {}) {
    try {
      // DynamoDB doesn't have a direct count operation
      // We'll need to scan and count, which is not ideal for large datasets
      const command = new ScanCommand({
        TableName: this.tableName,
        Select: 'COUNT'
      });

      const result = await this.docClient.send(command);
      return result.Count || 0;
    } catch (error) {
      throw error;
    }
  }

  // Compatibility method for password comparison
  async comparePassword(user, candidatePassword) {
    return await bcrypt.compare(candidatePassword, user.password);
  }
}

module.exports = DynamoDBUserModel;