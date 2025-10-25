# AI Study Circle - Complete Setup Guide

## 🎯 Overview
AI Study Circle is a powerful web application that uses AI agents to create intelligent summaries and exam papers from your content. This guide will walk you through setting up the complete application with all advanced features.

## 📋 Features Implemented

### Core Features
- ✅ AI-powered content analysis and processing
- ✅ Intelligent summary generation with multiple styles
- ✅ Automated exam paper creation with various question types
- ✅ File upload support (PDF, DOCX, TXT)
- ✅ Text input processing
- ✅ User authentication and authorization
- ✅ Content management system

### Advanced Customization Features
- ✅ **Analytics Dashboard** - Comprehensive user analytics and insights
- ✅ **Template Management** - Create, customize, and share templates
- ✅ **Export Services** - Export summaries and exams to PDF/Word
- ✅ **Performance Metrics** - Track productivity and quality scores
- ✅ **Usage Tracking** - Monitor content engagement and trends
- ✅ **Rating System** - Rate and review content quality
- ✅ **Default Templates** - Pre-configured templates for various use cases

## 🏗️ Architecture

### Backend Services
```
backend/
├── agents/           # AI processing agents
├── models/           # Database schemas
├── routes/           # API endpoints
├── services/         # Business logic services
├── middleware/       # Authentication & validation
└── config/           # Database configuration
```

### Frontend Components
```
frontend/
├── components/       # React components
├── pages/           # Application pages
├── utils/           # Helper functions
└── styles/          # CSS and styling
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Database: MongoDB (local or Atlas) OR DynamoDB (AWS or local)
- OpenAI API key

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
cd Al-Study-Circle

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Environment Configuration

Create `.env` file in the backend directory:

**For MongoDB (Default):**
```env
# Database Configuration
DB_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/ai-study-circle
```

**For DynamoDB:**
```env
# Database Configuration  
DB_TYPE=dynamodb
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
DYNAMODB_TABLE_PREFIX=ai-study-circle

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRE=24h

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=50000000
```

### Step 3: Database Setup

**For MongoDB:**
```bash
# Start MongoDB (if running locally)
mongod

# Seed default templates and data
cd backend
npm run seed
```

**For DynamoDB:**
```bash
# Create DynamoDB tables
cd backend
npm run dynamo:setup

# Seed default templates (requires tables to exist first)
npm run seed
```

### Step 4: Start the Applications

```bash
# Terminal 1: Start Backend Server
cd backend
npm run dev

# Terminal 2: Start Frontend Development Server
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Content Management
- `POST /api/upload` - Upload files (PDF, DOCX, TXT)
- `GET /api/upload/:id` - Get uploaded content
- `DELETE /api/upload/:id` - Delete content

### AI Services
- `POST /api/summary/generate` - Generate summary
- `POST /api/exam/generate` - Generate exam
- `GET /api/status/:jobId` - Check processing status

### Analytics
- `GET /api/analytics/dashboard` - User dashboard analytics
- `GET /api/analytics/content` - Content analytics
- `GET /api/analytics/summaries` - Summary analytics
- `GET /api/analytics/exams` - Exam analytics
- `GET /api/analytics/export` - Export analytics data

### Template Management
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates/:id/clone` - Clone template
- `POST /api/templates/:id/rate` - Rate template

### Export Services
- `GET /api/export/summary/:id` - Export summary
- `GET /api/export/exam/:id` - Export exam

## 🎨 Frontend Components

### Main Components
- **Dashboard** - Analytics and overview
- **FileUpload** - Drag & drop file upload
- **TextInput** - Direct text input
- **ContentPreview** - Content viewer
- **SummaryGenerator** - AI summary creation
- **ExamGenerator** - AI exam creation
- **TemplateManager** - Template management interface

### Usage Examples

```javascript
// Generate Summary
const summaryData = {
  contentId: "content_id_here",
  summaryType: "bullet_points",
  length: "moderate",
  targetAudience: "student"
};

const response = await fetch('/api/summary/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(summaryData)
});

// Generate Exam
const examData = {
  contentId: "content_id_here",
  questionTypes: ["multiple_choice", "short_answer"],
  totalQuestions: 20,
  difficulty: "intermediate"
};

const examResponse = await fetch('/api/exam/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(examData)
});
```

## 🔧 Configuration Options

### AI Agent Configuration
The AI agents can be customized with various parameters:

```javascript
// Summary Agent Configuration
{
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  style: "bullet_points", // outline, paragraph, mind_map, timeline
  length: "moderate",     // brief, moderate, detailed, comprehensive
  targetAudience: "student" // student, professional, general, expert
}

// Exam Agent Configuration
{
  model: "gpt-4",
  temperature: 0.8,
  questionTypes: ["multiple_choice", "true_false", "short_answer"],
  difficulty: "intermediate",
  totalQuestions: 25,
  passingScore: 70
}
```

### Template Configuration
Templates can be customized for different content types:

```javascript
{
  name: "Custom Template",
  type: "both", // summary, exam, both
  category: "academic",
  summaryConfig: {
    style: "outline",
    includeExamples: true,
    tone: "academic"
  },
  examConfig: {
    questionTypes: [
      { type: "multiple_choice", percentage: 70 },
      { type: "short_answer", percentage: 30 }
    ],
    timeLimit: 60
  }
}
```

## 📈 Analytics Features

### Dashboard Metrics
- Content creation statistics
- Summary generation analytics
- Exam performance metrics
- Usage trends over time
- Quality ratings and feedback

### Performance Tracking
- Productivity scores
- Content engagement rates
- API usage monitoring
- User activity patterns

### Export Options
- JSON data export
- CSV format for spreadsheet analysis
- PDF reports (coming soon)

## 🛠️ Advanced Features

### Template System
- Pre-built templates for various subjects
- Custom template creation
- Template sharing and rating
- Version control for templates

### Export Services
- PDF generation with custom formatting
- Word document export
- Batch export capabilities
- Custom branding options

### Analytics Engine
- Real-time usage tracking
- Performance benchmarking
- Predictive insights
- Custom reporting

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting on API endpoints
- Input validation and sanitization
- File upload security
- CORS configuration

## 🚢 Deployment

### Production Environment Setup

```bash
# Set production environment variables
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
OPENAI_API_KEY=your_production_openai_key

# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile example for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📱 Usage Examples

### Creating a Summary
1. Upload a document or paste text
2. Select summary type and configuration
3. Choose or create a template
4. Generate AI-powered summary
5. Export to desired format

### Generating an Exam
1. Provide source content
2. Configure question types and difficulty
3. Set exam parameters (time, passing score)
4. Generate comprehensive exam
5. Export with answer keys

### Managing Templates
1. Browse available templates
2. Clone and customize existing templates
3. Create new templates from scratch
4. Share templates with the community
5. Rate and review templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Examine the example configurations
- Create an issue on GitHub

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added analytics dashboard
- **v1.2.0** - Template management system
- **v1.3.0** - Export services and advanced customization
- **v1.4.0** - Performance improvements and UI enhancements

---

**🎉 Your AI Study Circle platform is now ready!** Start creating intelligent summaries and exams with the power of AI agents and advanced customization features.