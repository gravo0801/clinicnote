import { useState, useEffect, useRef } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, query, orderBy, where
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'

const CLOUD_NAME = 'dfcvmvlen'
const UPLOAD_PRESET = 'clinicnote_uploads'

//  초음파 분류 체계 
const US_CATEGORIES = [
  {
    key: 'abdomen', label: '복부', icon: 'A',
    subs: ['간(Liver)','담낭/담도','비장','췌장','신장/부신','복수/복막','혈관(대동맥/IVC)','기타복부'],
  },
  {
    key: 'thyroid', label: '갑상선/경부', icon: 'T',
    subs: ['갑상선 결절','갑상선 미만성 질환','경부 림프절','부갑상선','침샘'],
  },
  {
    key: 'breast', label: '유방', icon: 'B',
    subs: ['낭성 병변','고형 병변','BIRADS 분류','액와 림프절'],
  },
  {
    key: 'msk', label: '근골격', icon: 'M',
    subs: ['어깨/회전근개','무릎','발목/족부','팔꿈치','손목/손','힘줄/건초염'],
  },
  {
    key: 'vascular', label: '혈관', icon: 'V',
    subs: ['경동맥','하지정맥','DVT','동정맥루(투석)'],
  },
  {
    key: 'ob', label: '산부인과', icon: 'O',
    subs: ['자궁','난소','임신 초기','임신 중기/후기'],
  },
  {
    key: 'focused', label: 'POCUS/집중', icon: 'P',
    subs: ['FAST(외상)','Lung US','심장(기초)','IVC 평가','방광'],
  },
]

const ALL_SUBS = US_CATEGORIES.flatMap(c => c.subs.map(s => ({ cat: c.key, catLabel: c.label, sub: s })))

// 놓치기 쉬운 질환 목록 (refer 기준 포함)
const PITFALL_PRESETS = [
  { organ: '간', disease: '간세포암(HCC) 소결절', sign: '위성결절, 배후음영, washout', refer: '간내과/소화기내과 (조영초음파 또는 CT 의뢰)', priority: 'high' },
  { organ: '간', disease: '간내담관 확장', sign: '담관 이중관 소견, 평행선', refer: '소화기내과 (MRCP 의뢰)', priority: 'high' },
  { organ: '담낭', disease: '담낭 용종 10mm 이상', sign: '유경성, 혈류신호', refer: '외과 (수술 고려)', priority: 'high' },
  { organ: '담낭', disease: '담낭벽 비후/불규칙', sign: '국소 비후, 5mm 이상', refer: '외과/소화기내과', priority: 'high' },
  { organ: '신장', disease: '신장 낭종 복잡성(Bosniak III-IV)', sign: '격막/석회화/고형부', refer: '비뇨기과', priority: 'high' },
  { organ: '신장', disease: '신우신배 확장(수신증)', sign: '신우 전후경 15mm 이상', refer: '비뇨기과', priority: 'mid' },
  { organ: '갑상선', disease: 'K-TIRADS 4-5', sign: '미세석회화, 불규칙경계, 종횡비>1', refer: '내분비내과 (FNA 의뢰)', priority: 'high' },
  { organ: '갑상선', disease: '경부 림프절 전이 의심', sign: '원형, 내부 석회화, 피막 소실', refer: '이비인후과/내분비내과', priority: 'high' },
  { organ: '복부혈관', disease: '복부 대동맥류(AAA)', sign: '대동맥 직경 3cm 이상', refer: '혈관외과', priority: 'high' },
  { organ: '비장', disease: '비장 종괴', sign: '고형, 혈류신호, 경계 불규칙', refer: '혈액종양내과', priority: 'high' },
  { organ: '췌장', disease: '췌관 확장 (주췌관 3mm 이상)', sign: '국소 확장, 막힘 부위', refer: '소화기내과 (MRCP/EUS)', priority: 'high' },
  { organ: '복막', disease: '복수 + 격막', sign: '격막성 복수, 복막 비후', refer: '소화기내과/종양내과', priority: 'high' },
]

async function uploadToCloudinary(file, onProgress) {
  const ext = file.name.split('.').pop().toLowerCase()
  const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext)
  const isVid = ['mp4','mov','avi','webm'].includes(ext)
  const rtype = isImg ? 'image' : isVid ? 'video' : 'raw'
  if (file.size > 50 * 1024 * 1024) throw new Error(file.name + ' 50MB 초과')
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'clinicnote_us')
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + rtype + '/upload')
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded/e.total*100)) }
    xhr.onload = () => {
      if (xhr.status === 200) {
        const r = JSON.parse(xhr.responseText)
        resolve({ url: r.secure_url, name: file.name, mime: file.type, size: file.size, rtype })
      } else reject(new Error('업로드 실패 (' + xhr.status + ')'))
    }
    xhr.onerror = () => reject(new Error('네트워크 오류'))
    xhr.send(fd)
  })
}

//  미디어 뷰어 
function MediaViewer({ file, onClose }) {
  const isImg = file.mime?.startsWith('image/') || file.rtype === 'image'
  const isVid = file.mime?.startsWith('video/') || file.rtype === 'video'
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>{file.name}</div>
      {isImg && <img src={file.url} alt={file.name} onClick={e=>e.stopPropagation()} style={{ maxWidth:'92vw', maxHeight:'85vh', objectFit:'contain', borderRadius:8 }} />}
      {isVid && <video src={file.url} controls autoPlay onClick={e=>e.stopPropagation()} style={{ maxWidth:'92vw', maxHeight:'85vh', borderRadius:8 }} />}
      {!isImg && !isVid && (
        <div style={{ color:'#fff', textAlign:'center' }}>
          <div style={{ marginBottom:12 }}>{file.name}</div>
          <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ background:'#0F6E56', color:'#fff', padding:'8px 20px', borderRadius:8, textDecoration:'none', fontWeight:700 }}>다운로드</a>
        </div>
      )}
      <div style={{ marginTop:12, fontSize:11, color:'rgba(255,255,255,0.4)' }}>클릭하여 닫기</div>
    </div>
  )
}

