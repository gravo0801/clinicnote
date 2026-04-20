import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet } from './ui'

// ---- 전체 건강검진 항목 (카테고리별) ----
const CHECKUP_CATEGORIES = [
  {
    key: 'body', label: '신체계측',
    items: [
      { key:'height',     label:'신장(키)',         unit:'cm'  },
      { key:'weight',     label:'체중',             unit:'kg'  },
      { key:'bmi',        label:'BMI',              unit:'',    warn:(v) => v>=30?'비만':v>=25?'과체중':v<18.5?'저체중':null },
      { key:'waist',      label:'허리둘레',           unit:'cm',  warn:(v,g) => (g==='여'?v>=85:v>=90)?'위험':null },
      { key:'bodyFat',    label:'체지방률',           unit:'%'   },
      { key:'abdomFat',   label:'복부지방률',          unit:''    },
    ]
  },
  {
    key: 'vital', label: '활력징후',
    items: [
      { key:'sbp',   label:'수축기혈압',  unit:'mmHg', warn:(v) => v>=140?'위험':v>=130?'주의':null },
      { key:'dbp',   label:'이완기혈압',  unit:'mmHg', warn:(v) => v>=90?'위험':v>=80?'주의':null },
      { key:'hr',    label:'심박수',     unit:'회/분' },
    ]
  },
  {
    key: 'cbc', label: '혈액일반 (CBC)',
    items: [
      { key:'wbc',         label:'WBC(백혈구)',       unit:'10^3/uL', warn:(v) => v>10?'높음':v<4?'낮음':null },
      { key:'rbc',         label:'RBC(적혈구)',       unit:'10^6/uL' },
      { key:'hemoglobin',  label:'혈색소(Hb)',        unit:'g/dL',    warn:(v,g) => (g==='여'?v<12:v<13)?'빈혈':null },
      { key:'hct',         label:'HCT(헤마토크릿)',    unit:'%'       },
      { key:'platelet',    label:'혈소판',            unit:'10^3/uL', warn:(v) => v<150?'낮음':v>400?'높음':null },
      { key:'mcv',         label:'MCV',              unit:'fL'      },
      { key:'mch',         label:'MCH',              unit:'pg'      },
      { key:'mchc',        label:'MCHC',             unit:'g/dL'    },
      { key:'rdw',         label:'RDW',              unit:'%'       },
      { key:'mpv',         label:'MPV',              unit:'fL'      },
      { key:'pdw',         label:'PDW',              unit:'%'       },
      { key:'pct',         label:'PCT',              unit:'%'       },
      { key:'neutrophil',  label:'중성구(Neutrophil)', unit:'%'      },
      { key:'lymphocyte',  label:'림프구(Lymphocyte)', unit:'%'      },
      { key:'monocyte',    label:'단핵구(Monocyte)',   unit:'%'      },
      { key:'eosinophil',  label:'호산구(Eosinophil)', unit:'%'      },
      { key:'basophil',    label:'호염기구(Basophil)', unit:'%'      },
    ]
  },
  {
    key: 'lipid', label: '지질검사',
    items: [
      { key:'tc',  label:'총콜레스테롤',   unit:'mg/dL', warn:(v) => v>=240?'위험':v>=200?'경계':null },
      { key:'ldl', label:'LDL콜레스테롤',  unit:'mg/dL', warn:(v) => v>=160?'위험':v>=130?'경계':null },
      { key:'hdl', label:'HDL콜레스테롤',  unit:'mg/dL', warn:(v) => v<40?'위험':v<60?'경계':null },
      { key:'tg',  label:'중성지방(TG)',   unit:'mg/dL', warn:(v) => v>=500?'위험':v>=200?'높음':v>=150?'경계':null },
    ]
  },
  {
    key: 'glucose', label: '혈당/당뇨',
    items: [
      { key:'glucose', label:'공복혈당',    unit:'mg/dL', warn:(v) => v>=126?'당뇨':v>=100?'공복혈당장애':null },
      { key:'hba1c',   label:'당화혈색소',   unit:'%',     warn:(v) => v>=6.5?'당뇨':v>=5.7?'주의':null },
    ]
  },
  {
    key: 'liver', label: '간기능',
    items: [
      { key:'ast',              label:'AST(GOT)',      unit:'U/L',   warn:(v) => v>=40?'주의':null },
      { key:'alt',              label:'ALT(GPT)',      unit:'U/L',   warn:(v) => v>=56?'위험':v>=40?'주의':null },
      { key:'ggt',              label:'감마GTP',        unit:'U/L',   warn:(v) => v>=51?'주의':null },
      { key:'alp',              label:'ALP',           unit:'U/L'   },
      { key:'ldh',              label:'LDH',           unit:'U/L',   warn:(v) => v>=214?'높음':null },
      { key:'bilirubin',        label:'총빌리루빈',      unit:'mg/dL' },
      { key:'directBilirubin',  label:'직접빌리루빈',    unit:'mg/dL' },
      { key:'protein',          label:'총단백',         unit:'g/dL'  },
      { key:'albumin',          label:'알부민',         unit:'g/dL'  },
      { key:'globulin',         label:'글로불린',        unit:'g/dL'  },
      { key:'agRatio',          label:'A/G ratio',     unit:''      },
    ]
  },
  {
    key: 'kidney', label: '신장기능',
    items: [
      { key:'bun',        label:'BUN(요소질소)',    unit:'mg/dL' },
      { key:'creatinine', label:'크레아티닌',       unit:'mg/dL', warn:(v,g) => (g==='여'?v>=1.3:v>=1.5)?'주의':null },
      { key:'egfr',       label:'eGFR',           unit:'mL/min' },
      { key:'bcRatio',    label:'BUN/Cr ratio',   unit:''      },
    ]
  },
  {
    key: 'electrolyte', label: '전해질',
    items: [
      { key:'sodium',    label:'나트륨(Na)',    unit:'mEq/L' },
      { key:'potassium', label:'칼륨(K)',       unit:'mEq/L', warn:(v) => v>5.5?'높음':v<3.5?'낮음':null },
      { key:'chloride',  label:'염소(Cl)',      unit:'mEq/L' },
      { key:'calcium',   label:'칼슘(Ca)',      unit:'mg/dL' },
      { key:'phosphorus',label:'인(P)',         unit:'mg/dL' },
    ]
  },
  {
    key: 'thyroid', label: '갑상선',
    items: [
      { key:'tsh',    label:'TSH',      unit:'mIU/L', warn:(v) => v>4.5?'저하증의심':v<0.4?'항진증의심':null },
      { key:'t3',     label:'T3',       unit:'nmol/L' },
      { key:'freeT4', label:'Free T4',  unit:'ng/dL'  },
    ]
  },
  {
    key: 'other', label: '기타 검사',
    items: [
      { key:'uric',      label:'요산',           unit:'mg/dL', warn:(v,g) => (g==='여'?v>=6:v>=7)?'주의':null },
      { key:'crp',       label:'CRP(정량)',       unit:'mg/dL', warn:(v) => v>=1?'높음':null },
      { key:'vitaminD',  label:'비타민D',          unit:'ng/mL', warn:(v) => v<20?'결핍':v<30?'부족':null },
      { key:'amylase',   label:'아밀라제',          unit:'U/L'   },
      { key:'lipase',    label:'리파제',            unit:'U/L'   },
    ]
  },
  {
    key: 'tumor', label: '종양표지자',
    items: [
      { key:'cea',   label:'CEA',    unit:'ng/mL', warn:(v) => v>=5?'높음':null },
      { key:'afp',   label:'AFP',    unit:'ng/mL', warn:(v) => v>=7?'높음':null },
      { key:'ca125', label:'CA-125', unit:'U/mL',  warn:(v) => v>=35?'높음':null },
      { key:'ca199', label:'CA19-9', unit:'U/mL',  warn:(v) => v>=37?'높음':null },
    ]
  },
]

