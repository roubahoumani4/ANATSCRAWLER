import React, { Component } from "react";

// Error boundary component to catch rendering errors
class ScanDetailsErrorBoundary extends Component<{
  onReset: () => void;
  children: React.ReactNode;
}> {
  state = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "[ScanDetails] Error boundary caught error:",
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <div className="text-red-500 mb-4">An unexpected error occurred</div>
          <div className="text-gray-400 text-sm mb-4">
            The scan details page encountered an error while rendering. This
            might be due to corrupt or unexpected data formats.
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) {
                this.props.onReset();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reset and Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ScanDetailsErrorBoundary;
