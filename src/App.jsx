import { useState, useEffect } from 'react'
import Login from './components/Login'
import FamilyTab from './components/FamilyTab'
import RxTab from './components/RxTab'
import DiseaseNoteTab from './components/DiseaseNoteTab'
import { useIsMobile } from './components/ui'

/* ── SVG Icon helper ── */
const ICON_PATHS = {
  stethoscope: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
  pill:        '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  bookOpen:    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  users:       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  logOut:      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
}

function NavIcon({ name, size = 17, color = 'currentColor', strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
    />
  )
}

const NAV_ITEMS = [
  { key: 'rx',     icon: 'pill',      label: '처방 노하우' },
  { key: 'notes',  icon: 'bookOpen',  label: '질환 노트'  },
  { key: 'family', icon: 'users',     label: '가족 건강'  },
]

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab]           = useState('rx')
  const isMobile                = useIsMobile()

  useEffect(() => {
    if (sessionStorage.getItem('cn_auth') === '1') setLoggedIn(true)
  }, [])

  const logout = () => { sessionStorage.removeItem('cn_auth'); setLoggedIn(false) }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  /* ── Mobile ── */
  if (isMobile) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 40, padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,192,127,0.35)' }}>
                <NavIcon name="stethoscope" size={17} color="#fff" strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>ClinicNote</span>
            </div>
            <button onClick={logout} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              로그아웃
            </button>
          </div>
          <div style={{ display: 'flex', gap: 2, padding: '3px', borderRadius: 11, background: 'var(--bg)' }}>
            {NAV_ITEMS.map(({ key, icon, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: tab === key ? 'var(--surface)' : 'transparent',
                color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 12.5, fontWeight: tab === key ? 700 : 400,
                boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                whiteSpace: 'nowrap',
              }}>
                <NavIcon name={icon} size={13} color={tab === key ? 'var(--accent)' : 'var(--text-muted)'} />
                {label}
              </button>
            ))}
          </div>
        </div>
        {tab === 'family' ? <FamilyTab /> : tab === 'notes' ? <DiseaseNoteTab /> : <RxTab />}
      </div>
    )
  }

  /* ── Desktop ── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Sidebar */}
      <div style={{
        width: 220, background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-b)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '26px 20px 20px', borderBottom: '1px solid var(--sidebar-b)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg, var(--accent) 0%, #00A06A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(0,192,127,0.4)',
            }}>
              <NavIcon name="stethoscope" size={19} color="#fff" strokeWidth={1.75} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sidebar-text)', letterSpacing: '-0.4px' }}>ClinicNote</div>
              <div style={{ fontSize: 11, color: 'var(--sidebar-muted)', marginTop: 1 }}>가족 건강 관리</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ key, icon, label }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, border: 'none',
                background: active ? 'rgba(0,192,127,0.15)' : 'transparent',
                color: active ? '#fff' : 'var(--sidebar-text)',
                fontSize: 13.5, fontWeight: active ? 700 : 400,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.12s', whiteSpace: 'nowrap',
              }}>
                <NavIcon name={icon} size={16} color={active ? 'var(--accent)' : 'var(--sidebar-muted)'} strokeWidth={active ? 2 : 1.75} />
                {label}
                {active && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 3px rgba(0,192,127,0.25)' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '14px 10px 20px', borderTop: '1px solid var(--sidebar-b)' }}>
          <button onClick={logout} style={{
            width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none',
            background: 'transparent', color: 'var(--sidebar-muted)',
            fontSize: 13, cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}>
            <NavIcon name="logOut" size={15} color="var(--sidebar-muted)" />
            로그아웃
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {tab === 'family' ? <FamilyTab /> : tab === 'notes' ? <DiseaseNoteTab /> : <RxTab />}
      </div>
    </div>
  )
}
