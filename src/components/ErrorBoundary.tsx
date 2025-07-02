import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You could also log the error to an error reporting service
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-full text-white p-4">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
          <p className="text-lg text-gray-400">We&apos;re sorry for the inconvenience. Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;