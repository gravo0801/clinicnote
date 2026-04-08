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

const iStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }
const taStyle = { ...iStyle, resize: 'vertical', lineHeight: 1.6 }
const labelStyle = { display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 600, letterSpacing: '0.3px' }

// ── 약물 자동완성 인풋 ─────────────────────────────────────
function DrugInput({ value, onChange, suggestions = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const filtered = value.length >= 1 ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 6) : []
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input value={value} onChange={e => { onChange(e.target.value); setOpen(true) }} onFocus={() => value.length >= 1 && setOpen(true)}
        placeholder="약물명 검색..." style={{ ...iStyle, fontSize: 12 }} />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', marginTop: 2, overflow: 'hidden' }}>
          {filtered.map(n => (
            <div key={n} onMouseDown={() => { onChange(n); setOpen(false) }}
              style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}
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

// ── 섹션 래퍼 ──────────────────────────────────────────────
function Section({ num, title, color = '#0F6E56', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = { '#0F6E56': '#f0faf5', '#2563eb': '#eff6ff', '#7c3aed': '#f5f3ff', '#d97706': '#fffbeb', '#0891b2': '#ecfeff', '#dc2626': '#fef2f2' }
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: open ? colors[color] || '#f8f8f8' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '16px', borderTop: '1px solid #f0ede8', background: '#fff' }}>{children}</div>}
    </div>
  )
}

