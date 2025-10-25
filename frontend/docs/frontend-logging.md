# Frontend Logging System Documentation

## Overview

The Frontend Logging System provides comprehensive client-side logging for React/Next.js applications with the following features:

- **Structured Logging**: JSON-formatted logs with metadata
- **Performance Monitoring**: Web Vitals and custom metrics
- **User Action Tracking**: Clicks, navigation, form interactions
- **Error Boundaries**: React error catching and logging
- **API Logging**: HTTP request/response monitoring
- **Batch Processing**: Efficient log queue management

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Update your `.env.local` file:

```env
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENABLE_LOGGING=true
```

### 3. Setup Provider

Wrap your app with the logging provider:

```jsx
import FrontendLoggingProvider from './components/FrontendLoggingProvider';
import { frontendLoggingConfig } from './config/loggingConfig';

function App() {
  return (
    <FrontendLoggingProvider config={frontendLoggingConfig}>
      {/* Your app components */}
    </FrontendLoggingProvider>
  );
}
```

### 4. Use Logging Hooks

```jsx
import { useLogging, useComponentTracking } from './components/FrontendLoggingProvider';

const MyComponent = () => {
  const { log, error, trackAction } = useLogging();
  const { trackUserAction } = useComponentTracking('MyComponent');

  const handleClick = () => {
    trackUserAction('button_click', { buttonId: 'submit' });
    log('Button clicked', { timestamp: Date.now() });
  };

  return <button onClick={handleClick}>Click me</button>;
};
```

## API Reference

### useLogging Hook

- `log(message, data, context)` - Info level logging
- `warn(message, data, context)` - Warning level logging
- `error(message, error, context)` - Error level logging
- `debug(message, data, context)` - Debug level logging
- `trackAction(action, data)` - User action tracking
- `setUser(userId, userData)` - Set user context
- `flush()` - Manually flush log queue

### useComponentTracking Hook

- `trackRender()` - Track component render
- `trackUserAction(action, data)` - Track user action with component context

### useApiTracking Hook

- `trackApiCall(apiCall)` - Wrap and track API calls

## Configuration Options

### Logger Configuration

```javascript
{
  enabled: true,
  logLevel: 'info', // debug, info, warn, error
  apiEndpoint: 'http://localhost:5000',
  batchSize: 10,
  flushInterval: 30000,
  maxQueueSize: 100,
  enableConsole: false,
  enableStorage: true
}
```

### Performance Monitoring

```javascript
{
  enabled: true,
  trackWebVitals: true,
  trackNavigation: true,
  trackResources: true,
  trackLongTasks: true,
  trackMemory: true
}
```

### User Tracking

```javascript
{
  enabled: true,
  trackClicks: true,
  trackFormSubmissions: true,
  trackNavigation: true,
  trackScrolling: true,
  trackFocus: true,
  debounceDelay: 100,
  idleTimeout: 300000
}
```

## Best Practices

### 1. Log Levels

- **Debug**: Development information, verbose logging
- **Info**: General application flow, user actions
- **Warn**: Unexpected situations that don't break functionality
- **Error**: Errors that need attention

### 2. Privacy

- Never log sensitive information (passwords, tokens, personal data)
- Use data masking for sensitive fields
- Be mindful of GDPR/privacy regulations

### 3. Performance

- Use appropriate batch sizes and flush intervals
- Avoid logging in tight loops
- Monitor log queue size

### 4. Error Handling

- Always wrap components with Error Boundaries
- Log errors with sufficient context
- Provide fallback UI for error states

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check API endpoint configuration
2. **High memory usage**: Reduce batch size or flush interval
3. **Missing logs**: Verify log level configuration
4. **Performance impact**: Disable verbose tracking in production

### Debugging

Enable debug mode:

```env
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_LOG_TO_CONSOLE=true
```

## Examples

See the `ExampleComponent` and `LoggingDashboard` components for usage examples.

## Integration with Backend

Logs are sent to the backend `/api/logs` endpoint. Ensure your backend Winston logger is properly configured to receive and process frontend logs.

## Testing

Run tests with:

```bash
npm test
npm run test:coverage
```

## Scripts

- `npm run logs:analyze` - Analyze log patterns
- `npm run logs:clean` - Clean old logs
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
