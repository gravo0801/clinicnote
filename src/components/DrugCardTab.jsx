import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'
import RecallQuiz from './RecallQuiz'

const SYSTEM_CATEGORIES = [
  '소화기', '호흡기', '순환기', '비뇨생식기', '근골격·통증', '신경',
  '피부', '내분비·대사', '정신·수면', '이비인후', '안과', '산부인과',
  '알레르기·면역', '감염', '영양·일반',
]
const UNCATEGORIZED = '미분류'

const EMPTY = {
  drugName: '', genericName: '', drugClass: '', koreanBrands: '',
  systemCategory: '', subCategories: '',
  indication: '', dosage: '', usage: '', duration: '',
  kcdCodes: '', insuranceNote: '',
  patientCounseling: '', sideEffects: '',
  interactions: '', contraindications: '',
  pregnancy: '', pediatric: '', geriatric: '',
  renalAdjust: '', hepaticAdjust: '',
  scenarioGroup: '', sourceRefs: '', userMemo: '',
  claudeRefineNote: '', claudeComparisonNote: '',
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
  const [systemFilter, setSystemFilter] = useState('전체')   // 대분류
  const [subFilter, setSubFilter]       = useState('전체')   // 소분류
  const [classifying, setClassifying]   = useState(false)
  const [classifyError, setClassifyError] = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [detail, setDetail]     = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [editMode, setEditMode] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [sources, setSources]     = useState([
    { label: 'Gemini',  text: '' },
    { label: 'ChatGPT', text: '' },
  ])
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

  // 카드 그룹화: systemCategory별로 카드 수, 그 안에서 사용된 subCategories 수집
  const categoryTree = useMemo(() => {
    const tree = {}
    cards.forEach(c => {
      const sc = c.systemCategory || UNCATEGORIZED
      if (!tree[sc]) tree[sc] = { count: 0, subs: {} }
      tree[sc].count += 1
      ;(c.subCategories || []).forEach(sub => {
        if (!sub) return
        tree[sc].subs[sub] = (tree[sc].subs[sub] || 0) + 1
      })
    })
    return tree
  }, [cards])

  // 정렬: 표준 분류 순서 → 그 외 → 미분류 마지막
  const orderedSystemCats = useMemo(() => {
    const present = Object.keys(categoryTree)
    const ordered = SYSTEM_CATEGORIES.filter(c => present.includes(c))
    const extras = present.filter(c => !SYSTEM_CATEGORIES.includes(c) && c !== UNCATEGORIZED).sort()
    return [...ordered, ...extras, ...(present.includes(UNCATEGORIZED) ? [UNCATEGORIZED] : [])]
  }, [categoryTree])

  // 현재 systemFilter에서 사용 가능한 소분류
  const subOptions = useMemo(() => {
    if (systemFilter === '전체') return []
    const subs = categoryTree[systemFilter]?.subs || {}
    return Object.entries(subs).sort((a, b) => b[1] - a[1])
  }, [categoryTree, systemFilter])

  const unclassifiedCount = (categoryTree[UNCATEGORIZED]?.count) || 0

  const visible = useMemo(() => cards.filter(c => {
    if (filter === 'pending'  && c.status !== 'pending') return false
    if (filter === 'approved' && c.status !== 'approved') return false
    if (filter === 'starred'  && !c.starred) return false
    if (systemFilter !== '전체') {
      const sc = c.systemCategory || UNCATEGORIZED
      if (sc !== systemFilter) return false
      if (subFilter !== '전체' && !(c.subCategories || []).includes(subFilter)) return false
    }
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [c.drugName, c.genericName, c.drugClass, c.indication, c.scenarioGroup, c.userMemo, c.systemCategory, ...(c.subCategories || [])]
      .some(t => t?.toLowerCase().includes(q))
  }), [cards, filter, systemFilter, subFilter, search])

  const buildPayload = (f, status) => ({
    drugName: f.drugName.trim(),
    genericName: f.genericName.trim(),
    drugClass: f.drugClass.trim(),
    koreanBrands: toArr(f.koreanBrands),
    systemCategory: f.systemCategory?.trim() || '',
    subCategories: toArr(f.subCategories),
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
    claudeComparisonNote: f.claudeComparisonNote || '',
    starred: false,
    reviewInterval: 0,
  })

  const cardToForm = (c, scenarioGroup) => ({
    ...EMPTY,
    drugName: c.drugName || '',
    genericName: c.genericName || '',
    drugClass: c.drugClass || '',
    koreanBrands: toCsv(c.koreanBrands),
    systemCategory: c.systemCategory || '',
    subCategories: toCsv(c.subCategories),
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
    claudeRefineNote: c.claudeNote || c.claudeRefineNote || '',
    claudeComparisonNote: c.claudeComparisonNote || '',
  })

  const refineFromText = async () => {
    const activeSources = sources.filter(s => s.text && s.text.trim())
    if (activeSources.length === 0) return
    setRefining(true); setRefineError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'refine_drug_card',
          caseData: { sources: activeSources.map(s => ({ label: s.label || '원문', text: s.text })) },
        }),
      })
      const rawBody = await res.text()
      let data
      try { data = JSON.parse(rawBody) }
      catch {
        throw new Error(`서버 응답이 JSON이 아닙니다 (HTTP ${res.status}). 본문: ${rawBody.slice(0, 200)}`)
      }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      const scenarioGroup = data.scenarioGroup || ''
      const cardsArr = Array.isArray(data.cards) ? data.cards : []
      if (cardsArr.length === 0) throw new Error('정리된 카드가 없습니다')

      const isMultiSource = activeSources.length >= 2
      const sourceTag = isMultiSource ? 'multi-ai' : (activeSources[0].label?.toLowerCase().includes('chatgpt') ? 'chatgpt-daily' : 'gemini-daily')

      if (cardsArr.length === 1) {
        // 1개면 폼에 미리 채워서 사용자 검토 후 저장
        const f = cardToForm(cardsArr[0], scenarioGroup)
        setForm(f)
        setClaudeNote(f.claudeRefineNote || '')
        setPasteMode(false)
        setSources([{ label: 'Gemini', text: '' }, { label: 'ChatGPT', text: '' }])
      } else {
        // 여러 개면 모두 검토대기(pending)로 저장 → 사용자가 검토 탭에서 하나씩 승인
        const batch = cardsArr.map(c => {
          const f = cardToForm(c, scenarioGroup)
          return {
            ...buildPayload(f, 'pending'),
            source: sourceTag,
            createdAt: serverTimestamp(),
          }
        })
        await Promise.all(batch.map(payload => addDoc(collection(db, 'drugCards'), payload)))
        setShowAdd(false); setPasteMode(false); setForm(EMPTY); setClaudeNote('')
        setSources([{ label: 'Gemini', text: '' }, { label: 'ChatGPT', text: '' }])
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

  const classifyUnclassified = async () => {
    const targets = cards.filter(c => !c.systemCategory)
    if (targets.length === 0) return
    setClassifying(true); setClassifyError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'classify_drug_cards',
          caseData: {
            items: targets.map(c => ({
              id: c.id,
              drugName: c.drugName, genericName: c.genericName,
              indication: c.indication, scenarioGroup: c.scenarioGroup,
            })),
          },
        }),
      })
      const rawBody = await res.text()
      let data
      try { data = JSON.parse(rawBody) }
      catch { throw new Error(`서버 응답이 JSON이 아닙니다 (HTTP ${res.status}). 본문: ${rawBody.slice(0, 200)}`) }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      const map = new Map((data.results || []).map(r => [r.id, r]))
      await Promise.all(targets.map(c => {
        const r = map.get(c.id)
        if (!r) return Promise.resolve()
        return updateDoc(doc(db, 'drugCards', c.id), {
          systemCategory: r.systemCategory || '',
          subCategories: Array.isArray(r.subCategories) ? r.subCategories : [],
        })
      }))
    } catch (e) {
      setClassifyError(e.message || '오류')
    } finally {
      setClassifying(false)
    }
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
      <Field label="동일성분 시판 상품 (쉼표 구분)" value={form.koreanBrands} onChange={v => setForm(p => ({ ...p, koreanBrands: v }))} placeholder="예: 오구멘틴, 크라목신, 아모크라" />
      <Field label="대분류 (계통)">
        <select value={form.systemCategory} onChange={e => setForm(p => ({ ...p, systemCategory: e.target.value }))}
          style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">— 선택 —</option>
          {SYSTEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="소분류 (진단·증상, 쉼표 구분)" value={form.subCategories} onChange={v => setForm(p => ({ ...p, subCategories: v }))} placeholder="예: GERD, 속쓰림, 소화불량" />
      <Field label="약물군 (선택)"     value={form.drugClass}   onChange={v => setForm(p => ({ ...p, drugClass: v }))} placeholder="예: 베타락탐/베타락타마제 억제제" />
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
      <Field label="Claude 검증·보강 메모 (편집 가능)" value={form.claudeRefineNote} onChange={v => setForm(p => ({ ...p, claudeRefineNote: v }))} multiline />
      <Field label="Claude 비교 메모 (소스 간 차이)" value={form.claudeComparisonNote} onChange={v => setForm(p => ({ ...p, claudeComparisonNote: v }))} multiline />
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
  const closeAddSheet = () => {
    setShowAdd(false); setForm(EMPTY); setPasteMode(false)
    setSources([{ label: 'Gemini', text: '' }, { label: 'ChatGPT', text: '' }])
    setClaudeNote(''); setRefineError('')
  }
  const activeSourceCount = sources.filter(s => s.text && s.text.trim()).length
  const isMultiActive = activeSourceCount >= 2

  const AddSheet = showAdd && (
    <Sheet title="약물 카드 추가" onClose={closeAddSheet}>
      {pasteMode ? (
        <>
          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 12.5, color: '#9A3412', lineHeight: 1.6, border: '1px solid #FED7AA' }}>
            🤖 Gemini · ChatGPT 등에서 받은 약물 정보를 각각의 칸에 붙여넣어 보세요.
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li>약물별로 분리해 스키마 필드별로 정리</li>
              <li>누락된 임산부/소아/노인/금기·상호작용 보강</li>
              <li>상병코드는 "후보" 처리 + 심평원 재확인 안내 자동 추가</li>
              <li>한국 시판 상품명·출처 강화</li>
            </ul>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: isMultiActive ? '#C2410C' : '#9A3412' }}>
              {isMultiActive
                ? `🔍 ${activeSourceCount}개 소스를 비교·병합합니다 (일치·불일치 항목을 자동 메모)`
                : '💡 1개 소스만 채워도 동작합니다. 2개 이상이면 자동 비교·병합.'}
            </div>
          </div>

          {sources.map((s, i) => (
            <div key={i} style={{ marginBottom: 10, background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>소스 {i + 1}</span>
                <input value={s.label} onChange={e => setSources(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                  placeholder="라벨 (Gemini, ChatGPT, ...)"
                  style={{ flex: 1, padding: '5px 9px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
                {sources.length > 1 && (
                  <button onClick={() => setSources(p => p.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>×</button>
                )}
              </div>
              <textarea value={s.text} onChange={e => setSources(p => p.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))}
                placeholder={`${s.label || '이 소스'}에서 받은 약물 정보 전체를 그대로 붙여넣기...`}
                style={{ width: '100%', minHeight: 130, padding: '9px 11px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', background: '#fff' }} />
            </div>
          ))}

          {sources.length < 4 && (
            <button onClick={() => setSources(p => [...p, { label: '소스 ' + (p.length + 1), text: '' }])}
              style={{ width: '100%', padding: '8px', borderRadius: 9, border: '1.5px dashed #FED7AA', background: '#FFF7ED', color: '#9A3412', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
              + 소스 추가
            </button>
          )}

          {refineError && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 10 }}>{refineError}</div>
          )}
          <PrimaryButton onClick={refineFromText} disabled={refining || activeSourceCount === 0}>
            {refining
              ? (isMultiActive ? '비교·병합 정리 중…' : '정리 중…')
              : (isMultiActive ? `✨ Claude로 ${activeSourceCount}개 소스 통합 정리` : '✨ Claude로 정리')}
          </PrimaryButton>
          <button onClick={() => { setPasteMode(false); setRefineError('') }} style={{
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
            background: '#FFF7ED', border: '1.5px solid #FED7AA',
            color: '#9A3412', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 700,
          }}>📋 Gemini · ChatGPT 텍스트 붙여넣어 Claude로 정리·병합</button>
          {claudeNote && (
            <div style={{ background: '#FAF7F1', borderRadius: 10, padding: '11px 14px', marginBottom: 14, border: '1px solid #F3EFE7' }}>
              <div style={{ fontSize: 11, color: '#9A3412', fontWeight: 700, marginBottom: 4 }}>🔍 Claude 검증·보강 메모</div>
              <div style={{ fontSize: 12.5, color: '#1C1917', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{claudeNote}</div>
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
    const borderColor = isPending ? '#FBBF24' : (card.source === 'multi-ai' ? '#1d4ed8' : (card.source === 'claude-daily' ? '#8B5CF6' : '#C2410C'))
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {card.systemCategory && <span style={chipStyle('#FFEDD5', '#9A3412')}>📂 {card.systemCategory}</span>}
          {(card.subCategories || []).slice(0, 3).map(s => (
            <span key={s} style={chipStyle('#FEF7F0', '#C2410C')}>{s}</span>
          ))}
        </div>
        {card.indication && (
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>{card.indication}</div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {isPending && <span style={chipStyle('#FEF3C7', '#92400E')}>검토 대기</span>}
          {card.source === 'multi-ai' && <span style={chipStyle('#EFF6FF', '#1D4ED8')}>🔀 통합</span>}
          {card.source === 'claude-daily' && <span style={chipStyle('#EDE9FE', '#6D28D9')}>Claude</span>}
          {card.source === 'gemini-daily' && <span style={chipStyle('#DBEAFE', '#1E40AF')}>Gemini</span>}
          {card.source === 'chatgpt-daily' && <span style={chipStyle('#DCFCE7', '#166534')}>ChatGPT</span>}
          {!!(card.claudeComparisonNote && String(card.claudeComparisonNote).trim()) && <span style={chipStyle('#EFF6FF', '#1D4ED8')} title="소스 간 차이 메모 있음">⚖</span>}
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
        {/* 대분류 칩 */}
        <div style={{ padding: '0 16px 8px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
            {['전체', ...orderedSystemCats].map(c => {
              const count = c === '전체' ? cards.length : (categoryTree[c]?.count || 0)
              const active = systemFilter === c
              return (
                <button key={c} onClick={() => { setSystemFilter(c); setSubFilter('전체') }} style={{
                  padding: '5px 11px', borderRadius: 16,
                  border: active ? 'none' : '1px solid #e5e7eb',
                  background: active ? '#166534' : '#fff',
                  color: active ? '#fff' : '#6b7280',
                  fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontWeight: active ? 700 : 400,
                }}>{c} ({count})</button>
              )
            })}
          </div>
        </div>
        {/* 소분류 칩 */}
        {systemFilter !== '전체' && subOptions.length > 0 && (
          <div style={{ padding: '0 16px 10px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
              {[['전체', null], ...subOptions].map(([s, n]) => {
                const active = subFilter === s
                return (
                  <button key={s} onClick={() => setSubFilter(s)} style={{
                    padding: '4px 10px', borderRadius: 16,
                    border: active ? 'none' : '1px solid #e5e7eb',
                    background: active ? '#7c3aed' : '#F5F3FF',
                    color: active ? '#fff' : '#7c3aed',
                    fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                    fontWeight: active ? 700 : 500,
                  }}>{s}{n != null ? ` (${n})` : ''}</button>
                )
              })}
            </div>
          </div>
        )}
        {unclassifiedCount > 0 && (systemFilter === '전체' || systemFilter === UNCATEGORIZED) && (
          <div style={{ padding: '0 16px 10px' }}>
            <button onClick={classifyUnclassified} disabled={classifying}
              style={{ width: '100%', padding: '9px', borderRadius: 10, border: '1.5px dashed #C4B5FD', background: '#FAF5FF', color: '#5B21B6', fontWeight: 600, fontSize: 12, cursor: classifying ? 'wait' : 'pointer' }}>
              {classifying ? 'Claude로 분류 중…' : `🤖 미분류 ${unclassifiedCount}개를 Claude로 자동 분류`}
            </button>
            {classifyError && <div style={{ marginTop: 6, fontSize: 11, color: '#991B1B' }}>{classifyError}</div>}
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
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, padding: '6px 8px' }}>계통 (대분류)</div>
          {[['전체', cards.length], ...orderedSystemCats.map(c => [c, categoryTree[c]?.count || 0])].map(([c, count]) => {
            const active = systemFilter === c
            return (
              <div key={c} style={{ marginBottom: 2 }}>
                <button onClick={() => { setSystemFilter(c); setSubFilter('전체') }} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 10px', borderRadius: 8, border: 'none',
                  background: active ? '#DCFCE7' : 'transparent',
                  color: active ? '#166534' : '#374151',
                  fontSize: 12.5, fontWeight: active ? 700 : 400, cursor: 'pointer',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
                  <span style={{ fontSize: 10.5, background: active ? '#86EFAC' : '#f3f4f6', color: active ? '#166534' : '#9ca3af', borderRadius: 10, padding: '1px 7px', flexShrink: 0, marginLeft: 6 }}>{count}</span>
                </button>
                {/* 활성 대분류 아래에 소분류 칩 펼침 */}
                {active && c !== '전체' && subOptions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 10px 4px' }}>
                    {[['전체', null], ...subOptions].map(([s, n]) => {
                      const sActive = subFilter === s
                      return (
                        <button key={s} onClick={() => setSubFilter(s)} style={{
                          padding: '3px 9px', borderRadius: 12,
                          border: sActive ? 'none' : '1px solid #e9d5ff',
                          background: sActive ? '#7c3aed' : '#F5F3FF',
                          color: sActive ? '#fff' : '#7c3aed',
                          fontSize: 10.5, cursor: 'pointer', whiteSpace: 'nowrap',
                          fontWeight: sActive ? 700 : 500,
                        }}>{s}{n != null ? ` ${n}` : ''}</button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {unclassifiedCount > 0 && (
            <div style={{ padding: '10px 8px 4px' }}>
              <button onClick={classifyUnclassified} disabled={classifying}
                style={{ width: '100%', padding: '8px', borderRadius: 9, border: '1.5px dashed #C4B5FD', background: '#FAF5FF', color: '#5B21B6', fontWeight: 600, fontSize: 11, cursor: classifying ? 'wait' : 'pointer', lineHeight: 1.4 }}>
                {classifying ? 'Claude로 분류 중…' : `🤖 미분류 ${unclassifiedCount}개\n자동 분류`}
              </button>
              {classifyError && <div style={{ marginTop: 4, fontSize: 10.5, color: '#991B1B' }}>{classifyError}</div>}
            </div>
          )}
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
  // 표준 cream/orange 톤. 위험 정보(금기·상호작용)만 빨강 alert.
  const hasValue = (v) => v && (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0)
  const asText = (v) => Array.isArray(v) ? v.join(', ') : (v || '')

  const Section = ({ icon, label, value }) => {
    if (!hasValue(value)) return null
    return (
      <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '11px 14px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#9A3412', marginBottom: 4, fontWeight: 700 }}>{icon} {label}</div>
        <div style={{ fontSize: 13.5, color: '#1C1917', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{asText(value)}</div>
      </div>
    )
  }

  const QuadCell = ({ label, value }) => (
    <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 8, padding: '9px 10px', minHeight: 56 }}>
      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: '#1C1917', lineHeight: 1.5, fontWeight: 600 }}>{asText(value) || '—'}</div>
    </div>
  )

  const hasRisk = hasValue(card.contraindications) || hasValue(card.interactions)
  const hasSpecial = hasValue(card.pregnancy) || hasValue(card.pediatric) || hasValue(card.geriatric) || hasValue(card.renalAdjust) || hasValue(card.hepaticAdjust)
  const hasInsurance = hasValue(card.kcdCodes) || hasValue(card.insuranceNote)
  const koreanBrands = Array.isArray(card.koreanBrands) ? card.koreanBrands : []

  return (
    <>
      {/* ── 헤더 ── */}
      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #F3EFE7' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1C1917', letterSpacing: '-0.3px' }}>{card.drugName}</span>
          <button onClick={onToggleStar} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: card.starred ? '#F59E0B' : '#D1D5DB' }}>★</button>
        </div>
        {card.genericName && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{card.genericName}</div>}
        {card.drugClass && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{card.drugClass}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          {card.systemCategory && <span style={chipStyle('#FFEDD5', '#9A3412')}>📂 {card.systemCategory}</span>}
          {(card.subCategories || []).map(s => (
            <span key={s} style={chipStyle('#FEF7F0', '#C2410C')}>{s}</span>
          ))}
        </div>
        {koreanBrands.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>동일성분 시판</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {koreanBrands.map(b => <span key={b} style={chipStyle('#F4F6F9', '#374151')}>{b}</span>)}
            </div>
          </div>
        )}
        {card.scenarioGroup && <div style={{ fontSize: 11.5, color: '#C2410C', marginTop: 8 }}>🏥 {card.scenarioGroup}</div>}
      </div>

      {/* ── ⚡ 한눈에 (적응증·용량·용법·일수) ── */}
      {(hasValue(card.indication) || hasValue(card.dosage) || hasValue(card.usage) || hasValue(card.duration)) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#9A3412', fontWeight: 700, marginBottom: 6 }}>⚡ 한눈에</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <QuadCell label="적응증" value={card.indication} />
            <QuadCell label="용량"   value={card.dosage} />
            <QuadCell label="용법"   value={card.usage} />
            <QuadCell label="일수"   value={card.duration} />
          </div>
        </div>
      )}

      {/* ── 🚨 위험·금기 (위험 정보만 빨강 alert) ── */}
      {hasRisk && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '11px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 700, marginBottom: 6 }}>🚨 위험·주의</div>
          {hasValue(card.contraindications) && (
            <div style={{ marginBottom: hasValue(card.interactions) ? 6 : 0 }}>
              <div style={{ fontSize: 10.5, color: '#991B1B', fontWeight: 700, marginBottom: 2 }}>🚫 금기</div>
              <div style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{asText(card.contraindications)}</div>
            </div>
          )}
          {hasValue(card.interactions) && (
            <div>
              <div style={{ fontSize: 10.5, color: '#991B1B', fontWeight: 700, marginBottom: 2 }}>⚠ 약물 상호작용</div>
              <div style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{asText(card.interactions)}</div>
            </div>
          )}
        </div>
      )}

      <Section icon="🗣" label="환자 설명" value={card.patientCounseling} />
      <Section icon="💢" label="부작용" value={card.sideEffects} />

      {/* ── 🤰 특수집단 (접기/펼치기) ── */}
      {hasSpecial && (
        <details style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
          <summary style={{ fontSize: 11.5, color: '#9A3412', fontWeight: 700, cursor: 'pointer', listStyle: 'none' }}>🤰 특수집단 (임산부·소아·노인·신/간기능)</summary>
          <div style={{ marginTop: 10 }}>
            <Section icon="🤰" label="임산부" value={card.pregnancy} />
            <Section icon="👶" label="소아" value={card.pediatric} />
            <Section icon="👴" label="노인" value={card.geriatric} />
            <Section icon="🫘" label="신기능 보정" value={card.renalAdjust} />
            <Section icon="🫀" label="간기능 보정" value={card.hepaticAdjust} />
          </div>
        </details>
      )}

      {/* ── 🏥 보험 ── */}
      {hasInsurance && (
        <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '11px 14px', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#9A3412', fontWeight: 700, marginBottom: 6 }}>🏥 보험 (심평원 고시 재확인 필수)</div>
          {hasValue(card.kcdCodes) && (
            <div style={{ marginBottom: hasValue(card.insuranceNote) ? 8 : 0 }}>
              <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>상병코드 후보</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(card.kcdCodes || []).map(k => <span key={k} style={chipStyle('#FFEDD5', '#9A3412')}>{k}</span>)}
              </div>
            </div>
          )}
          {hasValue(card.insuranceNote) && (
            <div style={{ fontSize: 12.5, color: '#1C1917', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{card.insuranceNote}</div>
          )}
        </div>
      )}

      {/* ── Claude 메모 ── */}
      <Section icon="🔍" label="Claude 검증·보강 메모" value={card.claudeRefineNote} />
      {hasValue(card.claudeComparisonNote) && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '11px 14px', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 700, marginBottom: 4 }}>🔀 Claude 소스 비교 메모</div>
          <div style={{ fontSize: 13, color: '#1E3A8A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{card.claudeComparisonNote}</div>
        </div>
      )}
      <Section icon="📝" label="내 임상 메모" value={card.userMemo} />

      {/* ── 출처 chips ── */}
      {hasValue(card.sourceRefs) && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #F3EFE7' }}>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>📚 출처</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(card.sourceRefs || []).map((s, i) => {
              const isUrl = /^https?:\/\//i.test(s)
              return isUrl
                ? <a key={i} href={s} target="_blank" rel="noopener noreferrer" style={{ ...chipStyle('#F4F6F9', '#1d4ed8'), textDecoration: 'none' }}>{s.replace(/^https?:\/\//, '').slice(0, 40)}</a>
                : <span key={i} style={chipStyle('#F4F6F9', '#374151')}>{s}</span>
            })}
          </div>
        </div>
      )}
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
