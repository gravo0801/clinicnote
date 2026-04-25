import { useState, useEffect, useMemo, useRef } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'
import { COMMON_DRUGS } from '../data/commonDrugs'

const CATEGORIES = ['전체','내과일반','상기도감염','소화기','근골격/통증','소아과','피부','이비인후과','외상','비뇨기','기타']

const iStyle = { width:'100%', padding:'8px 10px', borderRadius:7, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', color:'#0D1117' }
const lblStyle = { display:'block', fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:600 }

// 약물 자동완성 (프리셋 폼용)
function DrugNameInput({ value, onChange, suggestions }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const hits = useMemo(() =>
    value.length >= 1 ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 7) : []
  , [value, suggestions])

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <input value={value}
        onChange={e => { onChange(e.target.value); setOpen(e.target.value.length >= 1) }}
        onFocus={() => { if (value.length >= 1) setOpen(true) }}
        placeholder="약물명 입력/검색..." style={{ ...iStyle, fontSize:12 }} />
      {open && hits.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, minWidth:240, width:'max-content', maxWidth:340,
          zIndex:9999, background:'#fff', border:'1px solid #C7F7E8', borderRadius:6,
          boxShadow:'0 6px 20px rgba(0,0,0,0.15)', maxHeight:220, overflowY:'auto',
        }}>
          {hits.map(n => (
            <div key={n} onMouseDown={e => { e.preventDefault(); onChange(n); setOpen(false) }}
              style={{ padding:'8px 11px', fontSize:12, cursor:'pointer', borderBottom:'1px solid #f0f0f0', color:'#0D1117', whiteSpace:'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background='#EDFFF8'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>
              💊 {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 프리셋 폼
function PresetForm({ initial, onSave, onClose, allDrugNames }) {
  const [name, setName] = useState(initial?.name || '')
  const [shortcut, setShortcut] = useState(initial?.shortcut || '')
  const [category, setCategory] = useState(initial?.category || '내과일반')
  const [drugs, setDrugs] = useState(initial?.drugs || [{ name:'', dosage:'1T', freq:'3', duration:'', usage:'식후' }])

  const addDrug = () => setDrugs(p => [...p, { name:'', dosage:'1T', freq:'3', duration:'', usage:'식후' }])
  const updDrug = (i, f, v) => setDrugs(p => p.map((d, idx) => idx === i ? { ...d, [f]: v } : d))
  const delDrug = (i) => setDrugs(p => p.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (!name.trim() || drugs.filter(d => d.name.trim()).length === 0) return
    onSave({ name: name.trim(), shortcut: shortcut.trim(), category, drugs: drugs.filter(d => d.name.trim()) })
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:12 }}>
        <div><label style={lblStyle}>약속처방 이름 *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="예: 감기 기본처방" style={iStyle} /></div>
        <div><label style={lblStyle}>단축키</label><input value={shortcut} onChange={e => setShortcut(e.target.value)} placeholder="예: cold" style={iStyle} /></div>
      </div>
      <div style={{ marginBottom:14 }}><label style={lblStyle}>카테고리</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {CATEGORIES.filter(c => c !== '전체').map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding:'5px 12px', borderRadius:20, border: category===c?'none':'1px solid #e5e7eb', background: category===c?'#00C07F':'#fff', color: category===c?'#fff':'#6b7280', fontSize:12, cursor:'pointer', fontWeight: category===c?600:400 }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <label style={lblStyle}>처방 약물 *</label>
          <button onClick={addDrug} style={{ background:'#EDFFF8', color:'#00C07F', border:'none', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ 추가</button>
        </div>
        {drugs.map((d, i) => (
          <div key={i} style={{ background:'#F8F9FB', borderRadius:9, padding:10, marginBottom:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#6b7280' }}>약물 {i+1}</span>
              {drugs.length > 1 && <button onClick={() => delDrug(i)} style={{ background:'none', border:'none', color:'#ef4444', fontSize:12, cursor:'pointer' }}>삭제</button>}
            </div>
            <div style={{ marginBottom:6 }}><DrugNameInput value={d.name} onChange={v => updDrug(i,'name',v)} suggestions={allDrugNames} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 0.8fr 1fr', gap:6 }}>
              <div><label style={{ ...lblStyle, fontSize:10 }}>용량</label><input value={d.dosage||''} onChange={e => updDrug(i,'dosage',e.target.value)} placeholder="1T" style={{ ...iStyle, fontSize:12, textAlign:'center' }} /></div>
              <div><label style={{ ...lblStyle, fontSize:10 }}>횟수</label>
                <select value={d.freq||'3'} onChange={e => updDrug(i,'freq',e.target.value)} style={{ ...iStyle, fontSize:12 }}>
                  {['1','2','3','4'].map(v => <option key={v} value={v}>{v}회/일</option>)}
                </select>
              </div>
              <div><label style={{ ...lblStyle, fontSize:10 }}>일수</label><input value={d.duration||''} onChange={e => updDrug(i,'duration',e.target.value)} placeholder="일" style={{ ...iStyle, fontSize:12, textAlign:'center' }} /></div>
              <div><label style={{ ...lblStyle, fontSize:10 }}>용법</label>
                <select value={d.usage||'식후'} onChange={e => updDrug(i,'usage',e.target.value)} style={{ ...iStyle, fontSize:12 }}>
                  {['식후','식전','식간','취침전','필요시'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={!name.trim()}
        style={{ width:'100%', padding:'11px', background:'#00C07F', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:!name.trim()?'not-allowed':'pointer', opacity:!name.trim()?0.5:1 }}>
        저장
      </button>
    </div>
  )
}

// 프리셋 카드
function PresetCard({ preset, onEdit, onDelete, onInsert, compact }) {
  const catColor = { '내과일반':'#00C07F','상기도감염':'#2563eb','소화기':'#059669','근골격/통증':'#7c3aed','소아과':'#db2777','피부':'#d97706','이비인후과':'#0891b2','외상':'#dc2626','비뇨기':'#6366f1','기타':'#6b7280' }
  const c = catColor[preset.category] || '#6b7280'
  return (
    <div style={{ background:'#fff', borderRadius:11, padding:'13px 14px', border:'1px solid #F0F4F8', borderLeft:`3px solid ${c}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#0D1117' }}>{preset.name}</span>
            {preset.shortcut && (
              <span style={{ fontSize:11, background:'#EDFFF8', color:'#00C07F', border:'1px solid #C7F7E8', borderRadius:5, padding:'1px 7px', fontWeight:700, fontFamily:'monospace' }}>#{preset.shortcut}</span>
            )}
          </div>
          <span style={{ fontSize:11, background: `${c}18`, color: c, borderRadius:20, padding:'2px 8px', fontWeight:600 }}>{preset.category}</span>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {onInsert && <button onClick={onInsert} style={{ background:'#00C07F', color:'#fff', border:'none', borderRadius:6, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>삽입</button>}
          <button onClick={onEdit} style={{ background:'none', border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 9px', fontSize:11, cursor:'pointer', color:'#6b7280' }}>수정</button>
          <button onClick={onDelete} style={{ background:'none', border:'1px solid #fca5a5', borderRadius:6, padding:'4px 9px', fontSize:11, cursor:'pointer', color:'#ef4444' }}>삭제</button>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {(preset.drugs||[]).map((d, i) => (
          <div key={i} style={{ display:'flex', gap:6, alignItems:'center', fontSize:12 }}>
            <span style={{ color:'#0D1117', fontWeight:500, flex:1 }}>💊 {d.name}</span>
            <span style={{ color:'#6b7280', flexShrink:0 }}>{[d.dosage, `${d.freq||3}회`, d.duration&&d.duration+'일', d.usage].filter(Boolean).join(' · ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 메인 컴포넌트
export default function PresetRxTab({ onInsert }) {
  const isMobile = useIsMobile()
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const [sheet, setSheet] = useState(null) // 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const allDrugNames = useMemo(() => [...new Set([...COMMON_DRUGS])], [])

  useEffect(() => {
    const q = query(collection(db, 'presetPrescriptions'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => { setPresets(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
  }, [])

  const filtered = useMemo(() => presets.filter(p => {
    const catOk = catFilter === '전체' || p.category === catFilter
    const q = search.toLowerCase()
    const sOk = !q || [p.name, p.shortcut, p.category, ...(p.drugs||[]).map(d => d.name)].some(t => t?.toLowerCase().includes(q))
    return catOk && sOk
  }), [presets, catFilter, search])

  const savePreset = async (form) => {
    if (sheet === 'edit' && editTarget) {
      await updateDoc(doc(db, 'presetPrescriptions', editTarget.id), { ...form, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'presetPrescriptions'), { ...form, createdAt: serverTimestamp() })
    }
    setSheet(null); setEditTarget(null)
  }

  const deletePreset = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'presetPrescriptions', id))
  }

  if (loading) return <Spinner />

  const sheetJsx = (sheet === 'add' || sheet === 'edit') ? (
    <Sheet title={sheet === 'edit' ? '약속처방 수정' : '약속처방 추가'} onClose={() => { setSheet(null); setEditTarget(null) }}>
      <PresetForm initial={editTarget} onSave={savePreset} onClose={() => { setSheet(null); setEditTarget(null) }} allDrugNames={allDrugNames} />
    </Sheet>
  ) : null

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* 검색 + 추가 버튼 */}
      <div style={{ padding:'12px 16px 10px', display:'flex', gap:10 }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#9ca3af' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="처방명, 약물명, 단축키 검색..."
            style={{ ...iStyle, paddingLeft:32 }} />
        </div>
        <button onClick={() => { setSheet('add'); setEditTarget(null) }}
          style={{ background:'#00C07F', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
          + 추가
        </button>
      </div>

      {/* 단축키 안내 */}
      <div style={{ margin:'0 16px 10px', padding:'9px 12px', background:'#fffbeb', borderRadius:8, border:'1px solid #fde68a', fontSize:12, color:'#92400e' }}>
        💡 처방창에서 <strong>#단축키</strong> 입력 시 해당 약속처방이 자동 삽입됩니다.
      </div>

      {/* 카테고리 필터 */}
      <div style={{ padding:'0 16px 12px', overflowX:'auto' }}>
        <div style={{ display:'flex', gap:6, minWidth:'max-content' }}>
          {CATEGORIES.map(c => {
            const cnt = c === '전체' ? presets.length : presets.filter(p => p.category === c).length
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{ padding:'5px 12px', borderRadius:20, border: catFilter===c?'none':'1px solid #e5e7eb', background: catFilter===c?'#00C07F':'#fff', color: catFilter===c?'#fff':'#6b7280', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontWeight: catFilter===c?700:400, flexShrink:0 }}>
                {c} {cnt > 0 && <span style={{ opacity:0.75 }}>({cnt})</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 리스트 */}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0
          ? <div style={{ textAlign:'center', padding:'48px 0', color:'#9ca3af' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
              <div style={{ fontSize:13, marginBottom:14 }}>약속처방이 없습니다</div>
              <button onClick={() => setSheet('add')} style={{ background:'#00C07F', color:'#fff', border:'none', borderRadius:20, padding:'7px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>첫 약속처방 추가하기</button>
            </div>
          : filtered.map(p => (
            <PresetCard key={p.id} preset={p}
              onEdit={() => { setEditTarget(p); setSheet('edit') }}
              onDelete={() => deletePreset(p.id)}
              onInsert={onInsert ? () => onInsert(p) : null}
            />
          ))
        }
      </div>
      {sheetJsx}
    </div>
  )
}

// 약속처방 선택 팝업 (처방창에서 사용)
export function PresetSelector({ onInsert, onClose }) {
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('전체')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'presetPrescriptions'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => { setPresets(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
  }, [])

  const filtered = useMemo(() => presets.filter(p => {
    const catOk = catFilter === '전체' || p.category === catFilter
    const q = search.toLowerCase()
    return catOk && (!q || [p.name, p.shortcut, p.category, ...(p.drugs||[]).map(d => d.name)].some(t => t?.toLowerCase().includes(q)))
  }), [presets, catFilter, search])

  if (loading) return <div style={{ padding:20, textAlign:'center', color:'#9ca3af', fontSize:13 }}>로딩 중...</div>

  const catColor = { '내과일반':'#00C07F','상기도감염':'#2563eb','소화기':'#059669','근골격/통증':'#7c3aed','소아과':'#db2777','피부':'#d97706','이비인후과':'#0891b2','외상':'#dc2626','비뇨기':'#6366f1','기타':'#6b7280' }

  return (
    <div>
      <div style={{ position:'relative', marginBottom:10 }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#9ca3af' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="처방명, 약물명 검색..."
          style={{ ...iStyle, paddingLeft:30, fontSize:12 }} autoFocus />
      </div>
      <div style={{ display:'flex', gap:5, overflowX:'auto', marginBottom:12, paddingBottom:2 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            style={{ padding:'4px 10px', borderRadius:20, border: catFilter===c?'none':'1px solid #e5e7eb', background: catFilter===c?'#00C07F':'#fff', color: catFilter===c?'#fff':'#6b7280', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            {c}
          </button>
        ))}
      </div>
      {filtered.length === 0
        ? <div style={{ textAlign:'center', padding:'24px 0', color:'#9ca3af', fontSize:13 }}>약속처방이 없습니다</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(p => {
              const c = catColor[p.category] || '#6b7280'
              return (
                <div key={p.id} onClick={() => { onInsert(p); onClose() }}
                  style={{ background:'#F8F9FB', borderRadius:9, padding:'11px 13px', cursor:'pointer', borderLeft:`3px solid ${c}`, transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#EDFFF8'} onMouseLeave={e => e.currentTarget.style.background='#F8F9FB'}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#0D1117' }}>{p.name}</span>
                    {p.shortcut && <span style={{ fontSize:10, background:'#EDFFF8', color:'#00C07F', border:'1px solid #C7F7E8', borderRadius:4, padding:'1px 6px', fontWeight:700, fontFamily:'monospace' }}>#{p.shortcut}</span>}
                    <span style={{ fontSize:10, color: c, fontWeight:600, marginLeft:'auto' }}>{p.category}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {(p.drugs||[]).map((d, i) => <div key={i} style={{ fontSize:12, color:'#374151' }}>💊 {d.name} {[d.dosage,`${d.freq||3}회`,d.duration&&d.duration+'일',d.usage].filter(Boolean).join(' · ')}</div>)}
                  </div>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}
