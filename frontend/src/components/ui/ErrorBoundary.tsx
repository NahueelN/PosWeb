import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Called when an unexpected render error is caught. The ErrorBoundary does NOT know about notifications, dialogs, or any UI behavior — the parent decides what to do. */
  onUnexpectedError?: (error: Error) => void
  /** Optional fallback UI when an error occurs. Defaults to null (nothing rendered). */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Generic error boundary that catches render errors in its children.
 *
 * It is intentionally decoupled from any UI behavior:
 * - It does NOT know about notifications, dialogs, closing popups, logging, or Sentry.
 * - It only reports the error via onUnexpectedError.
 * - The parent (consumer) decides what to do: show a notification, close a dialog, log, retry, etc.
 *
 * This allows the ErrorBoundary to remain stable while the error handling UX evolves.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onUnexpectedError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
