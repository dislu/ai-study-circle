const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const Template = require('../models/Template');

// Rate limiting for template operations
const templateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many template requests, please try again later'
  }
});

// Apply rate limiting
router.use(templateRateLimit);

/**
 * @route GET /api/templates
 * @desc Get templates based on filters
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      type,
      category,
      difficulty,
      isPublic,
      search,
      page = 1,
      limit = 20,
      sortBy = 'popularity'
    } = req.query;

    const filters = {};
    
    // Build filters
    if (type && ['summary', 'exam', 'both'].includes(type)) {
      filters.type = type;
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (difficulty) {
      filters.difficulty = difficulty;
    }
    
    if (isPublic !== undefined) {
      filters.isPublic = isPublic === 'true';
    }

    let templates;
    
    if (search) {
      // Search templates
      templates = await Template.searchTemplates(search, filters);
    } else {
      // Get user's templates and public templates
      templates = await Template.getUserTemplates(req.user.id, type);
      
      // Apply additional filters
      if (Object.keys(filters).length > 0) {
        templates = templates.filter(template => {
          return Object.entries(filters).every(([key, value]) => {
            if (key === 'type') {
              return template.type === value || template.type === 'both';
            }
            return template[key] === value;
          });
        });
      }
    }
    
    // Sort templates
    switch (sortBy) {
      case 'popularity':
        templates.sort((a, b) => b.popularityScore - a.popularityScore);
        break;
      case 'rating':
        templates.sort((a, b) => b.usage.averageRating - a.usage.averageRating);
        break;
      case 'usage':
        templates.sort((a, b) => b.usage.timesUsed - a.usage.timesUsed);
        break;
      case 'newest':
        templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'name':
        templates.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTemplates = templates.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        templates: paginatedTemplates,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(templates.length / parseInt(limit)),
          totalTemplates: templates.length,
          hasNext: endIndex < templates.length,
          hasPrev: startIndex > 0
        }
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * @route GET /api/templates/popular
 * @desc Get popular public templates
 * @access Private
 */
router.get('/popular', authenticateToken, async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    const popularTemplates = await Template.getPopularTemplates(type, parseInt(limit));
    
    res.json({
      success: true,
      data: popularTemplates
    });
  } catch (error) {
    console.error('Get popular templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular templates'
    });
  }
});

/**
 * @route GET /api/templates/defaults
 * @desc Get default system templates
 * @access Private
 */
router.get('/defaults', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    
    const defaultTemplates = await Template.getDefaultTemplates(type);
    
    res.json({
      success: true,
      data: defaultTemplates
    });
  } catch (error) {
    console.error('Get default templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch default templates'
    });
  }
});

/**
 * @route GET /api/templates/:id
 * @desc Get a specific template
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('parentTemplate', 'name version');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Check access permissions
    if (!template.isPublic && !template.createdBy._id.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this template'
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template'
    });
  }
});

/**
 * @route POST /api/templates
 * @desc Create a new template
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    // Validate required fields
    if (!templateData.name || !templateData.description || !templateData.type) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and type are required'
      });
    }
    
    // Only admins can create default templates
    if (templateData.isDefault && req.user.role !== 'admin') {
      templateData.isDefault = false;
    }
    
    const template = new Template(templateData);
    await template.save();
    
    await template.populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Create template error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

/**
 * @route PUT /api/templates/:id
 * @desc Update a template
 * @access Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Check permissions
    if (!template.canUserModify(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only modify your own templates.'
      });
    }
    
    // Prevent non-admins from setting isDefault
    if (req.body.isDefault && req.user.role !== 'admin') {
      delete req.body.isDefault;
    }
    
    // Update template
    Object.assign(template, req.body);
    template.version += 1; // Increment version
    
    await template.save();
    await template.populate('createdBy', 'username email');
    
    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Update template error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

/**
 * @route POST /api/templates/:id/clone
 * @desc Clone a template
 * @access Private
 */
