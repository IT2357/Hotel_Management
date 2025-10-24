import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import FoodButton from './FoodButton';

class FoodErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to backend
    this.logErrorToBackend(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  logErrorToBackend = async (error, errorInfo) => {
    try {
      // Send error to backend for logging
      await fetch('/api/food/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          retryCount: this.state.retryCount
        })
      });
    } catch (logError) {
      console.error('Failed to log error to backend:', logError);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened while loading the food page. 
              Don't worry, our team has been notified and we're working to fix it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-red-700 mt-2 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="space-y-3">
              <FoodButton
                onClick={this.handleRetry}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </FoodButton>
              
              <div className="flex gap-3">
                <FoodButton
                  onClick={this.handleGoBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </FoodButton>
                
                <FoodButton
                  onClick={this.handleGoHome}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </FoodButton>
              </div>
            </div>

            {this.state.retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Retry attempt: {this.state.retryCount}
              </p>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700">
                If this problem persists, please contact our support team at{' '}
                <a href="mailto:support@jaffnahotel.com" className="underline">
                  support@jaffnahotel.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FoodErrorBoundary;
