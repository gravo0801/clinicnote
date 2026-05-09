import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, updateDoc, doc, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, PrimaryButton, Spinner } from './ui'

// SM-2 simplified — interval ladder in days
const LADDER = [1, 3, 7, 14, 30, 60, 120]
const advance = (prev, score) => {
  if (score < 3) return 1
  const i = LADDER.indexOf(prev || 0)
  return LADDER[Math.min(i + 1, LADDER.length - 1)] || 1
}

const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// 카드별 1문항 자동 생성 (Claude 호출 없이 클라이언트에서 카드 데이터를 가공)
const QUESTION_TYPES = [
  { type: 'indication',        prompt: c => `이 약(${c.drugName})의 적응증은?`,         answer: c => c.indication },
  { type: 'contraindications', prompt: c => `${c.drugName}의 금기사항은?`,             answer: c => (c.contraindications || []).join(', ') },
  { type: 'interactions',      prompt: c => `${c.drugName}의 주요 약물 상호작용은?`,    answer: c => (c.interactions || []).join(', ') },
  { type: 'pregnancy',         prompt: c => `${c.drugName}의 임산부 사용 권고는?`,      answer: c => c.pregnancy },
  { type: 'sideEffects',       prompt: c => `${c.drugName}의 주요 부작용은?`,           answer: c => (c.sideEffects || []).join(', ') },
  { type: 'dosage',            prompt: c => `${c.drugName}의 표준 용량/용법은?`,         answer: c => `${c.dosage} / ${c.usage}` },
]

const pickQuestion = (card) => {
  const usable = QUESTION_TYPES.filter(q => {
    const a = q.answer(card)
    return a && a.trim() && a.trim() !== ',' && a.trim() !== '/ '
  })
  if (usable.length === 0) return QUESTION_TYPES[0]
  return usable[Math.floor(Math.random() * usable.length)]
}

export default function RecallQuiz({ onClose }) {
  const [cards, setCards]     = useState([])
  const [loading, setLoading] = useState(true)
  const [idx, setIdx]         = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone]       = useState(false)
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    return onSnapshot(collection(db, 'drugCards'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const t = today()
      const due = all.filter(c => {
        if (c.status !== 'approved') return false
        if (!c.nextReviewAt) return true  // never reviewed → due
        const next = c.nextReviewAt.toDate ? c.nextReviewAt.toDate() : new Date(c.nextReviewAt)
        return next <= t
      })
      // 가장 오래된 lastReviewedAt 우선
      due.sort((a, b) => {
        const av = a.lastReviewedAt?.toMillis?.() ?? 0
        const bv = b.lastReviewedAt?.toMillis?.() ?? 0
        return av - bv
      })
      const picked = due.slice(0, 10)
      setCards(picked)
      setQuestions(picked.map(c => ({ card: c, q: pickQuestion(c) })))
      setLoading(false)
    })
  }, [])

  const rate = async (score) => {
    const item = questions[idx]
    if (!item) return
    const card = item.card
    const interval = advance(card.reviewInterval || 0, score)
    const next = addDays(today(), interval)
    await updateDoc(doc(db, 'drugCards', card.id), {
      lastReviewedAt: serverTimestamp(),
      nextReviewAt: Timestamp.fromDate(next),
      reviewInterval: interval,
      reviewScore: score,
    })
    if (idx + 1 >= questions.length) setDone(true)
    else { setIdx(idx + 1); setRevealed(false) }
  }

  if (loading) return <Sheet title="복습 퀴즈" onClose={onClose}><Spinner /></Sheet>

  if (questions.length === 0) {
    return (
      <Sheet title="복습 퀴즈" onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 14 }}>오늘 복습할 카드가 없습니다.</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>승인된 카드의 다음 복습일이 도래하면 표시됩니다.</div>
        </div>
      </Sheet>
    )
  }

  if (done) {
    return (
      <Sheet title="복습 완료" onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{questions.length}개 카드 복습 완료</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>다음 복습일이 자동 설정되었습니다.</div>
        </div>
        <PrimaryButton onClick={onClose}>닫기</PrimaryButton>
      </Sheet>
    )
  }

  const item = questions[idx]
  const answer = item.q.answer(item.card)

  return (
    <Sheet title={`복습 ${idx + 1} / ${questions.length}`} onClose={onClose}>
      <div style={{ background: '#F4F6F9', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>문제</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0D1117', lineHeight: 1.5 }}>
          {item.q.prompt(item.card)}
        </div>
      </div>

      {!revealed ? (
        <button onClick={() => setRevealed(true)} style={{
          width: '100%', padding: '12px', borderRadius: 10,
          background: '#fff', border: '1.5px solid #00C07F',
          color: '#00C07F', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 700,
        }}>정답 보기</button>
      ) : (
        <>
          <div style={{ background: '#EDFFF8', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid #C7F7E8' }}>
            <div style={{ fontSize: 11, color: '#007A52', marginBottom: 4, fontWeight: 600 }}>정답</div>
            <div style={{ fontSize: 14, color: '#065F46', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{answer}</div>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, textAlign: 'center' }}>얼마나 잘 기억했나요?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 6 }}>
            {[
              [0, '😵 전혀'],
              [2, '🤔 헷갈림'],
              [3, '🙂 그럭저럭'],
              [4, '😊 잘 기억'],
              [5, '🎯 완벽'],
            ].map(([s, label]) => (
              <button key={s} onClick={() => rate(s)} style={{
                padding: '10px 6px', borderRadius: 9, border: '1px solid #e5e7eb',
                background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, color: '#374151',
              }}>{label}</button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  )
}
