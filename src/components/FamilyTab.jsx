import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, SegmentButtons, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'

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

function MemberInitial({ name, size = 40 }) {
  const initial = name?.charAt(0) || '?'
  const colors = ['#0F6E56','#2563eb','#7c3aed','#db2777','#d97706','#059669']
  const bg = colors[name?.charCodeAt(0) % colors.length] || '#0F6E56'
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
    }}>{initial}</div>
  )
}

export default function FamilyTab() {
  const isMobile = useIsMobile()
  const [members, setMembers] = useState([])
  const [records, setRecords] = useState({})
  const [selId, setSelId] = useState(null)
  const [loading, setLoading] = useState(true)

  const [addMember,  setAddMember]  = useState(false)
  const [addRecord,  setAddRecord]  = useState(false)
  const [detail,     setDetail]     = useState(null)
  const [delConfirm, setDelConfirm] = useState(false)

  const [mf, setMf] = useState({ name: '', relation: '', birthYear: '', gender: '남' })
  const [rf, setRf] = useState({
    date: new Date().toISOString().slice(0, 10),
    diagnosis: '', treatment: '', nextVisit: '', status: 'ongoing', note: ''
  })

  useEffect(() => {
    const q = query(collection(db, 'familyMembers'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMembers(list)
      if (!selId && list.length > 0) setSelId(list[0].id)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (members.length === 0) return
    const unsubs = members.map(m => {
      const q = query(collection(db, 'familyMembers', m.id, 'records'), orderBy('date', 'desc'))
      return onSnapshot(q, snap => {
        setRecords(prev => ({ ...prev, [m.id]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [members.length])

  const saveMember = async () => {
    if (!mf.name.trim()) return
    const ref = await addDoc(collection(db, 'familyMembers'), {
      ...mf, birthYear: parseInt(mf.birthYear) || 2000, createdAt: serverTimestamp()
    })
    setSelId(ref.id)
    setMf({ name: '', relation: '', birthYear: '', gender: '남' })
    setAddMember(false)
  }

  const saveRecord = async () => {
    if (!rf.diagnosis.trim() || !selId) return
    await addDoc(collection(db, 'familyMembers', selId, 'records'), { ...rf, createdAt: serverTimestamp() })
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

  // ── 공통 시트들 ─────────────────────────────────────────
  const Sheets = (
    <>
      {addMember && (
        <Sheet title="가족 추가" onClose={() => setAddMember(false)}>
          <Field label="이름 또는 별칭" value={mf.name} onChange={v => setMf(p => ({ ...p, name: v }))} placeholder="예: 배우자, 어머니" />
          <Field label="관계" value={mf.relation} onChange={v => setMf(p => ({ ...p, relation: v }))} placeholder="배우자 / 자녀 / 부모" />
          <Field label="출생연도" value={mf.birthYear} onChange={v => setMf(p => ({ ...p, birthYear: v }))} type="number" placeholder="예: 1990" />
          <Field label="성별">
            <SegmentButtons options={[{ val: '남', label: '남' }, { val: '여', label: '여' }]}
              value={mf.gender} onChange={v => setMf(p => ({ ...p, gender: v }))} />
          </Field>
          <PrimaryButton onClick={saveMember}>추가하기</PrimaryButton>
        </Sheet>
      )}
      {addRecord && (
        <Sheet title="진료 기록 추가" onClose={() => setAddRecord(false)}>
          <Field label="진료일" value={rf.date} onChange={v => setRf(p => ({ ...p, date: v }))} type="date" />
          <Field label="진단명" value={rf.diagnosis} onChange={v => setRf(p => ({ ...p, diagnosis: v }))} placeholder="예: 급성 편도염" />
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
                      style={{ background: sm.bg, color: sm.color, fontWeight: 600 }}>{sm.label}</span>
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
      {delConfirm && (
        <Sheet title="가족 삭제" onClose={() => setDelConfirm(false)}>
          <p className="text-sm mb-5" style={{ color: '#374151' }}>
            '{sel?.name}'을(를) 삭제하면 모든 진료 기록도 함께 삭제됩니다.
          </p>
          <DangerButton onClick={deleteMember}>삭제하기</DangerButton>
        </Sheet>
      )}
    </>
  )

  // ── 진료 기록 카드 (공통) ────────────────────────────────
  const RecordCard = ({ r }) => {
    const sm = STATUS[r.status] || STATUS.ongoing
    const fu = followUpStatus(r.nextVisit, r.status)
    return (
      <div onClick={() => setDetail(r)}
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
  }

  // ── 모바일 레이아웃 ──────────────────────────────────────
  if (isMobile) {
    return (
      <div className="pb-20">
        {/* 멤버 selector */}
        <div className="px-4 pt-4 pb-3 overflow-x-auto">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            {members.map(m => {
              const hasAlert = (records[m.id] || []).some(r => followUpStatus(r.nextVisit, r.status))
              const active = selId === m.id
              return (
                <button key={m.id} onClick={() => setSelId(m.id)}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: active ? '#0F6E56' : '#fff', color: active ? '#fff' : '#374151',
                    border: active ? 'none' : '1px solid #e5e7eb', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  {m.name}
                  {hasAlert && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF9F27', display: 'inline-block' }} />}
                </button>
              )
            })}
            <button onClick={() => setAddMember(true)}
              className="px-4 py-2 rounded-full text-sm"
              style={{ border: '1px dashed #d1d5db', color: '#9ca3af', background: 'none', cursor: 'pointer' }}>
              + 가족 추가
            </button>
          </div>
        </div>

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
              <div className="flex gap-2 mt-4">
                {[['진행중', 'ongoing'], ['완료', 'resolved'], ['추적', 'followup']].map(([l, s]) => (
                  <div key={l} className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.18)' }}>
                    {l} {recs.filter(r => r.status === s).length}건
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-4">
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontSize: 14, fontWeight: 700 }}>진료 기록</span>
            <button onClick={() => setAddRecord(true)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
              style={{ background: '#0F6E56', border: 'none', cursor: 'pointer' }}>+ 추가</button>
          </div>
          {recs.length === 0
            ? <div className="text-center py-12 text-sm" style={{ color: '#9ca3af' }}>📋 진료 기록이 없습니다</div>
            : <div className="flex flex-col gap-2.5">{recs.map(r => <RecordCard key={r.id} r={r} />)}</div>
          }
          {sel && <button onClick={() => setDelConfirm(true)}
            className="w-full mt-6 py-2.5 text-xs rounded-lg"
            style={{ background: 'none', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer' }}>
            '{sel.name}' 삭제
          </button>}
        </div>
        {Sheets}
      </div>
    )
  }

  // ── 데스크탑 레이아웃 ────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* 좌측 패널 — 멤버 목록 */}
      <div style={{
        width: 260, background: '#fff', borderRight: '1px solid #ece9e3',
        display: 'flex', flexDirection: 'column', height: '100vh',
      }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f0ede8' }}>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>가족 구성원</span>
            <button onClick={() => setAddMember(true)}
              style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              + 추가
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {members.map(m => {
            const mRecs = records[m.id] || []
            const hasAlert = mRecs.some(r => followUpStatus(r.nextVisit, r.status))
            const active = selId === m.id
            const ongoingCount = mRecs.filter(r => r.status === 'ongoing').length
            return (
              <button key={m.id} onClick={() => setSelId(m.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 12px', borderRadius: 12, border: 'none',
                  background: active ? '#f0faf5' : 'transparent',
                  cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                  transition: 'all 0.15s',
                }}>
                <MemberInitial name={m.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#0F6E56' : '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.name}
                    {hasAlert && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF9F27', display: 'inline-block', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {m.relation} · {getAge(m.birthYear)}세
                    {ongoingCount > 0 && <span style={{ marginLeft: 6, color: '#d97706' }}>진행중 {ongoingCount}</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 우측 패널 — 진료 기록 */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef' }}>
        {!sel
          ? <div className="flex items-center justify-center h-full" style={{ color: '#9ca3af' }}>
              <div className="text-center">
                <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
                <div style={{ fontSize: 14 }}>왼쪽에서 가족을 선택하세요</div>
              </div>
            </div>
          : <div style={{ maxWidth: 800, padding: '28px 32px' }}>
              {/* 멤버 헤더 */}
              <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: '#0F6E56' }}>
                <div className="flex items-center gap-4">
                  <MemberInitial name={sel.name} size={56} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{sel.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
                      {sel.relation} · {sel.gender} · {getAge(sel.birthYear)}세
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {[['진행중', 'ongoing'], ['완료', 'resolved'], ['추적', 'followup']].map(([l, s]) => (
                      <div key={l} className="text-center" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px' }}>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{recs.filter(r => r.status === s).length}</div>
                        <div style={{ fontSize: 11, opacity: 0.75 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 기록 헤더 */}
              <div className="flex justify-between items-center mb-4">
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                  진료 기록 <span style={{ color: '#9ca3af', fontWeight: 400 }}>({recs.length})</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setDelConfirm(true)}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #fecaca', background: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                    멤버 삭제
                  </button>
                  <button onClick={() => setAddRecord(true)}
                    style={{ padding: '7px 16px', borderRadius: 8, background: '#0F6E56', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    + 기록 추가
                  </button>
                </div>
              </div>

              {/* 기록 리스트 — 2열 그리드 */}
              {recs.length === 0
                ? <div className="text-center py-16" style={{ color: '#9ca3af', fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>진료 기록이 없습니다
                  </div>
                : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {recs.map(r => <RecordCard key={r.id} r={r} />)}
                  </div>
              }
            </div>
        }
      </div>

      {Sheets}
    </div>
  )
}
