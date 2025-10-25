/**
 * Example Component with Frontend Logging
 * Demonstrates how to use logging hooks in components
 */

import React, { useEffect, useState } from 'react';
import { useLogging, useComponentTracking } from './FrontendLoggingProvider';

const ExampleComponent = () => {
  const { log, warn, error, trackAction } = useLogging();
  const { trackRender, trackUserAction } = useComponentTracking('ExampleComponent');
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Track component mount
    log('ExampleComponent mounted', { initialCount: count });
    trackRender();
  }, []);

  useEffect(() => {
    // Track state changes
    if (count > 0) {
      log('Count updated', { newCount: count });
    }
  }, [count]);

  const handleClick = () => {
    trackUserAction('button_click', { buttonType: 'increment', currentCount: count });
    setCount(prev => prev + 1);
    
    if (count >= 10) {
      warn('High count reached', { count: count + 1 });
    }
  };

  const handleError = () => {
    try {
      throw new Error('This is a test error');
    } catch (err) {
      error('Test error occurred', err, { triggeredBy: 'user_action' });
    }
  };

  const handleApiCall = async () => {
    trackUserAction('api_call_initiated', { endpoint: '/api/test' });
    
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      log('API call successful', { response: data });
    } catch (err) {
      error('API call failed', err, { endpoint: '/api/test' });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Logging Example</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-gray-700">Count: {count}</p>
          <button
            onClick={handleClick}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment (Logged)
          </button>
        </div>
        
        <button
          onClick={handleError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Trigger Error (Logged)
        </button>
        
        <button
          onClick={handleApiCall}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          API Call (Logged)
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Check the browser console and network tab to see logs in action.
      </div>
    </div>
  );
};

export default ExampleComponent;
