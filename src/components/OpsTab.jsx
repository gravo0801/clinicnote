import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'

const EMPTY = { title: '', tags: '', body: '' }
const toArr = s => (s || '').split(',').map(t => t.trim()).filter(Boolean)
const toCsv = a => Array.isArray(a) ? a.join(', ') : (a || '')

export default function OpsTab() {
  const isMobile = useIsMobile()
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [tagFilter, setTagFilter] = useState('전체')
  const [showAdd, setShowAdd] = useState(false)
  const [detail, setDetail]   = useState(null)
  const [edit, setEdit]       = useState(false)
  const [form, setForm]       = useState(EMPTY)

  useEffect(() => {
    const q = query(collection(db, 'opsNotes'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const allTags = useMemo(() => {
    const s = new Set()
    notes.forEach(n => (n.tags || []).forEach(t => s.add(t)))
    return ['전체', ...s]
  }, [notes])

  const visible = useMemo(() => notes.filter(n => {
    if (tagFilter !== '전체' && !(n.tags || []).includes(tagFilter)) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [n.title, n.body, ...(n.tags || [])].some(t => t?.toLowerCase().includes(q))
  }), [notes, search, tagFilter])

  const buildPayload = (f) => ({
    title: f.title.trim(),
    tags: toArr(f.tags),
    body: f.body.trim(),
  })

  const saveNew = async () => {
    if (!form.title.trim()) return
    await addDoc(collection(db, 'opsNotes'), {
      ...buildPayload(form),
      createdAt: serverTimestamp(),
    })
    setForm(EMPTY)
    setShowAdd(false)
  }

  const saveEdit = async () => {
    if (!detail) return
    const payload = buildPayload(form)
    await updateDoc(doc(db, 'opsNotes', detail.id), payload)
    setEdit(false)
    setDetail({ ...detail, ...payload })
  }

  const removeNote = async (id) => {
    await deleteDoc(doc(db, 'opsNotes', id))
    setDetail(null)
  }

  const openDetail = (n) => {
    setDetail(n)
    setForm({ title: n.title || '', tags: toCsv(n.tags), body: n.body || '' })
    setEdit(false)
  }

  if (loading) return <Spinner />

  const FormFields = (
    <>
      <Field label="제목 *" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="예: 검진 후 위내시경 추가검사 안내 스크립트" />
      <Field label="태그 (쉼표 구분)" value={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} placeholder="예: 검진, 매출, 환자안내" />
      <Field label="내용 *" value={form.body} onChange={v => setForm(p => ({ ...p, body: v }))} multiline />
    </>
  )

  const NoteCard = ({ n }) => (
    <div onClick={() => openDetail(n)} style={{
      background: '#fff', borderRadius: 13, padding: '14px 16px', cursor: 'pointer',
      border: '1px solid #EDF0F4', borderLeft: '3px solid #f59e0b',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0D1117', marginBottom: 6 }}>{n.title}</div>
      {n.body && (
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {n.body}
        </div>
      )}
      {(n.tags || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {n.tags.map(t => (
            <span key={t} style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  )

  const AddSheet = showAdd && (
    <Sheet title="운영 노하우 추가" onClose={() => { setShowAdd(false); setForm(EMPTY) }}>
      {FormFields}
      <PrimaryButton onClick={saveNew}>저장</PrimaryButton>
    </Sheet>
  )

  const DetailSheet = detail && (
    <Sheet title={edit ? '편집' : detail.title} onClose={() => { setDetail(null); setEdit(false) }}>
      {edit ? (
        <>
          {FormFields}
          <PrimaryButton onClick={saveEdit}>저장</PrimaryButton>
          <button onClick={() => setEdit(false)} style={{
            width: '100%', padding: '11px', borderRadius: 10, marginTop: 8,
            background: 'none', border: '1.5px solid #e5e7eb',
            color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 600,
          }}>취소</button>
        </>
      ) : (
        <>
          {(detail.tags || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {detail.tags.map(t => (
                <span key={t} style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 14, color: '#0D1117', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            {detail.body}
          </div>
          <button onClick={() => setEdit(true)} style={{
            width: '100%', padding: '11px', borderRadius: 10,
            background: 'none', border: '1.5px solid #e5e7eb',
            color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 600,
          }}>편집</button>
          <DangerButton onClick={() => removeNote(detail.id)}>삭제</DangerButton>
        </>
      )}
    </Sheet>
  )

  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '12px 16px 10px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검색..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        {allTags.length > 1 && (
          <div style={{ padding: '0 16px 10px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
              {allTags.map(t => (
                <button key={t} onClick={() => setTagFilter(t)} style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: tagFilter === t ? 'none' : '1px solid #e5e7eb',
                  background: tagFilter === t ? '#f59e0b' : '#fff',
                  color: tagFilter === t ? '#fff' : '#6b7280',
                  fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontWeight: tagFilter === t ? 700 : 400,
                }}>{t}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{visible.length}개</span>
          <button onClick={() => { setForm(EMPTY); setShowAdd(true) }} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ 노하우 추가</button>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.length === 0
            ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>📝 등록된 노하우가 없습니다</div>
            : visible.map(n => <NoteCard key={n.id} n={n} />)}
        </div>
        {AddSheet}
        {DetailSheet}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100vh' }}>
      <div style={{ width: 220, background: '#fff', borderRight: '1px solid #EDF0F4', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #F0F4F8' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검색..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, padding: '4px 8px 6px' }}>태그</div>
          {allTags.map(t => {
            const count = t === '전체' ? notes.length : notes.filter(n => (n.tags || []).includes(t)).length
            const active = tagFilter === t
            return (
              <button key={t} onClick={() => setTagFilter(t)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 8, border: 'none',
                background: active ? '#FEF3C7' : 'transparent',
                color: active ? '#92400E' : '#374151',
                fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', marginBottom: 2,
              }}>
                <span>{t}</span>
                <span style={{ fontSize: 11, background: active ? '#FBBF24' : '#f3f4f6', color: active ? '#fff' : '#9ca3af', borderRadius: 10, padding: '1px 7px' }}>{count}</span>
              </button>
            )
          })}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #F0F4F8' }}>
          <button onClick={() => { setForm(EMPTY); setShowAdd(true) }} style={{ width: '100%', padding: '9px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ 노하우 추가</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#F4F6F9', padding: '24px 32px' }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>운영 노하우</h2>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{visible.length}개</div>
        </div>
        {visible.length === 0
          ? <div style={{ textAlign: 'center', paddingTop: 80, color: '#9ca3af' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
              <div style={{ fontSize: 14 }}>등록된 노하우가 없습니다</div>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {visible.map(n => <NoteCard key={n.id} n={n} />)}
            </div>
        }
      </div>
      {AddSheet}
      {DetailSheet}
    </div>
  )
}
