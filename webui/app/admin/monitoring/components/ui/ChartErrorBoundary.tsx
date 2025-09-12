'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChartErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ChartErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onRetry?: () => void
}

class ChartErrorBoundary extends React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-3" />
          <p className="text-lg font-medium mb-2">Chart Error</p>
          <p className="text-sm text-center mb-4 max-w-md">
            Something went wrong while loading this chart. This error has been logged.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="h-8"
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ChartErrorBoundary