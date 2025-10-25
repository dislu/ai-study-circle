import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  BookOpen, 
  Clock,
  Target,
  Award,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async (format = 'json') => {
    try {
      const response = await fetch(`/api/analytics/export?timeframe=${timeframe}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeframe}-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load dashboard data</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Content',
      value: analytics.contentStats.totalContent,
      change: '+12%',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Summaries Created',
      value: analytics.summaryStats.totalSummaries,
      change: '+8%',
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      title: 'Exams Generated',
      value: analytics.examStats.totalExams,
      change: '+15%',
      icon: Target,
      color: 'bg-purple-500'
    },
    {
      title: 'Productivity Score',
      value: analytics.performanceMetrics.productivityScore,
      change: '+5%',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Your AI Study Circle Analytics</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timeframe Selector */}
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Export Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => exportAnalytics('json')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => exportAnalytics('csv')}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change} from last period</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Usage Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedMetric('content')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedMetric === 'content' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setSelectedMetric('summaries')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedMetric === 'summaries' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Summaries
                </button>
                <button
                  onClick={() => setSelectedMetric('exams')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedMetric === 'exams' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Exams
                </button>
              </div>
            </div>
            
            {/* Placeholder for chart - you would integrate with a charting library like Chart.js or Recharts */}
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p>Usage trend chart for {selectedMetric}</p>
                <p className="text-sm">Integrate with charting library</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance</h3>
            
            <div className="space-y-4">
              {/* Productivity Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Productivity</span>
                  <span className="text-sm font-semibold">
                    {analytics.performanceMetrics.productivityScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analytics.performanceMetrics.productivityScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Content Engagement */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Content Engagement</span>
                  <span className="text-sm font-semibold">
                    {analytics.performanceMetrics.contentEngagement}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${analytics.performanceMetrics.contentEngagement}%` }}
                  ></div>
                </div>
              </div>

              {/* Quality Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Average Quality</span>
                  <span className="text-sm font-semibold">
                    {analytics.performanceMetrics.qualityMetrics.avgSummaryRating}/5.0
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(analytics.performanceMetrics.qualityMetrics.avgSummaryRating / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* API Usage */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">API Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-medium">
                    {analytics.userStats.apiUsage?.thisMonth || 0} calls
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-medium text-green-600">
                    {(analytics.userStats.apiUsage?.limit || 1000) - (analytics.userStats.apiUsage?.thisMonth || 0)} calls
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Distribution and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Content Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Content by Category</h3>
            
            <div className="space-y-3">
              {Object.entries(analytics.contentStats.categoryDistribution || {}).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analytics.contentStats.categoryDistribution || {}))) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Most Viewed Content</h3>
            
            <div className="space-y-4">
              {analytics.contentStats.mostViewed?.map((content, index) => (
                <div key={content._id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {content.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {content.usage.views} views • {content.usage.summariesGenerated} summaries
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Activity className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{content.usage.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Insights */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Insights & Recommendations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder for insights - these would come from the analytics insights endpoint */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Productivity Insight</span>
              </div>
              <p className="text-sm text-blue-700">
                Your content creation has increased 15% this month. Keep up the great work!
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Quality Achievement</span>
              </div>
              <p className="text-sm text-green-700">
                Your summaries maintain a 4.2/5 average rating. Excellent quality!
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">Usage Pattern</span>
              </div>
              <p className="text-sm text-orange-700">
                You're most productive on weekday mornings. Schedule important tasks accordingly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;