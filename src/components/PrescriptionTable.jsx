import { useState, useEffect, useMemo, useRef } from 'react'
import { S } from '../data/caseStudyStyles'
import { COMMON_DRUGS } from '../data/commonDrugs'
import { PresetSelector } from './PresetRxTab'
import DrugInteractionChecker from './DrugInteractionChecker'
import { Sheet } from './ui'

const ORAL_USAGES = ['식후','식전','식간','취침전','필요시']
const INJECTION_ROUTES = [
  { value:'IM', label:'IM(근육주사)' },
  { value:'SC', label:'SC(피하주사)' },
  { value:'IV', label:'IV(정맥주사)' },
  { value:'IA', label:'IA(관절강내)' },
  { value:'ID', label:'ID(피내주사)' },
]
const LEGACY_INJECTION_ROUTES = Object.fromEntries(INJECTION_ROUTES.map(({ value, label }) => [label, value]))
const INJ_KEYWORDS = ['주사','[INJ','injection','프롤리아','포스테오','엔브렐','휴미라','오젬픽','위고비','마운자로','빅토자','트루리시티','란투스','투제오','트레시바','레버미르','노보래피드','휴마로그','아피드라','바이에타','클렉산','이노헵','헤파린','루크린','졸레드론','본비바','콜레칼시페롤','아쿠아디트림','비타민B12주','에포에틴','뉴라스타','데포프로베라','레파타','프라루엔트','조마야','EPO']

const createDrugId = () => globalThis.crypto?.randomUUID?.() || `drug-${Date.now()}-${Math.random().toString(36).slice(2)}`
const isInjectionDrug = (name = '') => INJ_KEYWORDS.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))
const getInjectionRoute = (drug = {}) => drug.route || LEGACY_INJECTION_ROUTES[drug.usage] || ''
const getRouteLabel = (route) => INJECTION_ROUTES.find(item => item.value === route)?.label || route
const getAdministrationLabel = (drug = {}) => isInjectionDrug(drug.name)
  ? getRouteLabel(getInjectionRoute(drug)) || '투여경로 미입력'
  : drug.usage || '식후'

const normalizeDrug = (drug = {}) => isInjectionDrug(drug.name)
  ? { ...drug, id:drug.id || createDrugId(), route:getInjectionRoute(drug), usage:'', covered:drug.covered !== false }
  : { ...drug, id:drug.id || createDrugId(), route:drug.route || 'PO', usage:drug.usage || '식후', covered:drug.covered !== false }