// ── AI 버튼 ────────────────────────────────────────────────
function AiButton({ label, loading, onClick, color = '#0F6E56' }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: loading ? '#e5e7eb' : color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
      {loading ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />처리중...</> : <><span>🤖</span>{label}</>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}

// ── AI 결과 패널 ────────────────────────────────────────────
function AiResult({ data, type, onRefresh }) {
  if (!data) return null
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.3px' }}>🤖 AI 분석 결과</span>
        <button onClick={onRefresh} style={{ fontSize: 11, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}>재생성</button>
      </div>
      {type === 'knowledge' && data.sections?.map((s, i) => (
        <div key={i} style={{ background: '#f8f6f2', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F6E56', marginBottom: 4 }}>{s.title}</div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{s.content}</div>
        </div>
      ))}
      {type === 'papers' && data.papers?.map((p, i) => (
        <div key={i} style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 3 }}>{p.title}</div>
          <div style={{ fontSize: 11, color: '#3730a3', marginBottom: 5 }}>{p.journal} · {p.year} · <span style={{ background: '#ddd6fe', borderRadius: 4, padding: '1px 5px' }}>{p.level}</span></div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{p.keyPoints}</div>
        </div>
      ))}
      {type === 'revenue' && data.strategies?.map((s, i) => (
        <div key={i} style={{ background: '#fffbeb', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, background: '#d97706', color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>{s.category}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{s.title}</span>
          </div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>{s.detail}</div>
          <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>📈 {s.impact}</div>
        </div>
      ))}
    </div>
  )
}

// ── AI 심평원 검토 패널 ─────────────────────────────────────
function ReviewPanel({ caseData }) {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = async () => {
    setLoading(true); setError(null)
    try {
      const d = caseData.diagnosis || {}
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientAge: caseData.patient?.age,
          patientGender: caseData.patient?.gender,
          chiefComplaint: caseData.patient?.chiefComplaint,
          diagnosis: d.impression,
          kcdCode: d.kcd?.code,
          kcdName: d.kcd?.name,
          drugs: d.drugs || [],
          progressNote: caseData.workup?.history,
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReview(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const OVERALL = { '적절': { bg: '#0F6E56', icon: '✅' }, '주의필요': { bg: '#d97706', icon: '⚠️' }, '검토필요': { bg: '#dc2626', icon: '🔍' } }
  const STATUS = { ok: { bg: '#EAF3DE', color: '#27500A', icon: '✅' }, warning: { bg: '#FAEEDA', color: '#633806', icon: '⚠️' }, error: { bg: '#FCEBEB', color: '#791F1F', icon: '❌' } }

  if (!review && !loading) return (
    <div style={{ marginTop: 12 }}>
      {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fee2e2', borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>{error}</div>}
      <AiButton label="심평원 급여기준 검토" loading={false} onClick={request} color="#dc2626" />
      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 5 }}>처방 약물·상병코드 입력 후 검토하세요</p>
    </div>
  )
  if (loading) return <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: '#6b7280' }}>🔍 검토 중...</div>

  const om = OVERALL[review.overall] || OVERALL['적절']
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ background: om.bg, borderRadius: 10, padding: '12px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{om.icon} {review.overall}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', maxWidth: '60%', textAlign: 'right' }}>{review.summary}</div>
      </div>
      {review.items?.map((item, i) => {
        const sm = STATUS[item.status] || STATUS.ok
        return (
          <div key={i} style={{ background: sm.bg, borderRadius: 8, padding: '9px 12px', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sm.color, marginBottom: 3 }}>{sm.icon} {item.category}</div>
            <div style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5 }}>{item.comment}</div>
          </div>
        )
      })}
      {review.suggestions?.length > 0 && (
        <div style={{ background: '#f0faf5', borderRadius: 8, padding: '10px 12px', marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 6 }}>💡 제안</div>
          {review.suggestions.map((s, i) => <div key={i} style={{ fontSize: 12, color: '#1a1a1a', marginBottom: 3, paddingLeft: 10, position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>·</span>{s}</div>)}
        </div>
      )}
      <button onClick={request} style={{ marginTop: 8, width: '100%', padding: '7px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 11, color: '#6b7280', cursor: 'pointer' }}>🔄 재검토</button>
    </div>
  )
}

// ── 케이스 폼 (새 케이스 생성) ────────────────────────────
function NewCaseForm({ onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>케이스 제목 (선택)</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 급성 편도염 케이스 (비워두면 자동 생성)" style={iStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>주요 주호소 *</label>
        <input value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} placeholder="예: 발열, 인후통 3일" style={iStyle} />
      </div>
      <button onClick={() => chiefComplaint && onSave({ title: title || chiefComplaint, chiefComplaint })}
        style={{ width: '100%', padding: '11px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        케이스 생성
      </button>
    </div>
  )
}

// ── 케이스 상세 뷰 ────────────────────────────────────────
function CaseDetail({ caseDoc, drugSuggestions, onUpdate, onDelete }) {
  const [data, setData] = useState(caseDoc)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState({})
  const [images, setImages] = useState(caseDoc.knowledge?.images || [])

  const save = async (updates) => {
    const merged = { ...data, ...updates }
    setData(merged)
    setSaving(true)
    try { await updateDoc(doc(db, 'caseStudies', data.id), { ...updates, updatedAt: serverTimestamp() }) }
    finally { setSaving(false) }
    onUpdate(merged)
  }

  const setPatient = (k, v) => save({ patient: { ...data.patient, [k]: v } })
  const setWorkup = (k, v) => save({ workup: { ...data.workup, [k]: v } })
  const setDiagnosis = (k, v) => save({ diagnosis: { ...data.diagnosis, [k]: v } })
  const setKnowledge = (k, v) => save({ knowledge: { ...data.knowledge, [k]: v } })

  const updateDrug = (i, field, val) => {
    const drugs = [...(data.diagnosis?.drugs || [])]
    drugs[i] = { ...drugs[i], [field]: val }
    save({ diagnosis: { ...data.diagnosis, drugs } })
  }
  const addDrug = () => {
    const drugs = [...(data.diagnosis?.drugs || []), { name: '', dosage: '', usage: '', duration: '' }]
    save({ diagnosis: { ...data.diagnosis, drugs } })
  }
  const removeDrug = (i) => {
    const drugs = (data.diagnosis?.drugs || []).filter((_, idx) => idx !== i)
    save({ diagnosis: { ...data.diagnosis, drugs } })
  }

  const callAi = async (type) => {
    setAiLoading(p => ({ ...p, [type]: true }))
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, caseData: data }) })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      if (type === 'knowledge') save({ knowledge: { ...data.knowledge, aiContent: result } })
      else if (type === 'papers') save({ literature: { aiContent: result } })
      else if (type === 'revenue') save({ revenue: { aiContent: result } })
    } catch (e) { alert('AI 오류: ' + e.message) }
    finally { setAiLoading(p => ({ ...p, [type]: false })) }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    const compressed = await Promise.all(files.slice(0, 3).map(f => compressImage(f)))
    const updated = [...images, ...compressed].slice(0, 5)
    setImages(updated)
    save({ knowledge: { ...data.knowledge, images: updated } })
  }

  const p = data.patient || {}
  const w = data.workup || {}
  const d = data.diagnosis || {}
  const k = data.knowledge || {}

  return (
    <div style={{ padding: '20px 24px', maxWidth: 760 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' }}>{data.title || data.chiefComplaint}</h2>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{saving ? '저장 중...' : '자동 저장'}</div>
        </div>
        <button onClick={onDelete} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 7, color: '#ef4444', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>삭제</button>
      </div>

      {/* ── SECTION 1: 환자 정보 ── */}
      <Section num="1" title="환자 정보 및 증상" color="#0F6E56" defaultOpen={true}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[['나이', 'age', '세', 'number'], ['성별', 'gender', '남/여', 'text'], ['신장', 'height', 'cm', 'number'], ['체중', 'weight', 'kg', 'number']].map(([l, k, ph, t]) => (
            <div key={k}>
              <label style={labelStyle}>{l}</label>
              <input type={t} value={p[k] || ''} onChange={e => setPatient(k, e.target.value)} placeholder={ph}
                style={{ ...iStyle, fontSize: 12 }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>주호소 (Chief Complaint)</label>
          <input value={p.chiefComplaint || ''} onChange={e => setPatient('chiefComplaint', e.target.value)}
            placeholder="예: 발열, 인후통 3일째" style={iStyle} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>현병력 (History of Present Illness)</label>
          <textarea value={p.hpi || ''} onChange={e => setPatient('hpi', e.target.value)}
            placeholder="증상 시작 시기, 경과, 악화/완화 인자, 동반 증상 등..." style={{ ...taStyle, minHeight: 72 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>과거력 / 기저질환</label>
            <textarea value={p.pmhx || ''} onChange={e => setPatient('pmhx', e.target.value)} placeholder="HTN, DM, 수술력 등" style={{ ...taStyle, minHeight: 56 }} />
          </div>
          <div>
            <label style={labelStyle}>복용 약물 / 알레르기</label>
            <textarea value={p.meds || ''} onChange={e => setPatient('meds', e.target.value)} placeholder="현재 복용 약물, 약물 알레르기" style={{ ...taStyle, minHeight: 56 }} />
          </div>
        </div>
        <div style={{ background: '#f8f6f2', borderRadius: 8, padding: '10px 12px' }}>
          <label style={{ ...labelStyle, marginBottom: 8 }}>활력 징후 (Vital Signs)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[['BP', 'bp', 'mmHg'], ['HR', 'hr', '/min'], ['RR', 'rr', '/min'], ['BT', 'bt', '℃'], ['SpO2', 'spo2', '%']].map(([l, k, u]) => (
              <div key={k}>
                <label style={{ ...labelStyle, fontSize: 10 }}>{l} ({u})</label>
                <input value={p.vitals?.[k] || ''} onChange={e => setPatient('vitals', { ...p.vitals, [k]: e.target.value })}
                  placeholder="-" style={{ ...iStyle, fontSize: 12, textAlign: 'center' }} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── SECTION 2: 진료 사항 ── */}
      <Section num="2" title="진료 사항 (문진 및 신체검사)" color="#2563eb">
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>문진 사항 (Review of Systems)</label>
          <textarea value={w.history || ''} onChange={e => setWorkup('history', e.target.value)}
            placeholder="계통별 문진 내용, 추가 병력 청취 사항..." style={{ ...taStyle, minHeight: 80 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>신체검사 소견 (Physical Examination)</label>
          <textarea value={w.physicalExam || ''} onChange={e => setWorkup('physicalExam', e.target.value)}
            placeholder="General appearance, HEENT, Chest, Abdomen, Extremities 등..." style={{ ...taStyle, minHeight: 80 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>시행 검사 / 결과</label>
            <textarea value={w.labs || ''} onChange={e => setWorkup('labs', e.target.value)}
              placeholder="CBC, CMP, CRP, X-ray 등 검사 결과..." style={{ ...taStyle, minHeight: 72 }} />
          </div>
          <div>
            <label style={labelStyle}>추가 검사 계획</label>
            <textarea value={w.plan || ''} onChange={e => setWorkup('plan', e.target.value)}
              placeholder="추가로 필요한 검사, 의뢰 계획..." style={{ ...taStyle, minHeight: 72 }} />
          </div>
        </div>
      </Section>

      {/* ── SECTION 3: 진단 및 치료 ── */}
      <Section num="3" title="진단 및 치료 (Impression & Treatment)" color="#7c3aed">
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>진단명 (Impression)</label>
          <input value={d.impression || ''} onChange={e => setDiagnosis('impression', e.target.value)}
            placeholder="예: 급성 편도염 (Acute Tonsillitis)" style={iStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>상병코드 (KCD)</label>
          <KcdSearch value={d.kcd || null} onChange={v => setDiagnosis('kcd', v)} />
        </div>

        {/* 처방 약물 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={labelStyle}>처방 약물</label>
            <button onClick={addDrug} style={{ background: '#f5f3ff', color: '#7c3aed', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>+ 약물 추가</button>
          </div>
          {(d.drugs || []).length === 0
            ? <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 12, color: '#9ca3af', background: '#f8f6f2', borderRadius: 8 }}>약물을 추가하세요</div>
            : (d.drugs || []).map((drug, i) => (
              <div key={i} style={{ background: '#f8f6f2', borderRadius: 10, padding: '10px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>약물 {i + 1}</span>
                  <button onClick={() => removeDrug(i)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0 }}>삭제</button>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <DrugInput value={drug.name || ''} onChange={v => updateDrug(i, 'name', v)} suggestions={drugSuggestions} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.7fr', gap: 6, marginBottom: 6 }}>
                  <input value={drug.dosage || ''} onChange={e => updateDrug(i, 'dosage', e.target.value)} placeholder="용량 (1T)" style={{ ...iStyle, fontSize: 12 }} />
                  <input value={drug.usage || ''} onChange={e => updateDrug(i, 'usage', e.target.value)} placeholder="용법 (tid, qd...)" style={{ ...iStyle, fontSize: 12 }} />
                  <input value={drug.duration || ''} onChange={e => updateDrug(i, 'duration', e.target.value)} placeholder="일수" style={{ ...iStyle, fontSize: 12 }} />
                </div>
                <input value={drug.note || ''} onChange={e => updateDrug(i, 'note', e.target.value)} placeholder="처방 팁 / 주의사항" style={{ ...iStyle, fontSize: 12 }} />
              </div>
            ))
          }
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>처치 / 비약물 치료</label>
          <textarea value={d.nonDrug || ''} onChange={e => setDiagnosis('nonDrug', e.target.value)}
            placeholder="처치, 교육, 생활습관 지도, 추적 계획 등..." style={{ ...taStyle, minHeight: 60 }} />
        </div>

        {/* 심평원 검토 */}
        <div style={{ borderTop: '1px solid #f0ede8', paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>💊 심평원 급여기준 검토</div>
          <ReviewPanel caseData={data} />
        </div>
      </Section>

      {/* ── SECTION 4: 의학 지식 ── */}
      <Section num="4" title="관련 의학 지식 정리" color="#0891b2">
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>직접 입력 메모</label>
          <textarea value={k.text || ''} onChange={e => setKnowledge('text', e.target.value)}
            placeholder="진단 기준, 감별진단, 치료 원칙, 개인 노트 등 자유롭게 기록..." style={{ ...taStyle, minHeight: 100 }} />
        </div>

        {/* 이미지 업로드 */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>이미지 첨부 (최대 5장)</label>
          <label style={{ display: 'inline-block', padding: '7px 14px', background: '#ecfeff', color: '#0891b2', border: '1px dashed #a5f3fc', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            📎 이미지 선택
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <button onClick={() => { const upd = images.filter((_, idx) => idx !== i); setImages(upd); save({ knowledge: { ...k, images: upd } }) }}
                    style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <AiButton label="AI 의학 지식 생성" loading={aiLoading.knowledge || false} onClick={() => callAi('knowledge')} color="#0891b2" />
        <AiResult data={k.aiContent} type="knowledge" onRefresh={() => callAi('knowledge')} />
      </Section>

      {/* ── SECTION 5: 논문 검색 ── */}
      <Section num="5" title="관련 논문 및 가이드라인" color="#2563eb">
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
          진단명과 케이스 정보를 바탕으로 관련 가이드라인 및 근거 논문을 정리합니다.
        </p>
        <AiButton label="AI 논문 검색" loading={aiLoading.papers || false} onClick={() => callAi('papers')} color="#2563eb" />
        <AiResult data={data.literature?.aiContent} type="papers" onRefresh={() => callAi('papers')} />
      </Section>

      {/* ── SECTION 6: 매출 증대 ── */}
      <Section num="6" title="매출 증대 대책" color="#d97706">
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
          해당 진단과 관련하여 적법한 범위 내에서 추가 수익을 창출할 수 있는 방안을 제안합니다.
        </p>
        <AiButton label="AI 매출 전략 생성" loading={aiLoading.revenue || false} onClick={() => callAi('revenue')} color="#d97706" />
        <AiResult data={data.revenue?.aiContent} type="revenue" onRefresh={() => callAi('revenue')} />
      </Section>
    </div>
  )
}

// ── 메인 컴포넌트 ────────────────────────────────────────
export default function CaseStudyTab({ drugSuggestions = [] }) {
  const isMobile = useIsMobile()
  const [cases, setCases]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selCase, setSelCase]   = useState(null)
  const [showNew, setShowNew]   = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'caseStudies'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => cases.filter(c => {
    const q = search.toLowerCase()
    return !q || [c.title, c.patient?.chiefComplaint, c.diagnosis?.impression, c.diagnosis?.kcd?.code]
      .some(t => t?.toLowerCase().includes(q))
  }), [cases, search])

  const createCase = async (form) => {
    const ref = await addDoc(collection(db, 'caseStudies'), {
      title: form.title,
      patient: { chiefComplaint: form.chiefComplaint },
      createdAt: serverTimestamp(),
    })
    const newCase = { id: ref.id, title: form.title, patient: { chiefComplaint: form.chiefComplaint } }
    setSelCase(newCase)
    setShowNew(false)
  }

  const deleteCase = async (id) => {
    await deleteDoc(doc(db, 'caseStudies', id))
    setSelCase(null)
  }

  if (loading) return <Spinner />

  const SearchBar = (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af' }}>🔍</span>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..."
        style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
    </div>
  )

  const CaseItem = ({ c }) => {
    const active = selCase?.id === c.id
    return (
      <div onClick={() => setSelCase(c)}
        style={{ padding: '11px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active ? '#f0faf5' : 'transparent', border: active ? '1px solid #a7f3d0' : '1px solid transparent', transition: 'all 0.12s' }}>
        <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#0F6E56' : '#1a1a1a', marginBottom: 3 }}>{c.title || c.patient?.chiefComplaint || '새 케이스'}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          {c.patient?.chiefComplaint && <span>{c.patient.chiefComplaint}</span>}
          {c.diagnosis?.kcd?.code && <span style={{ marginLeft: 6, background: '#e6f4ef', color: '#0F6E56', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{c.diagnosis.kcd.code}</span>}
        </div>
      </div>
    )
  }

  // ── 모바일 ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '12px 16px 10px' }}>{SearchBar}</div>
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length}개</span>
          <button onClick={() => setShowNew(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ 케이스 추가</button>
        </div>
        <div style={{ padding: '0 16px' }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}><div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div><div style={{ fontSize: 13 }}>케이스가 없습니다</div></div>
            : filtered.map(c => <div key={c.id} onClick={() => setSelCase(c)} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid #f0ede8', borderLeft: '3px solid #0F6E56', cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{c.title || c.patient?.chiefComplaint}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{c.patient?.chiefComplaint}</div>
                {c.diagnosis?.kcd && <span style={{ fontSize: 11, background: '#e6f4ef', color: '#0F6E56', borderRadius: 4, padding: '1px 6px', marginTop: 4, display: 'inline-block', fontWeight: 600 }}>{c.diagnosis.kcd.code} {c.diagnosis.kcd.name}</span>}
              </div>)
          }
        </div>
        {showNew && (
          <Sheet title="새 케이스 생성" onClose={() => setShowNew(false)}>
            <NewCaseForm onSave={createCase} onClose={() => setShowNew(false)} />
          </Sheet>
        )}
        {selCase && (
          <Sheet title="케이스 상세" onClose={() => setSelCase(null)}>
            <CaseDetail caseDoc={selCase} drugSuggestions={drugSuggestions} onUpdate={setSelCase} onDelete={() => deleteCase(selCase.id)} />
          </Sheet>
        )}
      </div>
    )
  }

  // ── 데스크탑 ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 좌측 패널 */}
      <div style={{ width: 280, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f0ede8' }}>{SearchBar}</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}><div style={{ fontSize: 24, marginBottom: 6 }}>🏥</div>케이스가 없습니다</div>
            : filtered.map(c => <CaseItem key={c.id} c={c} />)
          }
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #f0ede8' }}>
          <button onClick={() => setShowNew(true)} style={{ width: '100%', padding: '9px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + 새 케이스 추가
          </button>
        </div>
      </div>

      {/* 우측 상세 */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef' }}>
        {!selCase
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', textAlign: 'center' }}>
              <div><div style={{ fontSize: 48, marginBottom: 14 }}>🏥</div><div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>케이스를 선택하거나 새로 추가하세요</div><div style={{ fontSize: 13 }}>환자 정보 → 진료 → 진단 → 지식 정리까지 한 곳에서</div></div>
            </div>
          : <CaseDetail key={selCase.id} caseDoc={selCase} drugSuggestions={drugSuggestions} onUpdate={c => { setSelCase(c); setCases(p => p.map(x => x.id === c.id ? c : x)) }} onDelete={() => deleteCase(selCase.id)} />
        }
      </div>

      {showNew && (
        <Sheet title="새 케이스 생성" onClose={() => setShowNew(false)}>
          <NewCaseForm onSave={createCase} onClose={() => setShowNew(false)} />
        </Sheet>
      )}
    </div>
  )
}
