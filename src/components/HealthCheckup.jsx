import { useState, useEffect, useMemo } from 'react'
import {
  CHECKUP_CATEGORIES, CHECKUP_ITEMS, NUM_ITEMS, STATUS_COLORS,
  detectAbnormal, detectFindingAbnormal
} from '../data/checkupConfig'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet } from './ui'

const CLOUD_NAME = 'dfcvmvlen'
const UPLOAD_PRESET = 'clinicnote_uploads'

async function uploadToCloudinary(file, onProgress) {
  if (file.size > 20 * 1024 * 1024) throw new Error(file.name + ' 파일이 20MB를 초과합니다.')
  const ext = file.name.split('.').pop().toLowerCase()
  const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext)
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'clinicnote_checkup')
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + (isImg ? 'image' : 'raw') + '/upload')
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)) }
    xhr.onload = () => {
      if (xhr.status === 200) { const r = JSON.parse(xhr.responseText); resolve({ url: r.secure_url, name: file.name, mime: file.type, size: file.size }) }
      else reject(new Error('업로드 실패 (' + xhr.status + ')'))
    }
    xhr.onerror = () => reject(new Error('네트워크 오류'))
    xhr.send(fd)
  })
}


function Sparkline({ values, color = '#0F6E56', width = 100, height = 36 }) {
  const nums = values.filter(v => v!=null && !isNaN(v))
  if (nums.length < 2) return null
  const min = Math.min(...nums); const max = Math.max(...nums); const range = max - min || 1
  const pad = 3
  const pts = nums.map((v,i) => {
    const x = pad + (i/(nums.length-1))*(width-2*pad)
    const y = height - pad - ((v-min)/range)*(height-2*pad)
    return x.toFixed(1)+','+y.toFixed(1)
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




// ---- AI 검진 분석 컴포넌트 ----
function AiCheckupAnalysis({ abnormalItems, findingItems, memberInfo }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  const analyze = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkup_analysis',
          caseData: { abnormalItems, findingItems, memberInfo }
        })
      })
      if (!res.ok) throw new Error('서버 오류 ' + res.status)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data); setOpen(true)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const RISK_STYLE = {
    '위험': { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' },
    '주의': { bg:'#fef3c7', color:'#92400e', border:'#fde68a' },
    '경계': { bg:'#fffbeb', color:'#92400e', border:'#fde68a' },
    '정상': { bg:'#f0faf5', color:'#0F6E56', border:'#6ee7b7' },
  }
  const riskSt = result ? (RISK_STYLE[result.riskLevel] || RISK_STYLE['경계']) : null

  return (
    <div style={{ marginTop:14, borderTop:'1px solid #f0ede8', paddingTop:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>AI 검진 결과 분석</div>
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>이상 항목 기반 의사 관점 종합 분석</div>
        </div>
        <button onClick={analyze} disabled={loading}
          style={{ padding:'7px 16px', borderRadius:8, border:'none', background:loading?'#d1d5db':'#0F6E56', color:'#fff', fontSize:12, fontWeight:700, cursor:loading?'not-allowed':'pointer', flexShrink:0 }}>
          {loading ? '분석 중...' : 'AI 분석'}
        </button>
      </div>
      {error && <div style={{ marginTop:8, background:'#fee2e2', borderRadius:7, padding:'8px 12px', fontSize:12, color:'#991b1b' }}>오류: {error}</div>}
      {result && open && (
        <div style={{ marginTop:12 }}>
          {/* 위험도 배지 */}
          {result.riskLevel && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:riskSt.bg, color:riskSt.color, border:'1px solid '+riskSt.border, borderRadius:8, padding:'5px 12px', marginBottom:12, fontWeight:700, fontSize:13 }}>
              위험도: {result.riskLevel}
            </div>
          )}
          {/* 임상 소견 */}
          {result.impression && (
            <div style={{ background:'#f8f6f2', borderRadius:9, padding:'11px 14px', marginBottom:10, border:'1px solid #f0ede8' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:5 }}>임상적 의의 / 예상 진단</div>
              <div style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.8 }}>{result.impression}</div>
            </div>
          )}
          {/* 환자 설명 */}
          {result.explanation && (
            <div style={{ background:'#eff6ff', borderRadius:9, padding:'11px 14px', marginBottom:10, border:'1px solid #bfdbfe' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1d4ed8', marginBottom:5 }}>환자 설명 방법</div>
              <div style={{ fontSize:13, color:'#1d4ed8', lineHeight:1.8 }}>{result.explanation}</div>
            </div>
          )}
          {/* 생활습관 */}
          {result.lifestyle && result.lifestyle.length > 0 && (
            <div style={{ background:'#f0faf5', borderRadius:9, padding:'11px 14px', marginBottom:10, border:'1px solid #6ee7b7' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#0F6E56', marginBottom:5 }}>생활습관 교정</div>
              {result.lifestyle.map((item, i) => (
                <div key={i} style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.7, paddingLeft:12, position:'relative' }}>
                  <span style={{ position:'absolute', left:0, color:'#0F6E56' }}>-</span>{item}
                </div>
              ))}
            </div>
          )}
          {/* 치료 방향 */}
          {result.treatment && (
            <div style={{ background:'#fef3c7', borderRadius:9, padding:'11px 14px', marginBottom:10, border:'1px solid #fde68a' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:5 }}>치료 및 추가 검사</div>
              <div style={{ fontSize:13, color:'#92400e', lineHeight:1.8 }}>{result.treatment}</div>
            </div>
          )}
          {/* 추적 계획 */}
          {result.followUp && (
            <div style={{ background:'#f5f3ff', borderRadius:9, padding:'11px 14px', marginBottom:10, border:'1px solid #ddd6fe' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:5 }}>추적 관찰 계획</div>
              <div style={{ fontSize:13, color:'#7c3aed', lineHeight:1.8 }}>{result.followUp}</div>
            </div>
          )}
          {/* 진료 메모 */}
          {result.doctorNote && (
            <div style={{ background:'#f8f6f2', borderRadius:9, padding:'10px 13px', border:'1px solid #e5e7eb' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:4 }}>처방/진료 주의사항</div>
              <div style={{ fontSize:12, color:'#374151', lineHeight:1.7 }}>{result.doctorNote}</div>
            </div>
          )}
          <button onClick={() => setOpen(false)} style={{ marginTop:8, fontSize:11, color:'#9ca3af', background:'none', border:'none', cursor:'pointer' }}>접기</button>
        </div>
      )}
    </div>
  )
}

