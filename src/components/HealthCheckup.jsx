import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet } from './ui'

// 건강검진 표준 항목 및 참고치
const CHECKUP_ITEMS = [
  { key:'weight',    label:'체중',         unit:'kg',   warn:(v) => v>90?'위험':v>75?'주의':null },
  { key:'bmi',       label:'BMI',          unit:'',     warn:(v) => v>=30?'비만':v>=25?'과체중':v<18.5?'저체중':null },
  { key:'waist',     label:'허리둘레',      unit:'cm',   warn:(v,g) => (g==='여'?v>=85:v>=90)?'위험':null },
  { key:'sbp',       label:'수축기혈압',    unit:'mmHg', warn:(v) => v>=140?'위험':v>=130?'주의':null },
  { key:'dbp',       label:'이완기혈압',    unit:'mmHg', warn:(v) => v>=90?'위험':v>=80?'주의':null },
  { key:'glucose',   label:'공복혈당',      unit:'mg/dL',warn:(v) => v>=126?'당뇨':v>=100?'공복혈당장애':null },
  { key:'hba1c',     label:'당화혈색소',    unit:'%',    warn:(v) => v>=6.5?'당뇨':v>=5.7?'주의':null },
  { key:'tc',        label:'총콜레스테롤',  unit:'mg/dL',warn:(v) => v>=240?'위험':v>=200?'경계':null },
  { key:'ldl',       label:'LDL 콜레스테롤',unit:'mg/dL',warn:(v) => v>=160?'위험':v>=130?'경계':null },
  { key:'hdl',       label:'HDL 콜레스테롤',unit:'mg/dL',warn:(v) => v<40?'위험':v<60?'경계':null },
  { key:'tg',        label:'중성지방',      unit:'mg/dL',warn:(v) => v>=500?'위험':v>=200?'높음':v>=150?'경계':null },
  { key:'alt',       label:'ALT (GPT)',    unit:'U/L',  warn:(v) => v>=56?'위험':v>=40?'주의':null },
  { key:'ast',       label:'AST (GOT)',    unit:'U/L',  warn:(v) => v>=40?'주의':null },
  { key:'ggt',       label:'감마GTP',       unit:'U/L',  warn:(v) => v>=51?'주의':null },
  { key:'creatinine',label:'크레아티닌',    unit:'mg/dL',warn:(v,g) => ((g==='여'?v>=1.3:v>=1.5)?'주의':null) },
  { key:'uric',      label:'요산',          unit:'mg/dL',warn:(v,g) => (g==='여'?v>=6:v>=7)?'주의':null },
  { key:'hemoglobin',label:'혈색소',        unit:'g/dL', warn:(v,g) => (g==='여'?v<12:v<13)?'빈혈':null },
  { key:'tsh',       label:'TSH',          unit:'mIU/L',warn:(v) => v>4.5?'저하증의심':v<0.4?'항진증의심':null },
]

