import { useState, useEffect, useRef, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

// ---- 검색 대상 설정 ----
const SEARCH_SOURCES = [
  {
    key: 'caseStudies',
    label: '케이스스터디',
    color: '#7c3aed',
    bg: '#f5f3ff',
    getItems: (docs) => docs.map(d => ({
      id: d.id,
      title: d.data().title || '제목 없음',
      sub: [d.data().diagnosis?.impression, d.data().patient?.chief].filter(Boolean).join(' / '),
      tab: 'rx',
      raw: d.data(),
    }))
  },
  {
    key: 'prescriptions',
    label: '처방 노하우',
    color: '#0F6E56',
    bg: '#f0faf5',
    getItems: (docs) => docs.map(d => ({
      id: d.id,
      title: d.data().title || d.data().diagnosis || '처방',
      sub: (d.data().drugs || []).slice(0,3).map(dr => dr.name).filter(Boolean).join(', '),
      tab: 'rx',
      raw: d.data(),
    }))
  },
  {
    key: 'presetPrescriptions',
    label: '약속처방',
    color: '#2563eb',
    bg: '#eff6ff',
    getItems: (docs) => docs.map(d => ({
      id: d.id,
      title: d.data().name || '약속처방',
      sub: (d.data().drugs || []).slice(0,3).map(dr => dr.name).filter(Boolean).join(', '),
      tab: 'rx',
      raw: d.data(),
    }))
  },
  {
    key: 'diseaseNotes2',
    label: '질환 노트',
    color: '#d97706',
    bg: '#fffbeb',
    getItems: (docs) => docs.map(d => ({
      id: d.id,
      title: d.data().title || '노트',
      sub: [d.data().category, ...(d.data().tags || [])].filter(Boolean).join('  -  '),
      tab: 'notes',
      raw: d.data(),
    }))
  },
  {
    key: 'myDrugs',
    label: '나의 약물',
    color: '#dc2626',
    bg: '#fee2e2',
    getItems: (docs) => docs.map(d => ({
      id: d.id,
      title: d.data().name || '약물',
      sub: d.data().note || d.data().category || '',
      tab: 'rx',
      raw: d.data(),
    }))
  },
]

// 텍스트 매칭 - 재귀적으로 객체 내 모든 문자열 검색
function deepSearch(obj, query, depth = 0) {
  if (depth > 4) return false
  if (!obj) return false
  if (typeof obj === 'string') return obj.toLowerCase().includes(query)
  if (Array.isArray(obj)) return obj.some(item => deepSearch(item, query, depth + 1))
  if (typeof obj === 'object') return Object.values(obj).some(v => deepSearch(v, query, depth + 1))
  return false
}

function highlight(text, query) {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#fef08a', color: '#1a1a1a', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function GlobalSearch({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState(null)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Cmd+K / Ctrl+K 단축키
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(p => !p)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 열릴 때 포커스
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      if (!cache) loadAll()
    } else {
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  // 전체 데이터 로드 (첫 오픈 시 1회)
  const loadAll = async () => {
    setLoading(true)
    const all = {}
    for (const src of SEARCH_SOURCES) {
      try {
        const snap = await getDocs(collection(db, src.key))
        all[src.key] = src.getItems(snap.docs)
      } catch { all[src.key] = [] }
    }
    // 가족 건강 (records만 검색)
    try {
      const fSnap = await getDocs(collection(db, 'familyMembers'))
      const familyItems = []
      for (const fdoc of fSnap.docs) {
        const memberName = fdoc.data().name || '가족'
        const rSnap = await getDocs(collection(db, 'familyMembers', fdoc.id, 'records'))
        rSnap.docs.forEach(rdoc => {
          familyItems.push({
            id: rdoc.id,
            title: memberName + ' - ' + (rdoc.data().title || '기록'),
            sub: rdoc.data().note?.slice(0, 60) || rdoc.data().status || '',
            tab: 'family',
            raw: rdoc.data(),
          })
        })
      }
      all['family'] = familyItems
    } catch { all['family'] = [] }
    setCache(all)
    setLoading(false)
  }

  // 검색 실행
  useEffect(() => {
    if (!cache || !query.trim()) { setResults([]); setSelected(0); return }
    const q = query.trim().toLowerCase()
    const out = []
    const srcMap = {
      ...Object.fromEntries(SEARCH_SOURCES.map(s => [s.key, s])),
      family: { key: 'family', label: '가족 건강', color: '#db2777', bg: '#fdf2f8' }
    }
    for (const [key, items] of Object.entries(cache)) {
      const src = srcMap[key]
      const matched = items.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.sub?.toLowerCase().includes(q) ||
        deepSearch(item.raw, q)
      )
      matched.forEach(item => out.push({ ...item, sourceKey: key, sourceLabel: src?.label, sourceColor: src?.color, sourceBg: src?.bg }))
    }
    setResults(out.slice(0, 30))
    setSelected(0)
  }, [query, cache])

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(p => Math.min(p + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(p => Math.max(p - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) selectResult(results[selected])
  }

  const selectResult = (item) => {
    onNavigate(item.tab)
    setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', color: '#9ca3af', fontSize: 12, cursor: 'pointer', width: '100%' }}>
        <span style={{ fontSize: 13 }}>🔍</span>
        <span style={{ flex: 1, textAlign: 'left' }}>전체 검색...</span>
        <kbd style={{ fontSize: 10, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 5px', color: '#9ca3af' }}>CmdK</kbd>
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px 20px' }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

        {/* 검색 입력 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f0ede8' }}>
          <span style={{ fontSize: 16, color: '#9ca3af' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="처방명, 진단명, 약물명, 노트 제목... 무엇이든 검색"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#1a1a1a', fontFamily: 'inherit', background: 'transparent' }}
          />
          {loading && <span style={{ fontSize: 11, color: '#9ca3af' }}>로딩...</span>}
          <kbd onClick={() => setOpen(false)} style={{ fontSize: 11, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 5, padding: '2px 7px', color: '#9ca3af', cursor: 'pointer' }}>ESC</kbd>
        </div>

        {/* 결과 목록 */}
        <div ref={listRef} style={{ maxHeight: 460, overflowY: 'auto' }}>
          {!query.trim() && !loading && (
            <div style={{ padding: '20px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 12 }}>검색 범위</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[...SEARCH_SOURCES, { key: 'family', label: '가족 건강', color: '#db2777', bg: '#fdf2f8' }].map(src => (
                  <span key={src.key} style={{ fontSize: 11, background: src.bg, color: src.color, borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                    {src.label}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 14, lineHeight: 1.7 }}>
                진단명, 약물명, 처방 제목, 노트 내용, 태그 등 앱 전체에서 검색합니다.
              </div>
            </div>
          )}

          {query.trim() && results.length === 0 && !loading && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>검색 결과 없음</div>
              <div>"{query}"에 해당하는 데이터가 없습니다</div>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                {results.length}개 결과
              </div>
              {results.map((item, i) => (
                <button key={item.id + i} onClick={() => selectResult(item)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: 'none', background: i === selected ? '#f8f6f2' : '#fff', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f9fafb' }}>
                  {/* 소스 배지 */}
                  <span style={{ fontSize: 10, background: item.sourceBg, color: item.sourceColor, borderRadius: 6, padding: '2px 8px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {item.sourceLabel}
                  </span>
                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {highlight(item.title, query)}
                    </div>
                    {item.sub && (
                      <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                        {highlight(item.sub, query)}
                      </div>
                    )}
                  </div>
                  {/* 탭 이동 화살표 */}
                  <span style={{ fontSize: 12, color: '#d1d5db', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* 하단 힌트 */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0ede8', display: 'flex', gap: 14, background: '#fafaf9' }}>
          {[['^v', '이동'], ['Enter', '이동'], ['ESC', '닫기'], ['CmdK', '토글']].map(([key, label]) => (
            <span key={key} style={{ fontSize: 11, color: '#9ca3af', display: 'flex', gap: 4, alignItems: 'center' }}>
              <kbd style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