//  아틀라스 케이스 카드 

//  인라인 리치 에디터 (초음파 탭용) 
// collectionName: Firestore 컬렉션, docId: 문서ID, fieldName: 저장할 필드명
function UsRichView({ text, collectionName, docId, fieldName, bgColor }) {
  const editorRef = useRef(null)
  const [toolbarPos, setToolbarPos] = useState(null)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return
    const isHtml = text?.includes('<mark') || text?.includes('<strong') || text?.includes('<em') || text?.includes('<u>')
    if (isHtml) editorRef.current.innerHTML = text || ''
    else editorRef.current.innerText = text || ''
  }, [docId, fieldName])

  const handleSelect = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.toString().trim() === '') { setToolbarPos(null); return }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const edRect = editorRef.current.getBoundingClientRect()
    setToolbarPos({ top: rect.top - edRect.top - 46, left: Math.max(0, rect.left - edRect.left + rect.width/2 - 145) })
  }

  const exec = (cmd, val) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); setToolbarPos(null); setDirty(true) }

  const saveContent = async () => {
    if (!editorRef.current || !dirty) return
    try {
      await updateDoc(doc(db, collectionName, docId), { [fieldName]: editorRef.current.innerHTML, updatedAt: serverTimestamp() })
      setSaved(true); setDirty(false)
      setTimeout(() => setSaved(false), 2000)
    } catch(e) { console.error(e) }
  }

  const highlights = [
    { color: '#fef08a', label: 'Y' }, { color: '#bbf7d0', label: 'G' },
    { color: '#fecaca', label: 'R' }, { color: '#bfdbfe', label: 'B' },
    { color: '#e9d5ff', label: 'P' },
  ]

  return (
    <div style={{ position: 'relative' }}>
      {toolbarPos && (
        <div style={{ position:'absolute', top: toolbarPos.top, left: toolbarPos.left, zIndex:200, background:'#1a1a1a', borderRadius:9, padding:'5px 8px', display:'flex', gap:4, alignItems:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.3)', userSelect:'none' }}>
          {[['B','bold'],['I','italic'],['U','underline'],['S','strikeThrough']].map(([icon,cmd]) => (
            <button key={cmd} onMouseDown={e => { e.preventDefault(); exec(cmd) }}
              style={{ width:26, height:26, borderRadius:5, border:'none', background:'rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer', fontSize:13,
                fontWeight: cmd==='bold'?900:400, fontStyle: cmd==='italic'?'italic':'normal',
                textDecoration: cmd==='underline'?'underline':cmd==='strikeThrough'?'line-through':'none' }}>{icon}</button>
          ))}
          <div style={{ width:1, height:16, background:'rgba(255,255,255,0.2)', margin:'0 2px' }} />
          {highlights.map(h => (
            <button key={h.color} onMouseDown={e => { e.preventDefault(); exec('hiliteColor', h.color) }}
              style={{ width:18, height:18, borderRadius:3, border:'1px solid rgba(255,255,255,0.3)', background:h.color, cursor:'pointer', padding:0, fontSize:9, color:'#333' }}>{h.label}</button>
          ))}
          <div style={{ width:1, height:16, background:'rgba(255,255,255,0.2)', margin:'0 2px' }} />
          <button onMouseDown={e => { e.preventDefault(); exec('removeFormat') }}
            style={{ width:26, height:26, borderRadius:5, border:'none', background:'rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer', fontSize:10 }}>x</button>
          <div style={{ position:'absolute', bottom:-5, left:140, width:10, height:10, background:'#1a1a1a', transform:'rotate(45deg)', borderRadius:1 }} />
        </div>
      )}
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onMouseUp={handleSelect} onKeyUp={handleSelect} onInput={() => setDirty(true)}
        style={{ fontSize:13, color:'#1a1a1a', lineHeight:1.85, background: bgColor || '#f8f6f2', borderRadius:8, padding:'10px 12px', border: dirty ? '1px solid #6ee7b7' : '1px solid #f0ede8', outline:'none', whiteSpace:'pre-wrap', wordBreak:'break-word', cursor:'text', minHeight:36 }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
        <span style={{ fontSize:10, color:'#9ca3af' }}>선택 후 서식 적용</span>
        {(dirty || saved) && (
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {saved && <span style={{ fontSize:11, color:'#0F6E56' }}>저장됨</span>}
            {dirty && <button onClick={saveContent} style={{ fontSize:11, color:'#fff', background:'#0891b2', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontWeight:700 }}>서식 저장</button>}
          </div>
        )}
      </div>
    </div>
  )
}

function AtlasCard({ item, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [viewFile, setViewFile] = useState(null)
  const cat = US_CATEGORIES.find(c => c.key === item.category)
  const mediaCount = (item.mediaFiles || []).length
  const diffCount = (item.differentials || []).length

  return (
    <>
      <div style={{ background:'#fff', borderRadius:12, marginBottom:10, border:'1px solid #f0ede8', overflow:'hidden', boxShadow: open ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}>
        <div onClick={() => setOpen(p=>!p)} style={{ padding:'12px 16px', cursor:'pointer', display:'flex', gap:10, alignItems:'flex-start' }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'#0891b2', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:800, flexShrink:0 }}>
            {cat?.icon || 'U'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', marginBottom:3 }}>{item.title || '제목 없음'}</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:10, background:'#e0f2fe', color:'#0891b2', borderRadius:6, padding:'1px 7px', fontWeight:700 }}>{cat?.label}</span>
              {item.subCategory && <span style={{ fontSize:10, background:'#f0f9ff', color:'#0369a1', borderRadius:6, padding:'1px 7px' }}>{item.subCategory}</span>}
              {item.difficulty && <span style={{ fontSize:10, background: item.difficulty==='고급'?'#fee2e2':item.difficulty==='중급'?'#fef3c7':'#f0faf5', color: item.difficulty==='고급'?'#991b1b':item.difficulty==='중급'?'#92400e':'#065f46', borderRadius:6, padding:'1px 7px', fontWeight:600 }}>{item.difficulty}</span>}
              {mediaCount > 0 && <span style={{ fontSize:10, color:'#7c3aed', background:'#f5f3ff', borderRadius:4, padding:'1px 6px' }}>{'이미지/영상 ' + mediaCount}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:5, flexShrink:0 }}>
            <button onClick={e=>{e.stopPropagation(); onEdit(item)}} style={{ fontSize:11, color:'#6b7280', background:'none', border:'1px solid #e5e7eb', borderRadius:5, padding:'3px 8px', cursor:'pointer' }}>수정</button>
            <button onClick={e=>{e.stopPropagation(); onDelete(item.id)}} style={{ fontSize:11, color:'#ef4444', background:'none', border:'1px solid #fca5a5', borderRadius:5, padding:'3px 8px', cursor:'pointer' }}>삭제</button>
            <span style={{ fontSize:10, color:'#9ca3af', display:'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', marginTop:4 }}>v</span>
          </div>
        </div>
        {open && (
          <div style={{ borderTop:'1px solid #f0ede8', padding:'14px 16px', background:'#fafaf9' }}>
            {/* 미디어 */}
            {mediaCount > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginBottom:8 }}>{'이미지 / 영상 (' + mediaCount + ')'}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {item.mediaFiles.map((f, i) => {
                    const isVid = f.mime?.startsWith('video/') || f.rtype === 'video'
                    return (
                      <div key={i} onClick={() => setViewFile(f)} style={{ position:'relative', cursor:'zoom-in' }}>
                        {isVid
                          ? <div style={{ width:90, height:90, background:'#1a1a1a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}></div>
                          : <img src={f.url} alt={f.name} style={{ width:90, height:90, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />}
                        <div style={{ fontSize:9, color:'#9ca3af', marginTop:2, maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {/* 소견 */}
            {item.findings && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#0891b2', marginBottom:4 }}>초음파 소견</div>
                <UsRichView text={item.findings} collectionName="usAtlas" docId={item.id} fieldName="findings" bgColor="#f0f9ff" />
              </div>
            )}
            {/* 감별 진단 */}
            {diffCount > 0 && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>감별 진단</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {item.differentials.map((d, i) => (
                    <span key={i} style={{ fontSize:12, background:'#f5f3ff', color:'#5b21b6', borderRadius:7, padding:'3px 10px', border:'1px solid #ddd6fe' }}>{d}</span>
                  ))}
                </div>
              </div>
            )}
            {/* 최종 진단 */}
            {item.diagnosis && (
              <div style={{ marginBottom:10, background:'#f0faf5', borderRadius:7, padding:'9px 12px', border:'1px solid #6ee7b7' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#0F6E56' }}>최종 진단: </span>
                <span style={{ fontSize:13, color:'#1a1a1a', fontWeight:600 }}>{item.diagnosis}</span>
              </div>
            )}
            {/* 핵심 포인트 */}
            {item.keyPoints && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#d97706', marginBottom:4 }}>핵심 포인트</div>
                <UsRichView text={item.keyPoints} collectionName="usAtlas" docId={item.id} fieldName="keyPoints" bgColor="#fffbeb" />
              </div>
            )}
            {/* 의뢰 기준 */}
            {item.referCriteria && (
              <div style={{ background:'#fee2e2', borderRadius:7, padding:'9px 12px', border:'1px solid #fca5a5' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#dc2626' }}>의뢰 기준: </span>
                <span style={{ fontSize:12, color:'#991b1b' }}>{item.referCriteria}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {viewFile && <MediaViewer file={viewFile} onClose={() => setViewFile(null)} />}
    </>
  )
}

//  아틀라스 입력 폼 
function AtlasForm({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [category, setCategory] = useState(initial?.category || 'abdomen')
  const [subCategory, setSubCat] = useState(initial?.subCategory || '')
  const [difficulty, setDiff] = useState(initial?.difficulty || '중급')
  const [findings, setFindings] = useState(initial?.findings || '')
  const [diffList, setDiffList] = useState(initial?.differentials || [])
  const [diffInput, setDiffInput] = useState('')
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis || '')
  const [keyPoints, setKeyPoints] = useState(initial?.keyPoints || '')
  const [referCriteria, setReferCriteria] = useState(initial?.referCriteria || '')
  const [mediaFiles, setMediaFiles] = useState(initial?.mediaFiles || [])
  const [uploadProgress, setUploadProgress] = useState({})
  const [saving, setSaving] = useState(false)

  const catObj = US_CATEGORIES.find(c => c.key === category)

  const handleMedia = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    for (const file of files) {
      const key = file.name + Date.now()
      setUploadProgress(p => ({ ...p, [key]: 0 }))
      try {
        const result = await uploadToCloudinary(file, pct => setUploadProgress(p => ({ ...p, [key]: pct })))
        setMediaFiles(p => [...p, result])
      } catch(err) { alert(err.message) }
      finally { setUploadProgress(p => { const n={...p}; delete n[key]; return n }) }
    }
  }

  const addDiff = () => {
    if (!diffInput.trim()) return
    setDiffList(p => [...p, diffInput.trim()])
    setDiffInput('')
  }

  const uploading = Object.entries(uploadProgress)
  const disabled = !title.trim() || saving || uploading.length > 0

  const iStyle = { width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff' }
  const lStyle = { display:'block', fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:600 }

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ marginBottom:12 }}>
        <label style={lStyle}>제목 *</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} autoFocus placeholder="예: 간 단순 낭종 vs 복잡 낭종 감별" style={iStyle} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div>
          <label style={lStyle}>카테고리</label>
          <select value={category} onChange={e=>{setCategory(e.target.value); setSubCat('')}} style={{ ...iStyle }}>
            {US_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lStyle}>세부 분류</label>
          <select value={subCategory} onChange={e=>setSubCat(e.target.value)} style={{ ...iStyle }}>
            <option value="">선택</option>
            {(catObj?.subs || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={lStyle}>난이도</label>
        <div style={{ display:'flex', gap:6 }}>
          {['초급','중급','고급'].map(d => (
            <button key={d} onClick={() => setDiff(d)}
              style={{ flex:1, padding:'6px', borderRadius:7, border: difficulty===d ? 'none' : '1px solid #e5e7eb', background: difficulty===d ? (d==='고급'?'#dc2626':d==='중급'?'#d97706':'#0F6E56') : '#fff', color: difficulty===d ? '#fff' : '#6b7280', fontSize:12, cursor:'pointer', fontWeight: difficulty===d ? 700 : 400 }}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={lStyle}>초음파 소견</label>
        <textarea value={findings} onChange={e=>setFindings(e.target.value)} rows={4} placeholder="크기, 에코, 경계, 혈류, 특징적 소견 등을 기술하세요..." style={{ ...iStyle, resize:'vertical', lineHeight:1.7 }} />
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={lStyle}>감별 진단</label>
        <div style={{ display:'flex', gap:6, marginBottom:6 }}>
          <input value={diffInput} onChange={e=>setDiffInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addDiff()} placeholder="감별 진단 입력 후 Enter 또는 추가" style={{ ...iStyle, flex:1 }} />
          <button onClick={addDiff} style={{ padding:'9px 14px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>추가</button>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {diffList.map((d,i) => (
            <span key={i} style={{ fontSize:12, background:'#f5f3ff', color:'#5b21b6', borderRadius:7, padding:'3px 10px', border:'1px solid #ddd6fe', display:'flex', alignItems:'center', gap:5 }}>
              {d}
              <button onClick={() => setDiffList(p=>p.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:13, lineHeight:1 }}>x</button>
            </span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={lStyle}>최종 진단</label>
        <input value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="최종 진단명" style={iStyle} />
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={lStyle}>핵심 포인트 (Pearl)</label>
        <textarea value={keyPoints} onChange={e=>setKeyPoints(e.target.value)} rows={3} placeholder="이 케이스에서 기억할 핵심 소견, 감별 포인트..." style={{ ...iStyle, resize:'vertical', lineHeight:1.7 }} />
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={lStyle}>의뢰 기준</label>
        <input value={referCriteria} onChange={e=>setReferCriteria(e.target.value)} placeholder="예: 소화기내과 의뢰 (조영초음파 또는 CT)" style={iStyle} />
      </div>
      <div style={{ marginBottom:16, background:'#f0f9ff', borderRadius:10, padding:'12px 14px', border:'1px solid #bae6fd' }}>
        <label style={{ ...lStyle, color:'#0369a1' }}>이미지 / 영상 첨부 (JPG, PNG, MP4 등, 파일당 50MB)</label>
        <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#0369a1', color:'#fff', borderRadius:8, fontSize:12, cursor:'pointer', fontWeight:700 }}>
          파일 선택
          <input type="file" multiple accept="image/*,video/*,.pdf" onChange={handleMedia} style={{ display:'none' }} />
        </label>
        {uploading.length > 0 && uploading.map(([k,pct]) => (
          <div key={k} style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#0369a1', marginBottom:3 }}><span>업로드 중...</span><span>{pct}%</span></div>
            <div style={{ background:'#bae6fd', borderRadius:4, height:4 }}><div style={{ background:'#0369a1', borderRadius:4, height:4, width:pct+'%', transition:'width 0.3s' }} /></div>
          </div>
        ))}
        {mediaFiles.length > 0 && (
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginTop:10 }}>
            {mediaFiles.map((f,i) => {
              const isVid = f.mime?.startsWith('video/') || f.rtype === 'video'
              return (
                <div key={i} style={{ position:'relative' }}>
                  {isVid
                    ? <div style={{ width:72, height:72, background:'#0369a1', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff' }}></div>
                    : <img src={f.url} alt={f.name} style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'1px solid #bae6fd' }} />}
                  <button onClick={() => setMediaFiles(p=>p.filter((_,idx)=>idx!==i))}
                    style={{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%', background:'#ef4444', color:'#fff', border:'none', fontSize:10, cursor:'pointer', fontWeight:700 }}>x</button>
                  <div style={{ fontSize:9, color:'#9ca3af', marginTop:2, maxWidth:72, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <button onClick={async () => { setSaving(true); await onSave({ title:title.trim(), category, subCategory, difficulty, findings, differentials:diffList, diagnosis, keyPoints, referCriteria, mediaFiles }); setSaving(false) }}
        disabled={disabled}
        style={{ width:'100%', padding:'12px', background: disabled ? '#d1d5db' : '#0891b2', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {saving ? '저장 중...' : uploading.length > 0 ? '업로드 중...' : (initial ? '수정 완료' : '케이스 저장')}
      </button>
    </div>
  )
}

//  아틀라스 탭 
function AtlasTab() {
  const isMobile = useIsMobile()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [subFilter, setSubFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'usAtlas'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => { setItems(snap.docs.map(d => ({ id:d.id, ...d.data() }))); setLoading(false) })
  }, [])

  const save = async (payload) => {
    if (editTarget) await updateDoc(doc(db, 'usAtlas', editTarget.id), { ...payload, updatedAt: serverTimestamp() })
    else await addDoc(collection(db, 'usAtlas'), { ...payload, createdAt: serverTimestamp() })
    setShowForm(false); setEditTarget(null)
  }

  const del = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'usAtlas', id))
  }

  const catObj = US_CATEGORIES.find(c => c.key === catFilter)
  const filtered = items.filter(item => {
    if (catFilter !== 'all' && item.category !== catFilter) return false
    if (subFilter && item.subCategory !== subFilter) return false
    if (diffFilter !== 'all' && item.difficulty !== diffFilter) return false
    if (search && ![item.title, item.findings, item.diagnosis, item.keyPoints].some(t => t?.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  const formSheet = (showForm || editTarget) ? (
    <div style={{ position:'fixed', inset:0, zIndex:8000, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'16px 12px' }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:680, padding:'24px 28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', marginTop:16, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:12, borderBottom:'1px solid #f0ede8' }}>
          <div style={{ fontSize:16, fontWeight:700 }}>{editTarget ? '케이스 수정' : '새 케이스 추가'}</div>
          <button onClick={() => { setShowForm(false); setEditTarget(null) }} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#9ca3af' }}>x</button>
        </div>
        <AtlasForm initial={editTarget} onSave={save} onClose={() => { setShowForm(false); setEditTarget(null) }} />
      </div>
    </div>
  ) : null

  if (loading) return <Spinner />

  return (
    <div style={{ display: isMobile ? 'block' : 'flex', height: isMobile ? 'auto' : '100vh', overflow: isMobile ? 'visible' : 'hidden' }}>
      {!isMobile && (
        <div style={{ width:240, background:'#fff', borderRight:'1px solid #ece9e3', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'14px 12px 10px', borderBottom:'1px solid #f0ede8' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="케이스 검색..." style={{ width:'100%', padding:'7px 9px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
            <button onClick={() => { setCatFilter('all'); setSubFilter('') }} style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'none', background: catFilter==='all' ? '#f0f9ff' : 'transparent', color: catFilter==='all' ? '#0891b2' : '#374151', fontSize:13, fontWeight: catFilter==='all' ? 700 : 400, cursor:'pointer', textAlign:'left', marginBottom:2 }}>
              전체 ({items.length})
            </button>
            {US_CATEGORIES.map(c => (
              <button key={c.key} onClick={() => { setCatFilter(c.key); setSubFilter('') }} style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'none', background: catFilter===c.key ? '#f0f9ff' : 'transparent', color: catFilter===c.key ? '#0891b2' : '#374151', fontSize:13, fontWeight: catFilter===c.key ? 700 : 400, cursor:'pointer', textAlign:'left', marginBottom:2, display:'flex', justifyContent:'space-between' }}>
                <span>{c.label}</span>
                <span style={{ fontSize:11, background:'#f3f4f6', color:'#9ca3af', borderRadius:10, padding:'1px 6px' }}>{items.filter(i=>i.category===c.key).length}</span>
              </button>
            ))}
          </div>
          <div style={{ padding:'12px', borderTop:'1px solid #f0ede8' }}>
            <button onClick={() => setShowForm(true)} style={{ width:'100%', padding:'10px', background:'#0891b2', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              + 케이스 추가
            </button>
          </div>
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto', background:'#f0f9ff', padding: isMobile ? '12px 16px 80px' : '20px 24px 40px' }}>
        {isMobile && (
          <div style={{ marginBottom:10 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="케이스 검색..." style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1px solid #e5e7eb', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
          </div>
        )}
        <div style={{ display:'flex', gap:5, overflowX:'auto', paddingBottom:4, marginBottom:12 }}>
          <button onClick={() => { setCatFilter('all'); setSubFilter('') }} style={{ padding:'4px 11px', borderRadius:16, border: catFilter==='all'?'none':'1px solid #e5e7eb', background: catFilter==='all'?'#0891b2':'#fff', color: catFilter==='all'?'#fff':'#6b7280', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontWeight: catFilter==='all'?700:400 }}>전체</button>
          {US_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => { setCatFilter(c.key); setSubFilter('') }} style={{ padding:'4px 11px', borderRadius:16, border: catFilter===c.key?'none':'1px solid #e5e7eb', background: catFilter===c.key?'#0891b2':'#fff', color: catFilter===c.key?'#fff':'#6b7280', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontWeight: catFilter===c.key?700:400 }}>{c.label}</button>
          ))}
        </div>

        {catObj && (
          <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:4, marginBottom:12 }}>
            <button onClick={() => setSubFilter('')} style={{ padding:'3px 9px', borderRadius:12, border: !subFilter?'none':'1px solid #e5e7eb', background: !subFilter?'#0369a1':'#fff', color: !subFilter?'#fff':'#6b7280', fontSize:10, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>전체</button>
            {catObj.subs.map(s => (
              <button key={s} onClick={() => setSubFilter(s)} style={{ padding:'3px 9px', borderRadius:12, border: subFilter===s?'none':'1px solid #e5e7eb', background: subFilter===s?'#0369a1':'#fff', color: subFilter===s?'#fff':'#6b7280', fontSize:10, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>{s}</button>
            ))}
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ display:'flex', gap:5 }}>
            {['all','초급','중급','고급'].map(d => (
              <button key={d} onClick={() => setDiffFilter(d)} style={{ padding:'4px 9px', borderRadius:12, border: diffFilter===d?'none':'1px solid #e5e7eb', background: diffFilter===d ? (d==='고급'?'#dc2626':d==='중급'?'#d97706':d==='초급'?'#0F6E56':'#0891b2') : '#fff', color: diffFilter===d?'#fff':'#6b7280', fontSize:11, cursor:'pointer', fontWeight: diffFilter===d?700:400 }}>{d==='all'?'전체':d}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#9ca3af' }}>{filtered.length}건</span>
            {isMobile && <button onClick={() => setShowForm(true)} style={{ padding:'6px 14px', background:'#0891b2', color:'#fff', border:'none', borderRadius:18, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 추가</button>}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>US</div>
            <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:8 }}>케이스가 없습니다</div>
            <button onClick={() => setShowForm(true)} style={{ background:'#0891b2', color:'#fff', border:'none', borderRadius:20, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>첫 케이스 추가</button>
          </div>
        ) : filtered.map(item => (
          <AtlasCard key={item.id} item={item} onEdit={setEditTarget} onDelete={del} />
        ))}
      </div>
      {formSheet}
    </div>
  )
}

//  놓치기 쉬운 질환 탭 
function PitfallTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [organFilter, setOrganFilter] = useState('all')
  const [form, setForm] = useState({ organ:'', disease:'', sign:'', refer:'', priority:'high', note:'' })
  const [saving, setSaving] = useState(false)
  const iStyle = { width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff' }
  const lStyle = { display:'block', fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:600 }

  useEffect(() => {
    const q = query(collection(db, 'usPitfalls'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => { setItems(snap.docs.map(d => ({ id:d.id, ...d.data() }))); setLoading(false) })
    // 최초 프리셋 자동 추가 여부는 사용자가 결정
    return unsub
  }, [])

  const addPresets = async () => {
    if (!window.confirm('기본 놓치기 쉬운 질환 목록을 추가하시겠습니까?')) return
    for (const p of PITFALL_PRESETS) {
      await addDoc(collection(db, 'usPitfalls'), { ...p, createdAt: serverTimestamp() })
    }
  }

  const save = async () => {
    if (!form.disease.trim()) return
    setSaving(true)
    if (editTarget) await updateDoc(doc(db, 'usPitfalls', editTarget.id), { ...form, updatedAt: serverTimestamp() })
    else await addDoc(collection(db, 'usPitfalls'), { ...form, createdAt: serverTimestamp() })
    setSaving(false); setShowForm(false); setEditTarget(null)
    setForm({ organ:'', disease:'', sign:'', refer:'', priority:'high', note:'' })
  }

  const del = async (id) => { if (!window.confirm('삭제?')) return; await deleteDoc(doc(db, 'usPitfalls', id)) }
  const openEdit = (item) => { setEditTarget(item); setForm({ organ:item.organ, disease:item.disease, sign:item.sign, refer:item.refer, priority:item.priority, note:item.note||'' }); setShowForm(true) }

  const organs = ['all', ...new Set(items.map(i => i.organ))]
  const filtered = organFilter === 'all' ? items : items.filter(i => i.organ === organFilter)
  const highCount = items.filter(i => i.priority === 'high').length

  if (loading) return <Spinner />

  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:'24px 20px 60px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1a1a1a' }}>놓치기 쉬운 질환</h2>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>초음파에서 반드시 확인하고 의뢰해야 할 질환 목록</div>
          {highCount > 0 && <div style={{ fontSize:12, color:'#dc2626', fontWeight:700, marginTop:4 }}>긴급 의뢰 대상 {highCount}건</div>}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {items.length === 0 && <button onClick={addPresets} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:12, cursor:'pointer' }}>기본 목록 추가</button>}
          <button onClick={() => { setEditTarget(null); setForm({ organ:'', disease:'', sign:'', refer:'', priority:'high', note:'' }); setShowForm(true) }} style={{ padding:'7px 14px', background:'#dc2626', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 추가</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:5, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>
        {organs.map(o => (
          <button key={o} onClick={() => setOrganFilter(o)} style={{ padding:'4px 11px', borderRadius:16, border: organFilter===o?'none':'1px solid #e5e7eb', background: organFilter===o?'#dc2626':'#fff', color: organFilter===o?'#fff':'#6b7280', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontWeight: organFilter===o?700:400 }}>{o==='all'?'전체':o}</button>
        ))}
      </div>

      {filtered.map(item => (
        <div key={item.id} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', marginBottom:8, border: '1px solid ' + (item.priority==='high'?'#fca5a5':'#f0ede8'), boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                <span style={{ fontSize:10, background: item.priority==='high'?'#dc2626':'#d97706', color:'#fff', borderRadius:5, padding:'1px 7px', fontWeight:700 }}>{item.priority==='high'?'긴급 의뢰':'주의'}</span>
                <span style={{ fontSize:10, background:'#f3f4f6', color:'#374151', borderRadius:5, padding:'1px 7px' }}>{item.organ}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>{item.disease}</span>
              </div>
              <div style={{ fontSize:12, color:'#374151', marginBottom:4 }}><span style={{ fontWeight:600, color:'#0891b2' }}>소견: </span>{item.sign}</div>
              <div style={{ fontSize:12, color:'#dc2626' }}><span style={{ fontWeight:600 }}>의뢰: </span>{item.refer}</div>
              {item.note && <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>{item.note}</div>}
            </div>
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              <button onClick={() => openEdit(item)} style={{ fontSize:11, color:'#6b7280', background:'none', border:'1px solid #e5e7eb', borderRadius:5, padding:'3px 7px', cursor:'pointer' }}>수정</button>
              <button onClick={() => del(item.id)} style={{ fontSize:11, color:'#ef4444', background:'none', border:'1px solid #fca5a5', borderRadius:5, padding:'3px 7px', cursor:'pointer' }}>삭제</button>
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
          <div style={{ fontSize:14, marginBottom:12 }}>등록된 항목이 없습니다</div>
          <button onClick={addPresets} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:20, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>기본 목록 자동 추가</button>
        </div>
      )}

      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:8000, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'20px 16px' }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:520, padding:'22px 24px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', marginTop:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #f0ede8' }}>
              <div style={{ fontSize:15, fontWeight:700 }}>{editTarget ? '항목 수정' : '놓치기 쉬운 질환 추가'}</div>
              <button onClick={() => { setShowForm(false); setEditTarget(null) }} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#9ca3af' }}>x</button>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={lStyle}>장기/부위 *</label>
              <input value={form.organ} onChange={e=>setForm(p=>({...p,organ:e.target.value}))} placeholder="예: 간, 담낭, 갑상선" style={iStyle} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={lStyle}>질환명 *</label>
              <input value={form.disease} onChange={e=>setForm(p=>({...p,disease:e.target.value}))} placeholder="예: 간세포암 소결절, 담낭벽 비후" style={iStyle} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={lStyle}>주요 초음파 소견 (Sign)</label>
              <input value={form.sign} onChange={e=>setForm(p=>({...p,sign:e.target.value}))} placeholder="예: 위성결절, washout, 불규칙 경계" style={iStyle} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={lStyle}>의뢰 대상 / 기준</label>
              <input value={form.refer} onChange={e=>setForm(p=>({...p,refer:e.target.value}))} placeholder="예: 소화기내과 (조영초음파 또는 CT)" style={iStyle} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={lStyle}>우선도</label>
              <div style={{ display:'flex', gap:6 }}>
                {[['high','긴급'],['mid','주의']].map(([v,l]) => (
                  <button key={v} onClick={() => setForm(p=>({...p,priority:v}))}
                    style={{ flex:1, padding:'7px', borderRadius:7, border: form.priority===v?'none':'1px solid #e5e7eb', background: form.priority===v?(v==='high'?'#dc2626':'#d97706'):'#fff', color: form.priority===v?'#fff':'#6b7280', fontSize:12, cursor:'pointer', fontWeight: form.priority===v?700:400 }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={lStyle}>추가 메모</label>
              <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} rows={2} style={{ ...iStyle, resize:'vertical', lineHeight:1.6 }} />
            </div>
            <button onClick={save} disabled={!form.disease.trim()||saving}
              style={{ width:'100%', padding:'11px', background: !form.disease.trim()||saving?'#d1d5db':'#dc2626', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor: !form.disease.trim()||saving?'not-allowed':'pointer' }}>
              {saving?'저장 중...':'저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

//  학습 노트 탭 
function StudyNoteTab() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [form, setForm] = useState({ title:'', category:'abdomen', content:'', cloudFiles:[] })
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  useEffect(() => {
    const q = query(collection(db, 'usNotes'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => { setNotes(snap.docs.map(d => ({ id:d.id, ...d.data() }))); setLoading(false) })
  }, [])

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    for (const file of files) {
      const key = file.name + Date.now()
      setUploadProgress(p => ({ ...p, [key]: 0 }))
      try {
        const result = await uploadToCloudinary(file, pct => setUploadProgress(p => ({ ...p, [key]: pct })))
        setForm(p => ({ ...p, cloudFiles: [...p.cloudFiles, result] }))
      } catch(err) { alert(err.message) }
      finally { setUploadProgress(p => { const n={...p}; delete n[key]; return n }) }
    }
  }

  const save = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    if (editTarget) await updateDoc(doc(db, 'usNotes', editTarget.id), { ...form, updatedAt: serverTimestamp() })
    else await addDoc(collection(db, 'usNotes'), { ...form, createdAt: serverTimestamp() })
    setSaving(false); setShowForm(false); setEditTarget(null)
    setForm({ title:'', category:'abdomen', content:'', cloudFiles:[] })
  }

  const del = async (id) => { if (!window.confirm('삭제?')) return; await deleteDoc(doc(db, 'usNotes', id)) }
  const openEdit = (n) => { setEditTarget(n); setForm({ title:n.title, category:n.category, content:n.content||'', cloudFiles:n.cloudFiles||[] }); setShowForm(true) }

  const filtered = catFilter === 'all' ? notes : notes.filter(n => n.category === catFilter)
  const uploading = Object.entries(uploadProgress)
  const iStyle = { width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff' }
  const lStyle = { display:'block', fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:600 }

  if (loading) return <Spinner />

  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:'24px 20px 60px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>학습 노트</h2>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:3 }}>교재, 가이드라인, 개인 정리 자료</div>
        </div>
        <button onClick={() => { setEditTarget(null); setForm({ title:'', category:'abdomen', content:'', cloudFiles:[] }); setShowForm(true) }} style={{ padding:'7px 16px', background:'#0891b2', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ 노트 추가</button>
      </div>

      <div style={{ display:'flex', gap:5, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>
        <button onClick={() => setCatFilter('all')} style={{ padding:'4px 11px', borderRadius:16, border: catFilter==='all'?'none':'1px solid #e5e7eb', background: catFilter==='all'?'#0891b2':'#fff', color: catFilter==='all'?'#fff':'#6b7280', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontWeight: catFilter==='all'?700:400 }}>전체</button>
        {US_CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCatFilter(c.key)} style={{ padding:'4px 11px', borderRadius:16, border: catFilter===c.key?'none':'1px solid #e5e7eb', background: catFilter===c.key?'#0891b2':'#fff', color: catFilter===c.key?'#fff':'#6b7280', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, fontWeight: catFilter===c.key?700:400 }}>{c.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}>
          <div style={{ fontSize:14, marginBottom:12 }}>학습 노트가 없습니다</div>
          <button onClick={() => setShowForm(true)} style={{ background:'#0891b2', color:'#fff', border:'none', borderRadius:20, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>첫 노트 작성</button>
        </div>
      ) : filtered.map(n => {
        const cat = US_CATEGORIES.find(c => c.key === n.category)
        return (
          <div key={n.id} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', marginBottom:10, border:'1px solid #f0ede8' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:n.content||n.cloudFiles?.length?10:0 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', marginBottom:4 }}>{n.title}</div>
                <div style={{ display:'flex', gap:5 }}>
                  <span style={{ fontSize:10, background:'#e0f2fe', color:'#0891b2', borderRadius:6, padding:'1px 7px', fontWeight:700 }}>{cat?.label}</span>
                  {n.cloudFiles?.length > 0 && <span style={{ fontSize:10, background:'#f5f3ff', color:'#7c3aed', borderRadius:6, padding:'1px 7px' }}>{'첨부 ' + n.cloudFiles.length + '개'}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:5 }}>
                <button onClick={() => openEdit(n)} style={{ fontSize:11, color:'#6b7280', background:'none', border:'1px solid #e5e7eb', borderRadius:5, padding:'3px 7px', cursor:'pointer' }}>수정</button>
                <button onClick={() => del(n.id)} style={{ fontSize:11, color:'#ef4444', background:'none', border:'1px solid #fca5a5', borderRadius:5, padding:'3px 7px', cursor:'pointer' }}>삭제</button>
              </div>
            </div>
            {n.content && (
              <div style={{ marginBottom: n.cloudFiles?.length?10:0 }}>
                <UsRichView text={n.content} collectionName="usNotes" docId={n.id} fieldName="content" bgColor="#f8f6f2" />
              </div>
            )}
            {n.cloudFiles?.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {n.cloudFiles.map((f,i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:'#0891b2', background:'#e0f2fe', borderRadius:6, padding:'3px 9px', textDecoration:'none', fontWeight:600 }}>
                    {f.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:8000, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'16px 12px' }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:640, padding:'22px 24px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', marginTop:16, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #f0ede8' }}>
              <div style={{ fontSize:15, fontWeight:700 }}>{editTarget?'노트 수정':'학습 노트 추가'}</div>
              <button onClick={() => { setShowForm(false); setEditTarget(null) }} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#9ca3af' }}>x</button>
            </div>
            <div style={{ marginBottom:12 }}><label style={lStyle}>제목 *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="예: 간 낭성 병변 Bosniak 분류" style={iStyle} autoFocus /></div>
            <div style={{ marginBottom:12 }}>
              <label style={lStyle}>카테고리</label>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={iStyle}>
                {US_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}><label style={lStyle}>내용</label><textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} rows={6} placeholder="교재 요약, 가이드라인, 개인 정리 내용..." style={{ ...iStyle, resize:'vertical', lineHeight:1.7 }} /></div>
            <div style={{ marginBottom:16, background:'#f0f9ff', borderRadius:9, padding:'10px 12px', border:'1px solid #bae6fd' }}>
              <label style={{ ...lStyle, color:'#0369a1' }}>파일 첨부 (PDF, 이미지, 영상)</label>
              <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#0369a1', color:'#fff', borderRadius:7, fontSize:12, cursor:'pointer', fontWeight:700 }}>
                파일 선택
                <input type="file" multiple accept="image/*,video/*,.pdf,.pptx,.docx" onChange={handleFiles} style={{ display:'none' }} />
              </label>
              {uploading.map(([k,pct]) => (
                <div key={k} style={{ marginTop:7 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#0369a1', marginBottom:3 }}><span>업로드 중...</span><span>{pct}%</span></div>
                  <div style={{ background:'#bae6fd', borderRadius:4, height:4 }}><div style={{ background:'#0369a1', borderRadius:4, height:4, width:pct+'%', transition:'width 0.3s' }} /></div>
                </div>
              ))}
              {form.cloudFiles.length > 0 && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                  {form.cloudFiles.map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:5, background:'#fff', borderRadius:6, padding:'3px 8px', border:'1px solid #bae6fd', fontSize:11 }}>
                      <span style={{ color:'#0369a1' }}>{f.name}</span>
                      <button onClick={() => setForm(p=>({...p,cloudFiles:p.cloudFiles.filter((_,idx)=>idx!==i)}))} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:13 }}>x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={save} disabled={!form.title.trim()||saving||uploading.length>0}
              style={{ width:'100%', padding:'11px', background: !form.title.trim()||saving||uploading.length>0?'#d1d5db':'#0891b2', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor: !form.title.trim()||saving||uploading.length>0?'not-allowed':'pointer' }}>
              {saving?'저장 중...':uploading.length>0?'업로드 중...':(editTarget?'수정 완료':'노트 저장')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

//  메인 초음파 탭 
const US_SUB_TABS = [
  { key: 'atlas',   label: '아틀라스',        icon: 'A', desc: '케이스  이미지  영상' },
  { key: 'pitfall', label: '놓치기 쉬운 질환', icon: '!', desc: '의뢰 기준  위험 소견' },
  { key: 'study',   label: '학습 노트',        icon: 'N', desc: '교재  가이드라인 정리' },
]

export default function UltrasoundTab() {
  const [subTab, setSubTab] = useState('atlas')

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      {/* 초음파 서브탭 헤더 */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 20px', display:'flex', alignItems:'center', gap:0, flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#0891b2', padding:'14px 16px 14px 0', borderRight:'1px solid #f0ede8', marginRight:12, whiteSpace:'nowrap' }}>
          US 초음파
        </div>
        {US_SUB_TABS.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            style={{ padding:'14px 16px', border:'none', borderBottom: subTab===t.key ? '2px solid #0891b2' : '2px solid transparent', background:'transparent', color: subTab===t.key ? '#0891b2' : '#6b7280', fontSize:13, fontWeight: subTab===t.key ? 700 : 400, cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 서브탭 컨텐츠 */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {subTab === 'atlas' && <AtlasTab />}
        {subTab === 'pitfall' && <PitfallTab />}
        {subTab === 'study' && <StudyNoteTab />}
      </div>
    </div>
  )
}
