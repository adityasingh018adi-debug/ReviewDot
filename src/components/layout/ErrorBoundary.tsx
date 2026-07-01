import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Catches render errors anywhere in the tree and shows a recoverable screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-ink-950 p-6 text-mist-100">
        <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center shadow-float">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-glow/15 text-rose-glow">
            <AlertTriangle size={26} />
          </div>
          <h1 className="font-display mt-5 text-xl font-bold text-mist-50">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-mist-400">
            An unexpected error interrupted the workspace. Your layout and settings are safe — reloading
            usually fixes it.
          </p>
          <pre className="mt-4 max-h-24 overflow-auto rounded-xl bg-white/5 p-3 text-left text-[11px] text-mist-400">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-pulse-500 to-aura-500 px-5 py-2.5 text-sm font-medium text-pure shadow-glow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <RefreshCw size={15} /> Reload workspace
          </button>
        </div>
      </div>
    )
  }
}