// 스파크라인 차트
function Sparkline({ values, color = '#0F6E56', width = 100, height = 36 }) {
  const nums = values.filter(v => v!=null && !isNaN(v))
  if (nums.length < 2) return null
  const min = Math.min(...nums); const max = Math.max(...nums); const range = max - min || 1
  const pad = 3
  const pts = nums.map((v,i) => {
    const x = pad + (i/(nums.length-1))*(width-2*pad)
    const y = height - pad - ((v-min)/range)*(height-2*pad)
    return `${x.toFixed(1)},${y.toFixed(1)}`
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

const STATUS_COLORS = { '위험':'#dc2626','주의':'#d97706','공복혈당장애':'#d97706','경계':'#d97706','주의':'#d97706','높음':'#d97706','당뇨':'#dc2626','빈혈':'#dc2626','비만':'#d97706','과체중':'#d97706','저체중':'#9ca3af','저하증의심':'#2563eb','항진증의심':'#dc2626' }

export default function HealthCheckup({ memberId, memberGender }) {
  const [checkups, setCheckups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showTrend, setShowTrend] = useState(false)
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0,10))
  const [newItems, setNewItems] = useState({})
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

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
  }

  const delCheckup = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db,'familyMembers',memberId,'checkups',id))
  }

  // 항목별 시계열 데이터
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
    <Sheet title="건강검진 기록 추가" onClose={() => setShowAdd(false)}>
      <div style={{ marginBottom:14 }}>
        <label style={lblStyle}>검진일</label>
        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={iStyle} />
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>측정값 입력 (해당 항목만 입력)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {CHECKUP_ITEMS.map(item => (
            <div key={item.key}>
              <label style={lblStyle}>{item.label} {item.unit && <span style={{ color:'#9ca3af', fontWeight:400 }}>({item.unit})</span>}</label>
              <input type="number" step="any" value={newItems[item.key]||''} onChange={e => setNewItems(p => ({...p,[item.key]:e.target.value}))}
                placeholder="-" style={{ ...iStyle, textAlign:'center' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={lblStyle}>메모</label>
        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="특이사항, 소견 등..." style={{ ...iStyle, resize:'vertical', minHeight:60, lineHeight:1.6 }} />
      </div>
      <button onClick={saveCheckup} disabled={saving}
        style={{ width:'100%', padding:'11px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
        {saving?'저장 중...':'저장'}
      </button>
    </Sheet>
  ) : null

  const trendModalJsx = showTrend ? (
    <Sheet title="건강 추이 그래프" onClose={() => setShowTrend(false)}>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:16 }}>2회 이상 기록된 항목의 추이를 보여줍니다.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {CHECKUP_ITEMS.filter(item => trendData[item.key]?.length >= 2).map(item => {
          const td = trendData[item.key]
          const last = td[td.length-1]?.value
          const prev = td[td.length-2]?.value
          const trend = last > prev ? '↑' : last < prev ? '↓' : '→'
          const item2 = CHECKUP_ITEMS.find(i => i.key===item.key)
          const warnStatus = item2?.warn?.(last, memberGender==='여'?'여':'남')
          const trendClr = trend==='↑'?'#ef4444':trend==='↓'?'#10b981':'#9ca3af'
          return (
            <div key={item.key} style={{ background:'#f8f6f2', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>{item.label}</span>
                  {item.unit && <span style={{ fontSize:11, color:'#9ca3af', marginLeft:4 }}>{item.unit}</span>}
                  {warnStatus && <span style={{ fontSize:10, background:`${STATUS_COLORS[warnStatus]||'#6b7280'}18`, color:STATUS_COLORS[warnStatus]||'#6b7280', borderRadius:4, padding:'1px 7px', marginLeft:7, fontWeight:700 }}>{warnStatus}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>{last}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:trendClr }}>{trend}</span>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <Sparkline values={td.map(d => d.value)} color={warnStatus?STATUS_COLORS[warnStatus]||'#0F6E56':'#0F6E56'} width={140} height={44} />
                <div style={{ display:'flex', gap:10, fontSize:11, color:'#9ca3af' }}>
                  {td.slice(-4).map(d => (
                    <div key={d.date} style={{ textAlign:'center' }}>
                      <div style={{ marginBottom:2 }}>{d.value}</div>
                      <div>{d.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
        {CHECKUP_ITEMS.filter(item => trendData[item.key]?.length >= 2).length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af', fontSize:13 }}>
            2회 이상 기록된 항목이 없습니다
          </div>
        )}
      </div>
    </Sheet>
  ) : null

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>건강검진 기록</span>
        <div style={{ display:'flex', gap:7 }}>
          {checkups.length >= 2 && (
            <button onClick={() => setShowTrend(true)}
              style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              📈 추이 그래프
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            style={{ background:'#0F6E56', color:'#fff', border:'none', borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            + 검진 추가
          </button>
        </div>
      </div>

      {/* 이상 항목 요약 (최근 검진 기준) */}
      {checkups.length > 0 && (() => {
        const latest = checkups[0]
        const warnings = CHECKUP_ITEMS.filter(item => {
          const v = parseFloat(latest.items?.[item.key])
          return v && item.warn?.(v, memberGender)
        })
        if (warnings.length === 0) return null
        return (
          <div style={{ background:'#fef2f2', borderRadius:10, padding:'10px 13px', marginBottom:12, border:'1px solid #fecaca' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#991b1b', marginBottom:6 }}>⚠️ 최근 검진 이상 항목 ({latest.date})</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {warnings.map(item => {
                const v = parseFloat(latest.items[item.key])
                const status = item.warn(v, memberGender)
                return (
                  <span key={item.key} style={{ fontSize:12, background:`${STATUS_COLORS[status]||'#6b7280'}15`, color:STATUS_COLORS[status]||'#6b7280', borderRadius:20, padding:'3px 10px', fontWeight:600 }}>
                    {item.label}: {v}{item.unit} ({status})
                  </span>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* 검진 목록 */}
      {loading
        ? <div style={{ textAlign:'center', padding:'24px 0', color:'#9ca3af', fontSize:13 }}>로딩 중...</div>
        : checkups.length === 0
          ? <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af', fontSize:13 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>🏥</div>건강검진 기록이 없습니다
            </div>
          : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {checkups.map(c => {
                const warnItems = CHECKUP_ITEMS.filter(item => {
                  const v = parseFloat(c.items?.[item.key])
                  return v && item.warn?.(v, memberGender)
                })
                const hasWarn = warnItems.length > 0
                return (
                  <div key={c.id} style={{ background:'#fff', borderRadius:11, border: hasWarn?'1px solid #fca5a5':'1px solid #f0ede8', overflow:'hidden' }}>
                    {/* 날짜 헤더 */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background: hasWarn?'#fef2f2':'#f8f6f2', borderBottom:'1px solid #f0ede8' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>📅 {c.date}</span>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {hasWarn && <span style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>이상 {warnItems.length}항목</span>}
                        <button onClick={() => delCheckup(c.id)} style={{ background:'none', border:'none', color:'#d1d5db', fontSize:14, cursor:'pointer', padding:0, lineHeight:1 }}
                          onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>×</button>
                      </div>
                    </div>
                    {/* 항목 값 */}
                    <div style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                        {Object.entries(c.items||{}).map(([key, val]) => {
                          const item = CHECKUP_ITEMS.find(i => i.key===key)
                          if (!item || val==null || val==='') return null
                          const numVal = parseFloat(val)
                          const status = item.warn?.(numVal, memberGender)
                          const sc = STATUS_COLORS[status]
                          return (
                            <div key={key} style={{ background: sc?`${sc}10`:'#f8f6f2', borderRadius:8, padding:'6px 10px', border: sc?`1px solid ${sc}30`:'1px solid #f0ede8' }}>
                              <div style={{ fontSize:10, color:sc||'#9ca3af', marginBottom:2, fontWeight:600 }}>{item.label}</div>
                              <div style={{ fontSize:14, fontWeight:700, color:sc||'#1a1a1a' }}>{val}<span style={{ fontSize:10, color:sc||'#9ca3af', marginLeft:2 }}>{item.unit}</span></div>
                              {status && <div style={{ fontSize:9, color:sc, fontWeight:700, marginTop:1 }}>{status}</div>}
                            </div>
                          )
                        })}
                      </div>
                      {/* 추이 미니 차트 (이상 항목) */}
                      {warnItems.length > 0 && (
                        <div style={{ marginTop:10, display:'flex', gap:10, flexWrap:'wrap' }}>
                          {warnItems.map(item => {
                            const td = trendData[item.key]
                            if (td.length < 2) return null
                            return (
                              <div key={item.key} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:11, color:'#6b7280' }}>{item.label}</span>
                                <Sparkline values={td.map(d => d.value)} color={STATUS_COLORS[item.warn?.(td[td.length-1]?.value, memberGender)]||'#0F6E56'} width={80} height={28} />
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {c.note && <div style={{ marginTop:8, fontSize:12, color:'#6b7280', fontStyle:'italic' }}>📝 {c.note}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
      }
      {addModalJsx}
      {trendModalJsx}
    </div>
  )
}
