/**
 * Log Analysis Script
 * Analyzes frontend logs for patterns and insights
 */

const fs = require('fs');
const path = require('path');

class LogAnalyzer {
  constructor() {
    this.logData = [];
    this.analysis = {
      summary: {},
      errors: [],
      performance: [],
      userActions: [],
      apiCalls: []
    };
  }

  /**
   * Load logs from localStorage backup or log files
   */
  loadLogs() {
    console.log('📊 Loading logs for analysis...');
    
    // In a real scenario, you'd load from your backend API
    // For demo purposes, we'll create sample data
    this.generateSampleLogs();
    
    console.log(`✅ Loaded ${this.logData.length} log entries`);
  }

  /**
   * Generate sample log data for analysis
   */
  generateSampleLogs() {
    const now = Date.now();
    const categories = ['user_action', 'api', 'performance', 'error', 'navigation'];
    const actions = ['click', 'scroll', 'form_submit', 'page_view', 'api_call'];
    
    for (let i = 0; i < 1000; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      this.logData.push({
        id: `log_${i}`,
        timestamp: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        level: this.getRandomLogLevel(),
        message: `${action} event`,
        category,
        data: this.generateSampleData(category),
        context: {
          sessionId: `session_${Math.floor(i / 100)}`,
          userId: `user_${Math.floor(Math.random() * 10)}`,
          url: `/page${Math.floor(Math.random() * 5)}`
        }
      });
    }
  }

  /**
   * Get random log level based on realistic distribution
   */
  getRandomLogLevel() {
    const rand = Math.random();
    if (rand < 0.6) return 'info';
    if (rand < 0.8) return 'debug';
    if (rand < 0.95) return 'warn';
    return 'error';
  }

  /**
   * Generate sample data based on category
   */
  generateSampleData(category) {
    switch (category) {
      case 'performance':
        return {
          metric: 'LCP',
          value: Math.random() * 3000 + 1000,
          threshold: Math.random() > 0.7 ? 'good' : 'needs-improvement'
        };
      case 'api':
        return {
          method: 'GET',
          url: `/api/endpoint${Math.floor(Math.random() * 5)}`,
          status: Math.random() > 0.9 ? 500 : 200,
          duration: Math.random() * 2000 + 100
        };
      case 'error':
        return {
          name: 'TypeError',
          message: 'Cannot read property of undefined',
          stack: 'Error: at component.jsx:42:15'
        };
      default:
        return {
          element: 'button',
          coordinates: { x: Math.random() * 1000, y: Math.random() * 800 }
        };
    }
  }

  /**
   * Perform comprehensive log analysis
   */
  analyze() {
    console.log('🔍 Analyzing logs...');
    
    this.analyzeSummary();
    this.analyzeErrors();
    this.analyzePerformance();
    this.analyzeUserBehavior();
    this.analyzeApiCalls();
    
    console.log('✅ Analysis complete');
  }

  /**
   * Analyze general log summary
   */
  analyzeSummary() {
    const totalLogs = this.logData.length;
    const timeRange = this.getTimeRange();
    const logLevels = this.groupBy(this.logData, 'level');
    const categories = this.groupBy(this.logData, 'category');
    const sessions = new Set(this.logData.map(log => log.context.sessionId)).size;
    const users = new Set(this.logData.map(log => log.context.userId)).size;

    this.analysis.summary = {
      totalLogs,
      timeRange,
      logLevels: Object.keys(logLevels).reduce((acc, level) => {
        acc[level] = logLevels[level].length;
        return acc;
      }, {}),
      categories: Object.keys(categories).reduce((acc, cat) => {
        acc[cat] = categories[cat].length;
        return acc;
      }, {}),
      sessions,
      users,
      avgLogsPerSession: Math.round(totalLogs / sessions),
      avgLogsPerUser: Math.round(totalLogs / users)
    };
  }

  /**
   * Analyze errors
   */
  analyzeErrors() {
    const errors = this.logData.filter(log => log.level === 'error');
    const errorsByType = this.groupBy(errors, 'data.name');
    const errorsByPage = this.groupBy(errors, 'context.url');
    
    this.analysis.errors = {
      total: errors.length,
      errorRate: ((errors.length / this.logData.length) * 100).toFixed(2) + '%',
      byType: Object.keys(errorsByType).map(type => ({
        type,
        count: errorsByType[type].length,
        percentage: ((errorsByType[type].length / errors.length) * 100).toFixed(1) + '%'
      })),
      byPage: Object.keys(errorsByPage).map(url => ({
        url,
        count: errorsByPage[url].length,
        percentage: ((errorsByPage[url].length / errors.length) * 100).toFixed(1) + '%'
      })),
      timeline: this.createTimeline(errors)
    };
  }