router.post('/:id/clone', authenticateToken, async (req, res) => {
  try {
    const originalTemplate = await Template.findById(req.params.id);
    
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Check access permissions
    if (!originalTemplate.isPublic && !originalTemplate.createdBy.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to clone this template'
      });
    }
    
    const modifications = req.body.modifications || {};
    const clonedTemplate = originalTemplate.clone(req.user.id, modifications);
    
    await clonedTemplate.save();
    await clonedTemplate.populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      data: clonedTemplate,
      message: 'Template cloned successfully'
    });
  } catch (error) {
    console.error('Clone template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clone template'
    });
  }
});

/**
 * @route DELETE /api/templates/:id
 * @desc Delete a template
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Check permissions
    if (!template.canUserModify(req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own templates.'
      });
    }
    
    // Soft delete by changing status
    template.status = 'inactive';
    await template.save();
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

/**
 * @route POST /api/templates/:id/rate
 * @desc Rate a template
 * @access Private
 */
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }
    
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Users can't rate their own templates
    if (template.createdBy.equals(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'You cannot rate your own template'
      });
    }
    
    await template.addRating(req.user.id, rating, comment);
    
    res.json({
      success: true,
      data: {
        averageRating: template.usage.averageRating,
        totalRatings: template.usage.totalRatings
      },
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Rate template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit rating'
    });
  }
});

/**
 * @route POST /api/templates/:id/use
 * @desc Mark template as used (increment usage count)
 * @access Private
 */
router.post('/:id/use', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Check access permissions
    if (!template.isPublic && !template.createdBy.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to use this template'
      });
    }
    
    await template.incrementUsage();
    
    res.json({
      success: true,
      data: {
        timesUsed: template.usage.timesUsed,
        lastUsed: template.usage.lastUsed
      },
      message: 'Template usage recorded'
    });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record template usage'
    });
  }
});

/**
 * @route GET /api/templates/categories/list
 * @desc Get list of available categories
 * @access Private
 */
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { value: 'academic', label: 'Academic', description: 'Educational content and coursework' },
      { value: 'business', label: 'Business', description: 'Business documents and presentations' },
      { value: 'technical', label: 'Technical', description: 'Technical documentation and manuals' },
      { value: 'medical', label: 'Medical', description: 'Medical and healthcare content' },
      { value: 'legal', label: 'Legal', description: 'Legal documents and contracts' },
      { value: 'scientific', label: 'Scientific', description: 'Research papers and scientific content' },
      { value: 'literature', label: 'Literature', description: 'Books, articles, and literary works' },
      { value: 'history', label: 'History', description: 'Historical documents and events' },
      { value: 'language', label: 'Language', description: 'Language learning and linguistics' },
      { value: 'math', label: 'Mathematics', description: 'Mathematical concepts and problems' },
      { value: 'general', label: 'General', description: 'General purpose content' },
      { value: 'custom', label: 'Custom', description: 'User-defined custom templates' }
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * @route GET /api/templates/export/:id
 * @desc Export template configuration
 * @access Private
 */
router.get('/export/:id', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Check access permissions
    if (!template.isPublic && !template.createdBy._id.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to export this template'
      });
    }
    
    // Create exportable template data
    const exportData = {
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      difficulty: template.difficulty,
      summaryConfig: template.summaryConfig,
      examConfig: template.examConfig,
      aiInstructions: template.aiInstructions,
      tags: template.tags,
      version: template.version,
      exportedAt: new Date(),
      exportedBy: req.user.username
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template-${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}.json"`);
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export template'
    });
  }
});

/**
 * @route POST /api/templates/import
 * @desc Import template configuration
 * @access Private
 */
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const templateData = req.body;
    
    if (!templateData.name || !templateData.type) {
      return res.status(400).json({
        success: false,
        error: 'Invalid template data. Name and type are required.'
      });
    }
    
    // Create new template from imported data
    const newTemplate = new Template({
      ...templateData,
      createdBy: req.user.id,
      isPublic: false, // Imported templates are private by default
      isDefault: false, // Only admins can create default templates
      usage: {
        timesUsed: 0,
        averageRating: 0,
        totalRatings: 0
      },
      ratings: [],
      name: `${templateData.name} (Imported)` // Add suffix to avoid conflicts
    });
    
    await newTemplate.save();
    await newTemplate.populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      data: newTemplate,
      message: 'Template imported successfully'
    });
  } catch (error) {
    console.error('Import template error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to import template'
    });
  }
});

module.exports = router;
