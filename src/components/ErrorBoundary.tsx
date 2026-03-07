import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-lg text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h1 className="text-xl font-bold font-mono uppercase tracking-wider">SYSTEM MALFUNCTION</h1>
            <p className="text-sm text-muted-foreground">
              {this.props.fallbackMessage || "An unexpected condition has been encountered. The error has been logged automatically."}
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-muted/50 p-4 rounded-lg overflow-auto max-h-48 border border-border">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack?.split("\n").slice(0, 8).join("\n")}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                RETRY
              </Button>
              <Button onClick={() => window.location.href = "/"}>
                RETURN TO DASHBOARD
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
