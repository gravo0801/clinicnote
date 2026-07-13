import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'
import { S } from '../data/caseStudyStyles'
import DiseaseTable from './DiseaseTable'
import PrescriptionTable, { DrugViewRow, getAdministrationLabel, isInjectionDrug, normalizeDrug } from './PrescriptionTable'
import AiResult from './AiResult'

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const max = 800; let { width, height } = img
      if (width > max) { height = height * max / width; width = max }
      if (height > max) { width = width * max / height; height = max }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }; img.src = e.target.result
  }; reader.readAsDataURL(file)
})

const SCOL = ['','#C2410C','#2563eb','#7c3aed','#0891b2','#1d4ed8','#d97706']
const SBGMAP = { '#C2410C':'#FEF7F0','#2563eb':'#eff6ff','#7c3aed':'#f5f3ff','#0891b2':'#ecfeff','#1d4ed8':'#eff6ff','#d97706':'#fffbeb' }

function Section({ num, title, children, defaultOpen=true, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  const c = SCOL[num]||'#374151'; const bg = SBGMAP[c]||'#f8f8f8'
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, marginBottom:10, overflow:'visible' }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(p => !p)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', background:open?bg:'#fff', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:24, height:24, borderRadius:'50%', background:c, color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{num}</div>
        <span style={{ fontSize:13, fontWeight:700, color:'#1C1917', flex:1 }}>{title}</span>
        {badge && <span style={{ fontSize:11, background:c, color:'#fff', borderRadius:20, padding:'1px 8px', fontWeight:600 }}>{badge}</span>}
        <span aria-hidden="true" style={{ fontSize:11, color:'#9ca3af', display:'inline-block', transition:'transform 0.2s', transform:open?'rotate(180deg)':'none' }}>▼</span>
      </button>
      {open && <div style={{ padding:'16px', background:'#fff', borderTop:'1px solid #F3EFE7' }}>{children}</div>}
    </div>
  )
}

