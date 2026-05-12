import { useState, useEffect } from 'react'
import Login from './components/Login'
import AdultDailyTab from './components/AdultDailyTab'
import FamilyTab from './components/FamilyTab'
import RxTab from './components/RxTab'
import DiseaseNoteTab from './components/DiseaseNoteTab'
import UltrasoundTab from './components/UltrasoundTab'
import OpsTab from './components/OpsTab'
import CautionTab from './components/CautionTab'
import BackupTab from './components/BackupTab'
import { useIsMobile } from './components/ui'

const ICON_PATHS = {
  steth:    '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
  pill:     '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  book:     '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  users:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  out:      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  wave:     '<path d="M2 12c2 0 2-4 4-4s2 8 4 8 2-12 4-12 2 16 4 16 2-4 4-4"/>',
  briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  cloud:    '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 1 0 6 14"/><path d="M12 12v9"/><polyline points="8 17 12 21 16 17"/>',
  alert:    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
}

function Ic({ name, s = 16, c = 'currentColor', w = 1.75 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
    />
  )
}

const NAV = [
  { key: 'adult',  icon: 'book',      label: '성인 Daily', short: '성인' },
  { key: 'rx',      icon: 'pill',      label: '처방 노하우', short: '처방' },
  { key: 'caution', icon: 'alert',     label: '주의 처방',   short: '주의' },
  { key: 'notes',   icon: 'book',      label: '질환 노트',   short: '질환' },
  { key: 'family', icon: 'users',     label: '가족 건강',   short: '가족' },
  { key: 'us',     icon: 'wave',      label: '초음파',      short: '초음파' },
  { key: 'ops',    icon: 'briefcase', label: '운영 노하우', short: '운영' },
  { key: 'backup', icon: 'cloud',     label: '백업/복원',   short: '백업' },
]

function ActiveTab({ tab }) {
  if (tab === 'adult') return <AdultDailyTab />
  if (tab === 'family') return <FamilyTab />
  if (tab === 'notes') return <DiseaseNoteTab />
  if (tab === 'caution') return <CautionTab />
  if (tab === 'us') return <UltrasoundTab />
  if (tab === 'ops') return <OpsTab />
  if (tab === 'backup') return <BackupTab />
  return <RxTab />
}

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

  if (isMobile) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', minHeight: '100vh', background: 'var(--cream)' }}>
        <div style={{ background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 40, padding: '14px 16px 12px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic name="steth" s={16} c="#fff" w={2} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>ClinicNote</span>
            </div>
            <button onClick={logout} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'none', color: 'var(--ink-3)', fontSize: 12, cursor: 'pointer' }}>로그아웃</button>
          </div>
          <div style={{
            display: 'flex', gap: 2, padding: 3, borderRadius: 10, background: 'var(--cream-2)',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
          }} className="cn-hide-scroll">
            {NAV.map(({ key, icon, short }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flexShrink: 0, padding: '8px 12px', borderRadius: 7, border: 'none',
                background: tab === key ? 'var(--paper)' : 'transparent',
                color: tab === key ? 'var(--ink)' : 'var(--ink-3)',
                fontSize: 12.5, fontWeight: tab === key ? 600 : 500,
                boxShadow: tab === key ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}>
                <Ic name={icon} s={13} c={tab === key ? 'var(--accent)' : 'var(--ink-3)'} />
                {short}
              </button>
            ))}
          </div>
          <style>{`.cn-hide-scroll::-webkit-scrollbar { display: none; }`}</style>
        </div>
        <ActiveTab tab={tab} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <aside style={{
        width: 236, flexShrink: 0, background: 'var(--cream)',
        borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="steth" s={16} c="#fff" w={2} />
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>ClinicNote</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 1 }}>가족 건강 관리</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '14px 12px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.6px', padding: '6px 10px 6px', textTransform: 'uppercase' }}>Workspace</div>
          {NAV.map(({ key, icon, label }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 7, border: 'none',
                background: active ? 'var(--cream-3)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                fontSize: 13, fontWeight: active ? 600 : 500,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}>
                <Ic name={icon} s={15} c={active ? 'var(--accent)' : 'var(--ink-3)'} w={1.85} />
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid var(--line)' }}>
          <button onClick={logout} style={{
            width: '100%', padding: '8px 10px', borderRadius: 7, border: 'none',
            background: 'transparent', color: 'var(--ink-3)',
            fontSize: 12.5, cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit',
          }}>
            <Ic name="out" s={14} c="var(--ink-3)" />로그아웃
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <ActiveTab tab={tab} />
      </main>
    </div>
  )
}
