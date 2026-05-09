import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, updateDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, PrimaryButton, DangerButton, Spinner, useIsMobile } from './ui'

export default function ScenarioTab() {
  const isMobile = useIsMobile()
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading]     = useState(true)
  const [active, setActive]       = useState(null)
  const [answers, setAnswers]     = useState({})  // qIdx → selected option
  const [revealed, setRevealed]   = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'scenarios'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setScenarios(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const open = (s) => { setActive(s); setAnswers({}); setRevealed(false) }
  const close = () => { setActive(null); setAnswers({}); setRevealed(false) }

  const markCompleted = async () => {
    if (!active) return
    await updateDoc(doc(db, 'scenarios', active.id), {
      status: 'completed', completedAt: serverTimestamp(),
    })
    close()
  }

  const remove = async (id) => {
    await deleteDoc(doc(db, 'scenarios', id))
    close()
  }

  if (loading) return <Spinner />

  const Card = ({ s }) => (
    <div onClick={() => open(s)} style={{
      background: '#fff', borderRadius: 13, padding: '16px 18px', cursor: 'pointer',
      border: '1px solid #EDF0F4', borderLeft: '3px solid #7c3aed',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0D1117' }}>{s.title}</span>
        {s.status === 'completed' && <span style={{ fontSize: 11, background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>완료</span>}
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>
        {s.weekOf} · {(s.questions || []).length}문항
      </div>
    </div>
  )

  const ActiveSheet = active && (
    <Sheet title={active.title} onClose={close}>
      <div style={{ background: '#F4F6F9', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>환자 정보</div>
        <div style={{ fontSize: 13.5, color: '#0D1117', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {active.vignette}
        </div>
      </div>
      {(active.questions || []).map((q, i) => {
        const selected = answers[i]
        const correct = q.answer
        return (
          <div key={i} style={{ background: '#fff', border: '1px solid #EDF0F4', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1117', marginBottom: 10, lineHeight: 1.5 }}>
              Q{i + 1}. {q.q}
            </div>
            {(q.options || []).map((opt, j) => {
              const letter = String.fromCharCode(65 + j)  // A, B, C, …
              const isSel = selected === letter || selected === opt
              const isCorrect = correct === letter || correct === opt
              const showResult = revealed
              const bg = !showResult
                ? (isSel ? '#EDFFF8' : '#fff')
                : (isCorrect ? '#D1FAE5' : (isSel ? '#FEE2E2' : '#fff'))
              const border = !showResult
                ? (isSel ? '1.5px solid #00C07F' : '1px solid #e5e7eb')
                : (isCorrect ? '1.5px solid #10B981' : (isSel ? '1.5px solid #EF4444' : '1px solid #e5e7eb'))
              return (
                <button key={j} disabled={revealed}
                  onClick={() => setAnswers(p => ({ ...p, [i]: letter }))}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 12px', borderRadius: 8, marginBottom: 6,
                    border, background: bg, cursor: revealed ? 'default' : 'pointer',
                    fontFamily: 'inherit', fontSize: 13, color: '#0D1117',
                  }}>
                  <b style={{ marginRight: 6 }}>{letter}.</b>{opt}
                </button>
              )
            })}
            {revealed && q.rationale && (
              <div style={{ marginTop: 8, background: '#FEF3C7', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: '#78350F', lineHeight: 1.6 }}>
                <b>해설:</b> {q.rationale}
              </div>
            )}
          </div>
        )
      })}
      {!revealed ? (
        <PrimaryButton onClick={() => setRevealed(true)}>정답 확인</PrimaryButton>
      ) : (
        <>
          <PrimaryButton onClick={markCompleted}>완료 처리</PrimaryButton>
          <DangerButton onClick={() => remove(active.id)}>시나리오 삭제</DangerButton>
        </>
      )}
    </Sheet>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F6F9', padding: isMobile ? '14px 16px' : '24px 32px' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0D1117' }}>🎯 임상 시나리오</h2>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
          {scenarios.length}개 · 매주 일요일 자동 생성
        </div>
      </div>
      {scenarios.length === 0
        ? <div style={{ textAlign: 'center', paddingTop: 80, color: '#9ca3af' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
            <div style={{ fontSize: 14 }}>등록된 시나리오가 없습니다</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>매주 일요일 21시에 자동 생성됩니다</div>
          </div>
        : <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {scenarios.map(s => <Card key={s.id} s={s} />)}
          </div>
      }
      {ActiveSheet}
    </div>
  )
}