export default function HealthCheckup({ memberId, memberGender }) {
  const [checkups, setCheckups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editCheckup, setEditCheckup] = useState(null)
  const [showTrend, setShowTrend] = useState(false)
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0,10))
  const [newItems, setNewItems] = useState({})
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanImgs, setScanImgs] = useState([])
  const [scanResults, setScanResults] = useState([])
  const [openCats, setOpenCats] = useState(() => ({ body:true, vital:true, lipid:true, glucose:true }))
  const [imagingFiles, setImagingFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [expandedCheckup, setExpandedCheckup] = useState(null)

  useEffect(() => {
    if (!memberId) return
    const q = query(collection(db,'familyMembers',memberId,'checkups'), orderBy('date','desc'))
    return onSnapshot(q, snap => { setCheckups(snap.docs.map(d => ({id:d.id,...d.data()}))); setLoading(false) })
  }, [memberId])

  // 이상 항목 자동 트래킹 등록
  const autoTrack = async (checkupDate, abnormal, findingAbnormal) => {
    const allAbnormal = [
      ...abnormal.map(a => ({ title: a.label + ' 이상 (' + a.value + a.unit + ', ' + a.status + ')', source: 'lab' })),
      ...findingAbnormal.map(f => ({ title: f.label + ' 이상 소견', source: 'finding' }))
    ]
    if (allAbnormal.length === 0) return
    // 기존 records 조회
    const existing = await getDocs(collection(db,'familyMembers',memberId,'records'))
    const existingTitles = existing.docs.map(d => d.data().title || '')
    const nextVisit = new Date(checkupDate)
    nextVisit.setFullYear(nextVisit.getFullYear() + 1)
    const nextVisitStr = nextVisit.toISOString().slice(0,10)
    for (const item of allAbnormal) {
      const alreadyExists = existingTitles.some(t => t.includes(item.title.split('(')[0].trim()))
      if (!alreadyExists) {
        await addDoc(collection(db,'familyMembers',memberId,'records'), {
          title: item.title,
          date: checkupDate,
          nextVisit: nextVisitStr,
          status: 'followup',
          note: checkupDate + ' 건강검진에서 발견된 이상 항목. 1년 후 재검 권고.',
          images: [], cloudFiles: [],
          createdAt: serverTimestamp()
        })
      }
    }
  }

  const openEdit = (chk) => {
    setEditCheckup(chk)
    setNewDate(chk.date || new Date().toISOString().slice(0,10))
    setNewItems(chk.items || {})
    setNewNote(chk.note || '')
    setImagingFiles(chk.imagingFiles || [])
    setScanImgs([]); setScanResults([])
    // 입력된 항목 카테고리 펼치기
    const filled = new Set()
    CHECKUP_CATEGORIES.forEach(cat => { if (cat.items.some(item => chk.items?.[item.key])) filled.add(cat.key) })
    if (filled.size > 0) setOpenCats(p => { const n={...p}; filled.forEach(k => { n[k]=true }); return n })
  }

  const closeForm = () => {
    setShowAdd(false); setEditCheckup(null)
    setNewDate(new Date().toISOString().slice(0,10))
    setNewItems({}); setNewNote('')
    setScanImgs([]); setScanResults([]); setImagingFiles([])
  }

  const saveCheckup = async () => {
    const filteredNum = Object.fromEntries(Object.entries(newItems).filter(([,v]) => v!==''))
    if (Object.keys(filteredNum).length === 0 && imagingFiles.length === 0) return
    setSaving(true)
    const abnormal = detectAbnormal(filteredNum, memberGender)
    const findingAbnormal = detectFindingAbnormal(filteredNum)
    const payload = { date: newDate, items: filteredNum, note: newNote, imagingFiles }
    if (editCheckup) {
      await updateDoc(doc(db,'familyMembers',memberId,'checkups',editCheckup.id), { ...payload, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db,'familyMembers',memberId,'checkups'), { ...payload, createdAt: serverTimestamp() })
      if (abnormal.length > 0 || findingAbnormal.length > 0) {
        await autoTrack(newDate, abnormal, findingAbnormal)
      }
    }
    setSaving(false); closeForm()
  }

  const delCheckup = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db,'familyMembers',memberId,'checkups',id))
  }

  const handleScanImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
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
          if (parsed[item.key] != null && String(parsed[item.key]).trim() !== '') {
            extracted[item.key] = String(parsed[item.key])
          }
        })
        setNewItems(p => ({ ...p, ...extracted }))
        if (parsed.checkupDate) setNewDate(parsed.checkupDate)
        const foundCats = new Set()
        CHECKUP_CATEGORIES.forEach(cat => { if (cat.items.some(item => extracted[item.key])) foundCats.add(cat.key) })
        if (foundCats.size > 0) setOpenCats(p => { const n={...p}; foundCats.forEach(k => { n[k]=true }); return n })
        const count = Object.keys(extracted).length
        setScanResults(p => [...p, count > 0 ? ('사진 ' + scanImgs.length + ': ' + count + '개 항목 자동 입력') : ('사진 ' + scanImgs.length + ': 수치 미검출')])
      } catch(err) {
        setScanResults(p => [...p, '판독 실패: ' + err.message])
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const [pendingLabels, setPendingLabels] = useState({})

  const handleImagingUpload = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    for (const file of files) {
      const key = file.name + Date.now()
      setUploadProgress(p => ({ ...p, [key]: 0 }))
      try {
        const result = await uploadToCloudinary(file, (pct) => setUploadProgress(p => ({ ...p, [key]: pct })))
        // Use filename as default label - user can edit inline after upload
        const defaultLabel = file.name.replace(/\.[^.]+$/, '')
        setImagingFiles(p => [...p, { ...result, label: defaultLabel, _key: key }])
      } catch(err) { alert(err.message) }
      finally { setUploadProgress(p => { const n={...p}; delete n[key]; return n }) }
    }
  }

  const trendData = useMemo(() => {
    const sorted = [...checkups].sort((a,b) => a.date.localeCompare(b.date))
    const result = {}
    NUM_ITEMS.forEach(item => {
      result[item.key] = sorted.filter(c => c.items?.[item.key]!=null).map(c => ({ date: c.date, value: parseFloat(c.items[item.key]) }))
    })
    return result
  }, [checkups])

  const iStyle = { width:'100%', padding:'7px 9px', borderRadius:7, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', color:'#1a1a1a' }
  const lblStyle = { display:'block', fontSize:11, color:'#6b7280', marginBottom:3, fontWeight:600 }
  const uploading = Object.entries(uploadProgress)

  const addModalJsx = (showAdd || editCheckup) ? (
    <Sheet title={editCheckup ? '건강검진 기록 수정' : '건강검진 기록 추가'} onClose={closeForm}>
      {/* AI 판독 */}
      <div style={{ marginBottom:16, background:'#eff6ff', borderRadius:10, padding:'12px 14px', border:'1px solid #bfdbfe' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#1d4ed8', marginBottom:6 }}>AI 결과지 자동 판독</div>
        <div style={{ fontSize:11, color:'#6b7280', marginBottom:10 }}>검진 결과지 사진 여러 장 올리면 수치가 누적 자동 입력됩니다.</div>
        <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:scanning?'#d1d5db':'#2563eb', color:'#fff', borderRadius:8, fontSize:12, cursor:scanning?'not-allowed':'pointer', fontWeight:700 }}>
          {scanning ? 'AI 판독 중...' : '결과지 사진 업로드'}
          <input type="file" accept="image/*" onChange={handleScanImage} disabled={scanning} style={{ display:'none' }} />
        </label>
        {scanning && <div style={{ fontSize:11, color:'#2563eb', marginTop:6 }}>분석 중... (10~20초 소요)</div>}
        {scanResults.map((r,i) => <div key={i} style={{ fontSize:11, color:r.includes('입력')?'#0F6E56':'#dc2626', background:r.includes('입력')?'#f0faf5':'#fee2e2', borderRadius:6, padding:'4px 8px', marginTop:5 }}>{r}</div>)}
        {scanImgs.length > 0 && <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>{scanImgs.map((img,i) => <img key={i} src={img} alt="" style={{ width:64, height:64, objectFit:'cover', borderRadius:7, border:'1px solid #bfdbfe' }} />)}</div>}
      </div>

      {/* 영상검사 이미지 첨부 */}
      <div style={{ marginBottom:16, background:'#f5f3ff', borderRadius:10, padding:'12px 14px', border:'1px solid #ddd6fe' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>영상검사 이미지 첨부 (내시경 / 초음파 / MRI / X선 등)</div>
        <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 13px', background:'#7c3aed', color:'#fff', borderRadius:8, fontSize:12, cursor:'pointer', fontWeight:600 }}>
          이미지 선택
          <input type="file" accept="image/*,.pdf" multiple onChange={handleImagingUpload} style={{ display:'none' }} />
        </label>
        {uploading.length > 0 && uploading.map(([key,pct]) => (
          <div key={key} style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#7c3aed', marginBottom:3 }}><span>업로드 중...</span><span>{pct}%</span></div>
            <div style={{ background:'#ddd6fe', borderRadius:4, height:4 }}><div style={{ background:'#7c3aed', borderRadius:4, height:4, width:pct+'%', transition:'width 0.3s' }} /></div>
          </div>
        ))}
        {imagingFiles.length > 0 && (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:10 }}>
            {imagingFiles.map((f,i) => (
              <div key={i} style={{ position:'relative', textAlign:'center' }}>
                <img src={f.url} alt={f.label} style={{ width:80, height:80, objectFit:'cover', borderRadius:8, border:'1px solid #ddd6fe', display:'block' }} />
                <input value={f.label} onChange={e => setImagingFiles(p => p.map((ff,idx) => idx===i ? {...ff,label:e.target.value} : ff))}
                  placeholder="레이블"
                  style={{ width:80, marginTop:3, padding:'2px 4px', fontSize:10, borderRadius:5, border:'1px solid #ddd6fe', outline:'none', fontFamily:'inherit', textAlign:'center', boxSizing:'border-box' }} />
                <button onClick={() => setImagingFiles(p => p.filter((_,idx) => idx!==i))}
                  style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', fontSize:10, cursor:'pointer', fontWeight:700 }}>x</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={lblStyle}>검진일</label>
        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={iStyle} />
      </div>

      {/* 카테고리별 항목 */}
      {CHECKUP_CATEGORIES.map(cat => {
        const filledCount = cat.items.filter(item => newItems[item.key]).length
        return (
          <div key={cat.key} style={{ marginBottom:8, border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
            <button onClick={() => setOpenCats(p => ({...p,[cat.key]:!p[cat.key]}))}
              style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background:filledCount>0?'#f0faf5':'#f9fafb', border:'none', cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:13, fontWeight:700, color:filledCount>0?'#0F6E56':'#374151' }}>{cat.label}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {filledCount > 0 && <span style={{ fontSize:10, color:'#0F6E56', background:'#dcfce7', borderRadius:10, padding:'1px 8px', fontWeight:700 }}>{filledCount}개 입력</span>}
                <span style={{ fontSize:12, color:'#9ca3af' }}>{openCats[cat.key]?'v':'>'}</span>
              </div>
            </button>
            {openCats[cat.key] && (
              <div style={{ padding:'10px 12px 12px', display:'grid', gridTemplateColumns:cat.items.some(i=>i.type==='text')?'1fr':'1fr 1fr', gap:8 }}>
                {cat.items.map(item => (
                  <div key={item.key}>
                    <label style={{ ...lblStyle, color:newItems[item.key]?'#0F6E56':'#6b7280' }}>
                      {item.label}{item.unit&&<span style={{ color:'#9ca3af', fontWeight:400 }}> ({item.unit})</span>}
                    </label>
                    {item.type === 'text'
                      ? <textarea value={newItems[item.key]||''} onChange={e => setNewItems(p => ({...p,[item.key]:e.target.value}))}
                          placeholder="소견 입력..." rows={2}
                          style={{ ...iStyle, resize:'vertical', lineHeight:1.5 }} />
                      : <input type="number" step="any" value={newItems[item.key]||''} onChange={e => setNewItems(p => ({...p,[item.key]:e.target.value}))}
                          placeholder="-" style={{ ...iStyle, textAlign:'center', background:newItems[item.key]?'#f0faf5':'#fff', borderColor:newItems[item.key]?'#6ee7b7':'#e5e7eb' }} />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginBottom:16, marginTop:8 }}>
        <label style={lblStyle}>추가 메모</label>
        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="이상소견, 의사 코멘트 등..." style={{ ...iStyle, resize:'vertical', minHeight:60, lineHeight:1.6 }} />
      </div>
      <div style={{ background:'#fffbeb', borderRadius:8, padding:'9px 12px', fontSize:11, color:'#92400e', marginBottom:12, border:'1px solid #fde68a' }}>
        저장 시 이상 수치 항목은 트래킹 탭에 자동 등록되어 1년 후 재검 알림이 설정됩니다.
      </div>
      <button onClick={saveCheckup} disabled={saving}
        style={{ width:'100%', padding:'11px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
        {saving ? '저장 중...' : editCheckup ? '수정 완료' : '저장'}
      </button>
    </Sheet>
  ) : null

  const [trendCatFilter, setTrendCatFilter] = useState('all')

  const trendModalJsx = showTrend ? (
    <div style={{ position:'fixed', inset:0, zIndex:8000, background:'rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ background:'#fff', display:'flex', flexDirection:'column', height:'100%', maxWidth:1100, width:'100%', margin:'0 auto', borderRadius:'0 0 0 0' }}>
        {/* 헤더 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #f0ede8', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>연도별 건강 추이표</div>
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>검진 {checkups.length}회 기록  /  항목별 수치 변화</div>
          </div>
          <button onClick={() => setShowTrend(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>x</button>
        </div>

        {/* 카테고리 탭 */}
        <div style={{ display:'flex', gap:5, padding:'10px 20px', borderBottom:'1px solid #f0ede8', flexShrink:0, overflowX:'auto' }}>
          <button onClick={() => setTrendCatFilter('all')}
            style={{ padding:'5px 12px', borderRadius:16, border:trendCatFilter==='all'?'none':'1px solid #e5e7eb', background:trendCatFilter==='all'?'#0F6E56':'#fff', color:trendCatFilter==='all'?'#fff':'#6b7280', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontWeight:trendCatFilter==='all'?700:400 }}>
            전체
          </button>
          {CHECKUP_CATEGORIES.filter(cat => cat.items.some(item => trendData[item.key]?.length >= 1)).map(cat => (
            <button key={cat.key} onClick={() => setTrendCatFilter(cat.key)}
              style={{ padding:'5px 12px', borderRadius:16, border:trendCatFilter===cat.key?'none':'1px solid #e5e7eb', background:trendCatFilter===cat.key?'#0F6E56':'#fff', color:trendCatFilter===cat.key?'#fff':'#6b7280', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontWeight:trendCatFilter===cat.key?700:400 }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 0 20px' }}>
          {checkups.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>검진 기록이 없습니다</div>
          ) : (() => {
            // 날짜 정렬 (오래된 순)
            const sorted = [...checkups].sort((a,b) => a.date.localeCompare(b.date))
            const dates = sorted.map(c => c.date)
            const catsToShow = trendCatFilter === 'all'
              ? CHECKUP_CATEGORIES
              : CHECKUP_CATEGORIES.filter(c => c.key === trendCatFilter)

            return catsToShow.map(cat => {
              // 이 카테고리에서 하나라도 데이터 있는 항목만
              const hasData = cat.items.filter(item => sorted.some(c => c.items?.[item.key] != null && c.items[item.key] !== ''))
              if (hasData.length === 0) return null

              return (
                <div key={cat.key}>
                  {/* 카테고리 헤더 */}
                  <div style={{ padding:'12px 20px 6px', background:'#f5f3ef', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', fontSize:12, fontWeight:700, color:'#374151', position:'sticky', top:0, zIndex:1 }}>
                    {cat.label}
                  </div>

                  {/* 테이블 */}
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, minWidth: 200 + dates.length * 90 }}>
                      <thead>
                        <tr style={{ background:'#f9fafb' }}>
                          <th style={{ textAlign:'left', padding:'8px 20px', fontWeight:700, color:'#6b7280', borderBottom:'1px solid #e5e7eb', width:160, position:'sticky', left:0, background:'#f9fafb', zIndex:1 }}>항목</th>
                          <th style={{ textAlign:'center', padding:'8px 12px', fontWeight:600, color:'#9ca3af', borderBottom:'1px solid #e5e7eb', width:50 }}>단위</th>
                          {dates.map(d => (
                            <th key={d} style={{ textAlign:'center', padding:'8px 12px', fontWeight:700, color:'#374151', borderBottom:'1px solid #e5e7eb', minWidth:80 }}>
                              {d.slice(0,7)}
                            </th>
                          ))}
                          <th style={{ textAlign:'center', padding:'8px 12px', fontWeight:700, color:'#374151', borderBottom:'1px solid #e5e7eb', minWidth:60 }}>추이</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hasData.map((item, rowIdx) => {
                          const isText = item.type === 'text'
                          const values = sorted.map(c => c.items?.[item.key] ?? null)
                          const numValues = isText ? [] : values.map(v => v != null ? parseFloat(v) : null).filter(v => v != null)
                          const last = isText ? null : numValues[numValues.length-1]
                          const prev = isText ? null : numValues[numValues.length-2]
                          const ws = (!isText && last != null) ? item.warn?.(last, memberGender) : null
                          const trendArrow = (!isText && last != null && prev != null) ? (last > prev ? 'v' : last < prev ? 'v' : '') : ''
                          // 화살표 방향 수정: 상승/하강
                          const trendDir = (!isText && last != null && prev != null) ? (last > prev ? 1 : last < prev ? -1 : 0) : 0

                          return (
                            <tr key={item.key} style={{ background: rowIdx%2===0 ? '#fff' : '#fafafa', borderBottom:'1px solid #f0ede8' }}>
                              {/* 항목명 - sticky */}
                              <td style={{ padding:'8px 20px', fontWeight:600, color:'#374151', position:'sticky', left:0, background:rowIdx%2===0?'#fff':'#fafafa', zIndex:1 }}>
                                {item.label}
                              </td>
                              <td style={{ textAlign:'center', padding:'8px 8px', color:'#9ca3af', fontSize:11 }}>{item.unit || '-'}</td>

                              {/* 각 날짜 수치 */}
                              {values.map((val, ci) => {
                                if (val == null) return (
                                  <td key={ci} style={{ textAlign:'center', padding:'8px 12px', color:'#e5e7eb' }}>-</td>
                                )
                                if (isText) return (
                                  <td key={ci} style={{ textAlign:'left', padding:'6px 10px', fontSize:11, color:'#374151', maxWidth:140, lineHeight:1.4 }}>
                                    {String(val)}
                                  </td>
                                )
                                const numV = parseFloat(val)
                                const cellWs = item.warn?.(numV, memberGender)
                                const cellClr = cellWs ? (STATUS_COLORS[cellWs] || '#374151') : '#374151'
                                const cellBg = cellWs ? (STATUS_COLORS[cellWs] || '#6b7280') + '12' : 'transparent'
                                // prev value for this column
                                const prevVal = ci > 0 ? parseFloat(values.slice(0,ci).filter(v=>v!=null).slice(-1)[0]) : null
                                const diff = (prevVal != null && !isNaN(prevVal)) ? numV - prevVal : null
                                return (
                                  <td key={ci} style={{ textAlign:'center', padding:'6px 12px', background:cellBg }}>
                                    <div style={{ fontWeight: cellWs ? 700 : 500, color:cellClr, fontSize:13 }}>{val}</div>
                                    {diff != null && diff !== 0 && (
                                      <div style={{ fontSize:10, color: diff > 0 ? '#ef4444' : '#10b981', marginTop:1 }}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                      </div>
                                    )}
                                    {cellWs && <div style={{ fontSize:9, color:cellClr, fontWeight:700, marginTop:1 }}>{cellWs}</div>}
                                  </td>
                                )
                              })}

                              {/* 추이 스파크라인 */}
                              <td style={{ textAlign:'center', padding:'4px 12px' }}>
                                {isText ? (
                                  <span style={{ fontSize:10, color:'#9ca3af' }}>-</span>
                                ) : numValues.length >= 2 ? (
                                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                                    <Sparkline values={numValues} color={ws ? (STATUS_COLORS[ws]||'#0F6E56') : '#0F6E56'} width={70} height={28} />
                                    <span style={{ fontSize:10, color: trendDir > 0 ? '#ef4444' : trendDir < 0 ? '#10b981' : '#9ca3af', fontWeight:700 }}>
                                      {trendDir > 0 ? '(+)' : trendDir < 0 ? '(-)' : '(=)'}
                                    </span>
                                  </div>
                                ) : <span style={{ fontSize:10, color:'#9ca3af' }}>1회</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          })()}
        </div>

        {/* 범례 */}
        <div style={{ padding:'10px 20px', borderTop:'1px solid #f0ede8', display:'flex', gap:16, flexWrap:'wrap', flexShrink:0, background:'#fafaf9' }}>
          <span style={{ fontSize:11, color:'#6b7280' }}>범례:</span>
          <span style={{ fontSize:11, color:'#dc2626', fontWeight:700 }}>빨강 = 위험/이상</span>
          <span style={{ fontSize:11, color:'#d97706', fontWeight:700 }}>주황 = 주의/경계</span>
          <span style={{ fontSize:11, color:'#ef4444' }}>(+) 상승</span>
          <span style={{ fontSize:11, color:'#10b981' }}>(-)  하강</span>
          <span style={{ fontSize:11, color:'#9ca3af' }}>회색 셀 = 해당 검진에 기록 없음</span>
        </div>
      </div>
    </div>
  ) : null

  if (loading) return <div style={{ padding:20, color:'#9ca3af', fontSize:13 }}>로딩 중...</div>

  const latestCheckup = checkups[0]
  const latestAbnormal = latestCheckup ? detectAbnormal(latestCheckup.items, memberGender) : []
  const latestFindingAbnormal = latestCheckup ? detectFindingAbnormal(latestCheckup.items) : []

  return (
    <div>
      {/* 이상 항목 요약 배너 */}
      {(latestAbnormal.length > 0 || latestFindingAbnormal.length > 0) && (
        <div style={{ background:'#fffbeb', borderRadius:12, padding:'12px 16px', marginBottom:16, border:'1px solid #fde68a' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:8 }}>[!] 최근 검진 이상 항목 ({latestCheckup.date})</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {latestAbnormal.map(a => (
              <span key={a.key} style={{ fontSize:11, background:(STATUS_COLORS[a.status]||'#6b7280')+'18', color:STATUS_COLORS[a.status]||'#6b7280', borderRadius:6, padding:'3px 9px', fontWeight:700 }}>
                {a.label} {a.value}{a.unit} ({a.status})
              </span>
            ))}
            {latestFindingAbnormal.map(f => (
              <span key={f.key} style={{ fontSize:11, background:'#fee2e2', color:'#991b1b', borderRadius:6, padding:'3px 9px', fontWeight:700 }}>
                {f.label} - 소견 있음
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:14, fontWeight:700 }}>건강검진 기록 <span style={{ color:'#9ca3af', fontWeight:400 }}>({checkups.length}회)</span></span>
        <div style={{ display:'flex', gap:6 }}>
          {checkups.length >= 1 && <button onClick={() => setShowTrend(true)} style={{ padding:'6px 12px', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:12, cursor:'pointer', fontWeight:600 }}>연도별 추이표</button>}
          <button onClick={() => setShowAdd(true)} style={{ padding:'6px 14px', borderRadius:7, background:'#0F6E56', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 검진 추가</button>
        </div>
      </div>

      {checkups.length === 0
        ? <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af', fontSize:13 }}>
            <div style={{ marginBottom:10 }}>검진 기록이 없습니다</div>
            <button onClick={() => setShowAdd(true)} style={{ padding:'8px 20px', borderRadius:20, background:'#0F6E56', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>첫 검진 기록 추가</button>
          </div>
        : checkups.map(chk => {
            const abnormal = detectAbnormal(chk.items, memberGender)
            const findingAbnormal = detectFindingAbnormal(chk.items)
            const isExpanded = expandedCheckup === chk.id
            const filledItems = CHECKUP_ITEMS.filter(item => chk.items?.[item.key] != null && chk.items[item.key] !== '')

            return (
              <div key={chk.id} style={{ background:'#fff', borderRadius:12, marginBottom:12, border: (abnormal.length>0||findingAbnormal.length>0) ? '1px solid #fde68a' : '1px solid #f0ede8', overflow:'hidden' }}>
                {/* 카드 헤더 */}
                <div style={{ padding:'14px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }} onClick={() => setExpandedCheckup(isExpanded ? null : chk.id)}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', marginBottom:4 }}>{chk.date} 검진</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:'#9ca3af' }}>{filledItems.length}개 항목</span>
                      {abnormal.length > 0 && <span style={{ fontSize:11, background:'#fef3c7', color:'#92400e', borderRadius:6, padding:'1px 7px', fontWeight:700 }}>{abnormal.length}개 수치 이상</span>}
                      {findingAbnormal.length > 0 && <span style={{ fontSize:11, background:'#fee2e2', color:'#991b1b', borderRadius:6, padding:'1px 7px', fontWeight:700 }}>{findingAbnormal.length}개 소견 이상</span>}
                      {(chk.imagingFiles||[]).length > 0 && <span style={{ fontSize:11, background:'#f5f3ff', color:'#7c3aed', borderRadius:6, padding:'1px 7px', fontWeight:700 }}>영상 {(chk.imagingFiles||[]).length}장</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <button onClick={e => { e.stopPropagation(); openEdit(chk) }} style={{ fontSize:11, color:'#2563eb', background:'none', border:'1px solid #bfdbfe', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>수정</button>
                    <button onClick={e => { e.stopPropagation(); delCheckup(chk.id) }} style={{ fontSize:11, color:'#ef4444', background:'none', border:'1px solid #fca5a5', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>삭제</button>
                    <span style={{ fontSize:12, color:'#9ca3af' }}>{isExpanded?'v':'>'}</span>
                  </div>
                </div>

                {/* 이상 항목 미리보기 (접힌 상태) */}
                {!isExpanded && (abnormal.length > 0 || findingAbnormal.length > 0) && (
                  <div style={{ padding:'0 16px 12px', display:'flex', flexWrap:'wrap', gap:5 }}>
                    {abnormal.map(a => (
                      <span key={a.key} style={{ fontSize:11, background:(STATUS_COLORS[a.status]||'#6b7280')+'18', color:STATUS_COLORS[a.status]||'#6b7280', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>
                        {a.label} {a.value}{a.unit}
                      </span>
                    ))}
                  </div>
                )}

                {/* 펼친 상태 - 전체 결과 카테고리별 표시 */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid #f0ede8', padding:'16px' }}>
                    {CHECKUP_CATEGORIES.map(cat => {
                      const catItems = cat.items.filter(item => chk.items?.[item.key] != null && chk.items[item.key] !== '')
                      if (catItems.length === 0) return null
                      return (
                        <div key={cat.key} style={{ marginBottom:16 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:8, paddingBottom:4, borderBottom:'1px solid #f0ede8', textTransform:'uppercase', letterSpacing:'0.5px' }}>{cat.label}</div>
                          {true && (
                              <div>
                                {catItems.filter(item => item.type === 'text').length > 0 && (
                                  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
                                    {catItems.filter(item => item.type === 'text').map(item => {
                                      const isAbnormal = findingAbnormal.find(f => f.key === item.key)
                                      return (
                                        <div key={item.key} style={{ background:isAbnormal?'#fee2e2':'#f8f6f2', borderRadius:7, padding:'8px 11px', border:isAbnormal?'1px solid #fca5a5':'none' }}>
                                          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>{item.label}</div>
                                          <div style={{ fontSize:13, color:isAbnormal?'#991b1b':'#1a1a1a', lineHeight:1.6 }}>{chk.items[item.key]}</div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {catItems.filter(item => item.type !== 'text').length > 0 && (
                                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px,1fr))', gap:6 }}>
                                {catItems.filter(item => item.type !== 'text').map(item => {
                                  const v = parseFloat(chk.items[item.key])
                                  const ws = item.warn?.(v, memberGender)
                                  const clr = ws ? (STATUS_COLORS[ws] || '#6b7280') : '#374151'
                                  const td = trendData[item.key]
                                  const prev = td?.find(d => d.date < chk.date)
                                  const trend = prev ? (v > prev.value ? '^' : v < prev.value ? 'v' : '') : ''
                                  const trendClr = trend==='^'?'#ef4444':trend==='v'?'#10b981':'#9ca3af'
                                  return (
                                    <div key={item.key} style={{ background:ws?(STATUS_COLORS[ws]||'#6b7280')+'12':'#f8f6f2', borderRadius:7, padding:'7px 9px', border:ws?'1px solid '+(STATUS_COLORS[ws]||'#6b7280')+'30':'none' }}>
                                      <div style={{ fontSize:10, color:'#9ca3af', marginBottom:2 }}>{item.label}</div>
                                      <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                                        <span style={{ fontSize:15, fontWeight:700, color:clr }}>{chk.items[item.key]}</span>
                                        {item.unit && <span style={{ fontSize:10, color:'#9ca3af' }}>{item.unit}</span>}
                                        {trend && <span style={{ fontSize:11, color:trendClr, fontWeight:700 }}>{trend}</span>}
                                      </div>
                                      {ws && <div style={{ fontSize:10, color:clr, marginTop:1, fontWeight:600 }}>{ws}</div>}
                                    </div>
                                  )
                                })}
                              </div>
                                )}
                              </div>
                          )}
                        </div>
                      )
                    })}

                    {/* 영상검사 이미지 */}
                    {(chk.imagingFiles||[]).length > 0 && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:8, paddingBottom:4, borderBottom:'1px solid #f0ede8', textTransform:'uppercase', letterSpacing:'0.5px' }}>영상검사 이미지</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {chk.imagingFiles.map((f,i) => (
                            <div key={i} style={{ textAlign:'center' }}>
                              <img src={f.url} alt={f.label} onClick={() => window.open(f.url,'_blank')}
                                style={{ width:100, height:100, objectFit:'cover', borderRadius:8, border:'1px solid #ddd6fe', cursor:'zoom-in' }} />
                              <div style={{ fontSize:10, color:'#7c3aed', fontWeight:600, marginTop:3, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {chk.note && <div style={{ background:'#fffbeb', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400e', lineHeight:1.6 }}>{chk.note}</div>}
                    {(abnormal.length > 0 || findingAbnormal.length > 0) && (
                      <AiCheckupAnalysis
                        abnormalItems={abnormal}
                        findingItems={findingAbnormal}
                        memberInfo={{ gender: memberGender, age: '' }}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })
      }
      {addModalJsx}
      {trendModalJsx}
    </div>
  )
}
