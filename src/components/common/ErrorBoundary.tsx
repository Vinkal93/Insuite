import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error in ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lift space-y-5">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Something went wrong
              </h1>
              <p className="text-xs text-muted-foreground">
                An unexpected error occurred. You can retry the current operation or return to the main dashboard.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-left">
                <p className="font-mono text-[11px] text-destructive break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="rounded-xl text-xs font-semibold"
              >
                <RotateCcw className="size-3.5 mr-1.5" /> Try Again
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={this.handleGoHome}
                className="rounded-xl text-xs font-bold shadow-soft"
              >
                <Home className="size-3.5 mr-1.5" /> Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
