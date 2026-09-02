import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { captureException } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary, April 2026 handoff spec:
 * crimson bracket corners + SYSTEM FAULT header + mono stack trace.
 */
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
    // No-op when VITE_SENTRY_DSN is unset.
    captureException(error, {
      contexts: {
        react: { componentStack: info.componentStack ?? undefined },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sf-void flex items-center justify-center p-8">
          <div className="max-w-xl w-full space-y-6">
            {/* Crimson bracket panel */}
            <div
              className="relative border border-sf-crimson/40 bg-sf-surface/90 p-8"
              style={{ boxShadow: "0 0 20px rgba(255,51,102,0.15)" }}
            >
              {/* Corner brackets (crimson variant of .sf-bracket) */}
              <span
                className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t border-l border-sf-crimson"
                aria-hidden
              />
              <span
                className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b border-r border-sf-crimson"
                aria-hidden
              />

              <p className="font-mono text-[12px] tracking-[0.18em] text-sf-crimson uppercase mb-3">
                // STATUS: FAULT
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-light uppercase tracking-sf-title text-t1 mb-4">
                SYSTEM FAULT
              </h1>
              <p className="font-mono text-[12px] tracking-[0.18em] uppercase text-t3 leading-relaxed mb-6">
                {this.props.fallbackMessage ||
                  "AN UNEXPECTED CONDITION HAS BEEN ENCOUNTERED. INCIDENT LOGGED AUTOMATICALLY."}
              </p>

              {this.state.error && (
                <pre className="font-mono text-[12px] text-left bg-sf-void/60 text-t4 p-4 rounded-none overflow-auto max-h-48 border border-sf-line sf-sb leading-relaxed">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack?.split("\n").slice(0, 8).join("\n")}
                </pre>
              )}

              <div className="flex gap-3 justify-start mt-6">
                <Button
                  variant="sf-ghost"
                  size="sf-md"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  RETRY
                </Button>
                <Button
                  variant="sf-primary"
                  size="sf-md"
                  onClick={() => (window.location.href = "/")}
                >
                  RETURN TO BRIDGE
                </Button>
              </div>
            </div>

            <p className="font-mono text-[12px] tracking-[0.18em] text-t4 uppercase text-center">
              39.87°N · 104.97°W · INCIDENT-{Date.now().toString(36).toUpperCase().slice(-6)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
