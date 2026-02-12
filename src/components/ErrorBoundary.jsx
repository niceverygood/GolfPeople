import React from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * 에러 바운더리 - 런타임 에러 시 빈 화면 대신 에러 UI 표시
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-gp-black flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-6">⛳</div>
          <h1 className="text-xl font-bold text-white mb-2">
            앗, 문제가 발생했어요
          </h1>
          <p className="text-sm text-gp-text-secondary mb-8 max-w-xs">
            일시적인 오류가 발생했습니다. 다시 시도하거나 홈으로 이동해주세요.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-5 py-3 bg-gp-green text-white font-medium rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-5 py-3 bg-gp-card text-white font-medium rounded-xl"
            >
              홈으로
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
