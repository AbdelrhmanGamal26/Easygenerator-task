import { Component, type ErrorInfo, type ReactNode } from 'react';
import CustomButton from '@/components/shared/CustomButton';

/** Catches render errors (and failed lazy chunk loads) so the app never shows a blank page. */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center"
        role="alert"
      >
        <h1 className="text-xl font-bold sm:text-2xl">Something went wrong</h1>
        <CustomButton
          type="button"
          className="mt-0 w-auto px-4 py-2"
          onClick={() => window.location.reload()}
        >
          Reload the page
        </CustomButton>
      </div>
    );
  }
}

export default ErrorBoundary;
