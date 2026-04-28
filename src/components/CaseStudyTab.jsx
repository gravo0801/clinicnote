import { useState, useEffect, useMemo, useRef } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'
import { searchKCD } from '../data/kcdCodes'
import { COMMON_DRUGS } from '../data/commonDrugs'
import { PresetSelector } from './PresetRxTab'
import DrugInteractionChecker from './DrugInteractionChecker'

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

// 식약처 의약품안전나라 검색 - 핵심 성분명/약품명으로 직접 검색
const drugInfoUrl = (name) => {
  // 용량(숫자+단위), 괄호 내용 제거  핵심 약품명만 추출
  const clean = name
    .replace(/\(.*?\)/g, '')          // 괄호 내용 제거: (코대원), (화이자) 등
    .replace(/\d+(\.\d+)?(mg|mcg|g|ml|IU|%)/gi, '') // 용량 제거
    .replace(/\s+/g, ' ')
    .trim()
  return `https://nedrug.mfds.go.kr/searchDrug?searchYn=true&search_str=${encodeURIComponent(clean)}`
}

const S = {
  input: { width:'100%', padding:'8px 10px', borderRadius:7, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', color:'#1a1a1a' },
  ta: (h=80) => ({ width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', resize:'vertical', minHeight:h, lineHeight:1.7, color:'#1a1a1a' }),
  label: { display:'block', fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:600 },
  cell: { border:'none', background:'transparent', fontSize:12, outline:'none', width:'100%', padding:'6px 8px', fontFamily:'inherit', color:'#1a1a1a', boxSizing:'border-box' },
  TH: (w) => ({ padding:'7px 8px', fontSize:11, fontWeight:700, color:'#374151', background:'#f3f4f6', borderRight:'1px solid #e5e7eb', borderBottom:'2px solid #d1d5db', whiteSpace:'nowrap', width:w, textAlign:'center' }),
  TD: { borderRight:'1px solid #eee', borderBottom:'1px solid #eee', padding:0, verticalAlign:'middle' },
}

// 약물 자동완성 -----------------------------------------
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
          style={S.cell}
        />
        {/* 드롭다운: z-index 높게, position absolute */}
        {open && hits.length > 0 && (
          <div style={{
            position:'absolute', top:'100%', left:0, minWidth:260, width:'max-content', maxWidth:360,
            zIndex:9999, background:'#fff', border:'1px solid #d1fae5', borderRadius:7,
            boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:260, overflowY:'auto',
          }}>
            {hits.map(n => (
              <div key={n} onMouseDown={e => { e.preventDefault(); select(n) }}
                style={{ padding:'9px 12px', fontSize:12, cursor:'pointer', borderBottom:'1px solid #f0f0f0', color:'#1a1a1a', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background='#f0faf5'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                <span>💊</span><span>{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {showInfo && (
        <>
          {selectedFromList && value
            ? <button onClick={() => setShowDrugModal(true)}
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
function DiseaseAutoInput({ value, onChange }) {
  const [text, setText] = useState(value?.code || '')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const results = useMemo(() => text.length >= 1 ? searchKCD(text) : [], [text])

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (value?.code && value.code !== text) setText(value.code)
  }, [value?.code])

  const handleChange = e => {
    setText(e.target.value); onChange(null)
    setOpen(e.target.value.length >= 1)
  }
  const select = item => { setText(item.code); onChange(item); setOpen(false) }

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <input value={text} onChange={handleChange}
        onFocus={() => { if (text.length >= 1) setOpen(true) }}
        placeholder="코드/질환명..." style={S.cell} />
      {open && results.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, minWidth:300, width:'max-content', maxWidth:380,
          zIndex:9999, background:'#fff', border:'1px solid #d1fae5', borderRadius:7,
          boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:240, overflowY:'auto',
        }}>
          {results.map(item => (
            <div key={item.code} onMouseDown={e => { e.preventDefault(); select(item) }}
              style={{ padding:'9px 12px', fontSize:12, cursor:'pointer', display:'flex', gap:10, alignItems:'center', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background='#f0faf5'}
              onMouseLeave={e => e.currentTarget.style.background='#fff'}>
              <span style={{ fontWeight:700, color:'#0F6E56', minWidth:48, flexShrink:0 }}>{item.code}</span>
              <span style={{ color:'#1a1a1a', flex:1 }}>{item.name}</span>
              <span style={{ fontSize:10, color:'#9ca3af', flexShrink:0 }}>{item.cat}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 상병 테이블 --------------------------------------------
function DiseaseTable({ diseases, onChange }) {
  const add = () => onChange([...diseases, { type:'주상병', kcd:null }])
  const remove = (i) => onChange(diseases.filter((_,idx) => idx !== i))
  const upd = (i,f,v) => onChange(diseases.map((d,idx) => idx===i ? {...d,[f]:v} : d))
  return (
    <div style={{ border:'1px solid #d1d5db', borderRadius:8, overflow:'visible', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'#e8f4f0', borderBottom:'1px solid #d1d5db' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#0F6E56' }}>상병 (질병)</span>
        <button onClick={add} style={{ background:'#0F6E56', color:'#fff', border:'none', borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ 추가</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead><tr>
          <th style={S.TH(28)}></th><th style={S.TH(36)}>순번</th><th style={S.TH(60)}>코드</th>
          <th style={{ ...S.TH(), textAlign:'left' }}>상병명</th><th style={S.TH(80)}>구분</th>
        </tr></thead>
        <tbody>
          {diseases.length === 0
            ? <tr><td colSpan={5} style={{ padding:'13px', textAlign:'center', color:'#9ca3af', fontSize:12, borderBottom:'1px solid #eee' }}>+ 추가 버튼으로 상병을 입력하세요</td></tr>
            : diseases.map((d,i) => (
              <tr key={i} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                <td style={{ ...S.TD, textAlign:'center' }}>
                  <button onClick={() => remove(i)} style={{ background:'none', border:'none', color:'#d1d5db', cursor:'pointer', fontSize:15, padding:'2px 6px', fontWeight:700, lineHeight:1 }}
                    onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>x</button>
                </td>
                <td style={{ ...S.TD, textAlign:'center', padding:'4px 0' }}><span style={{ fontSize:12, color:'#6b7280' }}>{i+1}</span></td>
                <td style={{ ...S.TD, textAlign:'center', padding:'4px 0' }}><span style={{ fontSize:12, fontWeight:700, color:d.kcd?'#0F6E56':'#9ca3af' }}>{d.kcd?.code||'-'}</span></td>
                <td style={{ ...S.TD, minWidth:200 }}>
                  <DiseaseAutoInput value={d.kcd} onChange={v => upd(i,'kcd',v)} />
                  {d.kcd?.name && <div style={{ padding:'0 8px 5px', fontSize:11, color:'#6b7280' }}>{d.kcd.name}</div>}
                </td>
                <td style={{ ...S.TD, textAlign:'center' }}>
                  <select value={d.type||'주상병'} onChange={e => upd(i,'type',e.target.value)}
                    style={{ border:'none', background:'transparent', fontSize:12, cursor:'pointer', padding:'6px 4px', outline:'none', fontFamily:'inherit', color:d.type==='주상병'?'#0F6E56':'#374151', fontWeight:d.type==='주상병'?700:400 }}>
                    <option value="주상병">주상병</option><option value="부상병">부상병</option>
                  </select>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

// 처방 테이블 (단축키 + 약속처방 지원) ------------------

//  약물 상호작용 체커 

function DrugInteractionChecker({ drugs }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  const validDrugs = drugs.filter(d => d.name && d.name.trim())

  const check = async () => {
    if (validDrugs.length < 2) return
    setLoading(true); setError(null); setOpen(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'drug_interaction',
          caseData: { drugs: validDrugs.map(d => d.name.replace(/^\[INJ-\w+\] /, '')) }
        })
      })
      if (!res.ok) throw new Error('서버 오류 ' + res.status)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  if (validDrugs.length < 2) return null

  const riskCfg = result ? (RISK_CONFIG[result.overallRisk] || RISK_CONFIG.caution) : null

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={check} disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #fde68a', background: loading ? '#f9fafb' : '#fffbeb', color: loading ? '#9ca3af' : '#92400e', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '분석 중...' : '[DI] 약물 상호작용 체크 (' + validDrugs.length + '종)'}
      </button>

      {open && (
        <div style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>약물 상호작용 분석 결과</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>x</button>
          </div>

          <div style={{ padding: '12px 14px' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>
                AI 분석 중... (10-20초 소요)
              </div>
            )}

            {error && (
              <div style={{ background: '#fee2e2', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#991b1b' }}>
                오류: {error}
              </div>
            )}

            {result && !loading && (
              <>
                {/* 전체 위험도 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: riskCfg.bg, borderRadius: 9, marginBottom: 12, border: '1px solid ' + (riskCfg.bg === '#f0faf5' ? '#6ee7b7' : riskCfg.bg === '#fffbeb' ? '#fde68a' : '#fca5a5') }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: riskCfg.color }}>{riskCfg.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: riskCfg.color }}>전체 위험도: {riskCfg.label}</div>
                    {result.summary && <div style={{ fontSize: 12, color: riskCfg.color, marginTop: 2, opacity: 0.85 }}>{result.summary}</div>}
                  </div>
                </div>

                {/* 상호작용 목록 */}
                {result.interactions && result.interactions.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 7 }}>
                      상호작용 {result.interactions.length}건
                    </div>
                    {result.interactions.map((inter, i) => {
                      const sev = SEVERITY_CONFIG[inter.severity] || SEVERITY_CONFIG.moderate
                      return (
                        <div key={i} style={{ background: sev.bg, borderRadius: 9, padding: '10px 12px', marginBottom: 7, border: '1px solid ' + sev.border }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, background: inter.severity === 'critical' ? '#dc2626' : sev.bg, color: sev.color, border: '1px solid ' + sev.border, borderRadius: 5, padding: '1px 8px', fontWeight: 700, flexShrink: 0, ...(inter.severity === 'critical' ? { color: '#fff' } : {}) }}>
                              {sev.label}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                              {(inter.drugs || []).join(' + ')}
                            </span>
                          </div>
                          {inter.mechanism && (
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                              기전: {inter.mechanism}
                            </div>
                          )}
                          {inter.effect && (
                            <div style={{ fontSize: 12, color: '#374151', marginBottom: 5, lineHeight: 1.6 }}>
                              {inter.effect}
                            </div>
                          )}
                          {inter.action && (
                            <div style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', borderRadius: 6, padding: '5px 9px', fontWeight: 600 }}>
                              조치: {inter.action}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 임상 팁 */}
                {result.tips && result.tips.length > 0 && (
                  <div style={{ background: '#f5f3ff', borderRadius: 9, padding: '10px 12px', border: '1px solid #ddd6fe' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>임상 팁</div>
                    {result.tips.map((tip, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#4c1d95', lineHeight: 1.7, paddingLeft: 10, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0 }}>-</span>{tip}
                      </div>
                    ))}
                  </div>
                )}

                {result.interactions && result.interactions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: '#0F6E56', fontSize: 13, fontWeight: 600 }}>
                    주요 상호작용 없음 - 안전한 처방입니다
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PrescriptionTable({ drugs, onChange, drugSuggestions, presets = [] }) {
  const [showPresets, setShowPresets] = useState(false)
  const add = () => onChange([...drugs, { name:'', dosage:'1T', freq:'3', duration:'', usage:'식후', covered:true, note:'' }])
  const remove = (i) => onChange(drugs.filter((_,idx) => idx !== i))
  const upd = (i,f,v) => onChange(drugs.map((d,idx) => idx===i ? {...d,[f]:v} : d))

  // 단축키 처리: #keyword 입력시 프리셋 삽입
  const handleDrugNameChange = (i, v) => {
    if (v.startsWith('#')) {
      const shortcut = v.slice(1).toLowerCase()
      const preset = presets.find(p => p.shortcut?.toLowerCase() === shortcut)
      if (preset && preset.drugs?.length > 0) {
        const newDrugs = [...drugs.slice(0, i), ...preset.drugs.map(d => ({ ...d, covered: d.covered !== false })), ...drugs.slice(i+1)]
        onChange(newDrugs); return
      }
    }
    upd(i, 'name', v)
  }

  // 약속처방 삽입
  const insertPreset = (preset) => {
    const newDrugs = [...drugs, ...(preset.drugs||[]).map(d => ({ ...d, covered: d.covered !== false }))]
    onChange(newDrugs); setShowPresets(false)
  }

  const allSuggestions = useMemo(() => [...new Set([...drugSuggestions, ...COMMON_DRUGS])], [drugSuggestions])

  return (
    <div style={{ border:'1px solid #d1d5db', borderRadius:8, overflow:'visible', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'#eef2ff', borderBottom:'1px solid #d1d5db' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#3730a3' }}>처방</span>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setShowPresets(true)}
            style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            📋 약속처방
          </button>
          <button onClick={add} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ 추가</button>
        </div>
      </div>
      {presets.length > 0 && (
        <div style={{ padding:'5px 10px', background:'#f5f3ff', fontSize:11, color:'#6d28d9', borderBottom:'1px solid #e9d5ff' }}>
          💡 단축키: {presets.filter(p => p.shortcut).slice(0,4).map(p => `#${p.shortcut}(${p.name})`).join(' . ')}
          {presets.filter(p => p.shortcut).length > 4 && ' ...'}
        </div>
      )}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:560 }}>
          <thead><tr>
            <th style={S.TH(28)}></th>
            <th style={{ ...S.TH(), textAlign:'left', minWidth:180 }}>약품명 (목록 선택  정보링크 활성)</th>
            <th style={S.TH(60)}>용량</th><th style={S.TH(60)}>횟수</th>
            <th style={S.TH(55)}>일수</th><th style={S.TH(72)}>용법</th><th style={S.TH(44)}>급여</th>
          </tr></thead>
          <tbody>
            {drugs.length === 0
              ? <tr><td colSpan={7} onClick={add}
                  style={{ padding:'16px', textAlign:'center', color:'#9ca3af', fontSize:12, cursor:'pointer', borderBottom:'1px solid #eee' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
                  onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                  + 처방을 추가하거나 📋 약속처방을 불러오세요
                </td></tr>
              : drugs.map((drug, i) => (
                <tr key={i} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                  <td style={{ ...S.TD, textAlign:'center' }}>
                    <button onClick={() => remove(i)} style={{ background:'none', border:'none', color:'#d1d5db', cursor:'pointer', fontSize:15, padding:'2px 6px', fontWeight:700, lineHeight:1 }}
                      onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>x</button>
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
                    {(() => {
                        const INJ_KEYWORDS = ['주사','[INJ','Inj','injection','프롤리아','포스테오','엔브렐','휴미라','오젬픽','위고비','마운자로','빅토자','트루리시티','란투스','투제오','트레시바','레버미르','노보래피드','휴마로그','아피드라','바이에타','클렉산','이노헵','헤파린','루크린','졸레드론','본비바','콜레칼시페롤','아쿠아디트림','비타민B12주','에포에틴','뉴라스타','데포프로베라','레파타','프라루엔트','조마야','EPO']
        const isInj = INJ_KEYWORDS.some(kw => (drug.name||'').toLowerCase().includes(kw.toLowerCase()))
                        const opts = isInj
                          ? ['IM(근육주사)','SC(피하주사)','IV(정맥주사)','IA(관절강내)','ID(피내주사)']
                          : ['식후','식전','식간','취침전','필요시']
                        const defVal = isInj ? 'IM(근육주사)' : '식후'
                        return (
                          <select value={drug.usage||defVal} onChange={e => upd(i,'usage',e.target.value)}
                            style={{ border:'none', background:'transparent', fontSize:12, cursor:'pointer', outline:'none', fontFamily:'inherit', color: isInj ? '#7c3aed' : '#374151', padding:'6px 2px', width:'100%', fontWeight: isInj ? 600 : 400 }}>
                            {opts.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        )
                      })()}
                  </td>
                  <td style={{ ...S.TD, textAlign:'center' }}><input type="checkbox" checked={drug.covered!==false} onChange={e => upd(i,'covered',e.target.checked)} style={{ width:15, height:15, cursor:'pointer', accentColor:'#0F6E56' }} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {drugs.length > 0 && (
        <div style={{ padding:'6px 12px', background:'#f9fafb', borderTop:'1px solid #eee', display:'flex', gap:14, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#6b7280' }}>총 {drugs.length}종</span>
          <span style={{ fontSize:11, color:'#0F6E56', fontWeight:600 }}>급여 {drugs.filter(d => d.covered!==false).length}종</span>
          <span style={{ fontSize:11, color:'#9ca3af' }}>비급여 {drugs.filter(d => d.covered===false).length}종</span>
        </div>
      )}
      {/* DI 체커 */}
      {drugs.length >= 2 && (
        <div style={{ padding:'10px 12px', borderTop:'1px solid #f0ede8' }}>
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

// 약물 정보 인라인 모달 ---------------------------------
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
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:540, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0ede8', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'#1a1a1a', marginBottom:3 }}>{drugName}</div>
            {info && <div style={{ fontSize:12, color:'#6b7280' }}>{info.engName} . {info.category}</div>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#9ca3af', lineHeight:1, flexShrink:0, marginLeft:10 }}></button>
        </div>
        {/* 본문 */}
        <div style={{ overflowY:'auto', padding:'16px 20px 24px' }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ width:28, height:28, border:'3px solid #e5e7eb', borderTopColor:'#0F6E56', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
              <div style={{ fontSize:13, color:'#6b7280' }}>약물 정보를 불러오는 중...</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {error && (
            <div style={{ background:'#fee2e2', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#991b1b' }}>
               {error}
            </div>
          )}
          {info && rows.map(([label, value]) => (
            <div key={label} style={{ marginBottom:12, paddingBottom:12, borderBottom:'1px solid #f5f5f5' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.4px' }}>{label}</div>
              <div style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.7 }}>{value}</div>
            </div>
          ))}
          {/* 면책 고지 */}
          {info && (
            <div style={{ fontSize:11, color:'#9ca3af', background:'#f8f6f2', borderRadius:7, padding:'8px 10px', marginTop:8, lineHeight:1.6 }}>
               본 정보는 AI 생성 참고 자료이며 실제 처방은 최신 허가사항을 확인하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
function AiResult({ data, type }) {
  if (!data) return null
  if (type === 'review') {
    const OC = { '적절':'#0F6E56','주의필요':'#d97706','검토필요':'#dc2626' }
    const ST = { ok:{bg:'#EAF3DE',color:'#27500A',icon:'[OK]'}, warning:{bg:'#FAEEDA',color:'#633806',icon:''}, error:{bg:'#FCEBEB',color:'#791F1F',icon:''} }
    return (
      <div style={{ marginTop:10 }}>
        {/* 종합 결과 */}
        <div style={{ background:OC[data.overall]||'#0F6E56', borderRadius:9, padding:'10px 14px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{data.overall}</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.9)', maxWidth:'65%', textAlign:'right' }}>{data.summary}</span>
        </div>

        {/* 항목별 검토 */}
        {data.items?.map((item,i) => { const s=ST[item.status]||ST.ok; return (
          <div key={i} style={{ background:s.bg, borderRadius:7, padding:'8px 12px', marginBottom:5 }}>
            <div style={{ fontSize:11, fontWeight:700, color:s.color, marginBottom:3 }}>{s.icon} {item.category}</div>
            <div style={{ fontSize:12, color:'#1a1a1a', lineHeight:1.5 }}>{item.comment}</div>
          </div>
        )})}

        {/* 제안사항 */}
        {data.suggestions?.length > 0 && (
          <div style={{ background:'#f0faf5', borderRadius:7, padding:'9px 12px', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#0F6E56', marginBottom:5 }}>💡 개선 제안</div>
            {data.suggestions.map((s,i) => <div key={i} style={{ fontSize:12, color:'#1a1a1a', paddingLeft:10, position:'relative', marginBottom:2 }}><span style={{ position:'absolute', left:0, color:'#0F6E56' }}>.</span>{s}</div>)}
          </div>
        )}

        {/* 모범 처방 레지멘 */}
        {data.recommendedRegimen?.length > 0 && (
          <div style={{ background:'#f5f3ff', borderRadius:10, padding:'12px 14px', border:'1px solid #ddd6fe', marginTop:6 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#6d28d9', marginBottom:4 }}>🏆 모범 처방 레지멘 (AI 권장)</div>
            {data.regimenSummary && (
              <div style={{ fontSize:12, color:'#4c1d95', lineHeight:1.6, marginBottom:10, paddingBottom:8, borderBottom:'1px solid #ede9fe' }}>
                {data.regimenSummary}
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {data.recommendedRegimen.map((r,i) => (
                <div key={i} style={{ background:'#fff', borderRadius:8, padding:'10px 12px', border:'1px solid #ede9fe', borderLeft:'3px solid #7c3aed' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>{r.drugName}</span>
                    <span style={{ fontSize:11, borderRadius:5, padding:'2px 7px', background:r.covered!==false?'#EAF3DE':'#fee2e2', color:r.covered!==false?'#27500A':'#991b1b', fontWeight:600, flexShrink:0, marginLeft:6 }}>
                      {r.covered!==false?'급여':'비급여'}
                    </span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:r.reason?5:0 }}>
                    {[r.dosage, r.freq, r.duration&&r.duration, r.usage].filter(Boolean).map((v,j) => (
                      <span key={j} style={{ fontSize:11, background:'#f5f3ff', border:'1px solid #ede9fe', borderRadius:5, padding:'2px 7px', color:'#6d28d9' }}>{v}</span>
                    ))}
                  </div>
                  {r.reason && (
                    <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.5, marginTop:3 }}>📌 {r.reason}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  if (type==='knowledge' && data.sections) return (
    <div style={{ marginTop:10 }}>{data.sections.map((s,i) => (
      <div key={i} style={{ background:'#f8f6f2', borderRadius:7, padding:'10px 13px', marginBottom:7 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#0F6E56', marginBottom:4 }}>{s.title}</div>
        <div style={{ fontSize:13, color:'#374151', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{s.content}</div>
      </div>
    ))}</div>
  )
  if (type==='papers' && data.papers) return (
    <div style={{ marginTop:10 }}>{data.papers.map((p,i) => (
      <div key={i} style={{ background:'#eff6ff', borderRadius:9, padding:'12px 14px', marginBottom:10, border:'1px solid #bfdbfe' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4, gap:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8', lineHeight:1.4, flex:1 }}>{p.title}</div>
          {p.level && <span style={{ fontSize:10, background:'#ddd6fe', color:'#5b21b6', borderRadius:4, padding:'2px 7px', fontWeight:700, flexShrink:0 }}>{p.level}</span>}
        </div>
        <div style={{ fontSize:11, color:'#3730a3', marginBottom:8 }}>{p.journal}{p.year ? '  ' + p.year : ''}</div>
        {p.keyPoints && (
          <div style={{ fontSize:12, color:'#1d4ed8', fontWeight:600, marginBottom:6, background:'#dbeafe', borderRadius:5, padding:'5px 9px', lineHeight:1.6 }}>
            핵심: {p.keyPoints}
          </div>
        )}
        {p.summary && (
          <div style={{ fontSize:12, color:'#374151', lineHeight:1.75, marginBottom: p.recommendation ? 8 : 0, borderLeft:'3px solid #93c5fd', paddingLeft:9 }}>
            {p.summary}
          </div>
        )}
        {p.recommendation && (
          <div style={{ fontSize:12, color:'#0F6E56', background:'#f0faf5', borderRadius:6, padding:'6px 10px', lineHeight:1.7, marginTop:6 }}>
            <span style={{ fontWeight:700 }}>적용: </span>{p.recommendation}
          </div>
        )}
      </div>
    ))}</div>
  )
  if (type==='revenue' && data.strategies) return (
    <div style={{ marginTop:10 }}>{data.strategies.map((s,i) => (
      <div key={i} style={{ background:'#fffbeb', borderRadius:7, padding:'10px 13px', marginBottom:7, border:'1px solid #fde68a' }}>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:10, background:'#d97706', color:'#fff', borderRadius:4, padding:'2px 7px', fontWeight:700 }}>{s.category}</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>{s.title}</span>
        </div>
        <div style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:4 }}>{s.detail}</div>
        <div style={{ fontSize:11, fontWeight:600, color:'#059669' }}>📈 {s.impact}</div>
      </div>
    ))}</div>
  )
  return null
}

// 섹션 래퍼 ---------------------------------------------
const SCOL = ['','#0F6E56','#2563eb','#7c3aed','#0891b2','#1d4ed8','#d97706']
const SBGMAP = { '#0F6E56':'#f0faf5','#2563eb':'#eff6ff','#7c3aed':'#f5f3ff','#0891b2':'#ecfeff','#1d4ed8':'#eff6ff','#d97706':'#fffbeb' }

function Section({ num, title, children, defaultOpen=true, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  const c = SCOL[num]||'#374151'; const bg = SBGMAP[c]||'#f8f8f8'
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, marginBottom:10, overflow:'visible' }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', background:open?bg:'#fff', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:24, height:24, borderRadius:'50%', background:c, color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{num}</div>
        <span style={{ fontSize:13, fontWeight:700, color:'#1a1a1a', flex:1 }}>{title}</span>
        {badge && <span style={{ fontSize:11, background:c, color:'#fff', borderRadius:20, padding:'1px 8px', fontWeight:600 }}>{badge}</span>}
        <span style={{ fontSize:11, color:'#9ca3af', display:'inline-block', transition:'transform 0.2s', transform:open?'rotate(180deg)':'none' }}>v</span>
      </button>
      {open && <div style={{ padding:'16px', background:'#fff', borderTop:'1px solid #f0ede8' }}>{children}</div>}
    </div>
  )
}

// 약물 보기 행 (정보조회 모달 포함) ---------------------
const INJ_KEYWORDS = ['주사','[INJ','Inj','injection','프롤리아','포스테오','엔브렐','휴미라','오젬픽','위고비','마운자로','빅토자','트루리시티','란투스','투제오','트레시바','레버미르','노보래피드','휴마로그','아피드라','바이에타','클렉산','이노헵','헤파린','루크린','졸레드론','본비바','콜레칼시페롤','아쿠아디트림','비타민B12주','에포에틴','뉴라스타','데포프로베라','레파타','프라루엔트','조마야']

function DrugViewRow({ drug: d }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <div style={{ background:'#f8f6f2', borderRadius:8, padding:'9px 12px', marginBottom:7, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {INJ_KEYWORDS.some(kw => (d.name||'').toLowerCase().includes(kw.toLowerCase())) && (
            <span style={{ fontSize:10, background:'#f5f3ff', color:'#7c3aed', borderRadius:4, padding:'1px 6px', fontWeight:700, flexShrink:0 }}>주사</span>
          )}
          <span style={{ fontSize:13, fontWeight:700, color: INJ_KEYWORDS.some(kw => (d.name||'').toLowerCase().includes(kw.toLowerCase())) ? '#7c3aed' : '#1a1a1a' }}>
            {(d.name||'').startsWith('[INJ') ? d.name.replace(/^\[INJ-\w+\] /, '') : d.name}
          </span>
        <button onClick={() => setShowModal(true)}
          style={{ fontSize:11, color:'#2563eb', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:5, padding:'2px 8px', fontWeight:600, cursor:'pointer' }}>
          정보조회
        </button>
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {[d.dosage,`${d.freq||3}회/일`,d.duration&&d.duration+'일',d.usage].filter(Boolean).map((v,j) => (
          <span key={j} style={{ fontSize:11, background:'#fff', border:'1px solid #e5e7eb', borderRadius:5, padding:'2px 7px', color:'#374151' }}>{v}</span>
        ))}
        <span style={{ fontSize:11, borderRadius:5, padding:'2px 7px', background:d.covered!==false?'#EAF3DE':'#fee2e2', color:d.covered!==false?'#27500A':'#991b1b', fontWeight:600 }}>{d.covered!==false?'급여':'비급여'}</span>
      </div>
      {showModal && <DrugInfoModal drugName={d.name} onClose={() => setShowModal(false)} />}
    </div>
  )
}

// 케이스 보기 (view mode) --------------------------------
function CaseView({ data, onEdit, onDelete, onUpdateReview }) {
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewData, setReviewData] = useState(data.aiReview || null)

  const p = data.patient||{}; const w = data.workup||{}
  const dx = data.diagnosis||{}; const k = data.knowledge||{}
  const drugs = dx.drugs||[]; const diseases = dx.diseases||[]

  const Row = ({ label, value }) => value ? (
    <div style={{ display:'flex', gap:10, padding:'5px 0', borderBottom:'1px solid #f5f5f5' }}>
      <span style={{ fontSize:12, color:'#9ca3af', flexShrink:0, minWidth:90 }}>{label}</span>
      <span style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.6, flex:1, whiteSpace:'pre-wrap' }}>{value}</span>
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
          usage: `${d.freq||3}회/일 ${d.usage||'식후'}`,
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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, paddingBottom:14, borderBottom:'1px solid #f0ede8' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:'#1a1a1a', marginBottom:6 }}>{data.title||'케이스 스터디'}</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {p.chiefComplaint && <span style={{ fontSize:12, background:'#f0faf5', color:'#0F6E56', borderRadius:20, padding:'2px 10px', fontWeight:600 }}>{p.chiefComplaint}</span>}
            {dx.impression && <span style={{ fontSize:12, background:'#f5f3ff', color:'#7c3aed', borderRadius:20, padding:'2px 10px', fontWeight:600 }}>{dx.impression}</span>}
            {diseases[0]?.kcd && <span style={{ fontSize:12, background:'#e6f4ef', color:'#0F6E56', borderRadius:20, padding:'2px 10px', fontWeight:700 }}>{diseases[0].kcd.code} {diseases[0].kcd.name}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={onDelete}
            style={{ background:'none', border:'1px solid #fca5a5', borderRadius:8, color:'#ef4444', padding:'7px 13px', fontSize:12, cursor:'pointer', fontWeight:600 }}>
            🗑 삭제
          </button>
          <button onClick={onEdit}
            style={{ background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
             수정
          </button>
        </div>
      </div>
      {(p.age||p.chiefComplaint||p.hpi) && (
        <Section num={1} title="환자 정보 및 증상" defaultOpen={true}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
            {[['나이', p.age&&p.age+'세'],['성별',p.gender],['신장',p.height&&p.height+'cm'],['체중',p.weight&&p.weight+'kg']].filter(([,v])=>v).map(([l,v]) => (
              <div key={l} style={{ background:'#f8f6f2', borderRadius:8, padding:'7px 12px', minWidth:70, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#9ca3af', marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>{v}</div>
              </div>
            ))}
            {p.vitals && Object.entries(p.vitals).filter(([,v])=>v).map(([k,v]) => (
              <div key={k} style={{ background:'#f8f6f2', borderRadius:8, padding:'7px 12px', minWidth:60, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#9ca3af', marginBottom:2 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>{v}</div>
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
          {dx.impression && <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:10 }}>{dx.impression}</div>}
          {diseases.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6 }}>상병</div>
              {diseases.map((d,i) => d.kcd && (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, background:'#e6f4ef', color:'#0F6E56', borderRadius:5, padding:'2px 8px' }}>{d.kcd.code}</span>
                  <span style={{ fontSize:13, color:'#1a1a1a' }}>{d.kcd.name}</span>
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
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>상병코드.처방 기준으로 AI가 검토합니다</div>
              </div>
              <button onClick={callReview} disabled={reviewLoading}
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
          {k.text && <div style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.75, whiteSpace:'pre-wrap', marginBottom:k.aiContent?12:0 }}>{k.text}</div>}
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
  const [form, setForm] = useState(() => ({
    patient:{}, workup:{}, literature:{}, revenue:{}, aiReview:null,
    ...data,
    diagnosis:{diseases:[],drugs:[],...(data.diagnosis||{})},
    knowledge:{images:[],...(data.knowledge||{})},
  }))
  const [saving, setSaving] = useState(false)
  const [aiLoad, setAiLoad] = useState({})

  const setP = (k,v) => setForm(f => ({...f, patient:{...f.patient,[k]:v}}))
  const setV = (k,v) => setForm(f => ({...f, patient:{...f.patient, vitals:{...(f.patient?.vitals||{}),[k]:v}}}))
  const setW = (k,v) => setForm(f => ({...f, workup:{...f.workup,[k]:v}}))
  const setDx = (k,v) => setForm(f => ({...f, diagnosis:{...f.diagnosis,[k]:v}}))
  const setK = (k,v) => setForm(f => ({...f, knowledge:{...f.knowledge,[k]:v}}))

  const handleSave = async () => {
    setSaving(true)
    try { await updateDoc(doc(db,'caseStudies',data.id), {...form, updatedAt:serverTimestamp()}); onSave(form) }
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
          drugs: (dx.drugs||[]).filter(d=>d.name).map(d => ({ name:d.name, dosage:d.dosage||'-', usage:`${d.freq||3}회/일 ${d.usage||'식후'}`, duration:d.duration||'-' })),
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
    <button onClick={() => callAi(type)} disabled={aiLoad[type]}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:7, border:'none', background:aiLoad[type]?'#d1d5db':color, color:'#fff', fontSize:12, fontWeight:600, cursor:aiLoad[type]?'not-allowed':'pointer' }}>
      {aiLoad[type] ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} />분석중...</> : <>{emoji} {label}</>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )

  const p=form.patient||{}; const w=form.workup||{}; const dx=form.diagnosis||{}; const k=form.knowledge||{}

  return (
    <div style={{ padding:'20px 24px 100px', maxWidth:820 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:14, borderBottom:'1px solid #f0ede8' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#1a1a1a' }}> {form.title||'케이스 편집'}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ padding:'8px 16px', background:'none', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:'#6b7280', cursor:'pointer' }}>취소</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'8px 20px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
            {saving?'저장 중...':'💾 저장 완료'}
          </button>
        </div>
      </div>
      <Section num={1} title="환자 정보 및 증상" defaultOpen={true}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:12 }}>
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
        <div style={{ background:'#f8f6f2', borderRadius:10, padding:'10px 12px' }}>
          <label style={{ ...S.label, marginBottom:8 }}>활력징후 (Vital Signs)</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
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
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>상병코드.처방 입력 후 검토하세요</div>
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
                  <button onClick={() => setK('images', k.images.filter((_,idx) => idx!==i))}
                    style={{ position:'absolute', top:-5, right:-5, width:18, height:18, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <AiBtn type="knowledge" label="AI 의학 지식 정리" emoji="🧠" color="#0891b2" />
        {form.knowledge?.aiContent && <AiResult data={form.knowledge.aiContent} type="knowledge" />}
      </Section>
      <Section num={5} title="관련 논문 및 가이드라인" defaultOpen={false}>
        <p style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>진단.케이스 정보를 바탕으로 관련 가이드라인 및 근거 논문을 정리합니다.</p>
        <AiBtn type="papers" label="AI 논문 검색" emoji="📚" color="#2563eb" />
        {form.literature?.aiContent && <AiResult data={form.literature.aiContent} type="papers" />}
      </Section>
      <Section num={6} title="매출 증대 대책" defaultOpen={false}>
        <p style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>해당 진단 관련, 적법한 범위 내 추가 수익 창출 방안을 제안합니다.</p>
        <AiBtn type="revenue" label="AI 전략 생성" emoji="📈" color="#d97706" />
        {form.revenue?.aiContent && <AiResult data={form.revenue.aiContent} type="revenue" />}
      </Section>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, paddingTop:16, borderTop:'1px solid #f0ede8', marginTop:8 }}>
        <button onClick={onCancel} style={{ padding:'10px 20px', background:'none', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:'#6b7280', cursor:'pointer' }}>취소</button>
        <button onClick={handleSave} disabled={saving}
          style={{ padding:'10px 28px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
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

  useEffect(() => {
    const q = query(collection(db,'caseStudies'), orderBy('createdAt','desc'))
    return onSnapshot(q, snap => { setCases(snap.docs.map(d => ({id:d.id,...d.data()}))); setLoading(false) })
  }, [])

  // 약속처방 로드
  useEffect(() => {
    const q = query(collection(db,'presetPrescriptions'), orderBy('createdAt','asc'))
    return onSnapshot(q, snap => setPresets(snap.docs.map(d => ({id:d.id,...d.data()}))))
  }, [])

  const selCase = cases.find(c => c.id===selId)||null
  const filtered = useMemo(() => cases.filter(c => {
    const q = search.toLowerCase()
    return !q || [c.title,c.patient?.chiefComplaint,c.diagnosis?.impression,c.diagnosis?.diseases?.[0]?.kcd?.code].some(t=>t?.toLowerCase().includes(q))
  }), [cases, search])

  const createCase = async () => {
    if (!newCC.trim()) return
    setCreating(true)
    const ref = await addDoc(collection(db,'caseStudies'), {
      title: newTitle.trim()||newCC.trim(), patient:{chiefComplaint:newCC.trim()},
      diagnosis:{diseases:[],drugs:[]}, knowledge:{images:[]}, createdAt:serverTimestamp(),
    })
    setSelId(ref.id); setEditMode(true); setShowNew(false); setNewTitle(''); setNewCC(''); setCreating(false)
  }

  const deleteCase = async (id) => {
    if (!window.confirm('케이스를 삭제하시겠습니까?')) return
    await deleteDoc(doc(db,'caseStudies',id)); setSelId(null); setEditMode(false)
  }

  const handleSaved = (updated) => {
    setCases(p => p.map(c => c.id===updated.id ? {...c,...updated} : c)); setEditMode(false)
  }

  if (loading) return <Spinner />

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
      <button onClick={createCase} disabled={!newCC.trim()||creating}
        style={{ width:'100%', padding:'12px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:!newCC.trim()?'not-allowed':'pointer', opacity:!newCC.trim()?0.5:1 }}>
        {creating?'생성 중...':'케이스 생성 '}
      </button>
    </Sheet>
  ) : null

  const renderListItem = (c) => {
    const active = selId===c.id; const kcd = c.diagnosis?.diseases?.[0]?.kcd
    return (
      <div key={c.id} onClick={() => { setSelId(c.id); setEditMode(false) }}
        style={{ padding:'11px 12px', borderRadius:10, cursor:'pointer', marginBottom:4, background:active?'#f0faf5':'transparent', border:active?'1px solid #a7f3d0':'1px solid transparent', transition:'all 0.12s' }}>
        <div style={{ fontSize:13, fontWeight:active?700:500, color:active?'#0F6E56':'#1a1a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
          {c.title||c.patient?.chiefComplaint||'새 케이스'}
        </div>
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          {c.patient?.chiefComplaint && <span style={{ fontSize:11, color:'#9ca3af', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.patient.chiefComplaint}</span>}
          {kcd && <span style={{ fontSize:10, background:'#e6f4ef', color:'#0F6E56', borderRadius:4, padding:'1px 5px', fontWeight:700, flexShrink:0 }}>{kcd.code}</span>}
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ paddingBottom:32 }}>
        <div style={{ padding:'12px 16px 10px' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#9ca3af' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..." style={{ ...S.input, paddingLeft:32 }} />
          </div>
        </div>
        <div style={{ padding:'0 16px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#9ca3af' }}>{filtered.length}건</span>
          <button onClick={() => setShowNew(true)} style={{ background:'#0F6E56', color:'#fff', border:'none', borderRadius:20, padding:'7px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }}> 새 케이스</button>
        </div>
        <div style={{ padding:'0 16px' }}>
          {filtered.length===0
            ? <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🏥</div>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:10 }}>케이스가 없습니다</div>
                <button onClick={() => setShowNew(true)} style={{ background:'#0F6E56', color:'#fff', border:'none', borderRadius:20, padding:'8px 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}>첫 케이스 추가하기</button>
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
      <div style={{ width:265, background:'#fff', borderRight:'1px solid #ece9e3', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'14px 12px 10px', borderBottom:'1px solid #f0ede8' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#9ca3af' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="케이스 검색..." style={{ ...S.input, paddingLeft:28, fontSize:12 }} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {filtered.length===0 ? <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af', fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>🏥</div>케이스가 없습니다</div>
            : filtered.map(c => renderListItem(c))}
        </div>
        <div style={{ padding:'12px', borderTop:'1px solid #f0ede8' }}>
          <button onClick={() => setShowNew(true)} style={{ width:'100%', padding:'10px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}> 새 케이스 추가</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', background:'#f5f3ef' }}>
        {!selCase
          ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🏥</div>
              <div style={{ fontSize:17, fontWeight:700, color:'#374151', marginBottom:8 }}>케이스 스터디</div>
              <div style={{ fontSize:13, marginBottom:24, lineHeight:1.6 }}>환자 정보  진료  진단.처방  의학 지식<br />한 곳에서 정리하고 저장하세요</div>
              <button onClick={() => setShowNew(true)} style={{ background:'#0F6E56', color:'#fff', border:'none', borderRadius:20, padding:'10px 24px', fontSize:14, fontWeight:700, cursor:'pointer' }}> 첫 케이스 만들기</button>
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
