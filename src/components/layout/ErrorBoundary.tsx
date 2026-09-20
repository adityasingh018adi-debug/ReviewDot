import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ReviewDot crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-6">
        <div className="max-w-md text-center">
          <LogoMark size={44} className="mx-auto" />
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">Something went wrong</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            The page hit an unexpected error. Reloading usually clears it.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-line bg-raised p-3 text-left text-[11px] text-muted">
            {this.state.error.message}
          </pre>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload ReviewDot
          </Button>
        </div>
      </div>
    )
  }
}