function CaseView({ data, onEdit, onDelete, onUpdateReview }) {
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewData, setReviewData] = useState(data.aiReview || null)

  const p = data.patient||{}; const w = data.workup||{}
  const dx = data.diagnosis||{}; const k = data.knowledge||{}
  const drugs = dx.drugs||[]; const diseases = dx.diseases||[]

  const Row = ({ label, value }) => value ? (
    <div style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid #f5f5f5' }}>
      <span style={{ fontSize:12, color:'#9ca3af', flexShrink:0, minWidth:90 }}>{label}</span>
      <span style={{ fontSize:13, color:'#1C1917', lineHeight:1.6, flex:1, whiteSpace:'pre-wrap' }}>{value}</span>
    </div>
  ) : null

  const [reviewError, setReviewError] = useState(null)

  const callReview = async () => {
    setReviewLoading(true)
    setReviewError(null)
    try {
      const payload = {
        patientAge: p.age, patientGender: p.gender,
        chiefComplaint: p.chiefComplaint,
        diagnosis: dx.impression,
        kcdCode: diseases[0]?.kcd?.code,
        kcdName: diseases[0]?.kcd?.name,
        drugs: (drugs || []).filter(d => d.name).map(d => ({
          name: d.name, dosage: d.dosage || '-',
          usage: `${d.freq||3}회/일 ${getAdministrationLabel(d)}`,
          duration: d.duration || '-'
        })),
        progressNote: w.history || '',
      }
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`서버 오류 (${res.status}): ${errText.slice(0, 200)}`)
      }
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setReviewData(result)
      if (onUpdateReview) onUpdateReview(result)
    } catch (e) {
      setReviewError(e.message)
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div style={{ padding:'20px 24px 100px', maxWidth:820 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, paddingBottom:14, borderBottom:'1px solid #F3EFE7' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#1C1917', marginBottom:6 }}>{data.title||'케이스 스터디'}</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {p.chiefComplaint && <span style={{ fontSize:12, background:'#FEF7F0', color:'#C2410C', borderRadius:20, padding:'2px 10px', fontWeight:600 }}>{p.chiefComplaint}</span>}
            {dx.impression && <span style={{ fontSize:12, background:'#f5f3ff', color:'#7c3aed', borderRadius:20, padding:'2px 10px', fontWeight:600 }}>{dx.impression}</span>}
            {diseases[0]?.kcd && <span style={{ fontSize:12, background:'#e6f4ef', color:'#C2410C', borderRadius:20, padding:'2px 10px', fontWeight:700 }}>{diseases[0].kcd.code} {diseases[0].kcd.name}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button type="button" onClick={onDelete}
            style={{ background:'none', border:'1px solid #fca5a5', borderRadius:8, color:'#ef4444', padding:'7px 13px', fontSize:12, cursor:'pointer', fontWeight:600 }}>
            🗑 삭제
          </button>
          <button type="button" onClick={onEdit}
            style={{ background:'#C2410C', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
             수정
          </button>
        </div>
      </div>
      {(p.age||p.chiefComplaint||p.hpi) && (
        <Section num={1} title="환자 정보 및 증상" defaultOpen={true}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
            {[['나이', p.age&&p.age+'세'],['성별',p.gender],['신장',p.height&&p.height+'cm'],['체중',p.weight&&p.weight+'kg']].filter(([,v])=>v).map(([l,v]) => (
              <div key={l} style={{ background:'#FAF7F1', borderRadius:8, padding:'7px 12px', minWidth:70, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#9ca3af', marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#1C1917' }}>{v}</div>
              </div>
            ))}
            {p.vitals && Object.entries(p.vitals).filter(([,v])=>v).map(([k,v]) => (
              <div key={k} style={{ background:'#FAF7F1', borderRadius:8, padding:'7px 12px', minWidth:60, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#9ca3af', marginBottom:2 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#1C1917' }}>{v}</div>
              </div>
            ))}
          </div>
          <Row label="주호소" value={p.chiefComplaint} />
          <Row label="현병력" value={p.hpi} />
          <Row label="과거력" value={p.pmhx} />
          <Row label="복용약/알레르기" value={p.meds} />
        </Section>
      )}
      {(w.history||w.physicalExam||w.labs) && (
        <Section num={2} title="진료 사항" defaultOpen={false}>
          <Row label="문진" value={w.history} /><Row label="신체검사" value={w.physicalExam} />
          <Row label="검사 결과" value={w.labs} /><Row label="추가 계획" value={w.plan} />
        </Section>
      )}
      {(dx.impression||diseases.length>0||drugs.filter(d=>d.name).length>0) && (
        <Section num={3} title="진단 및 처방" defaultOpen={true} badge={diseases[0]?.kcd?.code}>
          {dx.impression && <div style={{ fontSize:15, fontWeight:700, color:'#1C1917', marginBottom:10 }}>{dx.impression}</div>}
          {diseases.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6 }}>상병</div>
              {diseases.map((d,i) => d.kcd && (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, background:'#e6f4ef', color:'#C2410C', borderRadius:5, padding:'2px 8px' }}>{d.kcd.code}</span>
                  <span style={{ fontSize:13, color:'#1C1917' }}>{d.kcd.name}</span>
                  <span style={{ fontSize:11, color:'#9ca3af' }}>{d.type}</span>
                </div>
              ))}
            </div>
          )}
          {drugs.filter(d=>d.name).length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6 }}>처방 약물</div>
              {drugs.filter(d=>d.name).map((d,i) => (
                <DrugViewRow key={i} drug={d} />
              ))}
            </div>
          )}
          {dx.nonDrug && <Row label="처치/계획" value={dx.nonDrug} />}
          {/* 심평원 검토 버튼 + 결과 */}
          <div style={{ marginTop:14, background:'#fef2f2', borderRadius:10, padding:'13px', border:'1px solid #fecaca' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: (reviewData || reviewError) ? 10 : 0 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#991b1b' }}>🏥 심평원 급여기준 검토</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>상병코드·처방 기준으로 AI가 참고 검토합니다</div>
              </div>
              <button type="button" onClick={callReview} disabled={reviewLoading}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:7, border:'none', background: reviewLoading ? '#d1d5db' : '#dc2626', color:'#fff', fontSize:12, fontWeight:700, cursor: reviewLoading ? 'not-allowed' : 'pointer', flexShrink:0 }}>
                {reviewLoading
                  ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} />검토 중...</>
                  : <>{reviewData ? '🔄 재검토' : '🔍 AI 검토'}</>
                }
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>
            </div>
            {reviewError && (
              <div style={{ background:'#fee2e2', borderRadius:7, padding:'10px 12px', marginBottom:8, fontSize:12, color:'#991b1b', lineHeight:1.5 }}>
                <strong>오류:</strong> {reviewError}
                {reviewError.includes('API key') && (
                  <div style={{ marginTop:6, fontSize:11, color:'#7f1d1d' }}>
                     Vercel 환경변수에 <code style={{ background:'#fecaca', padding:'1px 4px', borderRadius:3 }}>ANTHROPIC_API_KEY</code>가 설정되어 있는지 확인하세요.
                  </div>
                )}
              </div>
            )}
            {reviewData && <AiResult data={reviewData} type="review" />}
          </div>
        </Section>
      )}
      {(k.text||k.aiContent||(k.images||[]).length>0) && (
        <Section num={4} title="관련 의학 지식" defaultOpen={false}>
          {k.text && <div style={{ fontSize:13, color:'#1C1917', lineHeight:1.75, whiteSpace:'pre-wrap', marginBottom:k.aiContent?12:0 }}>{k.text}</div>}
          {(k.images||[]).length > 0 && <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:k.aiContent?12:0 }}>{k.images.map((img,i) => <img key={i} src={img} alt="" style={{ width:120, height:120, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />)}</div>}
          {k.aiContent && <AiResult data={k.aiContent} type="knowledge" />}
        </Section>
      )}
      {data.literature?.aiContent && <Section num={5} title="관련 논문 및 가이드라인" defaultOpen={false}><AiResult data={data.literature.aiContent} type="papers" /></Section>}
      {data.revenue?.aiContent && <Section num={6} title="매출 증대 대책" defaultOpen={false}><AiResult data={data.revenue.aiContent} type="revenue" /></Section>}
    </div>
  )
}