  /**
   * Analyze performance metrics
   */
  analyzePerformance() {
    const perfLogs = this.logData.filter(log => log.category === 'performance');
    const metrics = this.groupBy(perfLogs, 'data.metric');
    
    this.analysis.performance = {
      total: perfLogs.length,
      metrics: Object.keys(metrics).map(metric => {
        const values = metrics[metric].map(log => log.data.value).filter(v => v != null);
        return {
          metric,
          count: values.length,
          average: this.average(values).toFixed(2),
          median: this.median(values).toFixed(2),
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
          p95: this.percentile(values, 95).toFixed(2)
        };
      }),
      slowPages: this.findSlowPages(perfLogs),
      timeline: this.createTimeline(perfLogs)
    };
  }

  /**
   * Analyze user behavior
   */
  analyzeUserBehavior() {
    const userLogs = this.logData.filter(log => log.category === 'user_action');
    const actionsByType = this.groupBy(userLogs, 'message');
    const userSessions = this.groupBy(userLogs, 'context.sessionId');
    
    this.analysis.userActions = {
      total: userLogs.length,
      byType: Object.keys(actionsByType).map(action => ({
        action,
        count: actionsByType[action].length,
        percentage: ((actionsByType[action].length / userLogs.length) * 100).toFixed(1) + '%'
      })),
      sessionActivity: Object.keys(userSessions).map(sessionId => ({
        sessionId,
        actions: userSessions[sessionId].length,
        duration: this.getSessionDuration(userSessions[sessionId]),
        pages: new Set(userSessions[sessionId].map(log => log.context.url)).size
      })),
      engagementMetrics: this.calculateEngagementMetrics(userSessions)
    };
  }

  /**
   * Analyze API calls
   */
  analyzeApiCalls() {
    const apiLogs = this.logData.filter(log => log.category === 'api');
    const callsByEndpoint = this.groupBy(apiLogs, 'data.url');
    const callsByStatus = this.groupBy(apiLogs, 'data.status');
    
    this.analysis.apiCalls = {
      total: apiLogs.length,
      byEndpoint: Object.keys(callsByEndpoint).map(endpoint => {
        const calls = callsByEndpoint[endpoint];
        const durations = calls.map(call => call.data.duration).filter(d => d != null);
        const errors = calls.filter(call => call.data.status >= 400).length;
        
        return {
          endpoint,
          count: calls.length,
          errorRate: ((errors / calls.length) * 100).toFixed(1) + '%',
          avgDuration: durations.length > 0 ? this.average(durations).toFixed(2) : 'N/A',
          p95Duration: durations.length > 0 ? this.percentile(durations, 95).toFixed(2) : 'N/A'
        };
      }),
      byStatus: Object.keys(callsByStatus).map(status => ({
        status,
        count: callsByStatus[status].length,
        percentage: ((callsByStatus[status].length / apiLogs.length) * 100).toFixed(1) + '%'
      })),
      errorRate: ((apiLogs.filter(log => log.data.status >= 400).length / apiLogs.length) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Utility methods
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = this.getNestedValue(item, key);
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {});
  }

  getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  average(numbers) {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  median(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  }

  percentile(numbers, p) {
    const sorted = numbers.sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    if (Math.floor(index) === index) {
      return sorted[index];
    }
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  getTimeRange() {
    const timestamps = this.logData.map(log => new Date(log.timestamp).getTime());
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));
    return {
      start: min.toISOString(),
      end: max.toISOString(),
      duration: Math.round((max - min) / (1000 * 60 * 60)) + ' hours'
    };
  }

  createTimeline(logs, buckets = 24) {
    const timestamps = logs.map(log => new Date(log.timestamp).getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    const bucketSize = (max - min) / buckets;
    
    const timeline = Array(buckets).fill(0);
    logs.forEach(log => {
      const bucket = Math.floor((new Date(log.timestamp).getTime() - min) / bucketSize);
      timeline[Math.min(bucket, buckets - 1)]++;
    });
    
    return timeline;
  }

  findSlowPages(perfLogs) {
    const pagePerf = this.groupBy(perfLogs, 'context.url');
    return Object.keys(pagePerf).map(url => {
      const logs = pagePerf[url];
      const avgValue = this.average(logs.map(log => log.data.value));
      return { url, avgValue };
    }).sort((a, b) => b.avgValue - a.avgValue).slice(0, 5);
  }

  getSessionDuration(sessionLogs) {
    const timestamps = sessionLogs.map(log => new Date(log.timestamp).getTime());
    return Math.max(...timestamps) - Math.min(...timestamps);
  }

  calculateEngagementMetrics(userSessions) {
    const sessions = Object.values(userSessions);
    const durations = sessions.map(logs => this.getSessionDuration(logs));
    const actionCounts = sessions.map(logs => logs.length);
    
    return {
      avgSessionDuration: this.average(durations),
      avgActionsPerSession: this.average(actionCounts),
      bounceRate: ((sessions.filter(logs => logs.length <= 1).length / sessions.length) * 100).toFixed(1) + '%'
    };
  }

  /**
   * Generate and save analysis report
   */
  generateReport() {
    console.log('📝 Generating analysis report...');
    
    const report = {
      generatedAt: new Date().toISOString(),
      analysis: this.analysis,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '../logs/analysis-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    fs.writeFileSync(path.join(__dirname, '../logs/analysis-report.md'), markdownReport);
    
    console.log('✅ Analysis report saved to logs/analysis-report.json and logs/analysis-report.md');
    
    // Display summary in console
    this.displaySummary();
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Error rate recommendations
    const errorRate = parseFloat(this.analysis.errors.errorRate);
    if (errorRate > 5) {
      recommendations.push({
        type: 'error',
        priority: 'high',
        message: `High error rate detected (${errorRate}%). Review error patterns and implement fixes.`
      });
    }
    
    // Performance recommendations
    const perfMetrics = this.analysis.performance.metrics;
    perfMetrics.forEach(metric => {
      if (metric.metric === 'LCP' && parseFloat(metric.p95) > 4000) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: `LCP P95 is ${metric.p95}ms. Optimize largest contentful paint.`
        });
      }
    });
    
    // API recommendations
    const apiErrorRate = parseFloat(this.analysis.apiCalls.errorRate);
    if (apiErrorRate > 10) {
      recommendations.push({
        type: 'api',
        priority: 'high',
        message: `High API error rate (${apiErrorRate}%). Review API reliability.`
      });
    }
    
    // Engagement recommendations
    const bounceRate = parseFloat(this.analysis.userActions.engagementMetrics.bounceRate);
    if (bounceRate > 60) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: `High bounce rate (${bounceRate}%). Improve user engagement.`
      });
    }
    
    return recommendations;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    return `# Frontend Logging Analysis Report

Generated: ${report.generatedAt}

## Summary

- **Total Logs**: ${this.analysis.summary.totalLogs}
- **Time Range**: ${this.analysis.summary.timeRange.duration}
- **Sessions**: ${this.analysis.summary.sessions}
- **Users**: ${this.analysis.summary.users}

## Error Analysis

- **Total Errors**: ${this.analysis.errors.total}
- **Error Rate**: ${this.analysis.errors.errorRate}

### Top Error Types
${this.analysis.errors.byType.slice(0, 5).map(error => 
  `- ${error.type}: ${error.count} (${error.percentage})`
).join('\n')}

## Performance Metrics

${this.analysis.performance.metrics.map(metric => 
  `### ${metric.metric}
