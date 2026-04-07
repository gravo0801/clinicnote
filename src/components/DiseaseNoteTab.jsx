import { useState, useEffect, useMemo, useRef } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'
import KcdSearch from './KcdSearch'
import { searchKCD } from '../data/kcdCodes'

function DrugInput({ value, onChange, suggestions = [], placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const filtered = value.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 6)
    : []

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => value.length >= 1 && setOpen(true)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', marginTop: 3, overflow: 'hidden' }}>
          {filtered.map(n => (
            <div key={n} onMouseDown={() => { onChange(n); setOpen(false) }}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f9fafb' }}
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

function PrescriptionRow({ rx, onChange, onDelete, drugSuggestions }) {
  const set = (k, v) => onChange({ ...rx, [k]: v })
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '12px', border: '1px solid #e5e7eb', marginBottom: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <DrugInput value={rx.drugName || ''} onChange={v => set('drugName', v)}
          suggestions={drugSuggestions} placeholder="약물명 (예: 아목시실린정500mg)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr', gap: 6, marginBottom: 8 }}>
        <input value={rx.dosage || ''} onChange={e => set('dosage', e.target.value)} placeholder="용량"
          style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
        <input value={rx.usage || ''} onChange={e => set('usage', e.target.value)} placeholder="용법 (tid, qd…)"
          style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
        <input value={rx.duration || ''} onChange={e => set('duration', e.target.value)} placeholder="일수"
          style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
      </div>
      <div style={{ marginBottom: 6 }}>
        <KcdSearch value={rx.kcd || null} onChange={v => set('kcd', v)} placeholder="상병코드 검색 (선택)" />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input value={rx.note || ''} onChange={e => set('note', e.target.value)} placeholder="처방 팁 / 주의사항"
          style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={onDelete} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 7, color: '#ef4444', padding: '7px 10px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>삭제</button>
      </div>
    </div>
  )
}

function DiseaseNoteForm({ initial = null, onSave, onClose, drugSuggestions }) {
  const [diseaseName, setDiseaseName] = useState(initial?.diseaseName || '')
  const [content, setContent] = useState(initial?.content || '')
  const [prescriptions, setPrescriptions] = useState(initial?.prescriptions || [])
  const [kcd, setKcd] = useState(initial?.kcd || null)

  const addRx = () => setPrescriptions(p => [...p, { drugName: '', dosage: '', usage: '', duration: '', kcd: null, note: '' }])
  const updateRx = (i, val) => setPrescriptions(p => p.map((r, idx) => idx === i ? val : r))
  const removeRx = (i) => setPrescriptions(p => p.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (!diseaseName.trim()) return
    onSave({ diseaseName: diseaseName.trim(), content, kcd, prescriptions })
  }

  const iStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>질환명 *</label>
        <input value={diseaseName} onChange={e => setDiseaseName(e.target.value)} placeholder="예: 급성 편도염, 고혈압 1기" style={iStyle} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>대표 상병코드 (KCD)</label>
        <KcdSearch value={kcd} onChange={setKcd} placeholder="상병코드 또는 질환명 검색..." />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>질환 내용 정리</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="진단 기준, 감별진단, 검사 항목, 치료 원칙, 추적 기준, 레퍼런스 등 자유롭게 기록..."
          style={{ ...iStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>처방 내역</label>
          <button onClick={addRx} style={{ background: '#f0faf5', color: '#0F6E56', border: 'none', borderRadius: 6, padding: '4px 11px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ 처방 추가</button>
        </div>
        <div style={{ background: '#f8f6f2', borderRadius: 10, padding: prescriptions.length > 0 ? 10 : 0 }}>
          {prescriptions.length === 0
            ? <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: '#9ca3af' }}>처방을 추가하세요</div>
            : prescriptions.map((rx, i) => (
                <PrescriptionRow key={i} rx={rx} onChange={v => updateRx(i, v)} onDelete={() => removeRx(i)} drugSuggestions={drugSuggestions} />
              ))
          }
        </div>
      </div>
      <PrimaryButton onClick={handleSave}>저장</PrimaryButton>
    </div>
  )
}

function NoteCard({ note, onClick }) {
  const rxCount = note.prescriptions?.filter(r => r.drugName).length || 0
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', border: '1px solid #f0ede8', borderLeft: '3px solid #7c3aed', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{note.diseaseName}</span>
        {note.kcd && (
          <span style={{ fontSize: 11, background: '#ede9fe', color: '#4c1d95', borderRadius: 5, padding: '2px 7px', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>{note.kcd.code}</span>
        )}
      </div>
      {note.content && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{note.content}</div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        {rxCount > 0 && <span style={{ fontSize: 11, background: '#f0faf5', color: '#0F6E56', borderRadius: 20, padding: '2px 8px' }}>💊 처방 {rxCount}건</span>}
        {note.kcd?.cat && <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '2px 8px' }}>{note.kcd.cat}</span>}
      </div>
    </div>
  )
}

function NoteDetail({ note, onEdit, onDelete }) {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{note.diseaseName}</h2>
          <button onClick={onEdit} style={{ background: '#f0faf5', color: '#0F6E56', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>수정</button>
        </div>
        {note.kcd && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: '#0F6E56', color: '#fff', borderRadius: 5, padding: '2px 8px' }}>{note.kcd.code}</span>
            <span style={{ fontSize: 13, color: '#374151' }}>{note.kcd.name}</span>
            <span style={{ fontSize: 11, background: '#ede9fe', color: '#4c1d95', borderRadius: 20, padding: '2px 7px' }}>{note.kcd.cat}</span>
          </div>
        )}
      </div>
      {note.content && (
        <div style={{ background: '#f8f6f2', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 600, letterSpacing: '0.3px' }}>📋 질환 내용 정리</div>
          <div style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{note.content}</div>
        </div>
      )}
      {note.prescriptions?.some(r => r.drugName) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.3px', marginBottom: 8 }}>💊 처방 내역</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {note.prescriptions.filter(r => r.drugName).map((rx, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #f0ede8', borderLeft: '3px solid #0F6E56' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{rx.drugName}</span>
                  {rx.kcd && <span style={{ fontSize: 11, background: '#e6f4ef', color: '#0F6E56', borderRadius: 5, padding: '2px 6px', fontWeight: 600, marginLeft: 8, whiteSpace: 'nowrap' }}>{rx.kcd.code}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: rx.note ? 6 : 0 }}>
                  {[['💊', rx.dosage], ['⏰', rx.usage], ['📆', rx.duration && rx.duration + '일']].filter(([, v]) => v).map(([icon, v]) => (
                    <span key={icon} style={{ fontSize: 12, background: '#f5f3ef', color: '#6b7280', borderRadius: 6, padding: '3px 8px' }}>{icon} {v}</span>
                  ))}
                </div>
                {rx.note && <div style={{ fontSize: 12, color: '#633806', background: '#FAEEDA', borderRadius: 6, padding: '5px 9px', marginTop: 4 }}>📝 {rx.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      <DangerButton onClick={onDelete}>삭제</DangerButton>
    </>
  )
}

export default function DiseaseNoteTab({ drugSuggestions = [] }) {
  const isMobile = useIsMobile()
  const [notes, setNotes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('전체')
  const [selNote, setSelNote]     = useState(null)
  const [sheet, setSheet]         = useState(null)
  const [sheetNote, setSheetNote] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'diseaseNotes'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const cats = useMemo(() => ['전체', ...new Set(notes.map(n => n.kcd?.cat).filter(Boolean))], [notes])
  const filtered = useMemo(() => notes.filter(n => {
    const catOk = catFilter === '전체' || n.kcd?.cat === catFilter
    const q = search.toLowerCase()
    const sOk = !q || [n.diseaseName, n.content, n.kcd?.code, n.kcd?.name].some(t => t?.toLowerCase().includes(q))
    return catOk && sOk
  }), [notes, catFilter, search])

  const saveNote = async (form) => {
    if (sheet === 'edit' && sheetNote) {
      await updateDoc(doc(db, 'diseaseNotes', sheetNote.id), { ...form, updatedAt: serverTimestamp() })
      setSelNote(n => n?.id === sheetNote.id ? { ...n, ...form } : n)
    } else {
      const ref = await addDoc(collection(db, 'diseaseNotes'), { ...form, createdAt: serverTimestamp() })
      if (!isMobile) setSelNote({ id: ref.id, ...form })
    }
    setSheet(null); setSheetNote(null)
  }

  const deleteNote = async (id) => {
    await deleteDoc(doc(db, 'diseaseNotes', id))
    setSelNote(null); setSheet(null); setSheetNote(null)
  }

  if (loading) return <Spinner />

  const SearchBar = (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9ca3af' }}>🔍</span>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="질환명, 내용, 상병코드 검색..."
        style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }} />
    </div>
  )

  const CatFilter = (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
      {cats.map(c => (
        <button key={c} onClick={() => setCatFilter(c)}
          style={{ padding: '5px 12px', borderRadius: 20, border: catFilter === c ? 'none' : '1px solid #e5e7eb', background: catFilter === c ? '#7c3aed' : '#fff', color: catFilter === c ? '#fff' : '#6b7280', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: catFilter === c ? 600 : 400, flexShrink: 0 }}>
          {c}
        </button>
      ))}
    </div>
  )

  const Sheets = (
    <>
      {(sheet === 'add' || sheet === 'edit') && (
        <Sheet title={sheet === 'edit' ? '질환 노트 수정' : '질환 노트 추가'} onClose={() => { setSheet(null); setSheetNote(null) }}>
          <DiseaseNoteForm initial={sheet === 'edit' ? sheetNote : null} onSave={saveNote} onClose={() => setSheet(null)} drugSuggestions={drugSuggestions} />
        </Sheet>
      )}
      {sheet === 'detail' && sheetNote && (
        <Sheet title="질환 노트" onClose={() => { setSheet(null); setSheetNote(null) }}>
          <NoteDetail note={sheetNote} onEdit={() => setSheet('edit')} onDelete={() => deleteNote(sheetNote.id)} onClose={() => setSheet(null)} />
        </Sheet>
      )}
    </>
  )

  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '14px 16px 10px' }}>{SearchBar}</div>
        <div style={{ padding: '0 16px 10px' }}>{CatFilter}</div>
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length}개</span>
          <button onClick={() => { setSheet('add'); setSheetNote(null) }}
            style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            + 질환 노트 추가
          </button>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>질환 노트가 없습니다</div>
            : filtered.map(n => <NoteCard key={n.id} note={n} onClick={() => { setSheetNote(n); setSheet('detail') }} />)
          }
        </div>
        {Sheets}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: 280, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f0ede8' }}>{SearchBar}</div>
        <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #f0ede8' }}>{CatFilter}</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}><div style={{ fontSize: 24, marginBottom: 6 }}>📖</div>노트가 없습니다</div>
            : filtered.map(n => {
                const active = selNote?.id === n.id
                return (
                  <div key={n.id} onClick={() => setSelNote(n)}
                    style={{ padding: '11px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: active ? '#f5f0ff' : 'transparent', border: active ? '1px solid #ddd6fe' : '1px solid transparent', transition: 'all 0.12s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#6d28d9' : '#1a1a1a' }}>{n.diseaseName}</span>
                      {n.kcd && <span style={{ fontSize: 10, background: '#ede9fe', color: '#4c1d95', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{n.kcd.code}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                      {n.prescriptions?.filter(r => r.drugName).length > 0 && `💊 ${n.prescriptions.filter(r => r.drugName).length}건`}
                      {n.kcd?.cat && <span style={{ marginLeft: 5 }}>{n.kcd.cat}</span>}
                    </div>
                  </div>
                )
              })
          }
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #f0ede8' }}>
          <button onClick={() => { setSheet('add'); setSheetNote(null) }}
            style={{ width: '100%', padding: '9px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + 질환 노트 추가
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef', padding: '32px 40px' }}>
        {!selNote
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', textAlign: 'center' }}>
              <div><div style={{ fontSize: 44, marginBottom: 12 }}>📖</div><div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>질환 노트를 선택하세요</div><div style={{ fontSize: 13 }}>또는 새 노트를 추가하세요</div></div>
            </div>
          : <div style={{ maxWidth: 700 }}>
              <NoteDetail note={selNote} onEdit={() => { setSheetNote(selNote); setSheet('edit') }} onDelete={() => deleteNote(selNote.id)} onClose={() => setSelNote(null)} />
            </div>
        }
      </div>
      {Sheets}
    </div>
  )
}
