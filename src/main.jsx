import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// 인라인 스플래시 제거
const removeInitialSplash = () => {
  const splash = document.getElementById('initial-splash')
  if (splash) {
    splash.style.opacity = '0'
    splash.style.transition = 'opacity 0.3s ease-out'
    setTimeout(() => splash.remove(), 300)
  }
}

// React 앱이 마운트되면 인라인 스플래시 제거
setTimeout(removeInitialSplash, 100)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)




