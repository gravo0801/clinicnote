import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'
import RecallQuiz from './RecallQuiz'

const EMPTY = {
  drugName: '', genericName: '', drugClass: '',
  indication: '', dosage: '', usage: '', duration: '',
  kcdCodes: '', insuranceNote: '',
  patientCounseling: '', sideEffects: '',
  interactions: '', contraindications: '',
  pregnancy: '', pediatric: '', geriatric: '',
  renalAdjust: '', hepaticAdjust: '',
  scenarioGroup: '', sourceRefs: '', userMemo: '',
}

// CSV ↔ array helpers
const toArr = s => (s || '').split(',').map(t => t.trim()).filter(Boolean)
const toCsv = a => Array.isArray(a) ? a.join(', ') : (a || '')

// SM-2 simplified: score 0~5 → next interval
const nextInterval = (prev, score) => {
  if (score < 3) return 1
  const seq = [1, 3, 7, 14, 30, 60, 120]
  const i = seq.indexOf(prev || 0)
  return seq[Math.min(i + 1, seq.length - 1)] || 1
}

export default function DrugCardTab() {
  const isMobile = useIsMobile()
  const [cards, setCards]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('approved')   // approved | pending | starred | all
  const [classFilter, setClassFilter] = useState('전체')
  const [showAdd, setShowAdd]   = useState(false)
  const [detail, setDetail]     = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [editMode, setEditMode] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [refining, setRefining]   = useState(false)
  const [refineError, setRefineError] = useState('')
  const [claudeNote, setClaudeNote] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'drugCards'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setCards(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const pendingCount = useMemo(() => cards.filter(c => c.status === 'pending').length, [cards])
  const dueCount = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return cards.filter(c => {
      if (c.status !== 'approved') return false
      if (!c.nextReviewAt) return true
      const next = c.nextReviewAt.toDate ? c.nextReviewAt.toDate() : new Date(c.nextReviewAt)
      return next <= t
    }).length
  }, [cards])
  const starredCount = useMemo(() => cards.filter(c => c.starred).length, [cards])
  const drugClasses = useMemo(() =>
    ['전체', ...new Set(cards.map(c => c.drugClass).filter(Boolean))],
    [cards]
  )

  const visible = useMemo(() => cards.filter(c => {
    if (filter === 'pending'  && c.status !== 'pending') return false
    if (filter === 'approved' && c.status !== 'approved') return false
    if (filter === 'starred'  && !c.starred) return false
    if (classFilter !== '전체' && c.drugClass !== classFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [c.drugName, c.genericName, c.drugClass, c.indication, c.scenarioGroup, c.userMemo]
      .some(t => t?.toLowerCase().includes(q))
  }), [cards, filter, classFilter, search])

  const buildPayload = (f, status) => ({
    drugName: f.drugName.trim(),
    genericName: f.genericName.trim(),
    drugClass: f.drugClass.trim(),
    indication: f.indication.trim(),
    dosage: f.dosage.trim(),
    usage: f.usage.trim(),
    duration: f.duration.trim(),
    kcdCodes: toArr(f.kcdCodes),
    insuranceNote: f.insuranceNote.trim(),
    patientCounseling: f.patientCounseling.trim(),
    sideEffects: toArr(f.sideEffects),
    interactions: toArr(f.interactions),
    contraindications: toArr(f.contraindications),
    pregnancy: f.pregnancy.trim(),
    pediatric: f.pediatric.trim(),
    geriatric: f.geriatric.trim(),
    renalAdjust: f.renalAdjust.trim(),
    hepaticAdjust: f.hepaticAdjust.trim(),
    scenarioGroup: f.scenarioGroup.trim(),
    sourceRefs: toArr(f.sourceRefs),
    userMemo: f.userMemo.trim(),
    status,
    source: 'manual',
    claudeRefineNote: f.claudeRefineNote || '',
    starred: false,
    reviewInterval: 0,
  })

  const cardToForm = (c, scenarioGroup) => ({
    ...EMPTY,
    drugName: c.drugName || '',
    genericName: c.genericName || '',
    drugClass: c.drugClass || '',
    scenarioGroup: c.scenarioGroup || scenarioGroup || '',
    indication: c.indication || '',
    dosage: c.dosage || '',
    usage: c.usage || '',
    duration: c.duration || '',
    kcdCodes: toCsv(c.kcdCodes),
    insuranceNote: c.insuranceNote || '',
    patientCounseling: c.patientCounseling || '',
    sideEffects: toCsv(c.sideEffects),
    interactions: toCsv(c.interactions),
    contraindications: toCsv(c.contraindications),
    pregnancy: c.pregnancy || '',
    pediatric: c.pediatric || '',
    geriatric: c.geriatric || '',
    renalAdjust: c.renalAdjust || '',
    hepaticAdjust: c.hepaticAdjust || '',
    sourceRefs: toCsv(c.sourceRefs),
    userMemo: '',
    claudeRefineNote: c.claudeNote || '',
  })

  const refineFromText = async () => {
    if (!pasteText.trim()) return
    setRefining(true); setRefineError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'refine_drug_card', caseData: { rawText: pasteText } }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'refine failed')
      const scenarioGroup = data.scenarioGroup || ''
      const cardsArr = Array.isArray(data.cards) ? data.cards : []
      if (cardsArr.length === 0) throw new Error('정리된 카드가 없습니다')

      if (cardsArr.length === 1) {
        // 1개면 폼에 미리 채워서 사용자 검토 후 저장
        const f = cardToForm(cardsArr[0], scenarioGroup)
        setForm(f)
        setClaudeNote(f.claudeRefineNote || '')
        setPasteMode(false)
        setPasteText('')
      } else {
        // 여러 개면 모두 검토대기(pending)로 저장 → 사용자가 검토 탭에서 하나씩 승인
        const batch = cardsArr.map(c => {
          const f = cardToForm(c, scenarioGroup)
          return {
            ...buildPayload(f, 'pending'),
            source: 'gemini-daily',
            createdAt: serverTimestamp(),
          }
        })
        await Promise.all(batch.map(payload => addDoc(collection(db, 'drugCards'), payload)))
        setShowAdd(false); setPasteMode(false); setPasteText(''); setForm(EMPTY); setClaudeNote('')
        setFilter('pending')
      }
    } catch (e) {
      setRefineError(e.message || '오류')
    } finally {
      setRefining(false)
    }
  }

  const saveNew = async () => {
    if (!form.drugName.trim()) return
    await addDoc(collection(db, 'drugCards'), {
      ...buildPayload(form, 'approved'),
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
    })
    setForm(EMPTY)
    setShowAdd(false)
  }

  const saveEdit = async () => {
    if (!detail) return
    const payload = buildPayload(form, detail.status || 'approved')
    delete payload.source; delete payload.starred  // preserve existing
    await updateDoc(doc(db, 'drugCards', detail.id), payload)
    setEditMode(false)
    setDetail({ ...detail, ...payload })
  }

  const approveCard = async (id, edited = null) => {
    const payload = edited
      ? { ...buildPayload(edited, 'approved'), approvedAt: serverTimestamp() }
      : { status: 'approved', approvedAt: serverTimestamp() }
    if (edited) { delete payload.source; delete payload.starred }
    await updateDoc(doc(db, 'drugCards', id), payload)
    setDetail(null); setEditMode(false)
  }

  const rejectCard = async (id) => {
    await updateDoc(doc(db, 'drugCards', id), { status: 'rejected' })
    setDetail(null)
  }

  const toggleStar = async (card) => {
    await updateDoc(doc(db, 'drugCards', card.id), { starred: !card.starred })
    if (detail?.id === card.id) setDetail({ ...detail, starred: !card.starred })
  }

  const removeCard = async (id) => {
    await deleteDoc(doc(db, 'drugCards', id))
    setDetail(null)
  }

  const openDetail = (card) => {
    setDetail(card)
    setForm({
      ...EMPTY,
      ...card,
      kcdCodes: toCsv(card.kcdCodes),
      sideEffects: toCsv(card.sideEffects),
      interactions: toCsv(card.interactions),
      contraindications: toCsv(card.contraindications),
      sourceRefs: toCsv(card.sourceRefs),
    })
    setEditMode(false)
  }

  if (loading) return <Spinner />

  // ── Form fields used by both Add and Edit ─────────────────
  const FormFields = (
    <>
      <Field label="상품명 *"   value={form.drugName}    onChange={v => setForm(p => ({ ...p, drugName: v }))} placeholder="예: 오구멘틴 듀오 정" />
      <Field label="성분명"     value={form.genericName} onChange={v => setForm(p => ({ ...p, genericName: v }))} placeholder="예: amoxicillin/clavulanate" />
      <Field label="약물군"     value={form.drugClass}   onChange={v => setForm(p => ({ ...p, drugClass: v }))} placeholder="예: 베타락탐/베타락타마제 억제제" />
      <Field label="진단군 묶음" value={form.scenarioGroup} onChange={v => setForm(p => ({ ...p, scenarioGroup: v }))} placeholder="예: 급성 인두편도염" />
      <Field label="효능/적응증" value={form.indication}  onChange={v => setForm(p => ({ ...p, indication: v }))} multiline />
      <Field label="용량"       value={form.dosage}      onChange={v => setForm(p => ({ ...p, dosage: v }))} placeholder="예: 625mg 1T" />
      <Field label="용법"       value={form.usage}       onChange={v => setForm(p => ({ ...p, usage: v }))} placeholder="예: 1일 3회 식후 (tid)" />
      <Field label="처방일수"   value={form.duration}    onChange={v => setForm(p => ({ ...p, duration: v }))} placeholder="예: 5–7일" />
      <Field label="상병코드 후보 (쉼표 구분)" value={form.kcdCodes} onChange={v => setForm(p => ({ ...p, kcdCodes: v }))} placeholder="예: J03.9, J02.9" />
      <Field label="보험 메모 (고시번호·근거)" value={form.insuranceNote} onChange={v => setForm(p => ({ ...p, insuranceNote: v }))} multiline />
      <Field label="환자 설명/복약지도" value={form.patientCounseling} onChange={v => setForm(p => ({ ...p, patientCounseling: v }))} multiline />
      <Field label="부작용 (쉼표)"     value={form.sideEffects}      onChange={v => setForm(p => ({ ...p, sideEffects: v }))} />
      <Field label="약물 상호작용 (쉼표)" value={form.interactions}    onChange={v => setForm(p => ({ ...p, interactions: v }))} />
      <Field label="금기 (쉼표)"        value={form.contraindications} onChange={v => setForm(p => ({ ...p, contraindications: v }))} />
      <Field label="임산부"   value={form.pregnancy}     onChange={v => setForm(p => ({ ...p, pregnancy: v }))} placeholder="FDA Cat. / KFDA / 권고" />
      <Field label="소아"     value={form.pediatric}     onChange={v => setForm(p => ({ ...p, pediatric: v }))} multiline />
      <Field label="노인"     value={form.geriatric}     onChange={v => setForm(p => ({ ...p, geriatric: v }))} multiline />
      <Field label="신기능 보정" value={form.renalAdjust} onChange={v => setForm(p => ({ ...p, renalAdjust: v }))} multiline />
      <Field label="간기능 보정" value={form.hepaticAdjust} onChange={v => setForm(p => ({ ...p, hepaticAdjust: v }))} multiline />
      <Field label="출처 (쉼표 구분 URL/문헌)" value={form.sourceRefs} onChange={v => setForm(p => ({ ...p, sourceRefs: v }))} multiline />
      <Field label="내 임상 메모" value={form.userMemo} onChange={v => setForm(p => ({ ...p, userMemo: v }))} multiline />
    </>
  )

  // ── Detail / Edit Sheet ────────────────────────────────
  const DetailSheet = detail && (
    <Sheet
      title={editMode ? '카드 편집' : (detail.status === 'pending' ? '검토 대기 카드' : '약물 카드')}
      onClose={() => { setDetail(null); setEditMode(false) }}
    >
      {editMode ? (
        <>
          {FormFields}
          {detail.status === 'pending' ? (
            <>
              <PrimaryButton onClick={() => approveCard(detail.id, form)}>수정 후 승인</PrimaryButton>
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
          <DetailView card={detail} onToggleStar={() => toggleStar(detail)} />
          {detail.status === 'pending' ? (
            <>
              <PrimaryButton onClick={() => approveCard(detail.id)}>승인</PrimaryButton>
              <button onClick={() => setEditMode(true)} style={ghostBtn}>수정 후 승인</button>
              <DangerButton onClick={() => rejectCard(detail.id)}>거부</DangerButton>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} style={ghostBtn}>편집</button>
              <DangerButton onClick={() => removeCard(detail.id)}>삭제</DangerButton>
            </>
          )}
        </>
      )}
    </Sheet>
  )

  // ── Add Sheet ─────────────────────────────────────────
  const AddSheet = showAdd && (
    <Sheet title="약물 카드 추가" onClose={() => { setShowAdd(false); setForm(EMPTY); setPasteMode(false); setPasteText(''); setClaudeNote(''); setRefineError('') }}>
      {pasteMode ? (
        <>
          <div style={{ background: '#EDE9FE', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 12.5, color: '#5B21B6', lineHeight: 1.6 }}>
            🤖 Gemini가 보낸 약물 정보(1개~여러 개) 텍스트를 그대로 붙여넣으면, Claude가 다음을 수행합니다:
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li>약물별로 분리해 스키마 필드별로 정리</li>
              <li>누락된 임산부/소아/노인/금기 정보 보강</li>
              <li>의심스러운 상병코드는 "후보" 처리 + 심평원 재확인 안내</li>
              <li>출처 추가, 보강·수정 사항을 별도로 표시</li>
            </ul>
            <div style={{ marginTop: 6, fontSize: 11.5, opacity: 0.8 }}>
              💡 1개면 폼에 채워져 검토 후 저장. 2개 이상이면 모두 <b>검토 대기</b>로 저장돼 하나씩 승인합니다.
            </div>
          </div>
          <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
            placeholder="Gemini 응답 전체를 그대로 붙여넣기..."
            style={{ width: '100%', minHeight: 200, padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
          {refineError && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>{refineError}</div>
          )}
          <PrimaryButton onClick={refineFromText} disabled={refining || !pasteText.trim()}>
            {refining ? '정리 중…' : '✨ Claude로 정리'}
          </PrimaryButton>
          <button onClick={() => { setPasteMode(false); setPasteText(''); setRefineError('') }} style={{
            width: '100%', padding: '11px', borderRadius: 10, marginTop: 8,
            background: 'none', border: '1.5px solid #e5e7eb',
            color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 600,
          }}>직접 입력으로 전환</button>
        </>
      ) : (
        <>
          <button onClick={() => setPasteMode(true)} style={{
            width: '100%', padding: '11px', borderRadius: 10, marginBottom: 14,
            background: '#EDE9FE', border: '1.5px solid #C4B5FD',
            color: '#5B21B6', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 700,
          }}>📋 Gemini 텍스트 붙여넣어 Claude로 자동 정리</button>
          {claudeNote && (
            <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '11px 14px', marginBottom: 14, border: '1px solid #FBBF24' }}>
              <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700, marginBottom: 4 }}>🔍 Claude 검증·보강 메모</div>
              <div style={{ fontSize: 12.5, color: '#78350F', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{claudeNote}</div>
            </div>
          )}
          {FormFields}
          <PrimaryButton onClick={saveNew}>저장</PrimaryButton>
        </>
      )}
    </Sheet>
  )

  // ── Filter Bar ────────────────────────────────────────
  const FilterBar = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {[
        ['approved', `승인 (${cards.filter(c => c.status === 'approved').length})`, '#00C07F'],
        ['pending',  `검토 대기 (${pendingCount})`, '#d97706'],
        ['starred',  `★ 별표 (${starredCount})`, '#7c3aed'],
        ['all',      '전체', '#6b7280'],
      ].map(([k, l, color]) => (
        <button key={k} onClick={() => setFilter(k)} style={{
          padding: '5px 12px', borderRadius: 20,
          border: filter === k ? 'none' : '1px solid #e5e7eb',
          background: filter === k ? color : '#fff',
          color: filter === k ? '#fff' : '#6b7280',
          fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
          fontWeight: filter === k ? 700 : 500,
        }}>{l}</button>
      ))}
    </div>
  )

  // ── Card grid item ────────────────────────────────────
  const Card = ({ card }) => {
    const isPending = card.status === 'pending'
    const borderColor = isPending ? '#FBBF24' : (card.source === 'claude-daily' ? '#8B5CF6' : '#00C07F')
    return (
      <div onClick={() => openDetail(card)}
        style={{
          background: '#fff', borderRadius: 13, padding: '14px 16px', cursor: 'pointer',
          border: '1px solid #EDF0F4', borderLeft: `3px solid ${borderColor}`,
          transition: 'box-shadow 0.15s', position: 'relative',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <button onClick={e => { e.stopPropagation(); toggleStar(card) }}
          style={{
            position: 'absolute', top: 10, right: 10, border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 16, color: card.starred ? '#F59E0B' : '#D1D5DB',
          }}>★</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, paddingRight: 24 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0D1117' }}>{card.drugName}</span>
          {card.genericName && <span style={{ fontSize: 11, color: '#9ca3af' }}>{card.genericName}</span>}
        </div>
        {card.scenarioGroup && (
          <div style={{ fontSize: 11, color: '#7c3aed', background: '#F5F3FF', display: 'inline-block', borderRadius: 6, padding: '2px 8px', marginBottom: 6, fontWeight: 600 }}>
            🏥 {card.scenarioGroup}
          </div>
        )}
        {card.indication && (
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>{card.indication}</div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {card.drugClass && <span style={chipStyle('#D0F7EC', '#007A52')}>{card.drugClass}</span>}
          {isPending && <span style={chipStyle('#FEF3C7', '#92400E')}>검토 대기</span>}
          {card.source === 'claude-daily' && <span style={chipStyle('#EDE9FE', '#6D28D9')}>Claude</span>}
          {card.source === 'gemini-daily' && <span style={chipStyle('#DBEAFE', '#1E40AF')}>Gemini</span>}
        </div>
      </div>
    )
  }

  // ── Mobile ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        {pendingCount > 0 && (
          <div style={{ margin: '0 16px 10px', padding: '10px 14px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FBBF24', cursor: 'pointer', fontSize: 13, color: '#92400E', fontWeight: 600 }}
            onClick={() => setFilter('pending')}>
            ⚠ 검토 대기 {pendingCount}건 — 클릭하여 검토
          </div>
        )}
        {dueCount > 0 && (
          <div style={{ margin: '0 16px 10px', padding: '10px 14px', background: '#EDE9FE', borderRadius: 10, border: '1px solid #C4B5FD', cursor: 'pointer', fontSize: 13, color: '#5B21B6', fontWeight: 600 }}
            onClick={() => setShowQuiz(true)}>
            🧠 오늘 복습 {dueCount}개 — 클릭하여 시작
          </div>
        )}
        <div style={{ padding: '0 16px 10px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검색..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ padding: '0 16px 10px' }}>{FilterBar}</div>
        {drugClasses.length > 1 && (
          <div style={{ padding: '0 16px 10px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
              {drugClasses.map(c => (
                <button key={c} onClick={() => setClassFilter(c)} style={{
                  padding: '4px 10px', borderRadius: 16,
                  border: classFilter === c ? 'none' : '1px solid #e5e7eb',
                  background: classFilter === c ? '#0F6E56' : '#fff',
                  color: classFilter === c ? '#fff' : '#6b7280',
                  fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontWeight: classFilter === c ? 700 : 400,
                }}>{c}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{visible.length}개</span>
          <button onClick={() => { setForm(EMPTY); setShowAdd(true) }} style={{ background: '#00C07F', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ 카드 추가</button>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>💊 표시할 카드가 없습니다</div>
            : visible.map(c => <Card key={c.id} card={c} />)}
        </div>
        {AddSheet}
        {DetailSheet}
        {showQuiz && <RecallQuiz onClose={() => setShowQuiz(false)} />}
      </div>
    )
  }

  // ── Desktop ────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid #EDF0F4', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #F0F4F8' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검색..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ padding: '12px 12px 8px' }}>{FilterBar}</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, padding: '6px 8px' }}>약물군</div>
          {drugClasses.map(c => {
            const count = c === '전체' ? cards.length : cards.filter(x => x.drugClass === c).length
            const active = classFilter === c
            return (
              <button key={c} onClick={() => setClassFilter(c)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 10px', borderRadius: 8, border: 'none',
                background: active ? '#EDFFF8' : 'transparent',
                color: active ? '#00C07F' : '#374151',
                fontSize: 12.5, fontWeight: active ? 700 : 400, cursor: 'pointer', marginBottom: 2,
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
                <span style={{ fontSize: 10.5, background: active ? '#D0F7EC' : '#f3f4f6', color: active ? '#00C07F' : '#9ca3af', borderRadius: 10, padding: '1px 7px', flexShrink: 0, marginLeft: 6 }}>{count}</span>
              </button>
            )
          })}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #F0F4F8' }}>
          <button onClick={() => { setForm(EMPTY); setShowAdd(true) }} style={{ width: '100%', padding: '9px', background: '#00C07F', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ 카드 추가</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#F4F6F9', padding: '24px 32px' }}>
        {pendingCount > 0 && filter !== 'pending' && (
          <div style={{ marginBottom: 12, padding: '12px 16px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FBBF24', cursor: 'pointer', fontSize: 13, color: '#92400E', fontWeight: 600 }}
            onClick={() => setFilter('pending')}>
            ⚠ Claude/Gemini가 보낸 검토 대기 카드 {pendingCount}건 — 클릭하여 검토
          </div>
        )}
        {dueCount > 0 && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#EDE9FE', borderRadius: 10, border: '1px solid #C4B5FD', cursor: 'pointer', fontSize: 13, color: '#5B21B6', fontWeight: 600 }}
            onClick={() => setShowQuiz(true)}>
            🧠 오늘 복습 {dueCount}개 — 클릭하여 시작
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>약물 카드</h2>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{visible.length}개</div>
          </div>
        </div>
        {visible.length === 0
          ? <div style={{ textAlign: 'center', paddingTop: 80, color: '#9ca3af' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💊</div>
              <div style={{ fontSize: 14 }}>표시할 카드가 없습니다</div>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {visible.map(c => <Card key={c.id} card={c} />)}
            </div>
        }
      </div>
      {AddSheet}
      {DetailSheet}
    </div>
  )
}

// ── Detail readonly view ──────────────────────────────
function DetailView({ card, onToggleStar }) {
  const Section = ({ label, value, color = '#F8F9FB', textColor = '#0D1117' }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null
    const text = Array.isArray(value) ? value.join(', ') : value
    return (
      <div style={{ background: color, borderRadius: 10, padding: '11px 14px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13.5, color: textColor, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{text}</div>
      </div>
    )
  }
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{card.drugName}</span>
          <button onClick={onToggleStar} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: card.starred ? '#F59E0B' : '#D1D5DB' }}>★</button>
        </div>
        {card.genericName && <div style={{ fontSize: 13, color: '#6b7280' }}>{card.genericName}</div>}
        {card.drugClass && <div style={{ fontSize: 12, color: '#007A52', marginTop: 4 }}>{card.drugClass}</div>}
        {card.scenarioGroup && <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 2 }}>🏥 {card.scenarioGroup}</div>}
      </div>
      <Section label="💊 적응증"     value={card.indication} />
      <Section label="용량"           value={card.dosage} />
      <Section label="용법"           value={card.usage} />
      <Section label="처방일수"       value={card.duration} />
      <Section label="🏥 상병코드 후보 (심평원 재확인 필요)" value={card.kcdCodes} color="#FEF3C7" textColor="#92400E" />
      <Section label="보험 메모"      value={card.insuranceNote} color="#FEF3C7" textColor="#92400E" />
      <Section label="🗣 환자 설명"   value={card.patientCounseling} />
      <Section label="부작용"         value={card.sideEffects} />
      <Section label="⚠ 약물 상호작용" value={card.interactions} color="#FEE2E2" textColor="#991B1B" />
      <Section label="🚫 금기"        value={card.contraindications} color="#FEE2E2" textColor="#991B1B" />
      <Section label="🤰 임산부"      value={card.pregnancy} color="#FCE7F3" textColor="#9D174D" />
      <Section label="👶 소아"        value={card.pediatric} color="#FCE7F3" textColor="#9D174D" />
      <Section label="👴 노인"        value={card.geriatric} color="#FCE7F3" textColor="#9D174D" />
      <Section label="신기능 보정"    value={card.renalAdjust} />
      <Section label="간기능 보정"    value={card.hepaticAdjust} />
      <Section label="📚 출처"        value={card.sourceRefs} />
      <Section label="🔍 Claude 검증·보강 메모" value={card.claudeRefineNote} color="#FEF3C7" textColor="#78350F" />
      <Section label="📝 내 메모"     value={card.userMemo} color="#FAEEDA" textColor="#412402" />
    </>
  )
}

const chipStyle = (bg, fg) => ({
  fontSize: 11, background: bg, color: fg, borderRadius: 6, padding: '2px 8px', fontWeight: 600,
})

const ghostBtn = {
  width: '100%', padding: '11px', borderRadius: 10, marginTop: 8,
  background: 'none', border: '1.5px solid #e5e7eb',
  color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 13.5, fontWeight: 600,
}
