import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Unknown app error",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MyConnect crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-5">
          <div className="max-w-sm w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger-text)] flex items-center justify-center mx-auto mb-3 font-bold">
              !
            </div>

            <h1 className="text-[var(--color-text)] text-lg font-bold">
              MyConnect failed to load
            </h1>

            <p className="text-[var(--color-muted)] text-sm mt-2">
              The app hit a browser error instead of showing a blank white
              screen.
            </p>

            <pre className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 text-left text-[11px] text-[var(--color-muted)] mt-4 whitespace-pre-wrap break-words">
              {this.state.message}
            </pre>

            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.removeItem("appTheme");
                  window.localStorage.removeItem("appLanguage");
                } catch {
                  // Ignore storage errors.
                }

                window.location.href = "/";
              }}
              className="w-full mt-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
            >
              Reset app settings
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
