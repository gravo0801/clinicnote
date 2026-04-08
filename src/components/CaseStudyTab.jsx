import { useState, useEffect, useMemo, useRef } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'
import KcdSearch from './KcdSearch'

// ── 유틸 ──────────────────────────────────────────────────
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
  input: {
    width: '100%', padding: '9px 11px', borderRadius: 8,
    border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
    color: '#1a1a1a',
  },
  label: { display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 },
  ta: (h = 72) => ({
    width: '100%', padding: '9px 11px', borderRadius: 8,
    border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
    resize: 'vertical', minHeight: h, lineHeight: 1.65, color: '#1a1a1a',
  }),
}

// ── 약물 자동완성 인풋 ─────────────────────────────────────
function DrugAutoInput({ value, onChange, suggestions = [], placeholder = '약물명 검색...' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hits = value.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => { if (value.length >= 1) setOpen(true) }}
        placeholder={placeholder}
        style={{ ...F.input, paddingLeft: 32 }}
      />
      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>💊</span>
      {open && hits.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 400,
          background: '#fff', border: '1px solid #d1fae5', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 3, overflow: 'hidden',
        }}>
          {hits.map(n => (
            <div key={n}
              onMouseDown={e => { e.preventDefault(); onChange(n); setOpen(false) }}
              style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f9fafb', color: '#1a1a1a' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0faf5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 접이식 섹션 ────────────────────────────────────────────
const SECTION_COLORS = {
  1: { accent: '#0F6E56', bg: '#f0faf5', badge: '#0F6E56' },
  2: { accent: '#2563eb', bg: '#eff6ff', badge: '#2563eb' },
  3: { accent: '#7c3aed', bg: '#f5f3ff', badge: '#7c3aed' },
  4: { accent: '#0891b2', bg: '#ecfeff', badge: '#0891b2' },
  5: { accent: '#2563eb', bg: '#eff6ff', badge: '#2563eb' },
  6: { accent: '#d97706', bg: '#fffbeb', badge: '#d97706' },
}

function Section({ num, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const c = SECTION_COLORS[num] || SECTION_COLORS[1]
  return (
    <div style={{ border: `1px solid #e5e7eb`, borderRadius: 12, marginBottom: 10, overflow: 'visible' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', background: open ? c.bg : '#fff',
          border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: open ? '12px 12px 0 0' : 12,
          transition: 'background 0.15s',
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: '50%', background: c.badge,
          color: '#fff', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{num}</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 11, color: '#9ca3af', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '16px', background: '#fff', borderTop: `1px solid #f0ede8`, borderRadius: '0 0 12px 12px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── AI 요청 버튼 ───────────────────────────────────────────
function AiBtn({ label, emoji, loading, onClick, color = '#0F6E56' }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 8, border: 'none',
        background: loading ? '#d1d5db' : color, color: '#fff',
        fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
      }}>
      {loading
        ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />분석 중...</>
        : <>{emoji} {label}</>
      }
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}

// ── AI 결과 카드 ───────────────────────────────────────────
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
          <div style={{ fontSize: 11, color: '#3730a3', marginBottom: 5 }}>
            {p.journal} · {p.year}
            <span style={{ marginLeft: 6, background: '#ddd6fe', borderRadius: 4, padding: '1px 6px' }}>{p.level}</span>
          </div>
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
      {type === 'review' && (
        <div>
          {(() => {
            const OVERALL = { '적절': '#0F6E56', '주의필요': '#d97706', '검토필요': '#dc2626' }
            const STATUS = { ok: { bg: '#EAF3DE', color: '#27500A', icon: '✅' }, warning: { bg: '#FAEEDA', color: '#633806', icon: '⚠️' }, error: { bg: '#FCEBEB', color: '#791F1F', icon: '❌' } }
            const bg = OVERALL[data.overall] || '#0F6E56'
            return (
              <>
                <div style={{ background: bg, borderRadius: 10, padding: '11px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    {data.suggestions.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#1a1a1a', paddingLeft: 12, position: 'relative', marginBottom: 3 }}>
                        <span style={{ position: 'absolute', left: 0, color: '#0F6E56' }}>·</span>{s}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ── 케이스 상세 편집 뷰 ────────────────────────────────────
function CaseDetail({ caseDoc, drugSuggestions, onUpdate, onDelete }) {
  const [local, setLocal] = useState(() => ({
    patient: {}, workup: {}, diagnosis: { drugs: [] },
    knowledge: { images: [] }, literature: {}, revenue: {}, aiReview: null,
    ...caseDoc,
  }))
  const [saving, setSaving] = useState(false)
  const [aiLoad, setAiLoad] = useState({})
  const saveTimer = useRef(null)

  // 자동저장 (디바운스 800ms)
  const saveField = (updates) => {
    const merged = { ...local, ...updates }
    setLocal(merged)
    onUpdate(merged)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try { await updateDoc(doc(db, 'caseStudies', caseDoc.id), { ...updates, updatedAt: serverTimestamp() }) }
      finally { setSaving(false) }
    }, 800)
  }

  const setP = (k, v) => saveField({ patient: { ...local.patient, [k]: v } })
  const setV = (k, v) => saveField({ patient: { ...local.patient, vitals: { ...(local.patient.vitals || {}), [k]: v } } })
  const setW = (k, v) => saveField({ workup: { ...local.workup, [k]: v } })
  const setD = (k, v) => saveField({ diagnosis: { ...local.diagnosis, [k]: v } })
  const setK = (k, v) => saveField({ knowledge: { ...local.knowledge, [k]: v } })

  const addDrug = () => setD('drugs', [...(local.diagnosis.drugs || []), { name: '', dosage: '', usage: '', duration: '', note: '' }])
  const updDrug = (i, f, v) => {
    const drugs = (local.diagnosis.drugs || []).map((d, idx) => idx === i ? { ...d, [f]: v } : d)
    setD('drugs', drugs)
  }
  const delDrug = (i) => setD('drugs', (local.diagnosis.drugs || []).filter((_, idx) => idx !== i))

  const callAi = async (type) => {
    setAiLoad(p => ({ ...p, [type]: true }))
    try {
      const endpoint = type === 'review' ? '/api/review' : '/api/ai'
      const body = type === 'review'
        ? {
            patientAge: local.patient?.age,
            patientGender: local.patient?.gender,
            chiefComplaint: local.patient?.chiefComplaint,
            diagnosis: local.diagnosis?.impression,
            kcdCode: local.diagnosis?.kcd?.code,
            kcdName: local.diagnosis?.kcd?.name,
            drugs: local.diagnosis?.drugs || [],
            progressNote: local.workup?.history,
          }
        : { type, caseData: local }

      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      if (type === 'review') saveField({ aiReview: result })
      else if (type === 'knowledge') saveField({ knowledge: { ...local.knowledge, aiContent: result } })
      else if (type === 'papers') saveField({ literature: { aiContent: result } })
      else if (type === 'revenue') saveField({ revenue: { aiContent: result } })
    } catch (e) { alert('AI 오류: ' + e.message) }
    finally { setAiLoad(p => ({ ...p, [type]: false })) }
  }

  const handleImgUpload = async (e) => {
    const compressed = await Promise.all(Array.from(e.target.files).slice(0, 3).map(compressImage))
    const updated = [...(local.knowledge.images || []), ...compressed].slice(0, 5)
    saveField({ knowledge: { ...local.knowledge, images: updated } })
  }

  const p = local.patient || {}
  const w = local.workup || {}
  const d = local.diagnosis || {}
  const k = local.knowledge || {}
  const drugs = d.drugs || []

  return (
    <div style={{ padding: '20px 24px 60px', maxWidth: 780 }}>
      {/* 케이스 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0ede8' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{local.title || '케이스 스터디'}</div>
          <div style={{ fontSize: 12, color: saving ? '#d97706' : '#9ca3af', marginTop: 3 }}>
            {saving ? '💾 저장 중...' : '✓ 자동 저장'}
          </div>
        </div>
        <button onClick={onDelete}
          style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 8, color: '#ef4444', padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
          🗑 케이스 삭제
        </button>
      </div>

      {/* ── Section 1: 환자 정보 ── */}
      <Section num={1} title="환자 정보 및 증상" defaultOpen={true}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[['나이(세)', 'age', 'number'], ['성별', 'gender', 'text'], ['신장(cm)', 'height', 'number'], ['체중(kg)', 'weight', 'number']].map(([l, key, t]) => (
            <div key={key}>
              <label style={F.label}>{l}</label>
              <input type={t} value={p[key] || ''} onChange={e => setP(key, e.target.value)}
                placeholder="-" style={{ ...F.input, textAlign: 'center' }} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={F.label}>주호소 (Chief Complaint) *</label>
          <input value={p.chiefComplaint || ''} onChange={e => setP('chiefComplaint', e.target.value)}
            placeholder="예: 발열, 인후통 3일째" style={F.input} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={F.label}>현병력 (HPI)</label>
          <textarea value={p.hpi || ''} onChange={e => setP('hpi', e.target.value)}
            placeholder="증상 시작 시기, 경과, 악화/완화 인자, 동반 증상 등..."
            style={F.ta(76)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <label style={F.label}>과거력 / 기저질환</label>
            <textarea value={p.pmhx || ''} onChange={e => setP('pmhx', e.target.value)}
              placeholder="HTN, DM, 수술력 등" style={F.ta(60)} />
          </div>
          <div>
            <label style={F.label}>복용 약물 / 알레르기</label>
            <textarea value={p.meds || ''} onChange={e => setP('meds', e.target.value)}
              placeholder="현재 복용 약, 약물 알레르기" style={F.ta(60)} />
          </div>
        </div>

        <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '12px 14px' }}>
          <label style={{ ...F.label, marginBottom: 8 }}>활력징후 (Vital Signs)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[['BP', 'bp', 'mmHg'], ['HR', 'hr', '/min'], ['RR', 'rr', '/min'], ['BT', 'bt', '℃'], ['SpO2', 'spo2', '%']].map(([l, key, u]) => (
              <div key={key} style={{ textAlign: 'center' }}>
                <label style={{ ...F.label, textAlign: 'center', fontSize: 10 }}>{l}<span style={{ color: '#9ca3af' }}> ({u})</span></label>
                <input value={p.vitals?.[key] || ''} onChange={e => setV(key, e.target.value)}
                  placeholder="-" style={{ ...F.input, textAlign: 'center', padding: '8px 4px' }} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Section 2: 진료 사항 ── */}
      <Section num={2} title="진료 사항 (문진 및 신체검사)" defaultOpen={true}>
        <div style={{ marginBottom: 10 }}>
          <label style={F.label}>문진 내용 (Review of Systems)</label>
          <textarea value={w.history || ''} onChange={e => setW('history', e.target.value)}
            placeholder="계통별 문진, 추가 병력 청취..."
            style={F.ta(80)} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={F.label}>신체검사 소견 (Physical Examination)</label>
          <textarea value={w.physicalExam || ''} onChange={e => setW('physicalExam', e.target.value)}
            placeholder="General / HEENT / Chest / Abdomen / Extremities..."
            style={F.ta(80)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={F.label}>시행 검사 및 결과</label>
            <textarea value={w.labs || ''} onChange={e => setW('labs', e.target.value)}
              placeholder="CBC, CRP, X-ray 등..." style={F.ta(64)} />
          </div>
          <div>
            <label style={F.label}>추가 검사 / 의뢰 계획</label>
            <textarea value={w.plan || ''} onChange={e => setW('plan', e.target.value)}
              placeholder="추가 검사, 전문과 의뢰 등..." style={F.ta(64)} />
          </div>
        </div>
      </Section>

      {/* ── Section 3: 진단 및 치료 ── */}
      <Section num={3} title="진단 및 처방 (Impression & Treatment)" defaultOpen={true}>
        <div style={{ marginBottom: 12 }}>
          <label style={F.label}>진단명 (Impression)</label>
          <input value={d.impression || ''} onChange={e => setD('impression', e.target.value)}
            placeholder="예: 급성 편도염 (Acute Tonsillitis)" style={F.input} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={F.label}>상병코드 (KCD 자동완성)</label>
          <KcdSearch value={d.kcd || null} onChange={v => setD('kcd', v)} />
        </div>

        {/* 처방 약물 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ ...F.label, marginBottom: 0 }}>처방 약물 (약물명 자동완성 지원)</label>
            <button onClick={addDrug}
              style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + 약물 추가
            </button>
          </div>

          {drugs.length === 0 && (
            <div onClick={addDrug} style={{ textAlign: 'center', padding: '20px', background: '#f5f3ff', borderRadius: 10, border: '2px dashed #c4b5fd', cursor: 'pointer', color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>
              + 처방 약물을 추가하세요
            </div>
          )}

          {drugs.map((drug, i) => (
            <div key={i} style={{ background: '#f8f6f2', borderRadius: 12, padding: '14px', marginBottom: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', background: '#e5e7eb', borderRadius: 20, padding: '2px 10px' }}>약물 {i + 1}</span>
                <button onClick={() => delDrug(i)}
                  style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 6, color: '#ef4444', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                  삭제
                </button>
              </div>

              {/* 약물명 검색 */}
              <div style={{ marginBottom: 8 }}>
                <label style={F.label}>약물명</label>
                <DrugAutoInput
                  value={drug.name || ''}
                  onChange={v => updDrug(i, 'name', v)}
                  suggestions={drugSuggestions}
                  placeholder="약물명 입력 또는 검색 (처방 노하우에서 자동완성)"
                />
              </div>

              {/* 용량 / 용법 / 일수 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={F.label}>용량</label>
                  <input value={drug.dosage || ''} onChange={e => updDrug(i, 'dosage', e.target.value)}
                    placeholder="예: 1T" style={F.input} />
                </div>
                <div>
                  <label style={F.label}>용법</label>
                  <input value={drug.usage || ''} onChange={e => updDrug(i, 'usage', e.target.value)}
                    placeholder="예: 1일 3회 식후 (tid)" style={F.input} />
                </div>
                <div>
                  <label style={F.label}>일수</label>
                  <input value={drug.duration || ''} onChange={e => updDrug(i, 'duration', e.target.value)}
                    placeholder="예: 5일" style={F.input} />
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label style={F.label}>처방 팁 / 주의사항</label>
                <input value={drug.note || ''} onChange={e => updDrug(i, 'note', e.target.value)}
                  placeholder="부작용 주의, 복용법 안내 등" style={F.input} />
              </div>
            </div>
          ))}

          {drugs.length > 0 && (
            <button onClick={addDrug}
              style={{ width: '100%', padding: '9px', background: '#f5f3ff', color: '#7c3aed', border: '1px dashed #c4b5fd', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + 약물 추가
            </button>
          )}
        </div>

        {/* 비약물 치료 */}
        <div style={{ marginBottom: 16 }}>
          <label style={F.label}>처치 / 비약물 치료 / 추적 계획</label>
          <textarea value={d.nonDrug || ''} onChange={e => setD('nonDrug', e.target.value)}
            placeholder="처치 내용, 교육, 생활습관 지도, 추적 방문 계획..." style={F.ta(60)} />
        </div>

        {/* 심평원 검토 */}
        <div style={{ background: '#fef2f2', borderRadius: 10, padding: '14px', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: local.aiReview ? 8 : 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>🏥 심평원 급여기준 검토</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>진단·처방 입력 후 검토하세요</div>
            </div>
            <AiBtn label="AI 검토" emoji="🔍" loading={aiLoad.review || false} onClick={() => callAi('review')} color="#dc2626" />
          </div>
          <AiResultBlock data={local.aiReview} type="review" />
        </div>
      </Section>

      {/* ── Section 4: 의학 지식 ── */}
      <Section num={4} title="관련 의학 지식 정리" defaultOpen={false}>
        <div style={{ marginBottom: 12 }}>
          <label style={F.label}>직접 메모</label>
          <textarea value={k.text || ''} onChange={e => setK('text', e.target.value)}
            placeholder="진단 기준, 감별진단, 치료 원칙, 개인 노트 등..."
            style={F.ta(96)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={F.label}>이미지 첨부 (최대 5장)</label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#ecfeff', color: '#0891b2', border: '1px dashed #a5f3fc', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            📎 이미지 선택
            <input type="file" accept="image/*" multiple onChange={handleImgUpload} style={{ display: 'none' }} />
          </label>
          {(k.images || []).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {(k.images || []).map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <button onClick={() => { const upd = (k.images || []).filter((_, idx) => idx !== i); saveField({ knowledge: { ...k, images: upd } }) }}
                    style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <AiBtn label="AI 의학 지식 정리" emoji="🧠" loading={aiLoad.knowledge || false} onClick={() => callAi('knowledge')} color="#0891b2" />
        <AiResultBlock data={k.aiContent} type="knowledge" />
      </Section>

      {/* ── Section 5: 논문 ── */}
      <Section num={5} title="관련 논문 및 가이드라인" defaultOpen={false}>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>진단·케이스 정보를 바탕으로 관련 가이드라인 및 근거 논문을 정리합니다.</p>
        <AiBtn label="AI 논문 검색" emoji="📚" loading={aiLoad.papers || false} onClick={() => callAi('papers')} color="#2563eb" />
        <AiResultBlock data={local.literature?.aiContent} type="papers" />
      </Section>

      {/* ── Section 6: 매출 ── */}
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
    return onSnapshot(q, snap => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const selCase = cases.find(c => c.id === selId) || null

  const filtered = useMemo(() => cases.filter(c => {
    const q = search.toLowerCase()
    return !q || [c.title, c.patient?.chiefComplaint, c.diagnosis?.impression, c.diagnosis?.kcd?.code]
      .some(t => t?.toLowerCase().includes(q))
  }), [cases, search])

  const createCase = async () => {
    if (!newCC.trim()) return
    setCreating(true)
    const ref = await addDoc(collection(db, 'caseStudies'), {
      title: newTitle.trim() || newCC.trim(),
      patient: { chiefComplaint: newCC.trim() },
      diagnosis: { drugs: [] },
      knowledge: { images: [] },
      createdAt: serverTimestamp(),
    })
    setSelId(ref.id)
    setShowNew(false)
    setNewTitle(''); setNewCC(''); setCreating(false)
  }

  const deleteCase = async (id) => {
    if (!window.confirm('케이스를 삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'caseStudies', id))
    setSelId(null)
  }

  const updateCase = (updated) => {
    setCases(p => p.map(c => c.id === updated.id ? updated : c))
  }

  if (loading) return <Spinner />

  const NewCaseModal = () => (
    <Sheet title="새 케이스 생성" onClose={() => setShowNew(false)}>
      <div style={{ marginBottom: 12 }}>
        <label style={F.label}>케이스 제목 (선택)</label>
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
          placeholder="예: 급성 편도염 증례 1" style={F.input} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={F.label}>주호소 *</label>
        <input value={newCC} onChange={e => setNewCC(e.target.value)}
          placeholder="예: 발열, 인후통 3일째" style={F.input}
          onKeyDown={e => e.key === 'Enter' && createCase()} />
      </div>
      <button onClick={createCase} disabled={!newCC.trim() || creating}
        style={{ width: '100%', padding: '12px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: !newCC.trim() ? 'not-allowed' : 'pointer', opacity: !newCC.trim() ? 0.5 : 1 }}>
        {creating ? '생성 중...' : '케이스 생성 →'}
      </button>
    </Sheet>
  )

  const CaseListItem = ({ c }) => {
    const active = selId === c.id
    return (
      <div onClick={() => setSelId(c.id)}
        style={{ padding: '12px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active ? '#f0faf5' : 'transparent', border: active ? '1px solid #a7f3d0' : '1px solid transparent', transition: 'all 0.12s' }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#0F6E56' : '#1a1a1a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.title || c.patient?.chiefComplaint || '새 케이스'}
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {c.patient?.chiefComplaint && <span style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.patient.chiefComplaint}</span>}
          {c.diagnosis?.kcd?.code && <span style={{ fontSize: 10, background: '#e6f4ef', color: '#0F6E56', borderRadius: 4, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>{c.diagnosis.kcd.code}</span>}
        </div>
      </div>
    )
  }

  // ── 모바일 ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '12px 16px 10px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..."
              style={{ ...F.input, paddingLeft: 32 }} />
          </div>
        </div>
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length}건</span>
          <button onClick={() => setShowNew(true)}
            style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            ✏️ 새 케이스
          </button>
        </div>
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏥</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>케이스가 없습니다</div>
                <button onClick={() => setShowNew(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>첫 케이스 추가하기</button>
              </div>
            : filtered.map(c => (
              <div key={c.id} onClick={() => setSelId(c.id)}
                style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid #f0ede8', borderLeft: '3px solid #0F6E56', cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{c.title || c.patient?.chiefComplaint}</div>
                {c.patient?.chiefComplaint && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{c.patient.chiefComplaint}</div>}
                {c.diagnosis?.kcd && <span style={{ fontSize: 11, background: '#e6f4ef', color: '#0F6E56', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>{c.diagnosis.kcd.code} {c.diagnosis.kcd.name}</span>}
              </div>
            ))
          }
        </div>
        {showNew && <NewCaseModal />}
        {selCase && (
          <Sheet title="케이스 편집" onClose={() => setSelId(null)}>
            <CaseDetail caseDoc={selCase} drugSuggestions={drugSuggestions} onUpdate={updateCase} onDelete={() => deleteCase(selCase.id)} />
          </Sheet>
        )}
      </div>
    )
  }

  // ── 데스크탑 ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 좌측 패널 */}
      <div style={{ width: 270, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #f0ede8' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..."
              style={{ ...F.input, paddingLeft: 28, fontSize: 12 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div>케이스가 없습니다
              </div>
            : filtered.map(c => <CaseListItem key={c.id} c={c} />)
          }
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #f0ede8' }}>
          <button onClick={() => setShowNew(true)}
            style={{ width: '100%', padding: '10px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            ✏️ 새 케이스 추가
          </button>
        </div>
      </div>

      {/* 우측 상세 */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef' }}>
        {!selCase
          ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏥</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#374151', marginBottom: 8 }}>케이스 스터디</div>
              <div style={{ fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>환자 정보 → 진료 → 진단·처방 → 의학 지식까지<br />한 곳에서 정리하세요</div>
              <button onClick={() => setShowNew(true)}
                style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                ✏️ 첫 케이스 만들기
              </button>
            </div>
          : <CaseDetail
              key={selCase.id}
              caseDoc={selCase}
              drugSuggestions={drugSuggestions}
              onUpdate={updateCase}
              onDelete={() => deleteCase(selCase.id)}
            />
        }
      </div>

      {showNew && <NewCaseModal />}
    </div>
  )
}