// 전체 항목 flat list
const CHECKUP_ITEMS = CHECKUP_CATEGORIES.flatMap(c => c.items)

// AI 판독용 키 목록 (JSON 프롬프트용)
const ALL_KEYS_JSON = '{' + CHECKUP_ITEMS.map(i => '"'+i.key+'":null').join(',') + ',"checkupDate":null}'

const STATUS_COLORS = {
  '위험':'#dc2626','주의':'#d97706','공복혈당장애':'#d97706','경계':'#d97706',
  '높음':'#d97706','당뇨':'#dc2626','빈혈':'#dc2626','비만':'#d97706',
  '과체중':'#d97706','저체중':'#9ca3af','저하증의심':'#2563eb','항진증의심':'#dc2626',
  '낮음':'#9ca3af','결핍':'#dc2626','부족':'#d97706',
}

function Sparkline({ values, color = '#0F6E56', width = 100, height = 36 }) {
  const nums = values.filter(v => v!=null && !isNaN(v))
  if (nums.length < 2) return null
  const min = Math.min(...nums); const max = Math.max(...nums); const range = max - min || 1
  const pad = 3
  const pts = nums.map((v,i) => {
    const x = pad + (i/(nums.length-1))*(width-2*pad)
    const y = height - pad - ((v-min)/range)*(height-2*pad)
    return x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      {nums.map((v,i) => {
        const x = pad + (i/(nums.length-1))*(width-2*pad)
        const y = height - pad - ((v-min)/range)*(height-2*pad)
        return <circle key={i} cx={x} cy={y} r={i===nums.length-1?3:2} fill={i===nums.length-1?color:'#fff'} stroke={color} strokeWidth="1.5" />
      })}
    </svg>
  )
}

export default function HealthCheckup({ memberId, memberGender }) {
  const [checkups, setCheckups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showTrend, setShowTrend] = useState(false)
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0,10))
  const [newItems, setNewItems] = useState({})
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanImg, setScanImg] = useState(null)
  const [scanImgs, setScanImgs] = useState([])
  const [scanResults, setScanResults] = useState([])
  const [scanError, setScanError] = useState(null)
  const [openCats, setOpenCats] = useState(() => Object.fromEntries(CHECKUP_CATEGORIES.map(c => [c.key, c.key === 'body' || c.key === 'vital' || c.key === 'lipid' || c.key === 'glucose'])))

  useEffect(() => {
    if (!memberId) return
    const q = query(collection(db,'familyMembers',memberId,'checkups'), orderBy('date','desc'))
    return onSnapshot(q, snap => { setCheckups(snap.docs.map(d => ({id:d.id,...d.data()}))); setLoading(false) })
  }, [memberId])

  const saveCheckup = async () => {
    const filtered = Object.fromEntries(Object.entries(newItems).filter(([,v]) => v!==''))
    if (Object.keys(filtered).length === 0) return
    setSaving(true)
    await addDoc(collection(db,'familyMembers',memberId,'checkups'), {
      date: newDate, items: filtered, note: newNote, createdAt: serverTimestamp()
    })
    setNewItems({}); setNewNote(''); setSaving(false); setShowAdd(false)
    setScanImg(null); setScanImgs([]); setScanResults([])
  }

  const delCheckup = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db,'familyMembers',memberId,'checkups',id))
  }

  const handleScanImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setScanning(true); setScanError(null)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      setScanImg(base64)
      setScanImgs(p => [...p, base64])
      try {
        const b64data = base64.split(',')[1]
        const mime = base64.split(';')[0].split(':')[1]
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'checkup_scan', caseData: { imageBase64: b64data, imageMime: mime } })
        })
        if (!res.ok) throw new Error('서버 오류 ' + res.status)
        const parsed = await res.json()
        if (parsed.error) throw new Error(parsed.error)
        const extracted = {}
        CHECKUP_ITEMS.forEach(item => {
          if (parsed[item.key] != null && parsed[item.key] !== '') {
            extracted[item.key] = String(parsed[item.key])
          }
        })
        setNewItems(p => ({ ...p, ...extracted }))
        if (parsed.checkupDate) setNewDate(parsed.checkupDate)
        // 판독된 항목이 속한 카테고리 자동 펼치기
        const foundCats = new Set()
        CHECKUP_CATEGORIES.forEach(cat => {
          if (cat.items.some(item => extracted[item.key])) foundCats.add(cat.key)
        })
        if (foundCats.size > 0) setOpenCats(p => { const n = {...p}; foundCats.forEach(k => { n[k] = true }); return n })
        const count = Object.keys(extracted).length
        const result = count > 0 ? ('사진 ' + scanImgs.length + ': ' + count + '개 항목 자동 입력됨') : ('사진 ' + scanImgs.length + ': 수치 미검출')
        setScanResults(p => [...p, result])
      } catch(err) {
        setScanResults(p => [...p, '판독 실패: ' + err.message])
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const trendData = useMemo(() => {
    const sorted = [...checkups].sort((a,b) => a.date.localeCompare(b.date))
    const result = {}
    CHECKUP_ITEMS.forEach(item => {
      result[item.key] = sorted.filter(c => c.items?.[item.key]!=null).map(c => ({
        date: c.date, value: parseFloat(c.items[item.key])
      }))
    })
    return result
  }, [checkups])

  const iStyle = { width:'100%', padding:'7px 9px', borderRadius:7, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', color:'#1a1a1a' }
  const lblStyle = { display:'block', fontSize:11, color:'#6b7280', marginBottom:3, fontWeight:600 }

  const addModalJsx = showAdd ? (
    <Sheet title="건강검진 기록 추가" onClose={() => { setShowAdd(false); setScanImg(null); setScanError(null); setScanImgs([]); setScanResults([]) }}>
      {/* AI 사진 판독 */}
      <div style={{ marginBottom:16, background:'#eff6ff', borderRadius:10, padding:'12px 14px', border:'1px solid #bfdbfe' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#1d4ed8', marginBottom:6 }}>AI 사진 자동 판독</div>
        <div style={{ fontSize:11, color:'#6b7280', marginBottom:10 }}>검진 결과지 사진을 올리면 수치를 자동 인식합니다. 여러 장 올리면 누적 반영됩니다.</div>
        <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background: scanning ? '#d1d5db' : '#2563eb', color:'#fff', borderRadius:8, fontSize:12, cursor: scanning ? 'not-allowed' : 'pointer', fontWeight:700 }}>
          {scanning ? 'AI 판독 중...' : '결과지 사진 업로드'}
          <input type="file" accept="image/*" onChange={handleScanImage} disabled={scanning} style={{ display:'none' }} />
        </label>
        {scanning && <div style={{ marginTop:8, fontSize:12, color:'#2563eb' }}>이미지 분석 중... (10~20초 소요)</div>}
        {scanResults.length > 0 && (
          <div style={{ marginTop:8 }}>
            {scanResults.map((r, i) => (
              <div key={i} style={{ fontSize:11, color: r.includes('입력됨') ? '#0F6E56' : '#dc2626', background: r.includes('입력됨') ? '#f0faf5' : '#fee2e2', borderRadius:6, padding:'5px 9px', marginBottom:4 }}>
                {r}
              </div>
            ))}
          </div>
        )}
        {scanImgs.length > 0 && (
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            {scanImgs.map((img, i) => (
              <img key={i} src={img} alt={'결과지' + (i+1)} style={{ width:68, height:68, objectFit:'cover', borderRadius:7, border:'1px solid #bfdbfe' }} />
            ))}
          </div>
        )}
      </div>

      {/* 검진일 */}
      <div style={{ marginBottom:14 }}>
        <label style={lblStyle}>검진일</label>
        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={iStyle} />
      </div>

      {/* 카테고리별 항목 입력 */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>측정값 입력 (AI 판독 결과 확인 후 수정 가능)</div>
        {CHECKUP_CATEGORIES.map(cat => {
          const filledCount = cat.items.filter(item => newItems[item.key]).length
          return (
            <div key={cat.key} style={{ marginBottom:8, border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
              <button onClick={() => setOpenCats(p => ({...p,[cat.key]:!p[cat.key]}))}
                style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background: filledCount > 0 ? '#f0faf5' : '#f9fafb', border:'none', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:13, fontWeight:700, color: filledCount > 0 ? '#0F6E56' : '#374151' }}>{cat.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {filledCount > 0 && <span style={{ fontSize:11, color:'#0F6E56', background:'#dcfce7', borderRadius:10, padding:'1px 8px', fontWeight:700 }}>{filledCount}개 입력됨</span>}
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{openCats[cat.key] ? 'v' : '>'}</span>
                </div>
              </button>
              {openCats[cat.key] && (
                <div style={{ padding:'10px 12px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {cat.items.map(item => (
                    <div key={item.key}>
                      <label style={{ ...lblStyle, color: newItems[item.key] ? '#0F6E56' : '#6b7280' }}>
                        {item.label} {item.unit && <span style={{ color:'#9ca3af', fontWeight:400 }}>({item.unit})</span>}
                      </label>
                      <input type="number" step="any" value={newItems[item.key]||''} onChange={e => setNewItems(p => ({...p,[item.key]:e.target.value}))}
                        placeholder="-" style={{ ...iStyle, textAlign:'center', background: newItems[item.key] ? '#f0faf5' : '#fff', borderColor: newItems[item.key] ? '#6ee7b7' : '#e5e7eb' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={lblStyle}>메모</label>
        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="이상소견, 의사 코멘트, 특이사항 등..." style={{ ...iStyle, resize:'vertical', minHeight:60, lineHeight:1.6 }} />
      </div>
      <button onClick={saveCheckup} disabled={saving}
        style={{ width:'100%', padding:'11px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
        {saving?'저장 중...':'저장'}
      </button>
    </Sheet>
  ) : null

  const trendModalJsx = showTrend ? (
    <Sheet title="건강 추이 분석" onClose={() => setShowTrend(false)}>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>2회 이상 기록된 항목의 추이를 보여줍니다.</p>
      {CHECKUP_CATEGORIES.map(cat => {
        const trendItems = cat.items.filter(item => trendData[item.key]?.length >= 2)
        if (trendItems.length === 0) return null
        return (
          <div key={cat.key} style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', marginBottom:8, paddingBottom:4, borderBottom:'1px solid #f0ede8' }}>{cat.label}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {trendItems.map(item => {
                const td = trendData[item.key]
                const last = td[td.length-1]?.value
                const prev = td[td.length-2]?.value
                const trend = last > prev ? '^' : last < prev ? 'v' : '-'
                const trendClr = trend==='^'?'#ef4444':trend==='v'?'#10b981':'#9ca3af'
                const warnStatus = item.warn?.(last, memberGender==='여'?'여':'남')
                return (
                  <div key={item.key} style={{ background:'#f8f6f2', borderRadius:10, padding:'10px 13px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div>
                        <span style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>{item.label}</span>
                        {item.unit && <span style={{ fontSize:11, color:'#9ca3af', marginLeft:4 }}>{item.unit}</span>}
                        {warnStatus && <span style={{ fontSize:10, background:(STATUS_COLORS[warnStatus]||'#6b7280')+'18', color:STATUS_COLORS[warnStatus]||'#6b7280', borderRadius:4, padding:'1px 7px', marginLeft:7, fontWeight:700 }}>{warnStatus}</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>{last}</span>
                        <span style={{ fontSize:14, fontWeight:700, color:trendClr }}>{trend}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                      <Sparkline values={td.map(d => d.value)} color={warnStatus?STATUS_COLORS[warnStatus]||'#0F6E56':'#0F6E56'} width={130} height={40} />
                      <div style={{ display:'flex', gap:8, fontSize:11, color:'#9ca3af' }}>
                        {td.slice(-4).map(d => (
                          <div key={d.date} style={{ textAlign:'center' }}>
                            <div style={{ marginBottom:2 }}>{d.value}</div>
                            <div>{d.date.slice(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {CHECKUP_ITEMS.filter(item => trendData[item.key]?.length >= 2).length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af', fontSize:13 }}>2회 이상 기록된 항목이 없습니다</div>
      )}
    </Sheet>
  ) : null

  if (loading) return <div style={{ padding:20, color:'#9ca3af', fontSize:13 }}>로딩 중...</div>

  const latestCheckup = checkups[0]
  const abnormalItems = latestCheckup ? CHECKUP_ITEMS.filter(item => {
    const v = parseFloat(latestCheckup.items?.[item.key])
    return item.warn && item.warn(v, memberGender) != null
  }) : []

  return (
    <div>
      {/* 최신 이상 항목 요약 */}
      {abnormalItems.length > 0 && (
        <div style={{ background:'#fffbeb', borderRadius:12, padding:'12px 16px', marginBottom:16, border:'1px solid #fde68a' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:6 }}>[!] 최근 검진 이상 항목 ({latestCheckup.date})</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {abnormalItems.map(item => {
              const v = parseFloat(latestCheckup.items[item.key])
              const ws = item.warn(v, memberGender)
              return (
                <span key={item.key} style={{ fontSize:11, background:(STATUS_COLORS[ws]||'#6b7280')+'18', color:STATUS_COLORS[ws]||'#6b7280', borderRadius:6, padding:'3px 9px', fontWeight:700 }}>
                  {item.label} {v} <span style={{ opacity:0.7 }}>({ws})</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:14, fontWeight:700 }}>건강검진 기록 <span style={{ color:'#9ca3af', fontWeight:400 }}>({checkups.length}회)</span></span>
        <div style={{ display:'flex', gap:6 }}>
          {checkups.length >= 2 && (
            <button onClick={() => setShowTrend(true)} style={{ padding:'6px 12px', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:12, cursor:'pointer', fontWeight:600 }}>추이 분석</button>
          )}
          <button onClick={() => setShowAdd(true)} style={{ padding:'6px 14px', borderRadius:7, background:'#0F6E56', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 검진 추가</button>
        </div>
      </div>

      {checkups.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af', fontSize:13 }}>
          <div style={{ marginBottom:10, fontSize:14 }}>건강검진 기록이 없습니다</div>
          <button onClick={() => setShowAdd(true)} style={{ padding:'8px 20px', borderRadius:20, background:'#0F6E56', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>첫 검진 기록 추가</button>
        </div>
      ) : checkups.map(c => {
        const abnormal = CHECKUP_ITEMS.filter(item => {
          const v = parseFloat(c.items?.[item.key])
          return item.warn && item.warn(v, memberGender) != null
        })
        const filledItems = CHECKUP_ITEMS.filter(item => c.items?.[item.key] != null)
        return (
          <div key={c.id} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', marginBottom:10, border:'1px solid #f0ede8' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>{c.date}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{filledItems.length}개 항목 기록</div>
              </div>
              <button onClick={() => delCheckup(c.id)} style={{ fontSize:11, color:'#ef4444', background:'none', border:'1px solid #fca5a5', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>삭제</button>
            </div>
            {abnormal.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
                {abnormal.map(item => {
                  const v = parseFloat(c.items[item.key])
                  const ws = item.warn(v, memberGender)
                  return (
                    <span key={item.key} style={{ fontSize:11, background:(STATUS_COLORS[ws]||'#6b7280')+'18', color:STATUS_COLORS[ws]||'#6b7280', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>
                      {item.label} {v}
                    </span>
                  )
                })}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))', gap:6 }}>
              {filledItems.map(item => {
                const v = parseFloat(c.items[item.key])
                const ws = item.warn?.(v, memberGender)
                const clr = ws ? (STATUS_COLORS[ws] || '#6b7280') : '#374151'
                return (
                  <div key={item.key} style={{ background:'#f8f6f2', borderRadius:7, padding:'7px 9px' }}>
                    <div style={{ fontSize:10, color:'#9ca3af', marginBottom:2 }}>{item.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:clr }}>{c.items[item.key]}<span style={{ fontSize:10, color:'#9ca3af', marginLeft:2 }}>{item.unit}</span></div>
                    {ws && <div style={{ fontSize:10, color:clr, marginTop:1 }}>{ws}</div>}
                  </div>
                )
              })}
            </div>
            {c.note && <div style={{ marginTop:10, fontSize:12, color:'#6b7280', background:'#fffbeb', borderRadius:7, padding:'7px 10px', lineHeight:1.6 }}>{c.note}</div>}
          </div>
        )
      })}

      {addModalJsx}
      {trendModalJsx}
    </div>
  )
}
