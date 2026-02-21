import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
          <h1 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-4 text-center max-w-md">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/events';
            }}
          >
            Go to Events
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
