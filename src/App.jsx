import { useState, useEffect } from 'react'
import Login from './components/Login'
import FamilyTab from './components/FamilyTab'
import RxTab from './components/RxTab'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState('family')

  // 세션 유지
  useEffect(() => {
    if (sessionStorage.getItem('cn_auth') === '1') setLoggedIn(true)
  }, [])

  const logout = () => {
    sessionStorage.removeItem('cn_auth')
    setLoggedIn(false)
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: '#f5f3ef' }}>
      {/* ── Header ── */}
      <div className="bg-white sticky top-0 z-40 px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid #ece9e3' }}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: '#0F6E56' }}>🩺</div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>ClinicNote</span>
          </div>
          <button onClick={logout}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ border: '1px solid #e5e7eb', background: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            로그아웃
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f0ede8' }}>
          {[['family', '👨‍👩‍👧 가족 건강'], ['rx', '💊 처방 노하우']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="flex-1 py-2 rounded-lg text-sm transition-all"
              style={{
                border: 'none', cursor: 'pointer',
                background: tab === k ? '#fff' : 'transparent',
                color: tab === k ? '#0F6E56' : '#9ca3af',
                fontWeight: tab === k ? 700 : 400,
                boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      {tab === 'family' ? <FamilyTab /> : <RxTab />}
    </div>
  )
}
