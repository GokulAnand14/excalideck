import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Excalideck ErrorBoundary Caught Error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            backgroundColor: "#18181b",
            color: "#f4f4f5",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            padding: "24px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "540px",
              background: "#1f1f23",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 600 }}>
              Something went wrong
            </h2>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#a1a1aa" }}>
              Excalideck encountered an unexpected error during execution.
            </p>

            {this.state.error && (
              <pre
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "11px",
                  color: "#f87171",
                  textAlign: "left",
                  overflowX: "auto",
                  maxHeight: "140px",
                  marginBottom: "20px",
                  fontFamily: "monospace",
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: "#6366f1",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
