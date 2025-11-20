import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  autoRetryCountdown: number;
}

/**
 * Error Boundary component to catch React errors and display a fallback UI
 * Prevents the entire app from crashing when an error occurs
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    autoRetryCountdown: 5,
  };

  private countdownInterval?: NodeJS.Timeout;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, retryCount: 0, autoRetryCountdown: 5 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to console with structured format
    console.group('🔴 Error Boundary Caught Error');
    console.error('Error:', error.message);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    this.setState({
      error,
      errorInfo,
    });

    // Start auto-retry countdown for transient errors
    if (this.state.retryCount < 2) {
      this.startAutoRetryCountdown();
    }
  }

  private startAutoRetryCountdown = () => {
    this.countdownInterval = setInterval(() => {
      this.setState((prev) => {
        if (prev.autoRetryCountdown <= 1) {
          this.handleAutoRetry();
          return prev;
        }
        return { ...prev, autoRetryCountdown: prev.autoRetryCountdown - 1 };
      });
    }, 1000);
  };

  private handleAutoRetry = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
      autoRetryCountdown: 5,
    }));
  };

  private handleManualRetry = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      autoRetryCountdown: 5,
    });
  };

  private handleReset = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0, autoRetryCountdown: 5 });
    window.location.href = '/';
  };

  public componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Si è verificato un errore</CardTitle>
                  <CardDescription>
                    Qualcosa è andato storto. Prova a ricaricare la pagina.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.retryCount < 2 && this.state.autoRetryCountdown > 0 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary">
                    Tentativo automatico di ripristino tra {this.state.autoRetryCountdown} secondi...
                  </p>
                </div>
              )}
              
              {this.state.error && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-foreground">Messaggio di errore:</p>
                  <p className="font-mono text-sm text-destructive">
                    {this.state.error.message || this.state.error.toString()}
                  </p>
                </div>
              )}
              
              {this.state.retryCount > 0 && (
                <div className="p-3 bg-muted/50 rounded border text-sm text-muted-foreground">
                  Tentativi di ripristino: {this.state.retryCount}
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="p-4 bg-muted rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Dettagli tecnici (solo in sviluppo)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2 flex-wrap">
                <Button onClick={this.handleManualRetry} className="flex-1">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Riprova Ora
                </Button>
                <Button variant="outline" onClick={this.handleReset} className="flex-1">
                  Torna alla Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