- Average: ${metric.average}ms
- P95: ${metric.p95}ms
- Count: ${metric.count}`
).join('\n\n')}

## API Analysis

- **Total API Calls**: ${this.analysis.apiCalls.total}
- **Error Rate**: ${this.analysis.apiCalls.errorRate}

### Top Endpoints
${this.analysis.apiCalls.byEndpoint.slice(0, 5).map(endpoint => 
  `- ${endpoint.endpoint}: ${endpoint.count} calls (${endpoint.errorRate} error rate)`
).join('\n')}

## User Behavior

- **Total Actions**: ${this.analysis.userActions.total}
- **Average Session Duration**: ${Math.round(this.analysis.userActions.engagementMetrics.avgSessionDuration / 1000)}s
- **Bounce Rate**: ${this.analysis.userActions.engagementMetrics.bounceRate}

## Recommendations

${report.recommendations.map(rec => 
  `- **${rec.priority.toUpperCase()}**: ${rec.message}`
).join('\n')}
`;
  }

  /**
   * Display summary in console
   */
  displaySummary() {
    console.log('\n📊 ANALYSIS SUMMARY');
    console.log('==================');
    console.log(`Total Logs: ${this.analysis.summary.totalLogs}`);
    console.log(`Error Rate: ${this.analysis.errors.errorRate}`);
    console.log(`API Error Rate: ${this.analysis.apiCalls.errorRate}`);
    console.log(`Sessions: ${this.analysis.summary.sessions}`);
    console.log(`Users: ${this.analysis.summary.users}`);
    console.log('\n🎯 TOP RECOMMENDATIONS');
    console.log('=====================');
    this.analysis.recommendations?.slice(0, 3).forEach(rec => {
      console.log(`${rec.priority.toUpperCase()}: ${rec.message}`);
    });
  }

  /**
   * Run complete analysis
   */
  run() {
    this.loadLogs();
    this.analyze();
    this.generateReport();
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new LogAnalyzer();
  analyzer.run();
}

module.exports = LogAnalyzer;