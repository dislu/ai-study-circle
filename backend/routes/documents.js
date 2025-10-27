const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken: auth } = require('../middleware/auth');
const Document = require('../models/Document');
const WebSocketService = require('../services/WebSocketService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'application/pdf' ||
                     file.mimetype === 'application/msword' ||
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file.mimetype === 'text/plain';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

/**
 * @route   GET /api/documents
 * @desc    Get all documents for the authenticated user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .sort({ uploadDate: -1 });
    
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

/**
 * @route   POST /api/documents/upload
 * @desc    Upload a new document
 * @access  Private
 */
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const document = new Document({
      userId: req.user.id,
      name: req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      type: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
      status: 'processing',
      uploadDate: new Date(),
      summaryGenerated: false,
      examGenerated: false
    });

    await document.save();

    // Send WebSocket notification for upload
    WebSocketService.notifyDocumentProcessed(req.user.id, document, 'processing');

    // Process the document for text extraction and word count in the background
    processDocumentAsync(document, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        name: document.name,
        type: document.type,
        size: formatFileSize(document.size),
        uploadDate: document.uploadDate.toISOString().split('T')[0],
        status: document.status,
        summaryGenerated: document.summaryGenerated,
        examGenerated: document.examGenerated,
        wordsCount: document.wordsCount || 0
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
});

/**
 * @route   GET /api/documents/:id
 * @desc    Get a specific document
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
});

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Delete the file from disk
    try {
      await fs.unlink(document.path);
    } catch (fileError) {
      console.error('Failed to delete file from disk:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await Document.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

/**
 * @route   GET /api/documents/:id/download
 * @desc    Download a document
 * @access  Private
 */
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(document.path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    res.download(document.path, document.originalName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download document'
    });
  }
});

/**
 * Extract text content from uploaded files
 */
async function extractTextFromFile(filePath, fileType) {
  try {
    switch (fileType) {
      case 'pdf':
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;

      case 'doc':
      case 'docx':
        const docBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        return result.value;

      case 'txt':
        const txtContent = await fs.readFile(filePath, 'utf8');
        return txtContent;

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
}

/**
 * Count words in text content
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  
  // Remove extra whitespace and split by whitespace
  const words = text.trim().split(/\s+/);
  return words.length > 0 && words[0] !== '' ? words.length : 0;
}

/**
 * Process document asynchronously for text extraction and analysis
 */
async function processDocumentAsync(document, userId) {
  try {
    console.log(`Processing document: ${document.name}`);
    
    // Extract text content
    const textContent = await extractTextFromFile(document.path, document.type);
    const wordsCount = countWords(textContent);
    
    // Update document with extracted content
    document.textContent = textContent;
    document.wordsCount = wordsCount;
    document.status = 'completed';
    await document.save();
    
    // Send success notification
    WebSocketService.notifyDocumentProcessed(userId, document, 'completed');
    
    console.log(`Document processed successfully: ${document.name} (${wordsCount} words)`);
    
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document status to failed
    document.status = 'failed';
    await document.save();
    
    // Send error notification
    WebSocketService.notifyProcessingError(userId, document, error.message);
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;