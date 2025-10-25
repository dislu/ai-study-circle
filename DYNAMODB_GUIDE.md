# 🚀 DynamoDB Integration Guide

## Overview

AI Study Circle now supports both MongoDB and DynamoDB as backend databases. This dual database support allows you to:

- **MongoDB**: Use for local development and traditional deployments
- **DynamoDB**: Use for AWS cloud deployments with serverless architecture

## 🏗️ Architecture

### Database Abstraction Layer
```
Database Factory
├── MongoDB Models (Mongoose)
│   ├── User.js
│   ├── Content.js
│   ├── Summary.js
│   ├── Exam.js
│   └── Template.js
└── DynamoDB Models (AWS SDK v3)
    ├── UserDynamo.js
    ├── ContentDynamo.js
    ├── SummaryDynamo.js
    ├── ExamDynamo.js
    └── TemplateDynamo.js
```

### Seamless Switching
The `ModelFactory` automatically selects the appropriate database models based on the `DB_TYPE` environment variable.

## ⚙️ Configuration

### Environment Variables

```bash
# Choose database type
DB_TYPE=dynamodb  # or 'mongodb'

# DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_TABLE_PREFIX=ai-study-circle

# For DynamoDB Local development
DYNAMODB_ENDPOINT=http://localhost:8000
```

### AWS Credentials Setup

#### Option 1: Environment Variables
```bash
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="us-east-1"
```

#### Option 2: AWS CLI Configuration
```bash
aws configure
```

#### Option 3: IAM Roles (for EC2/Lambda)
Use IAM roles for production deployments on AWS infrastructure.

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy DynamoDB environment template
cp .env.dynamodb .env

# Edit .env with your AWS credentials
```

### 3. Create DynamoDB Tables
```bash
# Setup all tables
npm run dynamo:setup

# List existing tables
npm run dynamo:list

# Delete all tables (with confirmation)
npm run dynamo:delete -- --confirm
```

### 4. Start Application
```bash
# Set database type and start
DB_TYPE=dynamodb npm run dev
```

## 📊 DynamoDB Table Structure

### Users Table
```
Primary Key: id (String)
GSI: EmailIndex (email)
GSI: UsernameIndex (username)

Attributes:
- id, username, email, password
- role, subscriptionPlan, preferences
- apiUsage, createdAt, updatedAt
```

### Content Table
```
Primary Key: id (String)
GSI: OwnerIndex (owner, createdAt)

Attributes:
- id, title, owner, contentType
- sourceText, filePath, category
- sourceMetadata, usage, status
```

### Summaries Table
```
Primary Key: id (String)
GSI: OwnerIndex (owner, createdAt)
GSI: ContentIndex (contentId)

Attributes:
- id, owner, contentId
- summaryText, summaryType, style
- configuration, metadata, rating
```

### Exams Table
```
Primary Key: id (String)
GSI: OwnerIndex (owner, createdAt)
GSI: ContentIndex (contentId)

Attributes:
- id, owner, contentId
- questions, configuration
- attempts, analytics, feedback
```

### Templates Table
```
Primary Key: id (String)
GSI: CreatedByIndex (createdBy, createdAt)
GSI: TypeCategoryIndex (type, category)
GSI: PublicTemplatesIndex (isPublic, createdAt)

Attributes:
- id, name, description, type
- summaryConfig, examConfig
- usage, ratings, isPublic
```

## 🔧 Development with DynamoDB Local

### Install DynamoDB Local
```bash
# Using Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Or download JAR file
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
```

### Configure for Local Development
```bash
# In your .env file
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
AWS_REGION=us-east-1
```

## 🚀 Production Deployment

### AWS IAM Permissions
Your application needs the following DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:ListTables"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/ai-study-circle-*",
        "arn:aws:dynamodb:*:*:table/ai-study-circle-*/index/*"
      ]
    }
  ]
}
```

### Serverless Deployment (AWS Lambda)
```yaml
# serverless.yml example
service: ai-study-circle

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DB_TYPE: dynamodb
    DYNAMODB_TABLE_PREFIX: ${self:service}-${self:provider.stage}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:*
      Resource: "arn:aws:dynamodb:*:*:table/${self:service}-${self:provider.stage}-*"
```

