"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private recover = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-2xl font-black text-white shadow-lg">
                !
              </div>
              <CardTitle className="mt-3 text-2xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                DevHeaven hit an unexpected error. You can try recovering the page without losing your session.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error?.message && (
                <pre className="max-h-32 overflow-auto rounded-xl border border-border bg-muted p-3 text-left text-xs text-muted-foreground">
                  {this.state.error.message}
                </pre>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={this.recover} className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90">
                  Try again
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Reload page
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
