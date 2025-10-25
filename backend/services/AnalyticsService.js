const User = require('../models/User');
const Content = require('../models/Content');
const Summary = require('../models/Summary');
const Exam = require('../models/Exam');

class AnalyticsService {
  
  // Get comprehensive dashboard analytics
  async getDashboardAnalytics(userId, timeframe = '30d') {
    try {
      const dateRange = this.getDateRange(timeframe);
      
      const [
        userStats,
        contentStats,
        summaryStats,
        examStats,
        usageTrends,
        popularContent,
        performanceMetrics
      ] = await Promise.all([
        this.getUserStats(userId, dateRange),
        this.getContentStats(userId, dateRange),
        this.getSummaryStats(userId, dateRange),
        this.getExamStats(userId, dateRange),
        this.getUsageTrends(userId, dateRange),
        this.getPopularContent(userId, dateRange),
        this.getPerformanceMetrics(userId, dateRange)
      ]);

      return {
        timeframe,
        dateRange,
        userStats,
        contentStats,
        summaryStats,
        examStats,
        usageTrends,
        popularContent,
        performanceMetrics,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Analytics generation failed: ${error.message}`);
    }
  }

  // Get system-wide analytics (admin only)
  async getSystemAnalytics(timeframe = '30d') {
    try {
      const dateRange = this.getDateRange(timeframe);
      
      const [
        systemOverview,
        userGrowth,
        contentAnalytics,
        usagePatterns,
        popularFeatures,
        errorAnalytics
      ] = await Promise.all([
        this.getSystemOverview(dateRange),
        this.getUserGrowthStats(dateRange),
        this.getSystemContentAnalytics(dateRange),
        this.getSystemUsagePatterns(dateRange),
        this.getPopularFeatures(dateRange),
        this.getErrorAnalytics(dateRange)
      ]);

      return {
        timeframe,
        dateRange,
        systemOverview,
        userGrowth,
        contentAnalytics,
        usagePatterns,
        popularFeatures,
        errorAnalytics,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`System analytics generation failed: ${error.message}`);
    }
  }

  // User statistics
  async getUserStats(userId, dateRange) {
    const user = await User.findById(userId);
    
    const totalContent = await Content.countDocuments({
      owner: userId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const totalSummaries = await Summary.countDocuments({
      owner: userId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const totalExams = await Exam.countDocuments({
      owner: userId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    return {
      subscriptionPlan: user.subscriptionPlan,
      memberSince: user.createdAt,
      totalContent,
      totalSummaries,
      totalExams,
      apiUsage: user.apiUsage,
      preferences: user.preferences
    };
  }

  // Content statistics
  async getContentStats(userId, dateRange) {
    const contentAggregation = await Content.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          totalWords: { $sum: '$sourceMetadata.wordCount' },
          avgWordsPerContent: { $avg: '$sourceMetadata.wordCount' },
          categories: { $push: '$category' },
          contentTypes: { $push: '$contentType' }
        }
      }
    ]);

    const stats = contentAggregation[0] || {
      totalContent: 0,
      totalWords: 0,
      avgWordsPerContent: 0,
      categories: [],
      contentTypes: []
    };

    // Process categories and content types
    const categoryCounts = this.countOccurrences(stats.categories);
    const contentTypeCounts = this.countOccurrences(stats.contentTypes);

    // Get most viewed content
    const mostViewed = await Content.find({
      owner: userId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    })
    .sort({ 'usage.views': -1 })
    .limit(5)
    .select('title category usage.views usage.summariesGenerated usage.examsGenerated');

    return {
      totalContent: stats.totalContent,
      totalWords: stats.totalWords,
      avgWordsPerContent: Math.round(stats.avgWordsPerContent || 0),
      categoryDistribution: categoryCounts,
      contentTypeDistribution: contentTypeCounts,
      mostViewed
    };
  }

  // Summary statistics
  async getSummaryStats(userId, dateRange) {
    const summaryAggregation = await Summary.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          totalSummaries: { $sum: 1 },
          totalDownloads: { $sum: '$downloads' },
          avgWordCount: { $avg: '$metadata.wordCount' },
          summaryTypes: { $push: '$summaryType' },
          styles: { $push: '$style' },
          audiences: { $push: '$targetAudience' }
        }
      }
    ]);

    const stats = summaryAggregation[0] || {
      totalSummaries: 0,
      totalDownloads: 0,
      avgWordCount: 0,
      summaryTypes: [],
      styles: [],
      audiences: []
    };

    const typeDistribution = this.countOccurrences(stats.summaryTypes);
    const styleDistribution = this.countOccurrences(stats.styles);
    const audienceDistribution = this.countOccurrences(stats.audiences);

    // Get highest rated summaries
    const topRated = await Summary.find({
      owner: userId,
      'rating.quality': { $exists: true },
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    })
    .sort({ 'rating.quality': -1 })
    .limit(5)
    .select('title summaryType rating downloads');

    return {
      totalSummaries: stats.totalSummaries,
      totalDownloads: stats.totalDownloads,
      avgWordCount: Math.round(stats.avgWordCount || 0),
      typeDistribution,
      styleDistribution,
      audienceDistribution,
      topRated
    };
  }

  // Exam statistics
  async getExamStats(userId, dateRange) {
    const examAggregation = await Exam.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          totalQuestions: { $sum: '$configuration.totalQuestions' },
          totalAttempts: { $sum: { $size: '$attempts' } },
          avgQuestions: { $avg: '$configuration.totalQuestions' },
          difficulties: { $push: '$configuration.difficulty' },
          templates: { $push: '$template' },
          categories: { $push: '$category' }
        }
      }
    ]);

    const stats = examAggregation[0] || {
      totalExams: 0,
      totalQuestions: 0,
      totalAttempts: 0,
      avgQuestions: 0,
      difficulties: [],
      templates: [],
      categories: []
    };

    const difficultyDistribution = this.countOccurrences(stats.difficulties);
    const templateDistribution = this.countOccurrences(stats.templates);
    const categoryDistribution = this.countOccurrences(stats.categories);

    // Get exam performance statistics
    const examPerformance = await Exam.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $unwind: '$attempts'
      },
      {
        $match: {
          'attempts.status': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$attempts.score.percentage' },
          avgTimeSpent: { $avg: '$attempts.timeSpent' },
          completionRate: { $avg: 1 } // This would need more complex logic for accurate completion rate
        }
      }
    ]);

    const performance = examPerformance[0] || {
      avgScore: 0,
      avgTimeSpent: 0,
      completionRate: 0
    };

    return {
      totalExams: stats.totalExams,
      totalQuestions: stats.totalQuestions,
      totalAttempts: stats.totalAttempts,
      avgQuestions: Math.round(stats.avgQuestions || 0),
      difficultyDistribution,
      templateDistribution,
      categoryDistribution,
      performance: {
        avgScore: Math.round(performance.avgScore || 0),
        avgTimeSpent: Math.round(performance.avgTimeSpent || 0),
        completionRate: Math.round((performance.completionRate || 0) * 100)
      }
    };
  }

  // Usage trends over time
  async getUsageTrends(userId, dateRange) {
    const dailyStats = await Promise.all([
      this.getDailyContentStats(userId, dateRange),
      this.getDailySummaryStats(userId, dateRange),
      this.getDailyExamStats(userId, dateRange)
    ]);

    return {
      content: dailyStats[0],
      summaries: dailyStats[1],
      exams: dailyStats[2]
    };
  }

  // Get popular content
  async getPopularContent(userId, dateRange) {
    const popularContent = await Content.find({
      owner: userId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    })
    .sort({ 
      'usage.views': -1,
      'usage.summariesGenerated': -1,
      'usage.examsGenerated': -1
    })
    .limit(10)
    .select('title category tags usage createdAt');

    return popularContent;
  }

  // Performance metrics
  async getPerformanceMetrics(userId, dateRange) {
    // Calculate various performance indicators
    const contentEngagement = await this.calculateContentEngagement(userId, dateRange);
    const productivityScore = await this.calculateProductivityScore(userId, dateRange);
    const qualityMetrics = await this.calculateQualityMetrics(userId, dateRange);

    return {
      contentEngagement,
      productivityScore,
      qualityMetrics
    };
  }

  // Helper methods
  getDateRange(timeframe) {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return { start, end };
  }

  countOccurrences(array) {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }

  async getDailyContentStats(userId, dateRange) {
    return await Content.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async getDailySummaryStats(userId, dateRange) {
    return await Summary.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async getDailyExamStats(userId, dateRange) {
    return await Exam.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async calculateContentEngagement(userId, dateRange) {
    const content = await Content.find({
      owner: userId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    if (content.length === 0) return 0;

    const totalViews = content.reduce((sum, c) => sum + (c.usage.views || 0), 0);
    const totalSummaries = content.reduce((sum, c) => sum + (c.usage.summariesGenerated || 0), 0);
    const totalExams = content.reduce((sum, c) => sum + (c.usage.examsGenerated || 0), 0);

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, (totalViews + totalSummaries * 2 + totalExams * 3) / content.length);
    return Math.round(engagementScore);
  }

  async calculateProductivityScore(userId, dateRange) {
    const [contentCount, summaryCount, examCount] = await Promise.all([
      Content.countDocuments({
        owner: userId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      Summary.countDocuments({
        owner: userId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      Exam.countDocuments({
        owner: userId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      })
    ]);

    // Calculate productivity score based on output
    const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    const dailyAvg = (contentCount + summaryCount + examCount) / days;
    const productivityScore = Math.min(100, dailyAvg * 20); // Scale to 0-100

    return Math.round(productivityScore);
  }

  async calculateQualityMetrics(userId, dateRange) {
    const summaries = await Summary.find({
      owner: userId,
      'rating.quality': { $exists: true },
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const exams = await Exam.find({
      owner: userId,
      'feedback.rating': { $exists: true },
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    let avgSummaryRating = 0;
    let avgExamRating = 0;

    if (summaries.length > 0) {
      const totalSummaryRating = summaries.reduce((sum, s) => sum + (s.rating.quality || 0), 0);
      avgSummaryRating = totalSummaryRating / summaries.length;
    }

    if (exams.length > 0) {
      let totalExamRating = 0;
      let totalRatings = 0;
      
      exams.forEach(exam => {
        exam.feedback.forEach(feedback => {
          if (feedback.rating) {
            totalExamRating += feedback.rating;
            totalRatings++;
          }
        });
      });
      
      if (totalRatings > 0) {
        avgExamRating = totalExamRating / totalRatings;
      }
    }

    return {
      avgSummaryRating: Math.round(avgSummaryRating * 10) / 10,
      avgExamRating: Math.round(avgExamRating * 10) / 10,
      ratedSummaries: summaries.length,
      ratedExams: exams.length
    };
  }

  // System-wide analytics methods (for admin use)
  async getSystemOverview(dateRange) {
    const [totalUsers, activeUsers, totalContent, totalSummaries, totalExams] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: dateRange.start } }),
      Content.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
      Summary.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
      Exam.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } })
    ]);

    return {
      totalUsers,
      activeUsers,
      totalContent,
      totalSummaries,
      totalExams,
      activityRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };
  }

  async getUserGrowthStats(dateRange) {
    return await User.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async getSystemContentAnalytics(dateRange) {
    return {
      contentByCategory: await this.getContentByCategory(dateRange),
      contentByType: await this.getContentByType(dateRange),
      summaryByStyle: await this.getSummaryByStyle(dateRange),
      examByDifficulty: await this.getExamByDifficulty(dateRange)
    };
  }

  async getSystemUsagePatterns(dateRange) {
    // Implementation for system usage patterns
    // This would include peak hours, popular features, etc.
    return {
      peakHours: await this.getPeakUsageHours(dateRange),
      popularFeatures: await this.getFeatureUsage(dateRange),
      avgSessionDuration: await this.getAvgSessionDuration(dateRange)
    };
  }

  async getPopularFeatures(dateRange) {
    // Track feature usage across the platform
    return {
      summaryGenerations: await Summary.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
      examGenerations: await Exam.countDocuments({ createdAt: { $gte: dateRange.start, $lte: dateRange.end } }),
      fileUploads: await Content.countDocuments({ 
        contentType: 'file_upload',
        createdAt: { $gte: dateRange.start, $lte: dateRange.end } 
      }),
      textInputs: await Content.countDocuments({ 
        contentType: 'text_input',
        createdAt: { $gte: dateRange.start, $lte: dateRange.end } 
      })
    };
  }

  async getErrorAnalytics(dateRange) {
    // This would require error logging implementation
    // For now, return placeholder
    return {
      totalErrors: 0,
      errorsByType: {},
      errorRate: 0,
      mostCommonErrors: []
    };
  }
}

module.exports = AnalyticsService;