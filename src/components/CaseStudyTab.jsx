import { useState, useEffect, useMemo, useRef } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'
import KcdSearch from './KcdSearch'
import { searchKCD } from '../data/kcdCodes'

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const max = 800
      let { width, height } = img
      if (width > max) { height = height * max / width; width = max }
      if (height > max) { width = width * max / height; height = max }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
})

const F = {
  input: { width: '100%', padding: '6px 8px', border: 'none', fontSize: 12, outline: 'none', background: 'transparent', fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 },
  ta: (h = 72) => ({ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', resize: 'vertical', minHeight: h, lineHeight: 1.65, color: '#1a1a1a' }),
  std: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#1a1a1a' },
}

// ── 약물 자동완성 ─────────────────────────────────────────
function DrugCell({ value, onChange, suggestions = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hits = value.length >= 1 ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8) : []
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true) }} onFocus={() => value.length >= 1 && setOpen(true)}
        placeholder="약품명 입력/검색..." style={F.input} />
      {open && hits.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500, background: '#fff', border: '1px solid #d1fae5', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          {hits.map(n => (
            <div key={n} onMouseDown={e => { e.preventDefault(); onChange(n); setOpen(false) }}
              style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#1a1a1a' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              💊 {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 상병코드 인라인 검색 ──────────────────────────────────
function DiseaseCell({ value, onChange }) {
  const [query, setQuery] = useState(value?.code ? `${value.code}` : '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const results = query.length >= 1 ? searchKCD(query) : []
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); onChange(null) }}
        onFocus={() => { if (query.length >= 1) setOpen(true) }}
        placeholder="코드 또는 질환명..." style={F.input} />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 500, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.12)', overflow: 'hidden', width: 320 }}>
          {results.map(item => (
            <div key={item.code} onMouseDown={e => { e.preventDefault(); setQuery(item.code); onChange(item); setOpen(false) }}
              style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <span style={{ fontWeight: 700, color: '#0F6E56', minWidth: 44 }}>{item.code}</span>
              <span style={{ color: '#1a1a1a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── EMR 스타일 테이블 ─────────────────────────────────────
const TH = ({ children, w, center }) => (
  <th style={{ padding: '7px 8px', fontSize: 11, fontWeight: 700, color: '#374151', background: '#f3f4f6', borderRight: '1px solid #e5e7eb', borderBottom: '2px solid #d1d5db', whiteSpace: 'nowrap', width: w, textAlign: center ? 'center' : 'left' }}>
    {children}
  </th>
)
const TD = ({ children, center, style = {} }) => (
  <td style={{ borderRight: '1px solid #eee', borderBottom: '1px solid #eee', padding: '0', verticalAlign: 'middle', textAlign: center ? 'center' : 'left', ...style }}>
    {children}
  </td>
)

// ── 상병 테이블 컴포넌트 ──────────────────────────────────
function DiseaseTable({ diseases = [], onChange }) {
  const add = () => onChange([...diseases, { type: '주상병', kcd: null }])
  const remove = (i) => onChange(diseases.filter((_, idx) => idx !== i))
  const update = (i, f, v) => onChange(diseases.map((d, idx) => idx === i ? { ...d, [f]: v } : d))

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#e8f4f0', borderBottom: '1px solid #d1d5db' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F6E56' }}>상병 (질병)</span>
        <button onClick={add} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ 상병 추가</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <TH w={28}> </TH>
            <TH w={50} center>순번</TH>
            <TH w={70} center>코드</TH>
            <TH>상병명</TH>
            <TH w={80} center>구분</TH>
          </tr>
        </thead>
        <tbody>
          {diseases.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '14px', textAlign: 'center', color: '#9ca3af', fontSize: 12, borderBottom: '1px solid #eee' }}>
                상병을 추가하세요
              </td>
            </tr>
          ) : diseases.map((d, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <TD center>
                <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 14, padding: '2px 6px', fontWeight: 700 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>
                  ×
                </button>
              </TD>
              <TD center><span style={{ padding: '4px 8px', fontSize: 12, color: '#6b7280' }}>{i + 1}</span></TD>
              <TD center>
                <span style={{ padding: '4px 8px', fontSize: 12, fontWeight: 700, color: d.kcd ? '#0F6E56' : '#9ca3af' }}>
                  {d.kcd?.code || '-'}
                </span>
              </TD>
              <TD style={{ minWidth: 200 }}>
                <DiseaseCell value={d.kcd} onChange={v => update(i, 'kcd', v)} />
                {d.kcd?.name && (
                  <div style={{ padding: '2px 8px 4px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.kcd.name}
                  </div>
                )}
              </TD>
              <TD center>
                <select value={d.type || '주상병'} onChange={e => update(i, 'type', e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', padding: '6px 4px', outline: 'none', fontFamily: 'inherit', color: d.type === '주상병' ? '#0F6E56' : '#374151', fontWeight: d.type === '주상병' ? 700 : 400 }}>
                  <option value="주상병">주상병</option>
                  <option value="부상병">부상병</option>
                </select>
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 처방 테이블 컴포넌트 ──────────────────────────────────
function PrescriptionTable({ drugs = [], onChange, drugSuggestions = [] }) {
  const add = () => onChange([...drugs, { name: '', dosage: '', freq: '3', duration: '', usage: '식후', covered: true, note: '' }])
  const remove = (i) => onChange(drugs.filter((_, idx) => idx !== i))
  const upd = (i, f, v) => onChange(drugs.map((d, idx) => idx === i ? { ...d, [f]: v } : d))

  const selectStyle = { border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit', color: '#374151', padding: '6px 2px', width: '100%' }

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#eef2ff', borderBottom: '1px solid #d1d5db' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#3730a3' }}>처방</span>
        <button onClick={add} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ 처방 추가</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr>
              <TH w={28}> </TH>
              <TH>약품명</TH>
              <TH w={60} center>용량</TH>
              <TH w={55} center>횟수</TH>
              <TH w={55} center>일수</TH>
              <TH w={80} center>용법</TH>
              <TH w={50} center>급여</TH>
            </tr>
          </thead>
          <tbody>
            {drugs.length === 0 ? (
              <tr>
                <td colSpan={7} onClick={add} style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  + 처방을 추가하세요
                </td>
              </tr>
            ) : drugs.map((drug, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9f9ff'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                <TD center>
                  <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 14, padding: '2px 6px', fontWeight: 700 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>
                    ×
                  </button>
                </TD>
                <TD>
                  <DrugCell value={drug.name || ''} onChange={v => upd(i, 'name', v)} suggestions={drugSuggestions} />
                  {drug.note !== undefined && (
                    <input value={drug.note || ''} onChange={e => upd(i, 'note', e.target.value)}
                      placeholder="메모 (선택)" style={{ ...F.input, fontSize: 11, color: '#9ca3af', paddingTop: 0, paddingBottom: 4 }} />
                  )}
                </TD>
                <TD center>
                  <input value={drug.dosage || ''} onChange={e => upd(i, 'dosage', e.target.value)}
                    placeholder="1T" style={{ ...F.input, textAlign: 'center' }} />
                </TD>
                <TD center>
                  <select value={drug.freq || '3'} onChange={e => upd(i, 'freq', e.target.value)} style={{ ...selectStyle, textAlign: 'center' }}>
                    {['1','2','3','4'].map(v => <option key={v} value={v}>{v}회/일</option>)}
                  </select>
                </TD>
                <TD center>
                  <input value={drug.duration || ''} onChange={e => upd(i, 'duration', e.target.value)}
                    placeholder="일" style={{ ...F.input, textAlign: 'center' }} />
                </TD>
                <TD center>
                  <select value={drug.usage || '식후'} onChange={e => upd(i, 'usage', e.target.value)} style={selectStyle}>
                    {['식후','식전','식간','취침전','필요시'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </TD>
                <TD center>
                  <input type="checkbox" checked={drug.covered !== false} onChange={e => upd(i, 'covered', e.target.checked)}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0F6E56' }} />
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {drugs.length > 0 && (
        <div style={{ padding: '6px 10px', background: '#f9fafb', borderTop: '1px solid #eee', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>총 {drugs.length}종</span>
          <span style={{ fontSize: 11, color: '#0F6E56' }}>급여 {drugs.filter(d => d.covered !== false).length}종</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>비급여 {drugs.filter(d => d.covered === false).length}종</span>
        </div>
      )}
    </div>
  )
}

// ── AI 결과 블록 ──────────────────────────────────────────
function AiResultBlock({ data, type }) {
  if (!data) return null
  return (
    <div style={{ marginTop: 12 }}>
      {type === 'knowledge' && data.sections?.map((s, i) => (
        <div key={i} style={{ background: '#f8f6f2', borderRadius: 8, padding: '11px 13px', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F6E56', marginBottom: 5 }}>{s.title}</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{s.content}</div>
        </div>
      ))}
      {type === 'papers' && data.papers?.map((p, i) => (
        <div key={i} style={{ background: '#eff6ff', borderRadius: 8, padding: '11px 13px', marginBottom: 8, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 3 }}>{p.title}</div>
          <div style={{ fontSize: 11, color: '#3730a3', marginBottom: 5 }}>{p.journal} · {p.year} <span style={{ background: '#ddd6fe', borderRadius: 4, padding: '1px 6px' }}>{p.level}</span></div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{p.keyPoints}</div>
        </div>
      ))}
      {type === 'revenue' && data.strategies?.map((s, i) => (
        <div key={i} style={{ background: '#fffbeb', borderRadius: 8, padding: '11px 13px', marginBottom: 8, border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 10, background: '#d97706', color: '#fff', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>{s.category}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{s.title}</span>
          </div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>{s.detail}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>📈 {s.impact}</div>
        </div>
      ))}
      {type === 'review' && (() => {
        const OVERALL = { '적절': '#0F6E56', '주의필요': '#d97706', '검토필요': '#dc2626' }
        const STATUS = { ok: { bg: '#EAF3DE', color: '#27500A', icon: '✅' }, warning: { bg: '#FAEEDA', color: '#633806', icon: '⚠️' }, error: { bg: '#FCEBEB', color: '#791F1F', icon: '❌' } }
        return (
          <div>
            <div style={{ background: OVERALL[data.overall] || '#0F6E56', borderRadius: 10, padding: '11px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{data.overall}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', maxWidth: '65%', textAlign: 'right' }}>{data.summary}</div>
            </div>
            {data.items?.map((item, i) => {
              const sm = STATUS[item.status] || STATUS.ok
              return (
                <div key={i} style={{ background: sm.bg, borderRadius: 8, padding: '9px 12px', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sm.color, marginBottom: 3 }}>{sm.icon} {item.category}</div>
                  <div style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5 }}>{item.comment}</div>
                </div>
              )
            })}
            {data.suggestions?.length > 0 && (
              <div style={{ background: '#f0faf5', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 6 }}>💡 제안</div>
                {data.suggestions.map((s, i) => <div key={i} style={{ fontSize: 12, color: '#1a1a1a', paddingLeft: 12, position: 'relative', marginBottom: 3 }}><span style={{ position: 'absolute', left: 0, color: '#0F6E56' }}>·</span>{s}</div>)}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ── 섹션 래퍼 ─────────────────────────────────────────────
const SC = { 1: '#0F6E56', 2: '#2563eb', 3: '#7c3aed', 4: '#0891b2', 5: '#2563eb', 6: '#d97706' }
function Section({ num, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const bgMap = { '#0F6E56': '#f0faf5', '#2563eb': '#eff6ff', '#7c3aed': '#f5f3ff', '#0891b2': '#ecfeff', '#d97706': '#fffbeb' }
  const c = SC[num]; const bg = bgMap[c] || '#f8f8f8'
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 10 }}>
      <button onClick={() => setOpen(p => !p)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: open ? bg : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: open ? '12px 12px 0 0' : 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: c, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 11, color: '#9ca3af', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #f0ede8', borderRadius: '0 0 12px 12px' }}>{children}</div>}
    </div>
  )
}

function AiBtn({ label, emoji, loading, onClick, color }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: loading ? '#d1d5db' : color, color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
      {loading ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />분석 중...</> : <>{emoji} {label}</>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}

// ── 케이스 상세 뷰 ────────────────────────────────────────
function CaseDetail({ caseDoc, drugSuggestions, onUpdate, onDelete }) {
  const [local, setLocal] = useState(() => ({
    patient: {}, workup: {}, diagnosis: { diseases: [], drugs: [] },
    knowledge: { images: [] }, literature: {}, revenue: {}, aiReview: null,
    ...caseDoc,
    diagnosis: { diseases: [], drugs: [], ...(caseDoc.diagnosis || {}) },
    knowledge: { images: [], ...(caseDoc.knowledge || {}) },
  }))
  const [saving, setSaving] = useState(false)
  const [aiLoad, setAiLoad] = useState({})
  const timer = useRef(null)

  const save = (updates) => {
    const merged = { ...local, ...updates }
    setLocal(merged); onUpdate(merged)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaving(true)
      try { await updateDoc(doc(db, 'caseStudies', caseDoc.id), { ...updates, updatedAt: serverTimestamp() }) }
      finally { setSaving(false) }
    }, 800)
  }

  const setP = (k, v) => save({ patient: { ...local.patient, [k]: v } })
  const setV = (k, v) => save({ patient: { ...local.patient, vitals: { ...(local.patient?.vitals || {}), [k]: v } } })
  const setW = (k, v) => save({ workup: { ...local.workup, [k]: v } })
  const setDx = (k, v) => save({ diagnosis: { ...local.diagnosis, [k]: v } })
  const setK = (k, v) => save({ knowledge: { ...local.knowledge, [k]: v } })

  const callAi = async (type) => {
    setAiLoad(p => ({ ...p, [type]: true }))
    try {
      const isReview = type === 'review'
      const res = await fetch(isReview ? '/api/review' : '/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isReview ? {
          patientAge: local.patient?.age, patientGender: local.patient?.gender,
          chiefComplaint: local.patient?.chiefComplaint,
          diagnosis: local.diagnosis?.impression,
          kcdCode: local.diagnosis?.diseases?.[0]?.kcd?.code,
          kcdName: local.diagnosis?.diseases?.[0]?.kcd?.name,
          drugs: (local.diagnosis?.drugs || []).map(d => ({ name: d.name, dosage: d.dosage, usage: `${d.freq||3}회 ${d.usage||'식후'}`, duration: d.duration })),
          progressNote: local.workup?.history,
        } : { type, caseData: local }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      if (type === 'review') save({ aiReview: result })
      else if (type === 'knowledge') save({ knowledge: { ...local.knowledge, aiContent: result } })
      else if (type === 'papers') save({ literature: { aiContent: result } })
      else if (type === 'revenue') save({ revenue: { aiContent: result } })
    } catch (e) { alert('AI 오류: ' + e.message) }
    finally { setAiLoad(p => ({ ...p, [type]: false })) }
  }

  const handleImg = async (e) => {
    const compressed = await Promise.all(Array.from(e.target.files).slice(0, 3).map(compressImage))
    const updated = [...(local.knowledge.images || []), ...compressed].slice(0, 5)
    save({ knowledge: { ...local.knowledge, images: updated } })
  }

  const p = local.patient || {}; const w = local.workup || {}
  const dx = local.diagnosis || {}; const k = local.knowledge || {}

  return (
    <div style={{ padding: '20px 24px 60px', maxWidth: 820 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f0ede8' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{local.title || '케이스 스터디'}</div>
          <div style={{ fontSize: 11, color: saving ? '#d97706' : '#9ca3af', marginTop: 2 }}>{saving ? '💾 저장 중...' : '✓ 자동 저장'}</div>
        </div>
        <button onClick={onDelete} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 7, color: '#ef4444', padding: '6px 13px', fontSize: 12, cursor: 'pointer' }}>🗑 삭제</button>
      </div>

      {/* ── 1. 환자 정보 ── */}
      <Section num={1} title="환자 정보 및 증상">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[['나이(세)', 'age', 'number'], ['성별', 'gender', 'text'], ['신장(cm)', 'height', 'number'], ['체중(kg)', 'weight', 'number']].map(([l, key, t]) => (
            <div key={key}><label style={F.label}>{l}</label><input type={t} value={p[key] || ''} onChange={e => setP(key, e.target.value)} placeholder="-" style={{ ...F.std, textAlign: 'center' }} /></div>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}><label style={F.label}>주호소 (Chief Complaint)</label><input value={p.chiefComplaint || ''} onChange={e => setP('chiefComplaint', e.target.value)} placeholder="예: 발열, 인후통 3일째" style={F.std} /></div>
        <div style={{ marginBottom: 10 }}><label style={F.label}>현병력 (HPI)</label><textarea value={p.hpi || ''} onChange={e => setP('hpi', e.target.value)} placeholder="증상 시작 시기, 경과, 동반 증상..." style={F.ta(70)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div><label style={F.label}>과거력 / 기저질환</label><textarea value={p.pmhx || ''} onChange={e => setP('pmhx', e.target.value)} placeholder="HTN, DM, 수술력 등" style={F.ta(56)} /></div>
          <div><label style={F.label}>복용 약물 / 알레르기</label><textarea value={p.meds || ''} onChange={e => setP('meds', e.target.value)} placeholder="현재 복용 약, 알레르기" style={F.ta(56)} /></div>
        </div>
        <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '10px 12px' }}>
          <label style={{ ...F.label, marginBottom: 8 }}>활력징후 (Vital Signs)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[['BP', 'bp', 'mmHg'], ['HR', 'hr', '/min'], ['RR', 'rr', '/min'], ['BT', 'bt', '℃'], ['SpO2', 'spo2', '%']].map(([l, key, u]) => (
              <div key={key} style={{ textAlign: 'center' }}>
                <label style={{ ...F.label, textAlign: 'center', fontSize: 10 }}>{l} ({u})</label>
                <input value={p.vitals?.[key] || ''} onChange={e => setV(key, e.target.value)} placeholder="-" style={{ ...F.std, textAlign: 'center', padding: '7px 4px' }} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 2. 진료 사항 ── */}
      <Section num={2} title="진료 사항 (문진 및 신체검사)">
        <div style={{ marginBottom: 10 }}><label style={F.label}>문진 내용 (Review of Systems)</label><textarea value={w.history || ''} onChange={e => setW('history', e.target.value)} placeholder="계통별 문진, 추가 병력..." style={F.ta(76)} /></div>
        <div style={{ marginBottom: 10 }}><label style={F.label}>신체검사 소견 (Physical Exam)</label><textarea value={w.physicalExam || ''} onChange={e => setW('physicalExam', e.target.value)} placeholder="General / HEENT / Chest / Abdomen..." style={F.ta(76)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><label style={F.label}>시행 검사 및 결과</label><textarea value={w.labs || ''} onChange={e => setW('labs', e.target.value)} placeholder="CBC, CRP, X-ray 등..." style={F.ta(60)} /></div>
          <div><label style={F.label}>추가 검사 / 의뢰 계획</label><textarea value={w.plan || ''} onChange={e => setW('plan', e.target.value)} placeholder="추가 검사, 전과 의뢰 등..." style={F.ta(60)} /></div>
        </div>
      </Section>

      {/* ── 3. 진단 및 처방 (EMR 스타일) ── */}
      <Section num={3} title="진단 및 처방 (Impression & Prescription)">
        <div style={{ marginBottom: 14 }}>
          <label style={F.label}>진단명 (Impression)</label>
          <input value={dx.impression || ''} onChange={e => setDx('impression', e.target.value)} placeholder="예: 급성 편도염 (Acute Tonsillitis)" style={F.std} />
        </div>

        {/* 상병 테이블 */}
        <div style={{ marginBottom: 14 }}>
          <DiseaseTable diseases={dx.diseases || []} onChange={v => setDx('diseases', v)} />
        </div>

        {/* 처방 테이블 */}
        <div style={{ marginBottom: 14 }}>
          <PrescriptionTable drugs={dx.drugs || []} onChange={v => setDx('drugs', v)} drugSuggestions={drugSuggestions} />
        </div>

        {/* 비약물 치료 */}
        <div style={{ marginBottom: 14 }}>
          <label style={F.label}>처치 / 비약물 치료 / 추적 계획</label>
          <textarea value={dx.nonDrug || ''} onChange={e => setDx('nonDrug', e.target.value)} placeholder="처치 내용, 교육, 생활습관 지도, 추적 방문 계획..." style={F.ta(56)} />
        </div>

        {/* 심평원 검토 */}
        <div style={{ background: '#fef2f2', borderRadius: 10, padding: '13px', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: local.aiReview ? 10 : 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>🏥 심평원 급여기준 검토</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>상병코드·처방 입력 후 검토하세요</div>
            </div>
            <AiBtn label="AI 검토" emoji="🔍" loading={aiLoad.review || false} onClick={() => callAi('review')} color="#dc2626" />
          </div>
          <AiResultBlock data={local.aiReview} type="review" />
        </div>
      </Section>

      {/* ── 4. 의학 지식 ── */}
      <Section num={4} title="관련 의학 지식 정리" defaultOpen={false}>
        <div style={{ marginBottom: 12 }}><label style={F.label}>직접 메모</label><textarea value={k.text || ''} onChange={e => setK('text', e.target.value)} placeholder="진단 기준, 감별진단, 치료 원칙, 개인 노트..." style={F.ta(96)} /></div>
        <div style={{ marginBottom: 12 }}>
          <label style={F.label}>이미지 첨부 (최대 5장)</label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', background: '#ecfeff', color: '#0891b2', border: '1px dashed #a5f3fc', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            📎 이미지 선택<input type="file" accept="image/*" multiple onChange={handleImg} style={{ display: 'none' }} />
          </label>
          {(k.images || []).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {(k.images || []).map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <button onClick={() => { const upd = k.images.filter((_, idx) => idx !== i); save({ knowledge: { ...k, images: upd } }) }} style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <AiBtn label="AI 의학 지식 정리" emoji="🧠" loading={aiLoad.knowledge || false} onClick={() => callAi('knowledge')} color="#0891b2" />
        <AiResultBlock data={k.aiContent} type="knowledge" />
      </Section>

      {/* ── 5. 논문 ── */}
      <Section num={5} title="관련 논문 및 가이드라인" defaultOpen={false}>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>진단·케이스 정보를 바탕으로 관련 가이드라인 및 근거 논문을 정리합니다.</p>
        <AiBtn label="AI 논문 검색" emoji="📚" loading={aiLoad.papers || false} onClick={() => callAi('papers')} color="#2563eb" />
        <AiResultBlock data={local.literature?.aiContent} type="papers" />
      </Section>

      {/* ── 6. 매출 ── */}
      <Section num={6} title="매출 증대 대책" defaultOpen={false}>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>해당 진단 관련, 적법한 범위 내 추가 수익 창출 방안을 AI가 제안합니다.</p>
        <AiBtn label="AI 전략 생성" emoji="📈" loading={aiLoad.revenue || false} onClick={() => callAi('revenue')} color="#d97706" />
        <AiResultBlock data={local.revenue?.aiContent} type="revenue" />
      </Section>
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────────
export default function CaseStudyTab({ drugSuggestions = [] }) {
  const isMobile = useIsMobile()
  const [cases, setCases]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [selId, setSelId]     = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCC, setNewCC]     = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'caseStudies'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => { setCases(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
  }, [])

  const selCase = cases.find(c => c.id === selId) || null
  const filtered = useMemo(() => cases.filter(c => {
    const q = search.toLowerCase()
    return !q || [c.title, c.patient?.chiefComplaint, c.diagnosis?.impression].some(t => t?.toLowerCase().includes(q))
  }), [cases, search])

  const createCase = async () => {
    if (!newCC.trim()) return
    setCreating(true)
    const ref = await addDoc(collection(db, 'caseStudies'), {
      title: newTitle.trim() || newCC.trim(),
      patient: { chiefComplaint: newCC.trim() },
      diagnosis: { diseases: [], drugs: [] },
      knowledge: { images: [] },
      createdAt: serverTimestamp(),
    })
    setSelId(ref.id); setShowNew(false); setNewTitle(''); setNewCC(''); setCreating(false)
  }

  const deleteCase = async (id) => {
    if (!window.confirm('케이스를 삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'caseStudies', id)); setSelId(null)
  }

  const updateCase = (updated) => setCases(p => p.map(c => c.id === updated.id ? updated : c))

  if (loading) return <Spinner />

  const NewModal = () => (
    <Sheet title="새 케이스 생성" onClose={() => setShowNew(false)}>
      <div style={{ marginBottom: 12 }}><label style={F.label}>케이스 제목 (선택)</label><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="예: 급성 편도염 증례 1" style={F.std} /></div>
      <div style={{ marginBottom: 20 }}><label style={F.label}>주호소 *</label><input value={newCC} onChange={e => setNewCC(e.target.value)} placeholder="예: 발열, 인후통 3일째" style={F.std} onKeyDown={e => e.key === 'Enter' && createCase()} /></div>
      <button onClick={createCase} disabled={!newCC.trim() || creating} style={{ width: '100%', padding: '12px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: !newCC.trim() ? 'not-allowed' : 'pointer', opacity: !newCC.trim() ? 0.5 : 1 }}>
        {creating ? '생성 중...' : '케이스 생성 →'}
      </button>
    </Sheet>
  )

  const ListItem = ({ c }) => {
    const active = selId === c.id
    const mainKcd = c.diagnosis?.diseases?.[0]?.kcd
    return (
      <div onClick={() => setSelId(c.id)} style={{ padding: '11px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active ? '#f0faf5' : 'transparent', border: active ? '1px solid #a7f3d0' : '1px solid transparent' }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#0F6E56' : '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{c.title || c.patient?.chiefComplaint || '새 케이스'}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {c.patient?.chiefComplaint && <span style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.patient.chiefComplaint}</span>}
          {mainKcd && <span style={{ fontSize: 10, background: '#e6f4ef', color: '#0F6E56', borderRadius: 4, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>{mainKcd.code}</span>}
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '12px 16px 10px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..." style={{ ...F.std, paddingLeft: 32 }} />
          </div>
        </div>
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length}건</span>
          <button onClick={() => setShowNew(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✏️ 새 케이스</button>
        </div>
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}><div style={{ fontSize: 36, marginBottom: 10 }}>🏥</div><div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>케이스가 없습니다</div><button onClick={() => setShowNew(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>첫 케이스 추가하기</button></div>
            : filtered.map(c => <ListItem key={c.id} c={c} />)
          }
        </div>
        {showNew && <NewModal />}
        {selCase && <Sheet title="케이스 편집" onClose={() => setSelId(null)}><CaseDetail caseDoc={selCase} drugSuggestions={drugSuggestions} onUpdate={updateCase} onDelete={() => deleteCase(selCase.id)} /></Sheet>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: 270, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #f0ede8' }}>
          <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af' }}>🔍</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..." style={{ ...F.std, paddingLeft: 28, fontSize: 12 }} /></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div>케이스가 없습니다</div>
            : filtered.map(c => <ListItem key={c.id} c={c} />)}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #f0ede8' }}>
          <button onClick={() => setShowNew(true)} style={{ width: '100%', padding: '10px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✏️ 새 케이스 추가</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef' }}>
        {!selCase
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏥</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#374151', marginBottom: 8 }}>케이스 스터디</div>
              <div style={{ fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>환자 정보 → 진료 → 진단·처방 → 의학 지식<br />한 곳에서 정리하세요</div>
              <button onClick={() => setShowNew(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✏️ 첫 케이스 만들기</button>
            </div>
          : <CaseDetail key={selCase.id} caseDoc={selCase} drugSuggestions={drugSuggestions} onUpdate={updateCase} onDelete={() => deleteCase(selCase.id)} />
        }
      </div>
      {showNew && <NewModal />}
    </div>
  )
}
