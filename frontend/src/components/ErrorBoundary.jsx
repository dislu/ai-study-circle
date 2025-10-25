/**
 * Error Boundary Component - Catches React errors and logs them
 * Provides fallback UI and error recovery mechanisms
 */

import React, { Component } from 'react';
import { getLogger } from '../lib/Logger';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };

    this.logger = getLogger();
    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = this.logger.error('React Error Boundary caught error', error, {
      category: 'react_error',
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      props: this.props,
      retryCount: this.state.retryCount
    });

    this.setState({
      error,
      errorInfo,
      errorId,
      hasError: true
    });

    // Report to external error tracking services if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.logger.info('Error boundary retry attempted', {
        retryCount: this.state.retryCount + 1,
        maxRetries: this.maxRetries,
        originalErrorId: this.state.errorId
      }, { category: 'error_recovery' });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  handleReload = () => {
    this.logger.info('Error boundary page reload triggered', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount
    }, { category: 'error_recovery' });

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI from props
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo,
          this.handleRetry,
          this.handleReload,
          this.state.retryCount < this.maxRetries
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.868-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="mt-6 text-xl font-semibold text-gray-900">
                  Oops! Something went wrong
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {this.props.errorMessage || "We're sorry, but something unexpected happened."}
                </p>
                
                {/* Error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Show Error Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                      <div className="font-semibold">Error:</div>
                      <div className="mb-2">{this.state.error.toString()}</div>
                      <div className="font-semibold">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  </details>
                )}

                <div className="mt-6 space-y-3">
                  {this.state.retryCount < this.maxRetries && (
                    <button
                      onClick={this.handleRetry}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Try Again ({this.maxRetries - this.state.retryCount} attempts remaining)
                    </button>
                  )}
                  
                  <button
                    onClick={this.handleReload}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reload Page
                  </button>

                  {this.props.onGoHome && (
                    <button
                      onClick={this.props.onGoHome}
                      className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Go to Home
                    </button>
                  )}
                </div>

                {this.state.errorId && (
                  <p className="mt-4 text-xs text-gray-400">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (WrappedComponent, errorBoundaryProps = {}) => {
  return class WithErrorBoundary extends Component {
    render() {
      return (
        <ErrorBoundary {...errorBoundaryProps}>
          <WrappedComponent {...this.props} />
        </ErrorBoundary>
      );
    }
  };
};

/**
 * Hook to manually trigger error boundary
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    const logger = getLogger();
    logger.error('Manual error capture', error, { category: 'manual_error' });
    setError(error);
  }, []);

  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

/**
 * Async error boundary for handling promise rejections
 */
export class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    this.logger = getLogger();
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.logger.error('Async Error Boundary caught error', error, {
      category: 'async_error',
      componentStack: errorInfo.componentStack,
      errorBoundary: 'AsyncErrorBoundary'
    });
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event) => {
    this.logger.error('Unhandled promise rejection', event.reason, {
      category: 'unhandled_rejection',
      promise: event.promise
    });

    // Prevent the default handling (console error)
    if (this.props.preventDefault) {
      event.preventDefault();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorBoundary {...this.props} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;