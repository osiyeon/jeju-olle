import { Component } from 'react'
import { exportAll } from '../lib/store'
import { localISO } from '../lib/geo'

// 화면을 그리다 오류가 나면 흰 화면 대신, 새로고침과 백업 받기를 할 수 있게
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error(error, info)
  }
  backup = async () => {
    try {
      const data = await exportAll()
      const file = new File([JSON.stringify(data)], `olle-backup-${localISO()}.json`, { type: 'application/json' })
      if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file] }).catch(() => {})
      const a = document.createElement('a')
      a.href = URL.createObjectURL(file)
      a.download = file.name
      a.click()
    } catch {
      alert('백업을 만들지 못했어요.')
    }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 12 }}>
        <h2>앗, 문제가 생겼어요</h2>
        <p className="hint">기록은 기기에 그대로 있어요. 새로고침해 보고, 계속 이러면 백업을 받아 두세요.</p>
        <div className="row" style={{ width: '100%', maxWidth: 360 }}>
          <button className="btn primary" onClick={() => location.reload()}>새로고침</button>
          <button className="btn" onClick={this.backup}>백업 받기</button>
        </div>
      </div>
    )
  }
}
