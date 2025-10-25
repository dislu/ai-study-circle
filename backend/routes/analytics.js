const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const AnalyticsService = require('../services/AnalyticsService');

const analyticsService = new AnalyticsService();

// Rate limiting for analytics endpoints
const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many analytics requests, please try again later'
  }
});

// Apply rate limiting to all routes
router.use(analyticsRateLimit);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get user dashboard analytics
 * @access Private
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Validate timeframe
    const validTimeframes = ['7d', '30d', '90d', '1y'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe. Must be one of: 7d, 30d, 90d, 1y'
      });
    }

    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard analytics'
    });
  }
});

/**
 * @route GET /api/analytics/content
 * @desc Get detailed content analytics
 * @access Private
 */
router.get('/content', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    res.json({
      success: true,
      data: {
        contentStats: analytics.contentStats,
        usageTrends: analytics.usageTrends.content,
        popularContent: analytics.popularContent
      }
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate content analytics'
    });
  }
});

/**
 * @route GET /api/analytics/summaries
 * @desc Get detailed summary analytics
 * @access Private
 */
router.get('/summaries', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    res.json({
      success: true,
      data: {
        summaryStats: analytics.summaryStats,
        usageTrends: analytics.usageTrends.summaries
      }
    });
  } catch (error) {
    console.error('Summary analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary analytics'
    });
  }
});

/**
 * @route GET /api/analytics/exams
 * @desc Get detailed exam analytics
 * @access Private
 */
router.get('/exams', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    res.json({
      success: true,
      data: {
        examStats: analytics.examStats,
        usageTrends: analytics.usageTrends.exams
      }
    });
  } catch (error) {
    console.error('Exam analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate exam analytics'
    });
  }
});

/**
 * @route GET /api/analytics/performance
 * @desc Get user performance metrics
 * @access Private
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    res.json({
      success: true,
      data: {
        performanceMetrics: analytics.performanceMetrics,
        userStats: analytics.userStats
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance analytics'
    });
  }
});

/**
 * @route GET /api/analytics/trends
 * @desc Get usage trends over time
 * @access Private
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d', type } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    let trendsData = analytics.usageTrends;
    
    // Filter by specific trend type if requested
    if (type && ['content', 'summaries', 'exams'].includes(type)) {
      trendsData = { [type]: trendsData[type] };
    }
    
    res.json({
      success: true,
      data: {
        trends: trendsData,
        timeframe,
        dateRange: analytics.dateRange
      }
    });
  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trends analytics'
    });
  }
});

/**
 * @route GET /api/analytics/export
 * @desc Export analytics data
 * @access Private
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d', format = 'json' } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    // Remove sensitive information for export
    const exportData = {
      ...analytics,
      userStats: {
        ...analytics.userStats,
        apiUsage: undefined // Remove API usage details
      }
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = await convertAnalyticsToCSV(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeframe}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      // JSON format (default)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeframe}-${Date.now()}.json"`);
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
});

/**
 * @route GET /api/analytics/system
 * @desc Get system-wide analytics (Admin only)
 * @access Private (Admin)
 */
router.get('/system', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }
    
    const { timeframe = '30d' } = req.query;
    
    const analytics = await analyticsService.getSystemAnalytics(timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('System analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate system analytics'
    });
  }
});

/**
 * @route POST /api/analytics/feedback
 * @desc Submit analytics feedback or request specific metrics
 * @access Private
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { type, message, requestedMetrics } = req.body;
    
    // Validate input
    if (!type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Feedback type and message are required'
      });
    }
    
    // In a real implementation, this would save to a feedback collection
    // For now, we'll just acknowledge the feedback
    
    res.json({
      success: true,
      message: 'Analytics feedback received successfully',
      data: {
        type,
        message,
        requestedMetrics,
        submittedAt: new Date(),
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('Analytics feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit analytics feedback'
    });
  }
});

/**
 * @route GET /api/analytics/insights
 * @desc Get AI-powered insights based on user data
 * @access Private
 */
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const analytics = await analyticsService.getDashboardAnalytics(req.user.id, timeframe);
    
    // Generate insights based on analytics data
    const insights = generateInsights(analytics);
    
    res.json({
      success: true,
      data: {
        insights,
        basedOnTimeframe: timeframe,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Analytics insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics insights'
    });
  }
});

// Helper functions

async function convertAnalyticsToCSV(analytics) {
  // Simple CSV conversion - in a real app, you'd use a proper CSV library
  let csv = 'Metric,Value,Type\n';
  
  // Add basic metrics
  csv += `Total Content,${analytics.contentStats.totalContent},count\n`;
  csv += `Total Summaries,${analytics.summaryStats.totalSummaries},count\n`;
  csv += `Total Exams,${analytics.examStats.totalExams},count\n`;
  csv += `Productivity Score,${analytics.performanceMetrics.productivityScore},score\n`;
  csv += `Content Engagement,${analytics.performanceMetrics.contentEngagement},score\n`;
  
  return csv;
}

function generateInsights(analytics) {
  const insights = [];
  
  // Productivity insights
  if (analytics.performanceMetrics.productivityScore > 80) {
    insights.push({
      type: 'positive',
      category: 'productivity',
      title: 'High Productivity',
      message: 'You\'re maintaining excellent productivity levels! Keep up the great work.',
      actionable: false
    });
  } else if (analytics.performanceMetrics.productivityScore < 40) {
    insights.push({
      type: 'improvement',
      category: 'productivity',
      title: 'Productivity Opportunity',
      message: 'Consider setting daily goals to increase your content creation and study activities.',
      actionable: true,
      suggestion: 'Try creating at least one piece of content or summary per day.'
    });
  }
  
  // Content insights
  if (analytics.contentStats.totalContent > 0) {
    const avgWordsPerContent = analytics.contentStats.avgWordsPerContent;
    if (avgWordsPerContent > 1000) {
      insights.push({
        type: 'positive',
        category: 'content',
        title: 'Comprehensive Content',
        message: `Your content averages ${avgWordsPerContent} words, showing depth and detail.`,
        actionable: false
      });
    } else if (avgWordsPerContent < 300) {
      insights.push({
        type: 'improvement',
        category: 'content',
        title: 'Content Depth',
        message: 'Consider adding more detail to your content for better summary and exam generation.',
        actionable: true,
        suggestion: 'Aim for at least 500 words per content piece for optimal AI processing.'
      });
    }
  }
  
  // Usage pattern insights
  if (analytics.usageTrends.content.length > 7) {
    const recentActivity = analytics.usageTrends.content.slice(-7);
    const totalRecent = recentActivity.reduce((sum, day) => sum + day.count, 0);
    
    if (totalRecent === 0) {
      insights.push({
        type: 'concern',
        category: 'engagement',
        title: 'Low Recent Activity',
        message: 'You haven\'t been active in the past week. Regular use helps build better study habits.',
        actionable: true,
        suggestion: 'Set aside 15 minutes daily to add content or create summaries.'
      });
    }
  }
  
  // Quality insights
  const qualityMetrics = analytics.performanceMetrics.qualityMetrics;
  if (qualityMetrics.avgSummaryRating > 4.0) {
    insights.push({
      type: 'positive',
      category: 'quality',
      title: 'High Quality Output',
      message: `Your summaries are highly rated (${qualityMetrics.avgSummaryRating}/5.0). Excellent work!`,
      actionable: false
    });
  }
  
  return insights;
}

module.exports = router;