function DrugAutoInput({ value, onChange, suggestions = [], showInfo = false }) {
  const [open, setOpen] = useState(false)
  const [selectedFromList, setSelectedFromList] = useState(false)
  const [showDrugModal, setShowDrugModal] = useState(false)
  const wrapRef = useRef(null)

  const allSuggestions = useMemo(() => [...new Set([...suggestions, ...COMMON_DRUGS])], [suggestions])
  const hits = useMemo(() =>
    value.length >= 1
      ? allSuggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 10)
      : []
  , [value, allSuggestions])

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleChange = v => {
    onChange(v); setSelectedFromList(false); setOpen(v.length >= 1)
  }
  const select = name => { onChange(name); setSelectedFromList(true); setOpen(false) }

  return (
    <div ref={wrapRef} style={{ position:'relative', display:'flex', alignItems:'center', gap:4 }}>
      <div style={{ flex:1, position:'relative' }}>
        <input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (value.length >= 1) setOpen(true) }}
          placeholder="약품명 입력/검색..."
          aria-label="약품명 입력 또는 검색"
          style={S.cell}
        />
        {/* 드롭다운: z-index 높게, position absolute */}
        {open && hits.length > 0 && (
          <div style={{
            position:'absolute', top:'100%', left:0, minWidth:260, width:'max-content', maxWidth:360,
            zIndex:9999, background:'#fff', border:'1px solid #FED7AA', borderRadius:7,
            boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:260, overflowY:'auto',
          }}>
            {hits.map(n => (
              <button type="button" key={n} onClick={() => select(n)}
                style={{ width:'100%', padding:'9px 12px', fontSize:12, cursor:'pointer', border:'none', borderBottom:'1px solid #f0f0f0', background:'#fff', textAlign:'left', color:'#1C1917', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background='#FEF7F0'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                <span>💊</span><span>{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {showInfo && (
        <>
          {selectedFromList && value
            ? <button type="button" onClick={() => setShowDrugModal(true)}
                title={`"${value}" 약물 정보 조회`}
                style={{ flexShrink:0, fontSize:11, color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:5, padding:'3px 7px', fontWeight:700, whiteSpace:'nowrap', cursor:'pointer' }}>
                정보조회
              </button>
            : <span style={{ flexShrink:0, fontSize:11, color:'#d1d5db', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:5, padding:'3px 7px', fontWeight:600, whiteSpace:'nowrap', cursor:'not-allowed' }} title="목록에서 선택 후 활성화">정보조회</span>
          }
          {showDrugModal && value && (
            <DrugInfoModal drugName={value} onClose={() => setShowDrugModal(false)} />
          )}
        </>
      )}
    </div>
  )
}

// 상병코드 자동완성 셀 ----------------------------------

function DrugInfoModal({ drugName, onClose }) {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/druginfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drugName }),
        })
        if (!cancelled) {
          if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          setInfo(data)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch_()
    return () => { cancelled = true }
  }, [drugName])

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const rows = info ? [
    ['분류', info.category],
    ['적응증', info.indication],
    ['성인 용량', info.dosage],
    ['소아 용량', info.pediatricDosage],
    ['부작용', info.sideEffects],
    ['금기', info.contraindication],
    ['약물 상호작용', info.interaction],
    ['심평원 급여기준', info.insuranceCoverage],
    ['임부 안전성', info.pregnancyCategory],
    ['처방 주의사항', info.precaution],
  ].filter(([, v]) => v) : []

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="drug-info-title" style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:540, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #F3EFE7', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
          <div>
            <div id="drug-info-title" style={{ fontSize:17, fontWeight:700, color:'#1C1917', marginBottom:3 }}>{drugName}</div>
            {info && <div style={{ fontSize:12, color:'#6b7280' }}>{info.engName} · {info.category}</div>}
          </div>
          <button type="button" aria-label="약물 정보 닫기" onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#9ca3af', lineHeight:1, flexShrink:0, marginLeft:10 }}>✕</button>
        </div>
        {/* 본문 */}
        <div style={{ overflowY:'auto', padding:'16px 20px 24px' }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ width:28, height:28, border:'3px solid #e5e7eb', borderTopColor:'#C2410C', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
              <div style={{ fontSize:13, color:'#6b7280' }}>약물 정보를 불러오는 중...</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {error && (
            <div style={{ background:'#fee2e2', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#991b1b' }}>
              ⚠️ {error}
            </div>
          )}
          {info && rows.map(([label, value]) => (
            <div key={label} style={{ marginBottom:12, paddingBottom:12, borderBottom:'1px solid #f5f5f5' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.4px' }}>{label}</div>
              <div style={{ fontSize:13, color:'#1C1917', lineHeight:1.7 }}>{value}</div>
            </div>
          ))}
          {/* 면책 고지 */}
          {info && (
            <div style={{ fontSize:11, color:'#9ca3af', background:'#FAF7F1', borderRadius:7, padding:'8px 10px', marginTop:8, lineHeight:1.6 }}>
              ⚠️ 본 정보는 AI 생성 참고 자료이며 실제 처방은 최신 허가사항을 확인하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PrescriptionTable({ drugs, onChange, drugSuggestions = [], presets = [] }) {
  const [showPresets, setShowPresets] = useState(false)
  const add = () => onChange([...drugs, normalizeDrug({ name:'', dosage:'1T', freq:'3', duration:'', route:'PO', usage:'식후', covered:true, note:'' })])
  const remove = (i) => onChange(drugs.filter((_,idx) => idx !== i))
  const upd = (i,f,v) => onChange(drugs.map((d,idx) => idx===i ? {...d,[f]:v} : d))

  // 단축키 처리: #keyword 입력시 프리셋 삽입
  const handleDrugNameChange = (i, v) => {
    if (v.startsWith('#')) {
      const shortcut = v.slice(1).toLowerCase()
      const preset = presets.find(p => p.shortcut?.toLowerCase() === shortcut)
      if (preset && preset.drugs?.length > 0) {
        const newDrugs = [...drugs.slice(0, i), ...preset.drugs.map(normalizeDrug), ...drugs.slice(i+1)]
        onChange(newDrugs); return
      }
    }
    const previous = drugs[i] || {}
    const wasInjection = isInjectionDrug(previous.name)
    const willBeInjection = isInjectionDrug(v)
    const next = { ...previous, name:v }
    if (!wasInjection && willBeInjection) {
      next.route = ''
      next.usage = ''
    } else if (wasInjection && !willBeInjection) {
      next.route = 'PO'
      next.usage = '식후'
    }
    onChange(drugs.map((drug, index) => index === i ? next : drug))
  }

  // 약속처방 삽입
  const insertPreset = (preset) => {
    const newDrugs = [...drugs, ...(preset.drugs||[]).map(normalizeDrug)]
    onChange(newDrugs); setShowPresets(false)
  }

  const allSuggestions = useMemo(() => [...new Set([...drugSuggestions, ...COMMON_DRUGS])], [drugSuggestions])

  return (
    <div style={{ border:'1px solid #d1d5db', borderRadius:8, overflow:'visible', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'#eef2ff', borderBottom:'1px solid #d1d5db' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#3730a3' }}>처방</span>
        <div style={{ display:'flex', gap:6 }}>
          <button type="button" onClick={() => setShowPresets(true)}
            style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            📋 약속처방
          </button>
          <button type="button" onClick={add} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ 추가</button>
        </div>
      </div>
      {presets.length > 0 && (
        <div style={{ padding:'5px 10px', background:'#f5f3ff', fontSize:11, color:'#6d28d9', borderBottom:'1px solid #e9d5ff' }}>
          💡 단축키: {presets.filter(p => p.shortcut).slice(0,4).map(p => `#${p.shortcut}(${p.name})`).join(' · ')}
          {presets.filter(p => p.shortcut).length > 4 && ' ...'}
        </div>
      )}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:560 }}>
          <thead><tr>
            <th style={S.TH(28)}></th>
            <th style={{ ...S.TH(), textAlign:'left', minWidth:180 }}>약품명 (목록↓ 선택 → 정보링크 활성)</th>
            <th style={S.TH(60)}>용량</th><th style={S.TH(60)}>횟수</th>
            <th style={S.TH(55)}>일수</th><th style={S.TH(90)}>용법/경로</th><th style={S.TH(44)}>급여</th>
          </tr></thead>
          <tbody>
            {drugs.length === 0
              ? <tr><td colSpan={7} style={{ padding:0, borderBottom:'1px solid #eee' }}>
                  <button type="button" onClick={add}
                    style={{ width:'100%', padding:'16px', textAlign:'center', color:'#9ca3af', fontSize:12, cursor:'pointer', border:'none', background:'#fff', fontFamily:'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
                    onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                    + 처방을 추가하거나 📋 약속처방을 불러오세요
                  </button>
                </td></tr>
              : drugs.map((drug, i) => {
                const injection = isInjectionDrug(drug.name)
                const route = getInjectionRoute(drug)
                return (
                <tr key={drug.id || i} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                  <td style={{ ...S.TD, textAlign:'center' }}>
                    <button type="button" aria-label={`${i+1}번 처방 삭제`} onClick={() => remove(i)} style={{ background:'none', border:'none', color:'#d1d5db', cursor:'pointer', fontSize:15, padding:'2px 6px', fontWeight:700, lineHeight:1 }}
                      onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>×</button>
                  </td>
                  <td style={{ ...S.TD, minWidth:180 }}>
                    <DrugAutoInput value={drug.name||''} onChange={v => handleDrugNameChange(i, v)} suggestions={allSuggestions} showInfo={true} />
                    <input value={drug.note||''} onChange={e => upd(i,'note',e.target.value)} placeholder="메모"
                      style={{ ...S.cell, fontSize:11, color:'#9ca3af', paddingTop:0, paddingBottom:5 }} />
                  </td>
                  <td style={{ ...S.TD, textAlign:'center' }}><input value={drug.dosage||''} onChange={e => upd(i,'dosage',e.target.value)} placeholder="1T" style={{ ...S.cell, textAlign:'center' }} /></td>
                  <td style={{ ...S.TD, textAlign:'center' }}>
                    <select value={drug.freq||'3'} onChange={e => upd(i,'freq',e.target.value)} style={{ border:'none', background:'transparent', fontSize:12, cursor:'pointer', outline:'none', fontFamily:'inherit', color:'#374151', padding:'6px 2px', width:'100%', textAlign:'center' }}>
                      {['1','2','3','4'].map(v => <option key={v} value={v}>{v}회/일</option>)}
                    </select>
                  </td>
                  <td style={{ ...S.TD, textAlign:'center' }}><input value={drug.duration||''} onChange={e => upd(i,'duration',e.target.value)} placeholder="일" style={{ ...S.cell, textAlign:'center' }} /></td>
                  <td style={{ ...S.TD, textAlign:'center' }}>
                    {injection ? (
                      <>
                        <select value={route} onChange={e => upd(i,'route',e.target.value)} aria-label={`${drug.name || '주사제'} 투여경로`}
                          style={{ border:'none', background:'transparent', fontSize:12, cursor:'pointer', outline:'none', fontFamily:'inherit', color:route?'#7c3aed':'#dc2626', padding:'6px 2px', width:'100%', fontWeight:600 }}>
                          <option value="">경로 선택</option>
                          {INJECTION_ROUTES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                        {!route && <div style={{ fontSize:9, color:'#dc2626', paddingBottom:4, fontWeight:600 }}>확인 필요</div>}
                      </>
                    ) : (
                      <select value={drug.usage||'식후'} onChange={e => upd(i,'usage',e.target.value)} aria-label={`${drug.name || '경구약'} 복약 시점`}
                        style={{ border:'none', background:'transparent', fontSize:12, cursor:'pointer', outline:'none', fontFamily:'inherit', color:'#374151', padding:'6px 2px', width:'100%' }}>
                        {ORAL_USAGES.map(value => <option key={value} value={value}>{value}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{ ...S.TD, textAlign:'center' }}><input aria-label={`${drug.name || `${i+1}번 처방`} 급여 여부`} type="checkbox" checked={drug.covered!==false} onChange={e => upd(i,'covered',e.target.checked)} style={{ width:15, height:15, cursor:'pointer', accentColor:'#C2410C' }} /></td>
                </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
      {drugs.length > 0 && (
        <div style={{ padding:'6px 12px', background:'#f9fafb', borderTop:'1px solid #eee', display:'flex', gap:14, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#6b7280' }}>총 {drugs.length}종</span>
          <span style={{ fontSize:11, color:'#C2410C', fontWeight:600 }}>급여 {drugs.filter(d => d.covered!==false).length}종</span>
          <span style={{ fontSize:11, color:'#9ca3af' }}>비급여 {drugs.filter(d => d.covered===false).length}종</span>
        </div>
      )}
      {/* DI 체커 */}
      {drugs.length >= 2 && (
        <div style={{ padding:'10px 12px', borderTop:'1px solid #F3EFE7' }}>
          <DrugInteractionChecker drugs={drugs} />
        </div>
      )}
      {/* 약속처방 선택 Sheet */}
      {showPresets && (
        <Sheet title="약속처방 불러오기" onClose={() => setShowPresets(false)}>
          <PresetSelector onInsert={insertPreset} onClose={() => setShowPresets(false)} />
        </Sheet>
      )}
    </div>
  )
}

// 약물 보기 행 (정보조회 모달 포함) ---------------------
function DrugViewRow({ drug: d }) {
  const [showModal, setShowModal] = useState(false)
  const injection = isInjectionDrug(d.name)
  return (
    <div style={{ background:'#FAF7F1', borderRadius:8, padding:'9px 12px', marginBottom:7, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {injection && (
            <span style={{ fontSize:10, background:'#f5f3ff', color:'#7c3aed', borderRadius:4, padding:'1px 6px', fontWeight:700, flexShrink:0 }}>주사</span>
          )}
          <span style={{ fontSize:13, fontWeight:700, color:injection?'#7c3aed':'#1C1917' }}>
            {(d.name||'').startsWith('[INJ') ? d.name.replace(/^\[INJ-\w+\] /, '') : d.name}
          </span>
        <button type="button" onClick={() => setShowModal(true)}
          style={{ fontSize:11, color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:5, padding:'2px 8px', fontWeight:600, cursor:'pointer' }}>
          정보조회
        </button>
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {[d.dosage,`${d.freq||3}회/일`,d.duration&&d.duration+'일',getAdministrationLabel(d)].filter(Boolean).map((v,j) => (
          <span key={j} style={{ fontSize:11, background:'#fff', border:'1px solid #e5e7eb', borderRadius:5, padding:'2px 7px', color:'#374151' }}>{v}</span>
        ))}
        <span style={{ fontSize:11, borderRadius:5, padding:'2px 7px', background:d.covered!==false?'#EAF3DE':'#fee2e2', color:d.covered!==false?'#27500A':'#991b1b', fontWeight:600 }}>{d.covered!==false?'급여':'비급여'}</span>
      </div>
      {showModal && <DrugInfoModal drugName={d.name} onClose={() => setShowModal(false)} />}
    </div>
  )
}

// 케이스 보기 (view mode) --------------------------------


export default PrescriptionTable
export { DrugViewRow, DrugInfoModal, DrugAutoInput, getAdministrationLabel, isInjectionDrug, normalizeDrug }
