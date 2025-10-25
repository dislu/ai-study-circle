const express = require('express');
const router = express.Router();
const exportService = require('../services/ExportService');
const { authenticateToken } = require('../middleware/auth');

// Export content as PDF
router.post('/pdf', authenticateToken, async (req, res) => {
  try {
    const { title, content, format = 'a4', orientation = 'portrait' } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const pdfBuffer = await exportService.generatePDF({
      title,
      content,
      format,
      orientation,
      userId: req.user.id
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export content as Word document
router.post('/word', authenticateToken, async (req, res) => {
  try {
    const { title, content, template = 'default' } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const docBuffer = await exportService.generateWordDoc({
      title,
      content,
      template,
      userId: req.user.id
    });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.docx"`,
      'Content-Length': docBuffer.length
    });

    res.send(docBuffer);

  } catch (error) {
    console.error('Word export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Word document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export content as plain text
router.post('/txt', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const txtContent = exportService.generateText({
      title,
      content,
      userId: req.user.id
    });

    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt"`
    });

    res.send(txtContent);

  } catch (error) {
    console.error('Text export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate text file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export content as JSON
router.post('/json', authenticateToken, async (req, res) => {
  try {
    const { title, content, metadata = {} } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const jsonData = exportService.generateJSON({
      title,
      content,
      metadata,
      userId: req.user.id
    });

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.json"`
    });

    res.json(jsonData);

  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate JSON file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get export history for user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const history = await exportService.getExportHistory(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch export history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get export formats and options
router.get('/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      formats: ['pdf', 'word', 'txt', 'json'],
      pdfOptions: {
        formats: ['a4', 'letter', 'legal', 'a3'],
        orientations: ['portrait', 'landscape']
      },
      wordOptions: {
        templates: ['default', 'academic', 'professional', 'simple']
      }
    }
  });
});

module.exports = router;