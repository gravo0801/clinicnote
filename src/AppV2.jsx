import { useEffect, useMemo, useState } from 'react'
import Login from './components/Login'
import AdultDailyTab from './components/AdultDailyTabWithSupplements'
import RxTab from './components/RxTab'
import CautionTab from './components/CautionTab'
import DiseaseNoteTab from './components/DiseaseNoteTab'
import CaseStudyTab from './components/CaseStudyTab'
import GlobalSearch from './components/GlobalSearch'
import DrugCardTab from './components/DrugCardTab'
import UltrasoundTab from './components/UltrasoundTab'
import HealthCheckup from './components/HealthCheckup'
import OpsTab from './components/OpsTab'
import FamilyTab from './components/FamilyTab'
import BackupTab from './components/BackupTab'
import { adultDailyDay11 } from './data/adultDailyDay11'
import { adultDailyDay12to15 } from './data/adultDailyDay12to15'

const PRIMARY = [
  { key: 'clinic', label: 'Clinic', ko: '진료', icon: '🩺' },
  { key: 'study', label: 'Study', ko: '학습', icon: '📚' },
  { key: 'search', label: 'Search', ko: '검색', icon: '⌕' },
  { key: 'tools', label: 'Tools', ko: '도구', icon: '🧰' },
  { key: 'archive', label: 'Archive', ko: '보관', icon: '🗂️' },
]

const SECONDARY = {
  clinic: [
    { key: 'clinic-home', label: 'Clinic 홈' },
    { key: 'rx', label: '처방 노하우' },
    { key: 'caution', label: '주의 처방' },
    { key: 'checkup', label: '검진' },
  ],
  study: [
    { key: 'adult', label: '성인 Daily' },
    { key: 'notes', label: '질환 노트' },
    { key: 'cases', label: 'Case / Recall' },
  ],
  search: [
    { key: 'search-home', label: '통합 검색' },
  ],
  tools: [
    { key: 'drugs', label: '약물 카드' },
    { key: 'ultrasound', label: '초음파' },
    { key: 'ops', label: '운영 노하우' },
  ],
  archive: [
    { key: 'family', label: '가족 건강' },
    { key: 'backup', label: '백업 / 복원' },
  ],
}

function useCompactLayout() {
  const [compact, setCompact] = useState(() => typeof window === 'undefined' ? true : window.innerWidth < 980)
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 980)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return compact
}

function SearchPanel({ onNavigate }) {
  return (
    <div style={{ padding: 'clamp(18px,4vw,44px)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 'clamp(18px,3vw,30px)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 900, letterSpacing: '.08em', marginBottom: 8 }}>UNIFIED SEARCH</div>
        <h1 style={{ margin: 0, fontSize: 'clamp(23px,3vw,32px)' }}>앱 전체 검색</h1>
        <p style={{ color: 'var(--ink-3)', lineHeight: 1.7, margin: '8px 0 18px' }}>처방, 질환 노트, 약물, 가족 기록을 한 번에 검색합니다. PC에서는 Ctrl/Cmd + K도 사용할 수 있습니다.</p>
        <div style={{ maxWidth: 640 }}><GlobalSearch onNavigate={onNavigate} /></div>
      </div>
    </div>
  )
}