// 케이스 편집 (edit mode) --------------------------------

function CaseEdit({ data, drugSuggestions, presets, onSave, onCancel }) {
  const isMobile = useIsMobile()
  const [form, setForm] = useState(() => {
    const diagnosis = {diseases:[],drugs:[],...(data.diagnosis||{})}
    return {
      patient:{}, workup:{}, literature:{}, revenue:{}, aiReview:null,
      ...data,
      diagnosis:{...diagnosis, drugs:(diagnosis.drugs||[]).map(normalizeDrug)},
      knowledge:{images:[],...(data.knowledge||{})},
    }
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [aiLoad, setAiLoad] = useState({})

  const setP = (k,v) => setForm(f => ({...f, patient:{...f.patient,[k]:v}}))
  const setV = (k,v) => setForm(f => ({...f, patient:{...f.patient, vitals:{...(f.patient?.vitals||{}),[k]:v}}}))
  const setW = (k,v) => setForm(f => ({...f, workup:{...f.workup,[k]:v}}))
  const setDx = (k,v) => setForm(f => ({...f, diagnosis:{...f.diagnosis,[k]:v}}))
  const setK = (k,v) => setForm(f => ({...f, knowledge:{...f.knowledge,[k]:v}}))

  const handleSave = async () => {
    const missingRoute = (form.diagnosis?.drugs||[]).find(drug =>
      drug.name && isInjectionDrug(drug.name) && getAdministrationLabel(drug) === '투여경로 미입력'
    )
    if (missingRoute) {
      setSaveError(`${missingRoute.name}의 투여경로를 선택해 주세요.`)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await updateDoc(doc(db,'caseStudies',data.id), {...form, updatedAt:serverTimestamp()})
      onSave(form)
    } catch (error) {
      setSaveError(`저장하지 못했습니다: ${error.message}`)
    }
    finally { setSaving(false) }
  }

  const callAi = async (type) => {
    setAiLoad(p => ({...p,[type]:true}))
    try {
      const dx = form.diagnosis||{}
      const isReview = type==='review'
      const res = await fetch(isReview?'/api/review':'/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(isReview ? {
          patientAge: form.patient?.age, patientGender: form.patient?.gender,
          chiefComplaint: form.patient?.chiefComplaint, diagnosis: dx.impression,
          kcdCode: dx.diseases?.[0]?.kcd?.code, kcdName: dx.diseases?.[0]?.kcd?.name,
          drugs: (dx.drugs||[]).filter(d=>d.name).map(d => ({ name:d.name, dosage:d.dosage||'-', usage:`${d.freq||3}회/일 ${getAdministrationLabel(d)}`, duration:d.duration||'-' })),
          progressNote: form.workup?.history||'',
        } : { type, caseData: form })
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`서버 오류 (${res.status}): ${errText.slice(0,200)}`)
      }
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      if (type==='review') setForm(f => ({...f, aiReview:result}))
      else if (type==='knowledge') setForm(f => ({...f, knowledge:{...f.knowledge, aiContent:result}}))
      else if (type==='papers') setForm(f => ({...f, literature:{aiContent:result}}))
      else if (type==='revenue') setForm(f => ({...f, revenue:{aiContent:result}}))
    } catch(e) { alert('AI 오류:\n' + e.message) }
    finally { setAiLoad(p => ({...p,[type]:false})) }
  }

  const handleImg = async (e) => {
    const compressed = await Promise.all(Array.from(e.target.files).slice(0,3).map(compressImage))
    const updated = [...(form.knowledge?.images||[]), ...compressed].slice(0,5)
    setK('images', updated)
  }

  const AiBtn = ({ type, label, emoji, color }) => (
    <button type="button" onClick={() => callAi(type)} disabled={aiLoad[type]}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:7, border:'none', background:aiLoad[type]?'#d1d5db':color, color:'#fff', fontSize:12, fontWeight:600, cursor:aiLoad[type]?'not-allowed':'pointer' }}>
      {aiLoad[type] ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} />분석중...</> : <>{emoji} {label}</>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )

  const p=form.patient||{}; const w=form.workup||{}; const dx=form.diagnosis||{}; const k=form.knowledge||{}

  return (
    <div style={{ padding:'20px 24px 100px', maxWidth:820 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:14, borderBottom:'1px solid #F3EFE7' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#1C1917' }}>✏️ {form.title||'케이스 편집'}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button type="button" onClick={onCancel} style={{ padding:'8px 16px', background:'none', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:'#6b7280', cursor:'pointer' }}>취소</button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ padding:'8px 20px', background:'#C2410C', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
            {saving?'저장 중...':'💾 저장 완료'}
          </button>
        </div>
      </div>
      {saveError && <div role="alert" style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, color:'#991b1b', padding:'9px 12px', marginBottom:12, fontSize:12 }}>{saveError}</div>}
      <Section num={1} title="환자 정보 및 증상" defaultOpen={true}>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr 1fr', gap:8, marginBottom:12 }}>
          {[['나이(세)','age','number'],['성별','gender','text'],['신장(cm)','height','number'],['체중(kg)','weight','number']].map(([l,key,t]) => (
            <div key={key}><label style={S.label}>{l}</label><input type={t} value={p[key]||''} onChange={e => setP(key,e.target.value)} placeholder="-" style={{ ...S.input, textAlign:'center' }} /></div>
          ))}
        </div>
        <div style={{ marginBottom:10 }}><label style={S.label}>주호소 *</label><input value={p.chiefComplaint||''} onChange={e => setP('chiefComplaint',e.target.value)} placeholder="예: 발열, 인후통 3일째" style={S.input} /></div>
        <div style={{ marginBottom:10 }}><label style={S.label}>현병력 (HPI)</label><textarea value={p.hpi||''} onChange={e => setP('hpi',e.target.value)} placeholder="증상 시작, 경과, 동반증상..." style={S.ta(72)} /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
          <div><label style={S.label}>과거력 / 기저질환</label><textarea value={p.pmhx||''} onChange={e => setP('pmhx',e.target.value)} placeholder="HTN, DM, 수술력 등" style={S.ta(56)} /></div>
          <div><label style={S.label}>복용 약물 / 알레르기</label><textarea value={p.meds||''} onChange={e => setP('meds',e.target.value)} placeholder="현재 복용 약, 알레르기" style={S.ta(56)} /></div>
        </div>
        <div style={{ background:'#FAF7F1', borderRadius:10, padding:'10px 12px' }}>
          <label style={{ ...S.label, marginBottom:8 }}>활력징후 (Vital Signs)</label>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(5,1fr)', gap:6 }}>
            {[['BP','bp','mmHg'],['HR','hr','/min'],['RR','rr','/min'],['BT','bt','C'],['SpO2','spo2','%']].map(([l,key,u]) => (
              <div key={key} style={{ textAlign:'center' }}>
                <label style={{ ...S.label, fontSize:10, textAlign:'center' }}>{l}({u})</label>
                <input value={p.vitals?.[key]||''} onChange={e => setV(key,e.target.value)} placeholder="-" style={{ ...S.input, textAlign:'center', padding:'7px 4px' }} />
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section num={2} title="진료 사항 (문진 및 신체검사)" defaultOpen={false}>
        <div style={{ marginBottom:10 }}><label style={S.label}>문진 내용</label><textarea value={w.history||''} onChange={e => setW('history',e.target.value)} placeholder="계통별 문진, 추가 병력..." style={S.ta(72)} /></div>
        <div style={{ marginBottom:10 }}><label style={S.label}>신체검사 소견</label><textarea value={w.physicalExam||''} onChange={e => setW('physicalExam',e.target.value)} placeholder="General / HEENT / Chest / Abdomen..." style={S.ta(72)} /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div><label style={S.label}>검사 결과</label><textarea value={w.labs||''} onChange={e => setW('labs',e.target.value)} placeholder="CBC, CRP, X-ray..." style={S.ta(56)} /></div>
          <div><label style={S.label}>추가 검사 / 의뢰</label><textarea value={w.plan||''} onChange={e => setW('plan',e.target.value)} placeholder="추가 검사, 전과 의뢰..." style={S.ta(56)} /></div>
        </div>
      </Section>
      <Section num={3} title="진단 및 처방" defaultOpen={true}>
        <div style={{ marginBottom:12 }}><label style={S.label}>진단명 (Impression)</label><input value={dx.impression||''} onChange={e => setDx('impression',e.target.value)} placeholder="예: 급성 편도염" style={S.input} /></div>
        <DiseaseTable diseases={dx.diseases||[]} onChange={v => setDx('diseases',v)} />
        <PrescriptionTable drugs={dx.drugs||[]} onChange={v => setDx('drugs',v)} drugSuggestions={drugSuggestions} presets={presets} />
        <div style={{ marginBottom:12 }}><label style={S.label}>처치 / 비약물 치료 / 추적 계획</label><textarea value={dx.nonDrug||''} onChange={e => setDx('nonDrug',e.target.value)} placeholder="처치 내용, 교육, 추적 계획..." style={S.ta(56)} /></div>
        <div style={{ background:'#fef2f2', borderRadius:10, padding:'13px', border:'1px solid #fecaca' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:form.aiReview?10:0 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#991b1b' }}>🏥 심평원 급여기준 검토</div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>상병코드·처방 입력 후 참고 검토하세요</div>
            </div>
            <AiBtn type="review" label="AI 검토" emoji="🔍" color="#dc2626" />
          </div>
          {form.aiReview && <AiResult data={form.aiReview} type="review" />}
        </div>
      </Section>
      <Section num={4} title="관련 의학 지식 정리" defaultOpen={false}>
        <div style={{ marginBottom:12 }}><label style={S.label}>직접 메모</label><textarea value={k.text||''} onChange={e => setK('text',e.target.value)} placeholder="진단 기준, 감별진단, 치료 원칙, 개인 노트..." style={S.ta(120)} /></div>
        <div style={{ marginBottom:12 }}>
          <label style={S.label}>이미지 첨부 (최대 5장)</label>
          <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 13px', background:'#ecfeff', color:'#0891b2', border:'1px dashed #a5f3fc', borderRadius:7, fontSize:12, cursor:'pointer', fontWeight:600 }}>
            📎 이미지 선택<input type="file" accept="image/*" multiple onChange={handleImg} style={{ display:'none' }} />
          </label>
          {(k.images||[]).length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              {k.images.map((img,i) => (
                <div key={i} style={{ position:'relative' }}>
                  <img src={img} alt="" style={{ width:80, height:80, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />
                  <button type="button" aria-label={`${i+1}번 이미지 삭제`} onClick={() => setK('images', k.images.filter((_,idx) => idx!==i))}
                    style={{ position:'absolute', top:-5, right:-5, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <AiBtn type="knowledge" label="AI 의학 지식 정리" emoji="🧠" color="#0891b2" />
        {form.knowledge?.aiContent && <AiResult data={form.knowledge.aiContent} type="knowledge" />}
      </Section>
      <Section num={5} title="관련 논문 및 가이드라인" defaultOpen={false}>
        <p style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>진단·케이스 정보를 바탕으로 관련 가이드라인 및 근거 논문을 정리합니다.</p>
        <AiBtn type="papers" label="AI 논문 검색" emoji="📚" color="#2563eb" />
        {form.literature?.aiContent && <AiResult data={form.literature.aiContent} type="papers" />}
      </Section>
      <Section num={6} title="매출 증대 대책" defaultOpen={false}>
        <p style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>해당 진단 관련, 적법한 범위 내 추가 수익 창출 방안을 제안합니다.</p>
        <AiBtn type="revenue" label="AI 전략 생성" emoji="📈" color="#d97706" />
        {form.revenue?.aiContent && <AiResult data={form.revenue.aiContent} type="revenue" />}
      </Section>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, paddingTop:16, borderTop:'1px solid #F3EFE7', marginTop:8 }}>
        <button type="button" onClick={onCancel} style={{ padding:'10px 20px', background:'none', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:'#6b7280', cursor:'pointer' }}>취소</button>
        <button type="button" onClick={handleSave} disabled={saving}
          style={{ padding:'10px 28px', background:'#C2410C', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
          {saving?'저장 중...':'💾 저장 완료'}
        </button>
      </div>
    </div>
  )
}

// 메인 -----------------------------------------------------

export default function CaseStudyTab({ drugSuggestions = [] }) {
  const isMobile = useIsMobile()
  const [cases, setCases]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selId, setSelId]       = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCC, setNewCC]       = useState('')
  const [creating, setCreating] = useState(false)
  const [presets, setPresets]   = useState([])
  const [loadError, setLoadError] = useState(null)
  const [presetError, setPresetError] = useState(null)
  const [createError, setCreateError] = useState(null)

  useEffect(() => {
    const q = query(collection(db,'caseStudies'), orderBy('createdAt','desc'))
    return onSnapshot(q,
      snap => { setCases(snap.docs.map(d => ({id:d.id,...d.data()}))); setLoading(false) },
      error => { setLoadError(error.message); setLoading(false) }
    )
  }, [])

  // 약속처방 로드
  useEffect(() => {
    const q = query(collection(db,'presetPrescriptions'), orderBy('createdAt','asc'))
    return onSnapshot(q,
      snap => setPresets(snap.docs.map(d => ({id:d.id,...d.data()}))),
      error => setPresetError(error.message)
    )
  }, [])

  const selCase = cases.find(c => c.id===selId)||null
  const filtered = useMemo(() => cases.filter(c => {
    const q = search.toLowerCase()
    return !q || [c.title,c.patient?.chiefComplaint,c.diagnosis?.impression,c.diagnosis?.diseases?.[0]?.kcd?.code].some(t=>t?.toLowerCase().includes(q))
  }), [cases, search])

  const createCase = async () => {
    if (!newCC.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const ref = await addDoc(collection(db,'caseStudies'), {
        title: newTitle.trim()||newCC.trim(), patient:{chiefComplaint:newCC.trim()},
        diagnosis:{diseases:[],drugs:[]}, knowledge:{images:[]}, createdAt:serverTimestamp(),
      })
      setSelId(ref.id); setEditMode(true); setShowNew(false); setNewTitle(''); setNewCC('')
    } catch (error) {
      setCreateError(`케이스를 생성하지 못했습니다: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  const deleteCase = async (id) => {
    if (!window.confirm('케이스를 삭제하시겠습니까?')) return
    await deleteDoc(doc(db,'caseStudies',id)); setSelId(null); setEditMode(false)
  }

  const handleSaved = (updated) => {
    setCases(p => p.map(c => c.id===updated.id ? {...c,...updated} : c)); setEditMode(false)
  }

  if (loading) return <Spinner />
  if (loadError) return <div role="alert" style={{ margin:24, padding:16, borderRadius:10, background:'#fee2e2', color:'#991b1b' }}>케이스를 불러오지 못했습니다: {loadError}</div>

  const newModalJsx = showNew ? (
    <Sheet title="새 케이스 생성" onClose={() => setShowNew(false)}>
      <div style={{ marginBottom:12 }}>
        <label style={S.label}>케이스 제목 (선택)</label>
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="예: 급성 편도염 증례 1" style={S.input} autoFocus />
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={S.label}>주호소 *</label>
        <input value={newCC} onChange={e => setNewCC(e.target.value)} placeholder="예: 발열, 인후통 3일째" style={S.input} onKeyDown={e => e.key==='Enter'&&createCase()} />
      </div>
      {createError && <div role="alert" style={{ marginBottom:12, padding:'8px 10px', borderRadius:7, background:'#fee2e2', color:'#991b1b', fontSize:12 }}>{createError}</div>}
      <button type="button" onClick={createCase} disabled={!newCC.trim()||creating}
        style={{ width:'100%', padding:'12px', background:'#C2410C', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:!newCC.trim()?'not-allowed':'pointer', opacity:!newCC.trim()?0.5:1 }}>
        {creating?'생성 중...':'케이스 생성 →'}
      </button>
    </Sheet>
  ) : null
  const presetErrorJsx = presetError ? (
    <div role="alert" style={{ margin:'8px 16px', padding:'8px 10px', borderRadius:7, background:'#fff7ed', color:'#9a3412', fontSize:11 }}>
      약속처방을 불러오지 못했습니다: {presetError}
    </div>
  ) : null

  const renderListItem = (c) => {
    const active = selId===c.id; const kcd = c.diagnosis?.diseases?.[0]?.kcd
    return (
      <button type="button" key={c.id} onClick={() => { setSelId(c.id); setEditMode(false) }}
        style={{ width:'100%', padding:'11px 12px', borderRadius:10, cursor:'pointer', marginBottom:4, background:active?'#FEF7F0':'transparent', border:active?'1px solid #FDBA74':'1px solid transparent', transition:'all 0.12s', textAlign:'left', fontFamily:'inherit' }}>
        <div style={{ fontSize:13, fontWeight:active?700:500, color:active?'#C2410C':'#1C1917', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
          {c.title||c.patient?.chiefComplaint||'새 케이스'}
        </div>
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          {c.patient?.chiefComplaint && <span style={{ fontSize:11, color:'#9ca3af', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.patient.chiefComplaint}</span>}
          {kcd && <span style={{ fontSize:10, background:'#e6f4ef', color:'#C2410C', borderRadius:4, padding:'1px 5px', fontWeight:700, flexShrink:0 }}>{kcd.code}</span>}
        </div>
      </button>
    )
  }

  if (isMobile) {
    return (
      <div style={{ paddingBottom:32 }}>
        <div style={{ padding:'12px 16px 10px' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#9ca3af' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..." aria-label="케이스 검색" style={{ ...S.input, paddingLeft:32 }} />
          </div>
        </div>
        <div style={{ padding:'0 16px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#9ca3af' }}>{filtered.length}건</span>
          <button type="button" onClick={() => setShowNew(true)} style={{ background:'#C2410C', color:'#fff', border:'none', borderRadius:20, padding:'7px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }}>✏️ 새 케이스</button>
        </div>
        {presetErrorJsx}
        <div style={{ padding:'0 16px' }}>
          {filtered.length===0
            ? <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🏥</div>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>케이스가 없습니다</div>
                <button type="button" onClick={() => setShowNew(true)} style={{ background:'#C2410C', color:'#fff', border:'none', borderRadius:20, padding:'8px 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}>첫 케이스 추가하기</button>
              </div>
            : filtered.map(c => renderListItem(c))
          }
        </div>
        {newModalJsx}
        {selCase&&!editMode && <Sheet title="케이스 보기" onClose={() => setSelId(null)}>
          <CaseView data={selCase} onEdit={() => setEditMode(true)}
            onDelete={() => deleteCase(selCase.id)}
            onUpdateReview={async (result) => {
              await updateDoc(doc(db,'caseStudies',selCase.id), { aiReview: result, updatedAt: serverTimestamp() })
              setCases(p => p.map(c => c.id===selCase.id ? {...c, aiReview: result} : c))
            }} />
        </Sheet>}
        {selCase&&editMode && <Sheet title="케이스 편집" onClose={() => setEditMode(false)}><CaseEdit data={selCase} drugSuggestions={drugSuggestions} presets={presets} onSave={handleSaved} onCancel={() => setEditMode(false)} /></Sheet>}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <div style={{ width:265, background:'#fff', borderRight:'1px solid #E7E2D7', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'14px 12px 10px', borderBottom:'1px solid #F3EFE7' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#9ca3af' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..." aria-label="케이스 검색" style={{ ...S.input, paddingLeft:28, fontSize:12 }} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {filtered.length===0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af', fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>🏥</div>케이스가 없습니다</div>
            : filtered.map(c => renderListItem(c))}
        </div>
        <div style={{ padding:'12px', borderTop:'1px solid #F3EFE7' }}>
          <button type="button" onClick={() => setShowNew(true)} style={{ width:'100%', padding:'10px', background:'#C2410C', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>✏️ 새 케이스 추가</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', background:'#F9F6F1' }}>
        {presetErrorJsx}
        {!selCase
          ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🏥</div>
              <div style={{ fontSize:17, fontWeight:700, color:'#374151', marginBottom:8 }}>케이스 스터디</div>
              <div style={{ fontSize:13, marginBottom:24, lineHeight:1.6 }}>환자 정보 → 진료 → 진단·처방 → 의학 지식<br />한 곳에서 정리하고 저장하세요</div>
              <button type="button" onClick={() => setShowNew(true)} style={{ background:'#C2410C', color:'#fff', border:'none', borderRadius:20, padding:'10px 24px', fontSize:14, fontWeight:700, cursor:'pointer' }}>✏️ 첫 케이스 만들기</button>
            </div>
          : editMode
            ? <CaseEdit key={selCase.id+'_edit'} data={selCase} drugSuggestions={drugSuggestions} presets={presets} onSave={handleSaved} onCancel={() => setEditMode(false)} />
            : <CaseView key={selCase.id+'_view'} data={selCase} onEdit={() => setEditMode(true)}
                onDelete={() => deleteCase(selCase.id)}
                onUpdateReview={async (result) => {
                  await updateDoc(doc(db,'caseStudies',selCase.id), { aiReview: result, updatedAt: serverTimestamp() })
                  setCases(p => p.map(c => c.id===selCase.id ? {...c, aiReview: result} : c))
                }} />
        }
      </div>
      {newModalJsx}
    </div>
  )
}
