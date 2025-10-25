/**
 * Logging Dashboard Component
 * Shows current logging status and metrics
 */

import React, { useState, useEffect } from 'react';
import { useLogging } from './FrontendLoggingProvider';

const LoggingDashboard = () => {
  const { 
    isInitialized, 
    getMetrics, 
    getSessionSummary, 
    flush,
    logger,
    performanceMonitor,
    userTracker
  } = useLogging();
  
  const [metrics, setMetrics] = useState([]);
  const [sessionSummary, setSessionSummary] = useState({});
  const [logQueue, setLogQueue] = useState(0);

  useEffect(() => {
    if (isInitialized) {
      const updateData = () => {
        setMetrics(getMetrics() || []);
        setSessionSummary(getSessionSummary() || {});
        setLogQueue(logger?.logQueue?.length || 0);
      };

      updateData();
      const interval = setInterval(updateData, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  const handleFlush = async () => {
    if (flush) {
      await flush();
      setLogQueue(0);
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-yellow-800">Logging system is initializing...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Logging Dashboard</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded">
          <h4 className="font-medium text-blue-900">System Status</h4>
          <p className="text-sm text-blue-700">
            Status: {isInitialized ? 'Active' : 'Inactive'}
          </p>
          <p className="text-sm text-blue-700">
            Queue: {logQueue} logs
          </p>
        </div>
        
        <div className="p-4 bg-green-50 rounded">
          <h4 className="font-medium text-green-900">Session Info</h4>
          <p className="text-sm text-green-700">
            Actions: {sessionSummary.actions || 0}
          </p>
          <p className="text-sm text-green-700">
            Time: {Math.round((sessionSummary.timeOnPage || 0) / 1000)}s
          </p>
        </div>
        
        <div className="p-4 bg-purple-50 rounded">
          <h4 className="font-medium text-purple-900">Performance</h4>
          <p className="text-sm text-purple-700">
            Metrics: {metrics.length}
          </p>
          <p className="text-sm text-purple-700">
            Scroll: {Math.round(sessionSummary.scrollDepth || 0)}%
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleFlush}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={logQueue === 0}
        >
          Flush Logs ({logQueue})
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Recent Performance Metrics</h4>
          <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-sm">
            {metrics.slice(-5).map((metric, index) => (
              <div key={index} className="text-gray-700">
                {metric.name}: {metric.value}ms
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingDashboard;