function ClinicHome({ onNavigate }) {
  const cards = useMemo(() => [...adultDailyDay11, ...adultDailyDay12to15], [])
  const [selected, setSelected] = useState(cards[0] || null)
  return (
    <div style={{ padding: 'clamp(14px,3vw,32px)', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 900, letterSpacing: '.08em' }}>POINT-OF-CARE</div>
          <h1 style={{ margin: '5px 0 0', fontSize: 'clamp(24px,3vw,32px)' }}>Clinic Mode</h1>
          <p style={{ margin: '7px 0 0', color: 'var(--ink-3)', lineHeight: 1.65 }}>주호소에서 시작해 Red Flag와 다음 행동을 빠르게 확인합니다. 기존 Study 자료는 그대로 유지됩니다.</p>
        </div>
        <div style={{ width: 'min(100%,360px)' }}><GlobalSearch onNavigate={onNavigate} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
        {cards.map(card => (
          <button key={card.day} onClick={() => setSelected(card)} style={{
            minHeight: 58, padding: '11px 12px', textAlign: 'left', borderRadius: 12,
            border: selected?.day === card.day ? '1.5px solid var(--accent)' : '1px solid var(--line)',
            background: selected?.day === card.day ? 'var(--accent-soft)' : '#fff', color: 'var(--ink)', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 900, marginBottom: 4 }}>D{String(card.day).padStart(2, '0')}</div>
            <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.4 }}>{card.topic.split(':')[0]}</div>
          </button>
        ))}
      </div>

      {selected && (
        <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 'clamp(14px,2.5vw,24px)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 900, marginBottom: 5 }}>STUDY-LINKED CLINIC CARD</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(19px,2.5vw,25px)' }}>{selected.topic}</h2>
            </div>
            <button onClick={() => onNavigate('adult')} style={{ minHeight: 44, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#166534', borderRadius: 9, padding: '9px 13px', fontWeight: 900, cursor: 'pointer' }}>Study에서 자세히</button>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.72 }} dangerouslySetInnerHTML={{ __html: selected.appHtml }} />
        </section>
      )}
    </div>
  )
}

function ActiveContent({ section, item, onNavigate }) {
  if (section === 'clinic' && item === 'clinic-home') return <ClinicHome onNavigate={onNavigate} />
  if (item === 'adult') return <AdultDailyTab />
  if (item === 'rx') return <RxTab />
  if (item === 'caution') return <CautionTab />
  if (item === 'checkup') return <HealthCheckup />
  if (item === 'notes') return <DiseaseNoteTab />
  if (item === 'cases') return <CaseStudyTab />
  if (item === 'search-home') return <SearchPanel onNavigate={onNavigate} />
  if (item === 'drugs') return <DrugCardTab />
  if (item === 'ultrasound') return <UltrasoundTab />
  if (item === 'ops') return <OpsTab />
  if (item === 'family') return <FamilyTab />
  if (item === 'backup') return <BackupTab />
  return <ClinicHome onNavigate={onNavigate} />
}

