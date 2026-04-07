import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, SegmentButtons, PrimaryButton, DangerButton, Spinner } from './ui'

const getAge = y => new Date().getFullYear() - y

const STATUS = {
  ongoing:  { label: '진행중',  bg: '#FAEEDA', color: '#633806' },
  resolved: { label: '완료',    bg: '#EAF3DE', color: '#27500A' },
  followup: { label: '추적필요', bg: '#FCEBEB', color: '#791F1F' },
}

const followUpStatus = (nextVisit, status) => {
  if (!nextVisit || status === 'resolved') return null
  const diff = (new Date(nextVisit) - new Date()) / 86400000
  if (diff < 0) return 'overdue'
  if (diff <= 14) return 'soon'
  return null
}

export default function FamilyTab() {
  const [members, setMembers] = useState([])
  const [records, setRecords] = useState({})   // { memberId: [...records] }
  const [selId, setSelId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sheets
  const [addMember, setAddMember] = useState(false)
  const [addRecord, setAddRecord] = useState(false)
  const [detail, setDetail]       = useState(null)
  const [delConfirm, setDelConfirm] = useState(false)

  // Forms
  const [mf, setMf] = useState({ name: '', relation: '', birthYear: '', gender: '남' })
  const [rf, setRf] = useState({
    date: new Date().toISOString().slice(0, 10),
    diagnosis: '', treatment: '', nextVisit: '', status: 'ongoing', note: ''
  })

  // ── Members listener ──
  useEffect(() => {
    const q = query(collection(db, 'familyMembers'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMembers(list)
      if (!selId && list.length > 0) setSelId(list[0].id)
      setLoading(false)
    })
  }, [])

  // ── Records listener for each member ──
  useEffect(() => {
    if (members.length === 0) return
    const unsubs = members.map(m => {
      const q = query(
        collection(db, 'familyMembers', m.id, 'records'),
        orderBy('date', 'desc')
      )
      return onSnapshot(q, snap => {
        setRecords(prev => ({
          ...prev,
          [m.id]: snap.docs.map(d => ({ id: d.id, ...d.data() }))
        }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [members.length])

  const saveMember = async () => {
    if (!mf.name.trim()) return
    const docRef = await addDoc(collection(db, 'familyMembers'), {
      ...mf, birthYear: parseInt(mf.birthYear) || 2000, createdAt: serverTimestamp()
    })
    setSelId(docRef.id)
    setMf({ name: '', relation: '', birthYear: '', gender: '남' })
    setAddMember(false)
  }

  const saveRecord = async () => {
    if (!rf.diagnosis.trim() || !selId) return
    await addDoc(collection(db, 'familyMembers', selId, 'records'), {
      ...rf, createdAt: serverTimestamp()
    })
    setRf({ date: new Date().toISOString().slice(0, 10), diagnosis: '', treatment: '', nextVisit: '', status: 'ongoing', note: '' })
    setAddRecord(false)
  }

  const deleteMember = async () => {
    if (!selId) return
    await deleteDoc(doc(db, 'familyMembers', selId))
    setDelConfirm(false)
    setSelId(null)
  }

  const deleteRecord = async (rid) => {
    await deleteDoc(doc(db, 'familyMembers', selId, 'records', rid))
    setDetail(null)
  }

  const sel = members.find(m => m.id === selId)
  const recs = records[selId] || []

  if (loading) return <Spinner />

  return (
    <div className="pb-20">
      {/* ── Member selector ── */}
      <div className="px-4 pt-4 pb-3 overflow-x-auto">
        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
          {members.map(m => {
            const hasAlert = (records[m.id] || []).some(r => followUpStatus(r.nextVisit, r.status))
            const active = selId === m.id
            return (
              <button key={m.id} onClick={() => setSelId(m.id)}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: active ? '#0F6E56' : '#fff',
                  color: active ? '#fff' : '#374151',
                  border: active ? 'none' : '1px solid #e5e7eb',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {m.name}
                {hasAlert && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#EF9F27' }} />}
              </button>
            )
          })}
          <button onClick={() => setAddMember(true)}
            className="px-4 py-2 rounded-full text-sm transition-all"
            style={{ border: '1px dashed #d1d5db', color: '#9ca3af', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + 가족 추가
          </button>
        </div>
      </div>

      {/* ── Member summary card ── */}
      {sel && (
        <div className="px-4 pb-4">
          <div className="rounded-2xl p-5 text-white" style={{ background: '#0F6E56' }}>
            <div className="flex justify-between items-start">
              <div>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{sel.name}</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 3 }}>
                  {sel.relation} · {sel.gender} · {getAge(sel.birthYear)}세
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 26, fontWeight: 700 }}>{recs.length}</div>
                <div style={{ fontSize: 11, opacity: 0.65 }}>진료 기록</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {[['진행중', recs.filter(r => r.status === 'ongoing').length],
                ['완료', recs.filter(r => r.status === 'resolved').length],
                ['추적', recs.filter(r => r.status === 'followup').length]
              ].map(([l, n]) => (
                <div key={l} className="text-xs px-3 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.18)' }}>
                  {l} {n}건
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Records ── */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>진료 기록</span>
          <button onClick={() => setAddRecord(true)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
            style={{ background: '#0F6E56', border: 'none', cursor: 'pointer' }}>
            + 추가
          </button>
        </div>

        {recs.length === 0
          ? <div className="text-center py-12 text-sm" style={{ color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              진료 기록이 없습니다
            </div>
          : <div className="flex flex-col gap-2.5">
            {recs.map(r => {
              const sm = STATUS[r.status] || STATUS.ongoing
              const fu = followUpStatus(r.nextVisit, r.status)
              return (
                <div key={r.id} onClick={() => setDetail(r)}
                  className="bg-white rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-sm"
                  style={{
                    border: fu === 'overdue' ? '1px solid #fca5a5'
                          : fu === 'soon'    ? '1px solid #fcd34d'
                          : '1px solid #f0ede8',
                  }}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{r.diagnosis}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md ml-2 shrink-0"
                      style={{ background: sm.bg, color: sm.color, fontWeight: 600 }}>
                      {sm.label}
                    </span>
                  </div>
                  <div className="text-xs mb-2 truncate" style={{ color: '#6b7280' }}>{r.treatment}</div>
                  <div className="flex gap-3 text-xs" style={{ color: '#9ca3af' }}>
                    <span>{r.date}</span>
                    {r.nextVisit && (
                      <span style={{ color: fu === 'overdue' ? '#dc2626' : fu === 'soon' ? '#d97706' : '#9ca3af' }}>
                        다음 {r.nextVisit}{fu === 'overdue' ? ' ⚠️' : fu === 'soon' ? ' 🔔' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        }

        {/* Delete member */}
        {sel && (
          <button onClick={() => setDelConfirm(true)} className="w-full mt-6 py-2.5 text-xs rounded-lg"
            style={{ background: 'none', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer' }}>
            '{sel.name}' 삭제
          </button>
        )}
      </div>

      {/* ── Add Member Sheet ── */}
      {addMember && (
        <Sheet title="가족 추가" onClose={() => setAddMember(false)}>
          <Field label="이름 또는 별칭" value={mf.name} onChange={v => setMf(p => ({ ...p, name: v }))} placeholder="예: 배우자, 어머니, 아빠" />
          <Field label="관계" value={mf.relation} onChange={v => setMf(p => ({ ...p, relation: v }))} placeholder="배우자 / 자녀 / 부모" />
          <Field label="출생연도" value={mf.birthYear} onChange={v => setMf(p => ({ ...p, birthYear: v }))} type="number" placeholder="예: 1990" />
          <Field label="성별">
            <SegmentButtons options={[{ val: '남', label: '남' }, { val: '여', label: '여' }]}
              value={mf.gender} onChange={v => setMf(p => ({ ...p, gender: v }))} />
          </Field>
          <PrimaryButton onClick={saveMember}>추가하기</PrimaryButton>
        </Sheet>
      )}

      {/* ── Add Record Sheet ── */}
      {addRecord && (
        <Sheet title="진료 기록 추가" onClose={() => setAddRecord(false)}>
          <Field label="진료일" value={rf.date} onChange={v => setRf(p => ({ ...p, date: v }))} type="date" />
          <Field label="진단명" value={rf.diagnosis} onChange={v => setRf(p => ({ ...p, diagnosis: v }))} placeholder="예: 급성 편도염, 고혈압 1기" />
          <Field label="치료 / 처방" value={rf.treatment} onChange={v => setRf(p => ({ ...p, treatment: v }))} placeholder="약물명, 용량, 용법 기록" multiline />
          <Field label="다음 방문 예정일" value={rf.nextVisit} onChange={v => setRf(p => ({ ...p, nextVisit: v }))} type="date" />
          <Field label="상태">
            <SegmentButtons
              options={[{ val: 'ongoing', label: '진행중' }, { val: 'resolved', label: '완료' }, { val: 'followup', label: '추적필요' }]}
              value={rf.status} onChange={v => setRf(p => ({ ...p, status: v }))} />
          </Field>
          <Field label="메모 (선택)" value={rf.note} onChange={v => setRf(p => ({ ...p, note: v }))} placeholder="추가 메모" multiline />
          <PrimaryButton onClick={saveRecord}>저장</PrimaryButton>
        </Sheet>
      )}

      {/* ── Record Detail Sheet ── */}
      {detail && (
        <Sheet title="진료 상세" onClose={() => setDetail(null)}>
          {(() => {
            const sm = STATUS[detail.status] || STATUS.ongoing
            const fu = followUpStatus(detail.nextVisit, detail.status)
            return (
              <>
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{detail.diagnosis}</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ background: sm.bg, color: sm.color, fontWeight: 600 }}>
                      {sm.label}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: '#6b7280' }}>
                    진료일 {detail.date}
                    {detail.nextVisit && ` · 다음 ${detail.nextVisit}${fu === 'overdue' ? ' ⚠️ 지남' : fu === 'soon' ? ' 🔔 곧' : ''}`}
                  </div>
                </div>
                {[['치료 / 처방', detail.treatment], ['메모', detail.note]].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} className="rounded-xl p-4 mb-3" style={{ background: '#f8f6f2' }}>
                    <div className="text-xs mb-1.5" style={{ color: '#9ca3af' }}>{l}</div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#1a1a1a' }}>{v}</div>
                  </div>
                ))}
                <DangerButton onClick={() => deleteRecord(detail.id)}>기록 삭제</DangerButton>
              </>
            )
          })()}
        </Sheet>
      )}

      {/* ── Delete member confirm ── */}
      {delConfirm && (
        <Sheet title="가족 삭제" onClose={() => setDelConfirm(false)}>
          <p className="text-sm mb-5" style={{ color: '#374151' }}>
            '{sel?.name}'을(를) 삭제하면 모든 진료 기록도 함께 삭제됩니다. 계속하시겠습니까?
          </p>
          <DangerButton onClick={deleteMember}>삭제하기</DangerButton>
        </Sheet>
      )}
    </div>
  )
}
