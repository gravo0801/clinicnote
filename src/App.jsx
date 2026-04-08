import { useState, useEffect } from 'react'
import Login from './components/Login'
import FamilyTab from './components/FamilyTab'
import RxTab from './components/RxTab'
import { useIsMobile } from './components/ui'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState('rx')
  const isMobile = useIsMobile()

  useEffect(() => {
    if (sessionStorage.getItem('cn_auth') === '1') setLoggedIn(true)
  }, [])

  const logout = () => {
    sessionStorage.removeItem('cn_auth')
    setLoggedIn(false)
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  // ── 모바일 레이아웃 ──────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: '#f5f3ef' }}>
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
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f0ede8' }}>
            {[['rx', '💊 처방 노하우'], ['family', '👨‍👩‍👧 가족 건강']].map(([k, l]) => (
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
        {tab === 'family' ? <FamilyTab /> : <RxTab />}
      </div>
    )
  }

  // ── 데스크탑 레이아웃 ────────────────────────────────────
  const NAV_ITEMS = [
    { key: 'rx',     icon: '💊', label: '처방 노하우' },
    { key: 'family', icon: '👨‍👩‍👧', label: '가족 건강' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef' }}>

      {/* ── 사이드바 ── */}
      <div style={{
        width: 220, background: '#fff', borderRight: '1px solid #ece9e3',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid #f0ede8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, background: '#0F6E56', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🩺</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>ClinicNote</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>가족 건강 관리</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV_ITEMS.map(({ key, icon, label }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 10, border: 'none',
                  background: active ? '#f0faf5' : 'transparent',
                  color: active ? '#0F6E56' : '#6b7280',
                  fontSize: 14, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', marginBottom: 4, textAlign: 'left',
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
                {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#0F6E56' }} />}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #f0ede8' }}>
          <button onClick={logout}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: 10,
              border: '1px solid #e5e7eb', background: 'none',
              color: '#9ca3af', fontSize: 13, cursor: 'pointer', textAlign: 'left',
            }}>
            🚪 로그아웃
          </button>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {tab === 'family' ? <FamilyTab /> : <RxTab />}
      </div>
    </div>
  )
}
