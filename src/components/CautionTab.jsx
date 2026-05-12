import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'

const CATEGORIES = [
  { key: 'pregnancy',   label: '임산부',          icon: '🤰', bg: '#FDF2F8', fg: '#9D174D', border: '#FBCFE8' },
  { key: 'elderly',     label: '노인',            icon: '👴', bg: '#F5F3FF', fg: '#5B21B6', border: '#DDD6FE' },
  { key: 'disease',     label: '특정질환 금기',    icon: '🩺', bg: '#FEF2F2', fg: '#991B1B', border: '#FCA5A5' },
  { key: 'interaction', label: '약물 상호작용',    icon: '🔀', bg: '#FFF7ED', fg: '#9A3412', border: '#FED7AA' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

const SEVERITY = [
  { key: 'absolute', label: '절대금기', color: '#991B1B', bg: '#FEE2E2' },
  { key: 'major',    label: '주요 주의', color: '#9A3412', bg: '#FFEDD5' },
  { key: 'caution',  label: '경미',     color: '#854D0E', bg: '#FEF3C7' },
]
const SEV_MAP = Object.fromEntries(SEVERITY.map(s => [s.key, s]))

const EMPTY = {
  category: 'disease',
  title: '',
  scenario: '',
  drugs: '',        // 쉼표 구분
  severity: 'major',
  mechanism: '',
  action: '',
  alternatives: '',
  sourceRefs: '',
  userMemo: '',
  claudeNote: '',
}

const toArr = s => (s || '').split(',').map(t => t.trim()).filter(Boolean)
const toCsv = a => Array.isArray(a) ? (a[0]?.name ? a.map(x => x.name).join(', ') : a.join(', ')) : (a || '')

export default function CautionTab() {
  const isMobile = useIsMobile()
  const [notes, setNotes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [catFilter, setCatFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('approved')
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [sources, setSources]   = useState([
    { label: 'Gemini',  text: '' },
    { label: 'ChatGPT', text: '' },
  ])
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState('')
  const [detail, setDetail]     = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm]         = useState(EMPTY)

  useEffect(() => {
    const q = query(collection(db, 'cautionNotes'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const counts = useMemo(() => {
    const c = { 전체: 0, pending: 0, starred: 0 }
    CATEGORIES.forEach(x => { c[x.key] = 0 })
    notes.forEach(n => {
      c.전체 += 1
      if (n.status === 'pending') c.pending += 1
      if (n.starred) c.starred += 1
      if (c[n.category] != null) c[n.category] += 1
    })
    return c
  }, [notes])

  const visible = useMemo(() => notes.filter(n => {
    if (statusFilter === 'approved' && n.status !== 'approved') return false
    if (statusFilter === 'pending'  && n.status !== 'pending')  return false
    if (statusFilter === 'starred'  && !n.starred) return false
    if (catFilter !== '전체' && n.category !== catFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    const drugStr = (n.drugs || []).map(d => d.name || d).join(' ')
    return [n.title, n.scenario, n.mechanism, n.action, n.alternatives, n.userMemo, drugStr]
      .some(t => t?.toLowerCase().includes(q))
  }), [notes, catFilter, statusFilter, search])

  const visibleFilteredByStatus = useMemo(() => notes.filter(n => {
    if (statusFilter === 'approved' && n.status !== 'approved') return false
    if (statusFilter === 'pending'  && n.status !== 'pending')  return false
    if (statusFilter === 'starred'  && !n.starred) return false
    return true
  }), [notes, statusFilter])

  const buildPayload = (f, status) => ({
    category: f.category,
    title: f.title.trim(),
    scenario: f.scenario.trim(),
    drugs: toArr(f.drugs).map(name => ({ name })),
    severity: f.severity,
    mechanism: f.mechanism.trim(),
    action: f.action.trim(),
    alternatives: f.alternatives.trim(),
    sourceRefs: toArr(f.sourceRefs),
    userMemo: f.userMemo.trim(),
    claudeNote: f.claudeNote || '',
    status,
    starred: false,
  })

  const noteToForm = (n) => ({
    ...EMPTY,
    category: n.category || 'disease',
    title: n.title || '',
    scenario: n.scenario || '',
    drugs: toCsv(n.drugs),
    severity: n.severity || 'major',
    mechanism: n.mechanism || '',
    action: n.action || '',
    alternatives: n.alternatives || '',
    sourceRefs: toCsv(n.sourceRefs),
    userMemo: n.userMemo || '',
    claudeNote: n.claudeNote || '',
  })

  const saveNew = async () => {
    if (!form.title.trim()) return
    await addDoc(collection(db, 'cautionNotes'), {
      ...buildPayload(form, 'approved'),
      source: 'manual',
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
    })
    setForm(EMPTY); setShowAdd(false)
  }

  const saveEdit = async () => {
    if (!detail) return
    const payload = buildPayload(form, detail.status || 'approved')
    delete payload.starred
    await updateDoc(doc(db, 'cautionNotes', detail.id), payload)
    setEditMode(false)
    setDetail({ ...detail, ...payload })
  }

  const approveNote = async (id, edited = null) => {
    const payload = edited
      ? { ...buildPayload(edited, 'approved'), approvedAt: serverTimestamp() }
      : { status: 'approved', approvedAt: serverTimestamp() }
    if (edited) delete payload.starred
    await updateDoc(doc(db, 'cautionNotes', id), payload)
    setDetail(null); setEditMode(false)
  }

  const rejectNote = async (id) => {
    await updateDoc(doc(db, 'cautionNotes', id), { status: 'rejected' })
    setDetail(null)
  }

  const removeNote = async (id) => {
    await deleteDoc(doc(db, 'cautionNotes', id))
    setDetail(null)
  }

  const toggleStar = async (n) => {
    await updateDoc(doc(db, 'cautionNotes', n.id), { starred: !n.starred })
    if (detail?.id === n.id) setDetail({ ...detail, starred: !n.starred })
  }

  const openDetail = (n) => {
    setDetail(n); setForm(noteToForm(n)); setEditMode(false)
  }

  const activeSourceCount = sources.filter(s => s.text && s.text.trim()).length

  const refineFromSources = async () => {
    const active = sources.filter(s => s.text && s.text.trim())
    if (active.length === 0) return
    setRefining(true); setRefineError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'refine_caution_notes',
          caseData: { sources: active.map(s => ({ label: s.label || '원문', text: s.text })) },
        }),
      })
      const rawBody = await res.text()
      let data
      try { data = JSON.parse(rawBody) }
      catch { throw new Error(`서버 응답이 JSON이 아닙니다 (HTTP ${res.status}). 본문: ${rawBody.slice(0, 200)}`) }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      const arr = Array.isArray(data.notes) ? data.notes : []
      if (arr.length === 0) throw new Error('추출된 주의 케이스 없음')
      const isMulti = active.length >= 2
      const sourceTag = isMulti ? 'multi-ai' : (active[0].label?.toLowerCase().includes('chatgpt') ? 'chatgpt-daily' : 'gemini-daily')
      await Promise.all(arr.map(n => addDoc(collection(db, 'cautionNotes'), {
        category: ['pregnancy','elderly','disease','interaction'].includes(n.category) ? n.category : 'disease',
        title: n.title || '',
        scenario: n.scenario || '',
        drugs: Array.isArray(n.drugs) ? n.drugs : [],
        severity: ['absolute','major','caution'].includes(n.severity) ? n.severity : 'major',
        mechanism: n.mechanism || '',
        action: n.action || '',
        alternatives: n.alternatives || '',
        sourceRefs: Array.isArray(n.sourceRefs) ? n.sourceRefs : [],
        claudeNote: n.claudeNote || '',
        userMemo: '',
        starred: false,
        status: 'pending',
        source: sourceTag,
        createdAt: serverTimestamp(),
      })))
      setShowAdd(false); setPasteMode(false)
      setSources([{ label: 'Gemini', text: '' }, { label: 'ChatGPT', text: '' }])
      setStatusFilter('pending')
    } catch (e) {
      setRefineError(e.message || '오류')
    } finally {
      setRefining(false)
    }
  }

  if (loading) return <Spinner />

  const closeAddSheet = () => {
    setShowAdd(false); setForm(EMPTY); setPasteMode(false); setRefineError('')
    setSources([{ label: 'Gemini', text: '' }, { label: 'ChatGPT', text: '' }])
  }

  // ── Form fields (manual / edit) ──────────────────────
  const FormFields = (
    <>
      <Field label="카테고리 *">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map(c => {
            const active = form.category === c.key
            return (
              <button key={c.key} onClick={() => setForm(p => ({ ...p, category: c.key }))}
                style={{
                  padding: '6px 12px', borderRadius: 18, border: active ? 'none' : '1px solid #e5e7eb',
                  background: active ? c.fg : c.bg, color: active ? '#fff' : c.fg,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>{c.icon} {c.label}</button>
            )
          })}
        </div>
      </Field>
      <Field label="제목 * (한 줄 요약)" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="예: 파킨슨 환자에서 metoclopramide 금기" />
      <Field label="상황·환자군" value={form.scenario} onChange={v => setForm(p => ({ ...p, scenario: v }))} placeholder="예: 파킨슨병 약물(레보도파 등) 복용 중" multiline />
      <Field label="관련 약물 (쉼표 구분)" value={form.drugs} onChange={v => setForm(p => ({ ...p, drugs: v }))} placeholder="예: 맥페란정 (metoclopramide), 돔페리돈" />
      <Field label="심각도">
        <div style={{ display: 'flex', gap: 6 }}>
          {SEVERITY.map(s => {
            const active = form.severity === s.key
            return (
              <button key={s.key} onClick={() => setForm(p => ({ ...p, severity: s.key }))}
                style={{
                  flex: 1, padding: '8px', borderRadius: 9, border: active ? 'none' : '1.5px solid #e5e7eb',
                  background: active ? s.color : s.bg, color: active ? '#fff' : s.color,
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}>{s.label}</button>
            )
          })}
        </div>
      </Field>
      <Field label="기전 (왜 위험한가)" value={form.mechanism} onChange={v => setForm(p => ({ ...p, mechanism: v }))} multiline />
      <Field label="대처 (어떻게)" value={form.action} onChange={v => setForm(p => ({ ...p, action: v }))} placeholder="예: 돔페리돈으로 대체. 부득이 시 단기간만." multiline />
      <Field label="대체약" value={form.alternatives} onChange={v => setForm(p => ({ ...p, alternatives: v }))} placeholder="예: 돔페리돈, 온단세트론" />
      <Field label="출처 (쉼표 구분)" value={form.sourceRefs} onChange={v => setForm(p => ({ ...p, sourceRefs: v }))} placeholder="예: 식약처, Beers 2023, UpToDate" multiline />
      <Field label="내 메모" value={form.userMemo} onChange={v => setForm(p => ({ ...p, userMemo: v }))} multiline />
      <Field label="Claude 검증 메모 (편집 가능)" value={form.claudeNote} onChange={v => setForm(p => ({ ...p, claudeNote: v }))} multiline />
    </>
  )

  const isMultiActive = activeSourceCount >= 2

  // ── Add Sheet ─────────────────────────────────────────
  const AddSheet = showAdd && (
    <Sheet title="주의 처방 추가" onClose={closeAddSheet}>
      {pasteMode ? (
        <>
          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 12.5, color: '#9A3412', lineHeight: 1.6, border: '1px solid #FED7AA' }}>
            🤖 Gemini · ChatGPT 등에서 받은 "주의해야 할 처방" 텍스트를 붙여넣어 자동 분류:
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li>임산부·노인·특정질환·약물상호작용 4가지로 분류</li>
              <li>심각도, 기전, 대처, 대체약 추출</li>
              <li>출처 자동 명시, 검증 메모 별도 표시</li>
            </ul>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: isMultiActive ? '#C2410C' : '#9A3412' }}>
              {isMultiActive
                ? `🔍 ${activeSourceCount}개 소스에서 통합 추출합니다`
                : '💡 1개만 채워도 동작. 2개 이상이면 통합.'}
            </div>
          </div>
          {sources.map((s, i) => (
            <div key={i} style={{ marginBottom: 10, background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>소스 {i + 1}</span>
                <input value={s.label} onChange={e => setSources(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                  placeholder="라벨"
                  style={{ flex: 1, padding: '5px 9px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
                {sources.length > 1 && (
                  <button onClick={() => setSources(p => p.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>×</button>
                )}
              </div>
              <textarea value={s.text} onChange={e => setSources(p => p.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))}
                placeholder={`${s.label || '이 소스'}에서 받은 주의 처방 정보 붙여넣기...`}
                style={{ width: '100%', minHeight: 130, padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', background: '#fff' }} />
            </div>
          ))}
          {sources.length < 4 && (
            <button onClick={() => setSources(p => [...p, { label: '소스 ' + (p.length + 1), text: '' }])}
              style={{ width: '100%', padding: '8px', borderRadius: 9, border: '1.5px dashed #FED7AA', background: '#FFF7ED', color: '#9A3412', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
              + 소스 추가
            </button>
          )}
          {refineError && <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>{refineError}</div>}
          <PrimaryButton onClick={refineFromSources} disabled={refining || activeSourceCount === 0}>
            {refining ? '추출·정리 중…' : (isMultiActive ? `✨ ${activeSourceCount}개 소스 통합 정리` : '✨ Claude로 정리')}
          </PrimaryButton>
          <button onClick={() => { setPasteMode(false); setRefineError('') }} style={ghostBtn}>직접 입력으로 전환</button>
        </>
      ) : (
        <>
          <button onClick={() => setPasteMode(true)} style={{
            width: '100%', padding: '11px', borderRadius: 10, marginBottom: 14,
            background: '#FFF7ED', border: '1.5px solid #FED7AA',
            color: '#9A3412', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 700,
          }}>📋 Gemini · ChatGPT 텍스트 붙여넣어 자동 분류</button>
          {FormFields}
          <PrimaryButton onClick={saveNew}>저장</PrimaryButton>
        </>
      )}
    </Sheet>
  )

  // ── Detail Sheet ─────────────────────────────────────
  const DetailSheet = detail && (
    <Sheet
      title={editMode ? '편집' : (detail.status === 'pending' ? '검토 대기' : '주의 처방')}
      onClose={() => { setDetail(null); setEditMode(false) }}
    >
      {editMode ? (
        <>
          {FormFields}
          {detail.status === 'pending' ? (
            <>
              <PrimaryButton onClick={() => approveNote(detail.id, form)}>수정 후 승인</PrimaryButton>
              <button onClick={() => setEditMode(false)} style={ghostBtn}>취소</button>
            </>
          ) : (
            <>
              <PrimaryButton onClick={saveEdit}>저장</PrimaryButton>
              <button onClick={() => setEditMode(false)} style={ghostBtn}>취소</button>
            </>
          )}
        </>
      ) : (
        <>
          <DetailView note={detail} onToggleStar={() => toggleStar(detail)} />
          {detail.status === 'pending' ? (
            <>
              <PrimaryButton onClick={() => approveNote(detail.id)}>승인</PrimaryButton>
              <button onClick={() => setEditMode(true)} style={ghostBtn}>수정 후 승인</button>
              <DangerButton onClick={() => rejectNote(detail.id)}>거부</DangerButton>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} style={ghostBtn}>편집</button>
              <DangerButton onClick={() => removeNote(detail.id)}>삭제</DangerButton>
            </>
          )}
        </>
      )}
    </Sheet>
  )

  // ── Card grid item ───────────────────────────────────
  const NoteCard = ({ n }) => {
    const cat = CAT_MAP[n.category] || CAT_MAP.disease
    const sev = SEV_MAP[n.severity] || SEV_MAP.major
    const drugStr = (n.drugs || []).map(d => d.name || d).join(', ')
    return (
      <div onClick={() => openDetail(n)} style={{
        background: '#fff', borderRadius: 13, padding: '14px 16px', cursor: 'pointer',
        border: '1px solid #EDF0F4', borderLeft: `3px solid ${cat.fg}`,
        transition: 'box-shadow 0.15s', position: 'relative',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <button onClick={e => { e.stopPropagation(); toggleStar(n) }}
          style={{ position: 'absolute', top: 10, right: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: n.starred ? '#F59E0B' : '#D1D5DB' }}>★</button>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6, paddingRight: 24 }}>
          <span style={{ fontSize: 11, background: cat.bg, color: cat.fg, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{cat.icon} {cat.label}</span>
          <span style={{ fontSize: 11, background: sev.bg, color: sev.color, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{sev.label}</span>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1C1917', marginBottom: 4, lineHeight: 1.4 }}>{n.title}</div>
        {drugStr && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>💊 {drugStr}</div>}
        {n.scenario && <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.scenario}</div>}
        {n.status === 'pending' && <div style={{ marginTop: 6 }}><span style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>검토 대기</span></div>}
      </div>
    )
  }

  // ── Filter / KPI strip ────────────────────────────────
  const StatusFilter = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {[
        ['approved', `등록 (${counts.전체 - counts.pending})`, '#C2410C'],
        ['pending',  `검토 대기 (${counts.pending})`, '#d97706'],
        ['starred',  `★ 별표 (${counts.starred})`, '#7c3aed'],
        ['all',      '전체', '#6b7280'],
      ].map(([k, l, color]) => {
        const active = statusFilter === k
        return (
          <button key={k} onClick={() => setStatusFilter(k)} style={{
            padding: '5px 12px', borderRadius: 20,
            border: active ? 'none' : '1px solid #e5e7eb',
            background: active ? color : '#fff', color: active ? '#fff' : '#6b7280',
            fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: active ? 700 : 500,
          }}>{l}</button>
        )
      })}
    </div>
  )

  const CategoryChips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <button onClick={() => setCatFilter('전체')} style={{
        padding: '6px 12px', borderRadius: 18,
        border: catFilter === '전체' ? 'none' : '1px solid #e5e7eb',
        background: catFilter === '전체' ? '#1C1917' : '#fff', color: catFilter === '전체' ? '#fff' : '#6b7280',
        fontSize: 12, cursor: 'pointer', fontWeight: catFilter === '전체' ? 700 : 500,
      }}>전체 ({visibleFilteredByStatus.length})</button>
      {CATEGORIES.map(c => {
        const cnt = visibleFilteredByStatus.filter(n => n.category === c.key).length
        const active = catFilter === c.key
        return (
          <button key={c.key} onClick={() => setCatFilter(c.key)} style={{
            padding: '6px 12px', borderRadius: 18,
            border: active ? 'none' : '1px solid #e5e7eb',
            background: active ? c.fg : c.bg, color: active ? '#fff' : c.fg,
            fontSize: 12, cursor: 'pointer', fontWeight: active ? 700 : 500,
          }}>{c.icon} {c.label} ({cnt})</button>
        )
      })}
    </div>
  )

  // ── Mobile ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        {counts.pending > 0 && statusFilter !== 'pending' && (
          <div style={{ margin: '12px 16px 10px', padding: '10px 14px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FBBF24', cursor: 'pointer', fontSize: 13, color: '#92400E', fontWeight: 600 }}
            onClick={() => setStatusFilter('pending')}>
            ⚠ 검토 대기 {counts.pending}건 — 클릭하여 검토
          </div>
        )}
        <div style={{ padding: '12px 16px 8px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 제목·상황·약물 검색..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ padding: '0 16px 8px' }}>{StatusFilter}</div>
        <div style={{ padding: '0 16px 10px', overflowX: 'auto' }}>{CategoryChips}</div>
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{visible.length}개</span>
          <button onClick={() => { setForm(EMPTY); setShowAdd(true) }} style={{ background: '#C2410C', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>+ 추가</button>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>⚠ 등록된 주의 처방이 없습니다</div>
            : visible.map(n => <NoteCard key={n.id} n={n} />)}
        </div>
        {AddSheet}
        {DetailSheet}
      </div>
    )
  }

  // ── Desktop ───────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100vh' }}>
      <div style={{ width: 250, background: '#fff', borderRight: '1px solid #E7E2D7', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #F3EFE7' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검색..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ padding: '12px 12px 8px' }}>{StatusFilter}</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, padding: '6px 8px' }}>카테고리</div>
          <button onClick={() => setCatFilter('전체')} style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', borderRadius: 8, border: 'none',
            background: catFilter === '전체' ? '#F9F6F1' : 'transparent',
            color: catFilter === '전체' ? '#1C1917' : '#374151',
            fontSize: 13, fontWeight: catFilter === '전체' ? 700 : 500, cursor: 'pointer', marginBottom: 2,
          }}>
            <span>전체</span>
            <span style={{ fontSize: 11, background: '#f3f4f6', color: '#9ca3af', borderRadius: 10, padding: '1px 7px' }}>{visibleFilteredByStatus.length}</span>
          </button>
          {CATEGORIES.map(c => {
            const cnt = visibleFilteredByStatus.filter(n => n.category === c.key).length
            const active = catFilter === c.key
            return (
              <button key={c.key} onClick={() => setCatFilter(c.key)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 8, border: 'none',
                background: active ? c.bg : 'transparent',
                color: active ? c.fg : '#374151',
                fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', marginBottom: 2,
              }}>
                <span>{c.icon} {c.label}</span>
                <span style={{ fontSize: 11, background: active ? c.fg : '#f3f4f6', color: active ? '#fff' : '#9ca3af', borderRadius: 10, padding: '1px 7px' }}>{cnt}</span>
              </button>
            )
          })}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #F3EFE7' }}>
          <button onClick={() => { setForm(EMPTY); setShowAdd(true) }} style={{ width: '100%', padding: '10px', background: '#C2410C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 주의 처방 추가</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#F9F6F1', padding: '24px 32px' }}>
        {counts.pending > 0 && statusFilter !== 'pending' && (
          <div style={{ marginBottom: 12, padding: '12px 16px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FBBF24', cursor: 'pointer', fontSize: 13, color: '#92400E', fontWeight: 600 }}
            onClick={() => setStatusFilter('pending')}>
            ⚠ 검토 대기 {counts.pending}건 — 클릭하여 검토
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>⚠ 주의 처방</h2>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{visible.length}개</div>
          </div>
        </div>
        {visible.length === 0
          ? <div style={{ textAlign: 'center', paddingTop: 80, color: '#9ca3af' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠</div>
              <div style={{ fontSize: 14 }}>등록된 주의 처방이 없습니다</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>+ 주의 처방 추가에서 시작하세요</div>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {visible.map(n => <NoteCard key={n.id} n={n} />)}
            </div>
        }
      </div>
      {AddSheet}
      {DetailSheet}
    </div>
  )
}

// ── Detail readonly view ──────────────────────────────
function DetailView({ note, onToggleStar }) {
  const cat = CAT_MAP[note.category] || CAT_MAP.disease
  const sev = SEV_MAP[note.severity] || SEV_MAP.major
  const drugs = (note.drugs || []).map(d => d.name || d).filter(Boolean)
  const hasValue = v => v && (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0)
  const Section = ({ icon, label, value }) => {
    if (!hasValue(value)) return null
    const text = Array.isArray(value) ? value.join(', ') : value
    return (
      <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '11px 14px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#9A3412', marginBottom: 4, fontWeight: 700 }}>{icon} {label}</div>
        <div style={{ fontSize: 13.5, color: '#1C1917', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{text}</div>
      </div>
    )
  }
  return (
    <>
      <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F3EFE7' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', lineHeight: 1.4 }}>{note.title}</span>
          <button onClick={onToggleStar} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: note.starred ? '#F59E0B' : '#D1D5DB' }}>★</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <span style={{ fontSize: 11, background: cat.bg, color: cat.fg, borderRadius: 6, padding: '2px 8px', fontWeight: 700, border: `1px solid ${cat.border}` }}>{cat.icon} {cat.label}</span>
          <span style={{ fontSize: 11, background: sev.bg, color: sev.color, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{sev.label}</span>
        </div>
      </div>
      {drugs.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#991B1B', marginBottom: 4, fontWeight: 700 }}>💊 관련 약물</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {drugs.map(d => <span key={d} style={{ fontSize: 12.5, background: '#fff', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 6, padding: '3px 9px', fontWeight: 600 }}>{d}</span>)}
          </div>
        </div>
      )}
      <Section icon="📋" label="상황·환자군"   value={note.scenario} />
      <Section icon="⚙" label="기전 (왜 위험)" value={note.mechanism} />
      <Section icon="✅" label="대처"           value={note.action} />
      <Section icon="🔄" label="대체약"         value={note.alternatives} />
      <Section icon="🔍" label="Claude 검증 메모" value={note.claudeNote} />
      <Section icon="📝" label="내 메모"        value={note.userMemo} />
      {hasValue(note.sourceRefs) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #F3EFE7' }}>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>📚 출처</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(note.sourceRefs || []).map((s, i) => {
              const isUrl = /^https?:\/\//i.test(s)
              const chip = { fontSize: 11, background: '#F4F6F9', color: '#374151', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }
              return isUrl
                ? <a key={i} href={s} target="_blank" rel="noopener noreferrer" style={{ ...chip, color: '#1d4ed8', textDecoration: 'none' }}>{s.replace(/^https?:\/\//, '').slice(0, 40)}</a>
                : <span key={i} style={chip}>{s}</span>
            })}
          </div>
        </div>
      )}
    </>
  )
}

const ghostBtn = {
  width: '100%', padding: '11px', borderRadius: 10, marginTop: 8,
  background: 'none', border: '1.5px solid #e5e7eb',
  color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 13.5, fontWeight: 600,
}
