import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Field, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'
import CaseStudyTab from './CaseStudyTab'
import PresetRxTab from './PresetRxTab'
import DrugCardTab from './DrugCardTab'
import ScenarioTab from './ScenarioTab'

export default function RxTab() {
  const isMobile = useIsMobile()
  const [subTab, setSubTab]     = useState('notes')
  const [rxList, setRxList]     = useState([])
  const [myDrugs, setMyDrugs]   = useState([])  // 사용자 등록 약물
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState('전체')
  const [addRx, setAddRx]       = useState(false)
  const [addMyDrug, setAddMyDrug] = useState(false)
  const [newDrugName, setNewDrugName] = useState('')
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

  // 사용자 등록 약물 목록
  useEffect(() => {
    return onSnapshot(collection(db, 'myDrugs'), snap => {
      setMyDrugs(snap.docs.map(d => d.data().name).filter(Boolean))
    })
  }, [])

  const saveMyDrug = async () => {
    if (!newDrugName.trim()) return
    await addDoc(collection(db, 'myDrugs'), { name: newDrugName.trim(), createdAt: serverTimestamp() })
    setNewDrugName('')
    setAddMyDrug(false)
  }

  // 처방 노하우 약물 + 사용자 등록 약물 합산
  const drugSuggestions = useMemo(() =>
    [...new Set([...rxList.map(r => r.drugName).filter(Boolean), ...myDrugs])]
  , [rxList, myDrugs])

  const categories = useMemo(() =>
    ['전체', ...new Set(rxList.map(r => r.category).filter(Boolean))],
    [rxList]
  )

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

  const deleteRx = async (id) => {
    await deleteDoc(doc(db, 'prescriptions', id))
    setDetail(null)
  }

  if (loading) return <Spinner />

  // ── 서브탭 바 ────────────────────────────────────────────
  const SubTabBar = ({ style = {} }) => (
    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: '#F0F4F8', ...style }}>
      {[['notes', '🏥 케이스'], ['drugs', '💊 약물 카드'], ['scenario', '🎯 시나리오'], ['preset', '📋 약속처방']].map(([k, l]) => (
        <button key={k} onClick={() => setSubTab(k)}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 7, border: 'none',
            background: subTab === k ? '#fff' : 'transparent',
            color: subTab === k ? (k === 'notes' ? '#7c3aed' : k === 'preset' ? '#d97706' : k === 'scenario' ? '#0EA5E9' : '#00C07F') : '#9ca3af',
            fontSize: 13, fontWeight: subTab === k ? 700 : 400, cursor: 'pointer',
            boxShadow: subTab === k ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
            transition: 'all 0.15s',
          }}>{l}</button>
      ))}
    </div>
  )

  // ── 약물 카드 시트들 ─────────────────────────────────────
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
      {/* 약물 빠른 등록 */}
      {addMyDrug && (
        <Sheet title="약물 빠른 등록" onClose={() => { setAddMyDrug(false); setNewDrugName('') }}>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, lineHeight: 1.6 }}>
            처방창 자동완성에 추가할 약물명을 등록합니다.<br />
            상세 정보가 필요하면 <b>처방 노하우 → 약물 카드</b>에서 추가하세요.
          </p>
          <Field label="약물명 *">
            <input value={newDrugName} onChange={e => setNewDrugName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveMyDrug()}
              placeholder="예: 세티리진정10mg(지르텍)"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              autoFocus />
          </Field>
          {/* 등록된 목록 */}
          {myDrugs.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>등록된 약물 ({myDrugs.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {myDrugs.map(name => (
                  <span key={name} style={{ fontSize: 12, background: '#EDFFF8', color: '#00C07F', border: '1px solid #C7F7E8', borderRadius: 20, padding: '3px 10px' }}>
                    💊 {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <PrimaryButton onClick={saveMyDrug}>추가</PrimaryButton>
        </Sheet>
      )}
      {detail && (
        <Sheet title="처방 상세" onClose={() => setDetail(null)}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{detail.drugName}</span>
              {detail.category && (
                <span style={{ fontSize: 11, background: '#D0F7EC', color: '#007A52', borderRadius: 6, padding: '3px 9px', fontWeight: 600 }}>{detail.category}</span>
              )}
            </div>
            {detail.indication && <div style={{ fontSize: 14, color: '#6b7280' }}>{detail.indication}</div>}
          </div>
          {[['💊 용량', detail.dosage], ['⏰ 용법', detail.usage], ['📆 처방일수', detail.duration]]
            .filter(([, v]) => v).map(([l, v]) => (
              <div key={l} style={{ background: '#F8F9FB', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0D1117' }}>{v}</div>
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

  // ── 약물 카드 컴포넌트 ───────────────────────────────────
  const RxCard = ({ rx }) => (
    <div onClick={() => setDetail(rx)}
      style={{ background: '#fff', borderRadius: 13, padding: '14px 16px', cursor: 'pointer', border: '1px solid #EDF0F4', borderLeft: '3px solid #00C07F', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0D1117' }}>{rx.drugName}</span>
        {rx.category && <span style={{ fontSize: 11, background: '#D0F7EC', color: '#007A52', borderRadius: 6, padding: '2px 8px', marginLeft: 8, fontWeight: 600, whiteSpace: 'nowrap' }}>{rx.category}</span>}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 1.4 }}>{rx.indication}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {[['💊', rx.dosage], ['⏰', rx.usage], ['📆', rx.duration]].filter(([, v]) => v).map(([icon, v]) => (
          <span key={icon} style={{ fontSize: 12, background: '#F4F6F9', color: '#6b7280', borderRadius: 6, padding: '3px 8px' }}>{icon} {v}</span>
        ))}
      </div>
    </div>
  )

  // ── 모바일 ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        {/* 서브탭 */}
        <div style={{ padding: '12px 16px 10px' }}>
          <SubTabBar />
        </div>

        {subTab === 'notes'
          ? <CaseStudyTab drugSuggestions={drugSuggestions} />
          : subTab === 'preset'
          ? <PresetRxTab />
          : subTab === 'scenario'
          ? <ScenarioTab />
          : <DrugCardTab />
        }
      </div>
    )
  }

  // ── 데스크탑 ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* 상단 서브탭 바 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EDF0F4', padding: '12px 24px' }}>
        <SubTabBar style={{ maxWidth: 320 }} />
      </div>

      {subTab === 'notes'
        ? <div style={{ flex: 1, overflow: 'hidden' }}>
            <CaseStudyTab drugSuggestions={drugSuggestions} />
          </div>
        : subTab === 'preset'
        ? <div style={{ flex: 1, overflow: 'hidden', overflowY: 'auto', background: '#F4F6F9' }}>
            <PresetRxTab />
          </div>
        : subTab === 'scenario'
        ? <div style={{ flex: 1, overflow: 'hidden', overflowY: 'auto' }}>
            <ScenarioTab />
          </div>
        : <DrugCardTab />
      }
    </div>
  )
}