export default function AppV2() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [section, setSection] = useState(() => localStorage.getItem('cn_v2_section') || 'clinic')
  const [item, setItem] = useState(() => localStorage.getItem('cn_v2_item') || 'clinic-home')
  const compact = useCompactLayout()

  useEffect(() => {
    if (sessionStorage.getItem('cn_auth') === '1') setLoggedIn(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('cn_v2_section', section)
    localStorage.setItem('cn_v2_item', item)
  }, [section, item])

  const chooseSection = key => {
    setSection(key)
    setItem(SECONDARY[key][0].key)
  }

  const navigateLegacy = target => {
    const map = {
      adult: ['study', 'adult'],
      notes: ['study', 'notes'],
      rx: ['clinic', 'rx'],
      caution: ['clinic', 'caution'],
      family: ['archive', 'family'],
      backup: ['archive', 'backup'],
    }
    const next = map[target] || ['search', 'search-home']
    setSection(next[0])
    setItem(next[1])
  }

  const logout = () => {
    sessionStorage.removeItem('cn_auth')
    setLoggedIn(false)
  }

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  const secondary = SECONDARY[section]

  if (compact) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(249,246,241,.97)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)' }}>
          <div style={{ minHeight: 56, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>✚</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 900, fontSize: 14 }}>ClinicNote</div><div style={{ color: 'var(--ink-mute)', fontSize: 10.5 }}>Adult Primary Care V2</div></div>
            <button onClick={logout} style={{ minHeight: 44, padding: '8px 10px', border: '1px solid var(--line)', background: '#fff', borderRadius: 9, color: 'var(--ink-3)', fontWeight: 700 }}>로그아웃</button>
          </div>
          <div style={{ overflowX: 'auto', display: 'flex', gap: 5, padding: '4px 10px 7px', scrollbarWidth: 'none' }}>
            {PRIMARY.map(nav => <button key={nav.key} onClick={() => chooseSection(nav.key)} style={{ minHeight: 44, flex: '0 0 auto', padding: '8px 12px', borderRadius: 10, border: section === nav.key ? '1px solid var(--accent)' : '1px solid var(--line)', background: section === nav.key ? 'var(--accent-soft)' : '#fff', color: section === nav.key ? 'var(--accent-deep)' : 'var(--ink-2)', fontWeight: 900 }}>{nav.icon} {nav.label}</button>)}
          </div>
          <div style={{ overflowX: 'auto', display: 'flex', gap: 6, padding: '0 10px 8px', scrollbarWidth: 'none' }}>
            {secondary.map(sub => <button key={sub.key} onClick={() => setItem(sub.key)} style={{ minHeight: 40, flex: '0 0 auto', padding: '7px 11px', borderRadius: 999, border: 'none', background: item === sub.key ? 'var(--ink)' : 'var(--cream-2)', color: item === sub.key ? '#fff' : 'var(--ink-3)', fontWeight: 800 }}>{sub.label}</button>)}
          </div>
        </header>
        <main><ActiveContent section={section} item={item} onNavigate={navigateLegacy} /></main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--cream)' }}>
      <aside style={{ width: 264, height: '100vh', position: 'sticky', top: 0, flexShrink: 0, borderRight: '1px solid var(--line)', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>✚</div>
            <div><div style={{ fontWeight: 900, fontSize: 15 }}>ClinicNote</div><div style={{ color: 'var(--ink-mute)', fontSize: 10.5, marginTop: 2 }}>Adult Primary Care V2</div></div>
          </div>
        </div>

        <nav style={{ padding: '14px 10px 8px' }}>
          {PRIMARY.map(nav => (
            <button key={nav.key} onClick={() => chooseSection(nav.key)} style={{ width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', marginBottom: 3, border: 'none', borderRadius: 10, background: section === nav.key ? 'var(--accent-soft)' : 'transparent', color: section === nav.key ? 'var(--accent-deep)' : 'var(--ink-2)', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 24, textAlign: 'center', fontSize: 16 }}>{nav.icon}</span>
              <span style={{ flex: 1 }}><span style={{ display: 'block', fontSize: 13.5, fontWeight: 900 }}>{nav.label}</span><span style={{ display: 'block', fontSize: 10.5, marginTop: 1, color: 'var(--ink-mute)' }}>{nav.ko}</span></span>
            </button>
          ))}
        </nav>

        <div style={{ margin: '4px 12px 0', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <div style={{ color: 'var(--ink-mute)', fontSize: 10, fontWeight: 900, letterSpacing: '.08em', padding: '4px 8px 7px' }}>CURRENT WORKSPACE</div>
          {secondary.map(sub => (
            <button key={sub.key} onClick={() => setItem(sub.key)} style={{ width: '100%', minHeight: 42, border: 'none', borderRadius: 8, background: item === sub.key ? '#fff' : 'transparent', color: item === sub.key ? 'var(--ink)' : 'var(--ink-3)', textAlign: 'left', padding: '8px 10px', fontSize: 12.5, fontWeight: item === sub.key ? 900 : 650, cursor: 'pointer', boxShadow: item === sub.key ? 'var(--shadow-sm)' : 'none' }}>{sub.label}</button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: 12, borderTop: '1px solid var(--line)' }}>
          <button onClick={logout} style={{ width: '100%', minHeight: 44, border: '1px solid var(--line)', borderRadius: 9, background: '#fff', color: 'var(--ink-3)', fontWeight: 800, cursor: 'pointer' }}>로그아웃</button>
        </div>
      </aside>
      <main style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}><ActiveContent section={section} item={item} onNavigate={navigateLegacy} /></main>
    </div>
  )
}
