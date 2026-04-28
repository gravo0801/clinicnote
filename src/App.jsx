import { useState, useEffect } from 'react'
import Login from './components/Login'
import FamilyTab from './components/FamilyTab'
import RxTab from './components/RxTab'
import DiseaseNoteTab from './components/DiseaseNoteTab'
import BackupTab from './components/BackupTab'
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

  const renderTab = () => {
    if (tab === 'family') return <FamilyTab />
    if (tab === 'notes') return <DiseaseNoteTab />
    if (tab === 'backup') return <BackupTab />
    return <RxTab />
  }

  // Mobile
  if (isMobile) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: '#f5f3ef' }}>
        <div className="bg-white sticky top-0 z-40 px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid #ece9e3' }}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: '#0F6E56' }}>CN</div>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>ClinicNote</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setTab('backup')}
                style={{ border: '1px solid #e5e7eb', background: tab === 'backup' ? '#f0faf5' : 'none', color: tab === 'backup' ? '#0F6E56' : '#9ca3af', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: tab === 'backup' ? 700 : 400 }}>
                백업
              </button>
              <button onClick={logout}
                style={{ border: '1px solid #e5e7eb', background: 'none', color: '#9ca3af', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                로그아웃
              </button>
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f0ede8' }}>
            {[['rx', '처방'], ['notes', '노트'], ['family', '가족']].map(([k, l]) => (
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
        {renderTab()}
      </div>
    )
  }

  // Desktop
  const NAV_ITEMS = [
    { key: 'rx',     icon: 'Rx',  label: '처방 노하우' },
    { key: 'notes',  icon: 'N',   label: '질환 노트' },
    { key: 'family', icon: 'F',   label: '가족 건강' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f3ef' }}>
      <div style={{
        width: 220, background: '#fff', borderRight: '1px solid #ece9e3',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid #f0ede8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, background: '#0F6E56', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 800 }}>CN</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>ClinicNote</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>가족 건강 관리</div>
            </div>
          </div>
        </div>

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
                }}>
                <span style={{ width: 24, height: 24, background: active ? '#0F6E56' : '#f0ede8', color: active ? '#fff' : '#9ca3af', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{icon}</span>
                {label}
                {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#0F6E56' }} />}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid #f0ede8' }}>
          <button onClick={() => setTab('backup')}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: tab === 'backup' ? '#f0faf5' : 'none',
              color: tab === 'backup' ? '#0F6E56' : '#9ca3af',
              fontSize: 13, cursor: 'pointer', textAlign: 'left',
              fontWeight: tab === 'backup' ? 700 : 400, marginBottom: 6,
            }}>
            [B] 백업 / 복원
          </button>
          <button onClick={logout}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: 10,
              border: '1px solid #e5e7eb', background: 'none',
              color: '#9ca3af', fontSize: 13, cursor: 'pointer', textAlign: 'left',
            }}>
            [Q] 로그아웃
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {renderTab()}
      </div>
    </div>
  )
}
