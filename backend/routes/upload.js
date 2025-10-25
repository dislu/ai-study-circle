const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ContentProcessor = require('../utils/ContentProcessor');
const jobManager = require('../utils/JobManager');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOCX, TXT, or MD files.'));
    }
  }
});

const contentProcessor = new ContentProcessor();

// Upload and process file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create a processing job
    const job = jobManager.createJob('file_upload', {
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size
    });

    // Start processing asynchronously
    processFileAsync(job.id, req.file.path, req.file.originalname);

    res.json({
      success: true,
      jobId: job.id,
      message: 'File uploaded successfully. Processing started.',
      filename: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

// Upload text directly (without file)
router.post('/text', async (req, res) => {
  try {
    const { text, title = 'Direct Text Input' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'No text content provided' });
    }

    // Validate content
    const validation = contentProcessor.validateContent(text);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Create a processing job
    const job = jobManager.createJob('text_input', {
      title,
      textLength: text.length,
      wordCount: validation.wordCount
    });

    // Process text immediately (no file processing needed)
    const processedContent = await contentProcessor.preprocessForAI(text);
    
    jobManager.setJobResult(job.id, {
      text: processedContent.text,
      metadata: {
        title,
        wordCount: validation.wordCount,
        characterCount: validation.characterCount,
        processedAt: new Date().toISOString(),
        source: 'direct_text'
      }
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Text processed successfully',
      wordCount: validation.wordCount,
      characterCount: validation.characterCount
    });

  } catch (error) {
    console.error('Text upload error:', error);
    res.status(500).json({ 
      error: 'Text processing failed',
      message: error.message 
    });
  }
});

// Get supported file formats
router.get('/formats', (req, res) => {
  res.json({
    supportedFormats: [
      {
        extension: 'pdf',
        mimeType: 'application/pdf',
        description: 'Portable Document Format'
      },
      {
        extension: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        description: 'Microsoft Word Document'
      },
      {
        extension: 'txt',
        mimeType: 'text/plain',
        description: 'Plain Text File'
      },
      {
        extension: 'md',
        mimeType: 'text/markdown',
        description: 'Markdown File'
      }
    ],
    maxFileSize: '50MB',
    maxTextLength: '1MB'
  });
});

// Async file processing function
async function processFileAsync(jobId, filePath, originalName) {
  try {
    jobManager.setJobStatus(jobId, 'processing', 10);

    // Extract content from file
    const result = await contentProcessor.processFile(filePath, originalName);
    jobManager.setJobStatus(jobId, 'processing', 50);

    // Preprocess for AI
    const processedContent = await contentProcessor.preprocessForAI(result.text);
    jobManager.setJobStatus(jobId, 'processing', 80);

    // Set final result
    jobManager.setJobResult(jobId, {
      text: processedContent.text,
      metadata: {
        ...result.metadata,
        ...processedContent.metadata
      }
    });

    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error('Failed to clean up processed file:', cleanupError);
    }

  } catch (error) {
    console.error('File processing error:', error);
    jobManager.failJob(jobId, error);

    // Clean up uploaded file on error
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error('Failed to clean up failed file:', cleanupError);
    }
  }
}

module.exports = router;