## 📈 Performance Considerations

### DynamoDB Advantages
- **Auto-scaling**: Handles traffic spikes automatically
- **Serverless**: No server maintenance required
- **Global**: Multi-region replication available
- **Fast**: Single-digit millisecond latency

### Query Optimization
- Use GSIs for different access patterns
- Implement pagination with `LastEvaluatedKey`
- Use batch operations for multiple items
- Consider DynamoDB Streams for real-time processing

### Cost Optimization
- Use On-Demand billing for variable workloads
- Use Provisioned capacity for predictable workloads
- Implement TTL for temporary data
- Use DynamoDB DAX for caching

## 🔄 Migration Between Databases

### MongoDB to DynamoDB
```bash
# 1. Export MongoDB data
mongodump --db ai-study-circle

# 2. Setup DynamoDB tables
DB_TYPE=dynamodb npm run dynamo:setup

# 3. Run migration script (to be created)
node scripts/migrate-mongo-to-dynamo.js
```

### DynamoDB to MongoDB
```bash
# 1. Export DynamoDB data
aws dynamodb scan --table-name ai-study-circle-users

# 2. Setup MongoDB
DB_TYPE=mongodb npm start

# 3. Run migration script
node scripts/migrate-dynamo-to-mongo.js
```

## 🧪 Testing

### Unit Tests with DynamoDB
```javascript
// Use DynamoDB Local for testing
process.env.DB_TYPE = 'dynamodb';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';

// Your test code
const ModelFactory = require('../models/ModelFactory');
const User = ModelFactory.User;

describe('User Model (DynamoDB)', () => {
  test('should create user', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    expect(user.username).toBe('testuser');
  });
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. AWS Credentials Not Found
```bash
Error: The config profile could not be found
```
**Solution**: Configure AWS credentials using `aws configure` or environment variables.

#### 2. Table Not Found
```bash
ResourceNotFoundException: Requested resource not found
```
**Solution**: Run `npm run dynamo:setup` to create tables.

#### 3. Permission Denied
```bash
AccessDeniedException: User is not authorized
```
**Solution**: Check IAM permissions and ensure your user has DynamoDB access.

#### 4. Endpoint Not Reachable
```bash
NetworkingError: getaddrinfo ENOTFOUND
```
**Solution**: Check your AWS region and endpoint configuration.

### Debug Mode
```bash
# Enable AWS SDK debug logging
export AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1
export DEBUG=aws-sdk:*

npm run dev
```

## 🔧 Advanced Features

### Global Secondary Indexes (GSI)
- **EmailIndex**: Quick user lookup by email
- **OwnerIndex**: User's content sorted by creation date
- **PublicTemplatesIndex**: Public templates for sharing

### Conditional Operations
```javascript
// Example: Prevent duplicate emails
await User.create(userData, {
  ConditionExpression: 'attribute_not_exists(email)'
});
```

### Batch Operations
```javascript
// Get multiple users efficiently
const users = await User.batchGet([id1, id2, id3]);
```

### Streams Integration
Set up DynamoDB Streams for real-time processing:
- Analytics updates
- Search index synchronization
- Audit logging

## 🎯 Best Practices

### 1. Data Modeling
- Design for your access patterns
- Use single-table design when appropriate
- Minimize GSIs (costly)

### 2. Error Handling
- Implement exponential backoff for retries
- Handle throttling gracefully
- Use batch operations efficiently

### 3. Security
- Use IAM roles over access keys
- Implement resource-based policies
- Encrypt data at rest and in transit

### 4. Monitoring
- Set up CloudWatch alarms
- Monitor consumed capacity
- Track error rates

## 🚀 Next Steps

1. **Complete Implementation**: Finish remaining DynamoDB models (Summary, Exam, Template)
2. **Migration Scripts**: Create data migration utilities
3. **Performance Testing**: Load test with both databases
4. **Monitoring**: Set up CloudWatch dashboards
5. **Backup Strategy**: Implement point-in-time recovery

---

**Your AI Study Circle platform now supports both MongoDB and DynamoDB!** 🎉

Choose the database that best fits your deployment needs and scale seamlessly.