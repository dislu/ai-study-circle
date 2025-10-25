import { render, screen, fireEvent } from '@testing-library/react';
import FrontendLoggingProvider from '../src/components/FrontendLoggingProvider';
import ExampleComponent from '../src/components/ExampleComponent';
import { frontendLoggingConfig } from '../src/config/loggingConfig';

// Mock fetch
global.fetch = jest.fn();

const renderWithLogging = (component) => {
  return render(
    <FrontendLoggingProvider config={frontendLoggingConfig}>
      {component}
    </FrontendLoggingProvider>
  );
};

describe('Frontend Logging System', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders ExampleComponent with logging', () => {
    renderWithLogging(<ExampleComponent />);
    expect(screen.getByText('Logging Example')).toBeInTheDocument();
  });

  test('tracks user actions when button is clicked', () => {
    renderWithLogging(<ExampleComponent />);
    
    const button = screen.getByText('Increment (Logged)');
    fireEvent.click(button);
    
    // Verify that the count updated
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  test('handles errors gracefully', () => {
    renderWithLogging(<ExampleComponent />);
    
    const errorButton = screen.getByText('Trigger Error (Logged)');
    fireEvent.click(errorButton);
    
    // Component should still be rendered after error
    expect(screen.getByText('Logging Example')).toBeInTheDocument();
  });
});
