# AI Study Circle - Intelligent Multilingual Content Analysis Platform

A web application powered by AI agents that can create summaries and exam papers from content in multiple Indian languages, with automatic translation support.

## 🌟 Features

### Core AI Capabilities
- **AI-Powered Summary Generation**: Upload content and get intelligent summaries
- **Exam Paper Creation**: Automatically generate various types of questions from content
- **Multi-format Support**: PDF, DOCX, TXT, and more
- **Configurable AI Agents**: Customize summary length, question difficulty, and exam format
- **Real-time Processing**: See your content being processed in real-time

### 🌏 Multilingual Support (NEW!)
- **16+ Indian Languages**: Hindi, Bengali, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Nepali, Sinhala, Myanmar, Sanskrit
- **Automatic Language Detection**: Smart detection using multiple methods (pattern, statistical, AI-based)
- **Seamless Translation**: Content automatically translated to English for AI processing
- **Native Script Support**: Full Unicode support for all Indian scripts
- **Response Translation**: AI responses can be translated back to original language
- **Translation Confidence**: Quality indicators for translation accuracy

## 🏗️ Architecture

### Core Platform
- **Frontend**: React with modern UI components and multilingual interface
- **Backend**: Node.js/Express API with AI agent orchestration
- **AI Agents**: Specialized agents for content analysis, summarization, and question generation
- **Database**: Dual support for MongoDB and Amazon DynamoDB

### Translation System
- **Translation Service**: Google Cloud Translate integration with fallback support
- **Language Detection**: Multi-method detection (Unicode patterns, statistical analysis, AI)
- **Translation Middleware**: Automatic preprocessing for AI agents
- **Caching Layer**: Intelligent caching for improved performance
- **Quality Assurance**: Confidence scoring and error handling

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud) OR Amazon DynamoDB
- OpenAI API key (for AI agents)
- Google Cloud Translate API key (for multilingual support)

### Quick Setup

Use our automated setup script for translation features:

```bash
node setup-translation.js
```

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Set up environment variables (see `.env.example` files)

5. Start the development servers:
   ```bash
   # Backend (port 3001)
   cd backend
   npm run dev
   
   # Frontend (port 3000)
   cd frontend
   npm run dev
   ```

## Usage

1. Upload your content (PDF, DOCX, or text)
2. Choose your desired output (Summary, Exam, or both)
3. Configure the AI agents settings
4. Let the AI process your content
5. Download or view your generated materials

## API Endpoints

- `POST /api/upload` - Upload content files
- `POST /api/summary/generate` - Generate summary
- `POST /api/exam/generate` - Generate exam paper
- `GET /api/status/:jobId` - Check processing status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License# ai-study-circle
