import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, PrimaryButton, DangerButton, Spinner } from './ui'

export default function RxTab() {
  const [rxList, setRxList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('전체')
  const [addRx, setAddRx] = useState(false)
  const [detail, setDetail] = useState(null)

  const [rf, setRf] = useState({
    drugName: '', category: '', indication: '',
    dosage: '', usage: '', duration: '', note: ''
  })

  // Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'prescriptions'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setRxList(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const categories = useMemo(() => ['전체', ...new Set(rxList.map(r => r.category).filter(Boolean))], [rxList])

  const filtered = useMemo(() => rxList.filter(r => {
    const cOk = catFilter === '전체' || r.category === catFilter
    const q = search.toLowerCase()
    const sOk = !q || [r.drugName, r.indication, r.category, r.note]
      .some(t => t?.toLowerCase().includes(q))
    return cOk && sOk
  }), [rxList, catFilter, search])

  const saveRx = async () => {
    if (!rf.drugName.trim()) return
    await addDoc(collection(db, 'prescriptions'), { ...rf, createdAt: serverTimestamp() })
    setRf({ drugName: '', category: '', indication: '', dosage: '', usage: '', duration: '', note: '' })
    setAddRx(false)
  }

  const deleteRx = async (id) => {
    await deleteDoc(doc(db, 'prescriptions', id))
    setDetail(null)
  }

  if (loading) return <Spinner />

  return (
    <div className="pb-20">
      {/* ── Search ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9ca3af' }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="약명, 적응증 검색..."
            className="w-full rounded-xl py-2.5 text-sm outline-none"
            style={{ paddingLeft: 36, paddingRight: 12, border: '1px solid #e5e7eb', fontFamily: 'inherit', fontSize: 14, background: '#fff' }}
          />
        </div>
      </div>

      {/* ── Category filter ── */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className="px-3.5 py-1.5 rounded-full text-sm transition-all"
              style={{
                background: catFilter === c ? '#0F6E56' : '#fff',
                color: catFilter === c ? '#fff' : '#6b7280',
                border: catFilter === c ? 'none' : '1px solid #e5e7eb',
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontWeight: catFilter === c ? 600 : 400,
              }}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── Count + Add ── */}
      <div className="px-4 pb-3 flex justify-between items-center">
        <span className="text-xs" style={{ color: '#9ca3af' }}>{filtered.length}개</span>
        <button onClick={() => setAddRx(true)}
          className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: '#0F6E56', border: 'none', cursor: 'pointer' }}>
          + 처방 추가
        </button>
      </div>

      {/* ── Drug cards ── */}
      <div className="px-4 flex flex-col gap-2.5">
        {filtered.length === 0
          ? <div className="text-center py-12 text-sm" style={{ color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💊</div>
              등록된 처방이 없습니다
            </div>
          : filtered.map(rx => (
            <div key={rx.id} onClick={() => setDetail(rx)}
              className="bg-white rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-sm"
              style={{ border: '1px solid #f0ede8', borderLeft: '3px solid #0F6E56' }}>
              <div className="flex justify-between items-start mb-1.5">
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{rx.drugName}</span>
                {rx.category && (
                  <span className="text-xs px-2 py-0.5 rounded-md ml-2 shrink-0"
                    style={{ background: '#E1F5EE', color: '#085041', fontWeight: 600 }}>
                    {rx.category}
                  </span>
                )}
              </div>
              <div className="text-sm mb-3" style={{ color: '#6b7280' }}>{rx.indication}</div>
              <div className="flex flex-wrap gap-1.5">
                {[['💊', rx.dosage], ['⏰', rx.usage], ['📆', rx.duration]].filter(([, v]) => v).map(([icon, v]) => (
                  <span key={icon} className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: '#f5f3ef', color: '#6b7280' }}>
                    {icon} {v}
                  </span>
                ))}
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Add Rx Sheet ── */}
      {addRx && (
        <Sheet title="처방 추가" onClose={() => setAddRx(false)}>
          <Field label="약물명 *" value={rf.drugName} onChange={v => setRf(p => ({ ...p, drugName: v }))} placeholder="예: 아목시실린" />
          <Field label="카테고리" value={rf.category} onChange={v => setRf(p => ({ ...p, category: v }))} placeholder="항생제 / 고혈압 / 위장약" />
          <Field label="적응증" value={rf.indication} onChange={v => setRf(p => ({ ...p, indication: v }))} placeholder="예: 편도염, 중이염, 인두염" />
          <Field label="용량" value={rf.dosage} onChange={v => setRf(p => ({ ...p, dosage: v }))} placeholder="예: 500mg 1T" />
          <Field label="용법" value={rf.usage} onChange={v => setRf(p => ({ ...p, usage: v }))} placeholder="예: 1일 3회 식후 (tid)" />
          <Field label="처방일수" value={rf.duration} onChange={v => setRf(p => ({ ...p, duration: v }))} placeholder="예: 5–7일" />
          <Field label="처방 팁 / 메모" value={rf.note} onChange={v => setRf(p => ({ ...p, note: v }))} placeholder="주의사항, 증량 기준, 특이사항 등" multiline />
          <PrimaryButton onClick={saveRx}>저장</PrimaryButton>
        </Sheet>
      )}

      {/* ── Detail Sheet ── */}
      {detail && (
        <Sheet title="처방 상세" onClose={() => setDetail(null)}>
          <div className="mb-5">
            <div className="flex items-center gap-2.5 mb-1">
              <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{detail.drugName}</span>
              {detail.category && (
                <span className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: '#E1F5EE', color: '#085041', fontWeight: 600 }}>
                  {detail.category}
                </span>
              )}
            </div>
            {detail.indication && (
              <div className="text-sm" style={{ color: '#6b7280' }}>{detail.indication}</div>
            )}
          </div>

          {[['💊 용량', detail.dosage], ['⏰ 용법', detail.usage], ['📆 처방일수', detail.duration]]
            .filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="rounded-xl p-4 mb-2" style={{ background: '#f8f6f2' }}>
                <div className="text-xs mb-1" style={{ color: '#9ca3af' }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{v}</div>
              </div>
          ))}

          {detail.note && (
            <div className="rounded-xl p-4 mb-2" style={{ background: '#FAEEDA', border: '1px solid #FAC775' }}>
              <div className="text-xs mb-1.5" style={{ color: '#633806' }}>📝 처방 팁</div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#412402' }}>{detail.note}</div>
            </div>
          )}

          <DangerButton onClick={() => deleteRx(detail.id)}>삭제</DangerButton>
        </Sheet>
      )}
    </div>
  )
}
