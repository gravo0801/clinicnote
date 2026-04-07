import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'
import DiseaseNoteTab from './DiseaseNoteTab'

export default function RxTab() {
  const isMobile = useIsMobile()
  const [subTab, setSubTab]     = useState('drugs')
  const [rxList, setRxList]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('전체')
  const [addRx, setAddRx]       = useState(false)
  const [detail, setDetail]     = useState(null)

  const [rf, setRf] = useState({
    drugName: '', category: '', indication: '',
    dosage: '', usage: '', duration: '', note: ''
  })

  useEffect(() => {
    const q = query(collection(db, 'prescriptions'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setRxList(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const drugSuggestions = useMemo(() => rxList.map(r => r.drugName).filter(Boolean), [rxList])
  const categories = useMemo(() => ['전체', ...new Set(rxList.map(r => r.category).filter(Boolean))], [rxList])
  const filtered = useMemo(() => rxList.filter(r => {
    const cOk = catFilter === '전체' || r.category === catFilter
    const q = search.toLowerCase()
    const sOk = !q || [r.drugName, r.indication, r.category, r.note].some(t => t?.toLowerCase().includes(q))
    return cOk && sOk
  }), [rxList, catFilter, search])

  const saveRx = async () => {
    if (!rf.drugName.trim()) return
    await addDoc(collection(db, 'prescriptions'), { ...rf, createdAt: serverTimestamp() })
    setRf({ drugName: '', category: '', indication: '', dosage: '', usage: '', duration: '', note: '' })
    setAddRx(false)
  }
  const deleteRx = async (id) => { await deleteDoc(doc(db, 'prescriptions', id)); setDetail(null) }

  if (loading) return <Spinner />

  const SubTabBar = ({ style = {} }) => (
    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: '#f0ede8', ...style }}>
      {[['drugs', '💊 약물 카드'], ['notes', '📖 질환 노트']].map(([k, l]) => (
        <button key={k} onClick={() => setSubTab(k)}
          style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: subTab === k ? '#fff' : 'transparent', color: subTab === k ? (k === 'notes' ? '#7c3aed' : '#0F6E56') : '#9ca3af', fontSize: 13, fontWeight: subTab === k ? 700 : 400, cursor: 'pointer', boxShadow: subTab === k ? '0 1px 3px rgba(0,0,0,0.07)' : 'none', transition: 'all 0.15s' }}>{l}</button>
      ))}
    </div>
  )

  const DrugSheets = (
    <>
      {addRx && (
        <Sheet title="처방 추가" onClose={() => setAddRx(false)}>
          <Field label="약물명 *" value={rf.drugName} onChange={v => setRf(p => ({ ...p, drugName: v }))} placeholder="예: 아목시실린" />
          <Field label="카테고리" value={rf.category} onChange={v => setRf(p => ({ ...p, category: v }))} placeholder="항생제 / 고혈압 / 위장약" />
          <Field label="적응증" value={rf.indication} onChange={v => setRf(p => ({ ...p, indication: v }))} placeholder="예: 편도염, 중이염, 인두염" />
          <Field label="용량" value={rf.dosage} onChange={v => setRf(p => ({ ...p, dosage: v }))} placeholder="예: 500mg 1T" />
          <Field label="용법" value={rf.usage} onChange={v => setRf(p => ({ ...p, usage: v }))} placeholder="예: 1일 3회 식후 (tid)" />
          <Field label="처방일수" value={rf.duration} onChange={v => setRf(p => ({ ...p, duration: v }))} placeholder="예: 5–7일" />
          <Field label="처방 팁 / 메모" value={rf.note} onChange={v => setRf(p => ({ ...p, note: v }))} placeholder="주의사항, 증량 기준 등" multiline />
          <PrimaryButton onClick={saveRx}>저장</PrimaryButton>
        </Sheet>
      )}
      {detail && (
        <Sheet title="처방 상세" onClose={() => setDetail(null)}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{detail.drugName}</span>
              {detail.category && <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', borderRadius: 6, padding: '3px 9px', fontWeight: 600 }}>{detail.category}</span>}
            </div>
            {detail.indication && <div style={{ fontSize: 14, color: '#6b7280' }}>{detail.indication}</div>}
          </div>
          {[['💊 용량', detail.dosage], ['⏰ 용법', detail.usage], ['📆 처방일수', detail.duration]].filter(([, v]) => v).map(([l, v]) => (
            <div key={l} style={{ background: '#f8f6f2', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{v}</div>
            </div>
          ))}
          {detail.note && (
            <div style={{ background: '#FAEEDA', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #FAC775' }}>
              <div style={{ fontSize: 12, color: '#633806', marginBottom: 4 }}>📝 처방 팁</div>
              <div style={{ fontSize: 14, color: '#412402', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detail.note}</div>
            </div>
          )}
          <DangerButton onClick={() => deleteRx(detail.id)}>삭제</DangerButton>
        </Sheet>
      )}
    </>
  )

  const RxCard = ({ rx }) => (
    <div onClick={() => setDetail(rx)} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', border: '1px solid #f0ede8', borderLeft: '3px solid #0F6E56', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{rx.drugName}</span>
        {rx.category && <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', borderRadius: 6, padding: '2px 8px', marginLeft: 8, fontWeight: 600, whiteSpace: 'nowrap' }}>{rx.category}</span>}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 1.4 }}>{rx.indication}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {[['💊', rx.dosage], ['⏰', rx.usage], ['📆', rx.duration]].filter(([, v]) => v).map(([icon, v]) => (
          <span key={icon} style={{ fontSize: 12, background: '#f5f3ef', color: '#6b7280', borderRadius: 6, padding: '3px 8px' }}>{icon} {v}</span>
        ))}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={{ padding: '12px 16px 10px' }}><SubTabBar /></div>
        {subTab === 'notes' ? <DiseaseNoteTab drugSuggestions={drugSuggestions} /> : (
          <>
            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9ca3af' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="약명, 적응증 검색..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }} />
              </div>
            </div>
            <div style={{ padding: '0 16px 10px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
                {categories.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '5px 12px', borderRadius: 20, border: catFilter === c ? 'none' : '1px solid #e5e7eb', background: catFilter === c ? '#0F6E56' : '#fff', color: catFilter === c ? '#fff' : '#6b7280', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: catFilter === c ? 600 : 400 }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length}개</span>
              <button onClick={() => setAddRx(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ 처방 추가</button>
            </div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 13 }}>💊 등록된 처방이 없습니다</div>
                : filtered.map(rx => <RxCard key={rx.id} rx={rx} />)}
            </div>
            {DrugSheets}
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #ece9e3', padding: '12px 24px' }}>
        <SubTabBar style={{ maxWidth: 320 }} />
      </div>
      {subTab === 'notes' ? <div style={{ flex: 1, overflow: 'hidden' }}><DiseaseNoteTab drugSuggestions={drugSuggestions} /></div> : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 210, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 14px', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="검색..." style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.5px', padding: '4px 8px 6px' }}>카테고리</div>
              {categories.map(c => {
                const count = c === '전체' ? rxList.length : rxList.filter(r => r.category === c).length
                const active = catFilter === c
                return (
                  <button key={c} onClick={() => setCatFilter(c)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: 'none', background: active ? '#f0faf5' : 'transparent', color: active ? '#0F6E56' : '#374151', fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', marginBottom: 2 }}>
                    <span>{c}</span>
                    <span style={{ fontSize: 11, background: active ? '#dcfce7' : '#f3f4f6', color: active ? '#0F6E56' : '#9ca3af', borderRadius: 10, padding: '1px 7px' }}>{count}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ padding: '12px', borderTop: '1px solid #f0ede8' }}>
              <button onClick={() => setAddRx(true)} style={{ width: '100%', padding: '9px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ 처방 추가</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef', padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{catFilter === '전체' ? '전체 처방' : catFilter}</h2>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{filtered.length}개</div>
              </div>
            </div>
            {filtered.length === 0
              ? <div style={{ textAlign: 'center', paddingTop: 80, color: '#9ca3af' }}><div style={{ fontSize: 36, marginBottom: 10 }}>💊</div><div style={{ fontSize: 14 }}>등록된 처방이 없습니다</div></div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>{filtered.map(rx => <RxCard key={rx.id} rx={rx} />)}</div>}
          </div>
          {DrugSheets}
        </div>
      )}
    </div>
  )
}
