import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import HealthCheckup from './HealthCheckup'
import { db } from '../firebase'
import { Sheet, SegmentButtons, DangerButton, Spinner, useIsMobile } from './ui'

const getAge = y => new Date().getFullYear() - y

const STATUS = {
  ongoing:  { label: '진행중',   bg: '#FAEEDA', color: '#633806' },
  resolved: { label: '완료',     bg: '#EAF3DE', color: '#27500A' },
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

// 구버전(treatment string) + 신버전(drugs array) 모두 표시
function RecordSummary({ r }) {
  const hasDrugs = r.drugs && r.drugs.length > 0 && r.drugs[0].name
  if (hasDrugs) {
    return (
      <div className="text-xs truncate" style={{ color: '#6b7280' }}>
        💊 {r.drugs.filter(d=>d.name).map(d=>d.name).join(', ')}
      </div>
    )
  }
  return (
    <div className="text-xs truncate" style={{ color: '#6b7280' }}>{r.treatment || '-'}</div>
  )
}

export default function FamilyTab() {
  const isMobile = useIsMobile()
  const [members, setMembers]   = useState([])
  const [records, setRecords]   = useState({})
  const [rxNames, setRxNames]   = useState([])  // 처방 약물명 자동완성용
  const [selId, setSelId]       = useState(null)
  const [loading, setLoading]   = useState(true)

  const [memberTab, setMemberTab]  = useState('records') // 'records' | 'checkup'
  const [addMember,  setAddMember]  = useState(false)
  const [addRecord,  setAddRecord]  = useState(false)
  const [detail,     setDetail]     = useState(null)
  const [delConfirm, setDelConfirm] = useState(false)

  const [mf, setMf] = useState({ name: '', relation: '', birthYear: '', gender: '남' })
  const [rf, setRf] = useState({
    date: new Date().toISOString().slice(0, 10),
    diagnosis: '', treatment: '', nextVisit: '', status: 'ongoing', note: ''
  })

  // ── Members ──────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'familyMembers'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMembers(list)
      if (!selId && list.length > 0) setSelId(list[0].id)
      setLoading(false)
    })
  }, [])

  // ── Records ──────────────────────────────────────────────
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

  // ── 처방 약물명 목록 (자동완성 소스) ─────────────────────
  useEffect(() => {
    return onSnapshot(collection(db, 'prescriptions'), snap => {
      setRxNames(snap.docs.map(d => d.data().drugName).filter(Boolean))
    })
  }, [])

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
    if (!selId || !rf.diagnosis.trim()) return
    await addDoc(collection(db, 'familyMembers', selId, 'records'), {
      ...rf, createdAt: serverTimestamp(),
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

  const sel  = members.find(m => m.id === selId)
  const recs = records[selId] || []

  if (loading) return <Spinner />

  // ── 공통 시트들 ──────────────────────────────────────────
  const Sheets = (
    <>
      {addMember && (
        <Sheet title="가족 추가" onClose={() => setAddMember(false)}>
          <div className="mb-3">
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>이름 또는 별칭</label>
            <input value={mf.name} onChange={e => setMf(p => ({ ...p, name: e.target.value }))} placeholder="예: 배우자, 어머니"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div className="mb-3">
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>관계</label>
            <input value={mf.relation} onChange={e => setMf(p => ({ ...p, relation: e.target.value }))} placeholder="배우자 / 자녀 / 부모"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div className="mb-3">
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>출생연도</label>
            <input type="number" value={mf.birthYear} onChange={e => setMf(p => ({ ...p, birthYear: e.target.value }))} placeholder="예: 1990"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div className="mb-3">
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 5 }}>성별</label>
            <SegmentButtons options={[{ val: '남', label: '남' }, { val: '여', label: '여' }]}
              value={mf.gender} onChange={v => setMf(p => ({ ...p, gender: v }))} />
          </div>
          <button onClick={saveMember} style={{ width: '100%', padding: '12px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            추가하기
          </button>
        </Sheet>
      )}

      {addRecord && (
        <Sheet title="진료 기록 작성" onClose={() => setAddRecord(false)}>
          {[['진료일','date','date'],['진단명','diagnosis','text'],['치료/처방','treatment','text'],['다음 방문일','nextVisit','date']].map(([l,k,t]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <label style={{ display:'block', fontSize:12, color:'#6b7280', marginBottom:4, fontWeight:600 }}>{l}</label>
              {k === 'treatment'
                ? <textarea value={rf[k]} onChange={e => setRf(p => ({...p,[k]:e.target.value}))} placeholder="약물명, 용량, 용법 기록"
                    style={{ width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical', minHeight:72 }} />
                : <input type={t} value={rf[k]} onChange={e => setRf(p => ({...p,[k]:e.target.value}))}
                    style={{ width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
              }
            </div>
          ))}
          <div style={{ marginBottom:10 }}>
            <label style={{ display:'block', fontSize:12, color:'#6b7280', marginBottom:4, fontWeight:600 }}>상태</label>
            <SegmentButtons options={[{val:'ongoing',label:'진행중'},{val:'resolved',label:'완료'},{val:'followup',label:'추적필요'}]}
              value={rf.status} onChange={v => setRf(p => ({...p,status:v}))} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:12, color:'#6b7280', marginBottom:4, fontWeight:600 }}>메모</label>
            <textarea value={rf.note} onChange={e => setRf(p => ({...p,note:e.target.value}))} placeholder="추가 메모"
              style={{ width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical', minHeight:60 }} />
          </div>
          <button onClick={saveRecord} style={{ width:'100%', padding:'12px', background:'#0F6E56', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>저장</button>
        </Sheet>
      )}

      {detail && (
        <Sheet title="진료 상세" onClose={() => setDetail(null)}>
          {(() => {
            const sm = STATUS[detail.status] || STATUS.ongoing
            const fu = followUpStatus(detail.nextVisit, detail.status)
            const hasDrugs = detail.drugs?.some(d => d.name)
            return (
              <>
                {/* 헤더 */}
                <div className="mb-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{detail.diagnosis || detail.chiefComplaint}</span>
                      {detail.kcd && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontSize: 11, background: '#0F6E56', color: '#fff', borderRadius: 5, padding: '2px 8px', marginRight: 6 }}>{detail.kcd.code}</span>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{detail.kcd.name}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg shrink-0 ml-2"
                      style={{ background: sm.bg, color: sm.color, fontWeight: 600 }}>{sm.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>
                    진료일 {detail.date}
                    {detail.nextVisit && ` · 다음 ${detail.nextVisit}${fu === 'overdue' ? ' ⚠️' : fu === 'soon' ? ' 🔔' : ''}`}
                  </div>
                </div>

                {/* 주호소 */}
                {detail.chiefComplaint && (
                  <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>주호소</div>
                    <div style={{ fontSize: 14, color: '#1a1a1a' }}>{detail.chiefComplaint}</div>
                  </div>
                )}

                {/* 처방 약물 (신버전) */}
                {hasDrugs && (
                  <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>처방 약물</div>
                    {detail.drugs.filter(d => d.name).map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', minWidth: 0, flex: 1 }}>{d.name}</span>
                        <span style={{ fontSize: 12, color: '#6b7280', shrink: 0 }}>{[d.dosage, d.usage, d.duration && d.duration+'일'].filter(Boolean).join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 구버전 treatment */}
                {!hasDrugs && detail.treatment && (
                  <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>치료 / 처방</div>
                    <div style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detail.treatment}</div>
                  </div>
                )}

                {/* Progress Note */}
                {detail.progressNote && (
                  <div style={{ background: '#f8f6f2', borderRadius: 10, padding: '11px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Progress Note</div>
                    <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detail.progressNote}</div>
                  </div>
                )}

                {/* 메모 */}
                {detail.note && (
                  <div style={{ background: '#fffbeb', borderRadius: 10, padding: '11px 14px', marginBottom: 10, border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 11, color: '#92400e', marginBottom: 4 }}>메모</div>
                    <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.6 }}>{detail.note}</div>
                  </div>
                )}

                {/* AI 검토 패널 — 케이스 스터디 탭에서 이용 가능 */}

                <DangerButton onClick={() => deleteRecord(detail.id)}>기록 삭제</DangerButton>
              </>
            )
          })()}
        </Sheet>
      )}

      {delConfirm && (
        <Sheet title="가족 삭제" onClose={() => setDelConfirm(false)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
            '{sel?.name}'을(를) 삭제하면 모든 진료 기록도 함께 삭제됩니다.
          </p>
          <DangerButton onClick={deleteMember}>삭제하기</DangerButton>
        </Sheet>
      )}
    </>
  )

  // ── 기록 카드 (공통) ─────────────────────────────────────
  const RecordCard = ({ r }) => {
    const sm = STATUS[r.status] || STATUS.ongoing
    const fu = followUpStatus(r.nextVisit, r.status)
    const hasKcd = r.kcd?.code
    return (
      <div onClick={() => setDetail(r)}
        className="bg-white rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-sm"
        style={{
          border: fu === 'overdue' ? '1px solid #fca5a5' : fu === 'soon' ? '1px solid #fcd34d' : '1px solid #f0ede8',
        }}>
        <div className="flex justify-between items-start mb-1.5">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{r.diagnosis || r.chiefComplaint}</span>
            {hasKcd && <span style={{ fontSize: 11, background: '#e6f4ef', color: '#0F6E56', borderRadius: 5, padding: '1px 6px', marginLeft: 6, fontWeight: 600 }}>{r.kcd.code}</span>}
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md ml-2 shrink-0"
            style={{ background: sm.bg, color: sm.color, fontWeight: 600 }}>{sm.label}</span>
        </div>
        <RecordSummary r={r} />
        <div className="flex gap-3 text-xs mt-2" style={{ color: '#9ca3af' }}>
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
        <div className="px-4 pt-4 pb-3 overflow-x-auto">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            {members.map(m => {
              const hasAlert = (records[m.id] || []).some(r => followUpStatus(r.nextVisit, r.status))
              const active = selId === m.id
              return (
                <button key={m.id} onClick={() => { setSelId(m.id); setMemberTab('records') }}
                  className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ background: active ? '#0F6E56' : '#fff', color: active ? '#fff' : '#374151', border: active ? 'none' : '1px solid #e5e7eb', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {m.name}
                  {hasAlert && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF9F27', display: 'inline-block' }} />}
                </button>
              )
            })}
            <button onClick={() => setAddMember(true)} style={{ padding: '8px 16px', borderRadius: 20, border: '1px dashed #d1d5db', color: '#9ca3af', background: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>+ 가족 추가</button>
          </div>
        </div>

        {sel && (
          <div className="px-4 pb-4">
            <div className="rounded-2xl p-5 text-white" style={{ background: '#0F6E56' }}>
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700 }}>{sel.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.75, marginTop: 3 }}>{sel.relation} · {sel.gender} · {getAge(sel.birthYear)}세</div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{recs.length}</div>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>진료 기록</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {[['진행중','ongoing'],['완료','resolved'],['추적','followup']].map(([l,s]) => (
                  <div key={l} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.18)' }}>
                    {l} {recs.filter(r=>r.status===s).length}건
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-4">
          {/* 서브 탭 토글 */}
          <div style={{ display: 'flex', gap: 4, background: '#f0ede8', borderRadius: 10, padding: 4, marginBottom: 14 }}>
            {[['records', '📋 진료 기록'], ['checkup', '🏥 건강검진']].map(([k, l]) => (
              <button key={k} onClick={() => setMemberTab(k)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: memberTab === k ? '#fff' : 'transparent', color: memberTab === k ? '#0F6E56' : '#9ca3af', fontSize: 13, fontWeight: memberTab === k ? 700 : 400, cursor: 'pointer', boxShadow: memberTab === k ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
                {l}
              </button>
            ))}
          </div>

          {memberTab === 'checkup' ? (
            sel && <HealthCheckup memberId={sel.id} memberGender={sel.gender} />
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <span style={{ fontSize: 14, fontWeight: 700 }}>진료 기록</span>
                <button onClick={() => setAddRecord(true)} className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                  style={{ background: '#0F6E56', border: 'none', cursor: 'pointer' }}>+ 추가</button>
              </div>
              {recs.length === 0
                ? <div className="text-center py-12 text-sm" style={{ color: '#9ca3af' }}>📋 진료 기록이 없습니다</div>
                : <div className="flex flex-col gap-2.5">{recs.map(r => <RecordCard key={r.id} r={r} />)}</div>
              }
            </>
          )}
          {sel && <button onClick={() => setDelConfirm(true)} className="w-full mt-6 py-2.5 text-xs rounded-lg"
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
      {/* 좌측 멤버 패널 */}
      <div style={{ width: 260, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f0ede8' }}>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>가족 구성원</span>
            <button onClick={() => setAddMember(true)}
              style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              + 추가
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {members.map(m => {
            const mRecs = records[m.id] || []
            const hasAlert = mRecs.some(r => followUpStatus(r.nextVisit, r.status))
            const active = selId === m.id
            const ongoingCount = mRecs.filter(r => r.status === 'ongoing').length
            return (
              <button key={m.id} onClick={() => { setSelId(m.id); setMemberTab('records') }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, border: 'none', background: active ? '#f0faf5' : 'transparent', cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
                <MemberInitial name={m.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#0F6E56' : '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5 }}>
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

      {/* 우측 패널 */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef' }}>
        {!sel
          ? <div className="flex items-center justify-center h-full" style={{ color: '#9ca3af' }}>
              <div className="text-center"><div style={{ fontSize: 40, marginBottom: 12 }}>👈</div><div style={{ fontSize: 14 }}>왼쪽에서 가족을 선택하세요</div></div>
            </div>
          : <div style={{ maxWidth: 800, padding: '28px 32px' }}>
              {/* 멤버 헤더 */}
              <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: '#0F6E56' }}>
                <div className="flex items-center gap-4">
                  <MemberInitial name={sel.name} size={56} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{sel.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{sel.relation} · {sel.gender} · {getAge(sel.birthYear)}세</div>
                  </div>
                  <div className="flex gap-3">
                    {[['진행중','ongoing'],['완료','resolved'],['추적','followup']].map(([l,s]) => (
                      <div key={l} className="text-center" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 18px' }}>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{recs.filter(r=>r.status===s).length}</div>
                        <div style={{ fontSize: 11, opacity: 0.75 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 서브 탭 */}
              <div style={{ display: 'flex', gap: 4, background: '#f0ede8', borderRadius: 10, padding: 4, marginBottom: 20 }}>
                {[['records', '📋 진료 기록'], ['checkup', '🏥 건강검진']].map(([k, l]) => (
                  <button key={k} onClick={() => setMemberTab(k)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: memberTab === k ? '#fff' : 'transparent', color: memberTab === k ? '#0F6E56' : '#9ca3af', fontSize: 13, fontWeight: memberTab === k ? 700 : 400, cursor: 'pointer', boxShadow: memberTab === k ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
                    {l}
                  </button>
                ))}
              </div>

              {memberTab === 'checkup' ? (
                <HealthCheckup memberId={sel.id} memberGender={sel.gender} />
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span style={{ fontSize: 15, fontWeight: 700 }}>
                      진료 기록 <span style={{ color: '#9ca3af', fontWeight: 400 }}>({recs.length})</span>
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setDelConfirm(true)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #fecaca', background: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>멤버 삭제</button>
                      <button onClick={() => setAddRecord(true)} style={{ padding: '7px 16px', borderRadius: 8, background: '#0F6E56', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ 기록 추가</button>
                    </div>
                  </div>
                  {recs.length === 0
                    ? <div className="text-center py-16" style={{ color: '#9ca3af', fontSize: 14 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>진료 기록이 없습니다</div>
                    : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {recs.map(r => <RecordCard key={r.id} r={r} />)}
                      </div>
                  }
                </>
              )}
            </div>
        }
      </div>
      {Sheets}
    </div>
  )
}
