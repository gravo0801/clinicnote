import { useMemo, useState } from 'react'
import { adultCurriculum, adultDailyTemplate } from '../data/adultCurriculum'
import { adultDailyContent } from '../data/adultDailyContent'
import { useIsMobile } from './ui'

const ADULT_DAILY_VERSION = 'v2026.07.05-day7-10'
const ADULT_DAILY_UPDATED_AT = '2026-07-05'

const planSummary = [
  { label: '목표', value: '개원 전 성인 1차진료 반복 질환을 진료실 루틴으로 만들기' },
  { label: '속도', value: '하루 1주제, 가벼운 주제는 하루 2주제까지 묶음' },
  { label: '산출물', value: 'master 원본 + A4 HTML + iPad용 PDF + 앱 카드' },
  { label: '검토 기준', value: '증상 접근, KCD, 처방, 추적, refer, 환자 설명' },
  { label: '버전', value: `${ADULT_DAILY_VERSION} · 업데이트 ${ADULT_DAILY_UPDATED_AT}` },
]

function flattenCurriculum() {
  const rows = []
  adultCurriculum.forEach(week => {
    week.topics.forEach((topic, idx) => {
      rows.push({
        day: rows.length + 1,
        week: week.week,
        theme: week.theme,
        topic,
        slot: idx + 1,
      })
    })
  })
  return rows
}

const S = {
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '3px 9px',
    fontSize: 11,
    fontWeight: 700,
    background: '#FFEDD5',
    color: '#9A330A',
    border: '1px solid #FED7AA',
  },
  card: {
    background: '#fff',
    border: '1px solid #E7E2D7',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  actionLink: {
    fontSize: 12,
    borderRadius: 8,
    padding: '5px 10px',
    fontWeight: 800,
    textDecoration: 'none',
  },
}

export default function AdultDailyTab() {
  const isMobile = useIsMobile()
  const topics = useMemo(flattenCurriculum, [])
  const contentByDay = useMemo(() => new Map(adultDailyContent.map(item => [item.day, item])), [])
  const [selectedDay, setSelectedDay] = useState(1)
  const [doneUntil, setDoneUntil] = useState(() => Number(localStorage.getItem('adult_daily_completed') || 0))
  const selected = topics.find(t => t.day === selectedDay) || topics[0]
  const content = contentByDay.get(selected.day)

  const markDone = () => {
    const next = Math.max(doneUntil, selected.day)
    localStorage.setItem('adult_daily_completed', String(next))
    setDoneUntil(next)
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#F9F6F1', padding: isMobile ? '16px' : '28px 32px 48px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <section style={{ ...S.card, padding: isMobile ? 18 : 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ ...S.pill, marginBottom: 10 }}>Adult Primary Care Daily</div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, lineHeight: 1.25, letterSpacing: '-0.4px' }}>성인 1차진료 학습</h1>
              <p style={{ margin: '8px 0 0', color: '#78716C', fontSize: 14, lineHeight: 1.7 }}>
                동네 의원에서 자주 보는 성인 증상, 만성질환, 비급여 상담 영역을 진료실에서 바로 쓰는 단위로 누적합니다.
              </p>
            </div>
            <div style={{
              border: '1px solid #E7E2D7',
              background: '#FAF7F1',
              color: '#78716C',
              borderRadius: 9,
              padding: '9px 12px',
              fontSize: 12.5,
              lineHeight: 1.45,
              maxWidth: 280,
            }}>출력은 각 단원 카드의 A4 HTML 열기에서 진행합니다.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))', gap: 10, marginTop: 18 }}>
            {planSummary.map(item => (
              <div key={item.label} style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#C2410C', fontWeight: 800, marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: '#1C1917', lineHeight: 1.55 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: 16 }}>
          <aside style={{ ...S.card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3EFE7', background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1917' }}>{adultCurriculum.length}주 커리큘럼</div>
              <div style={{ fontSize: 12, color: '#78716C', marginTop: 3 }}>총 {topics.length}개 주제</div>
            </div>
            <div style={{ maxHeight: isMobile ? 'none' : 'calc(100vh - 260px)', overflowY: 'auto', padding: 10 }}>
              {adultCurriculum.map(week => (
                <div key={week.week} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#9A330A', padding: '6px 8px' }}>
                    Week {week.week}. {week.theme}
                  </div>
                  {week.topics.map(topic => {
                    const row = topics.find(t => t.topic === topic)
                    const active = row.day === selected.day
                    const hasContent = contentByDay.has(row.day)
                    const done = row.day <= doneUntil
                    return (
                      <button key={topic} onClick={() => setSelectedDay(row.day)} style={{
                        width: '100%',
                        border: 'none',
                        borderRadius: 8,
                        background: active ? '#FEF7F0' : done ? '#F0FDF4' : 'transparent',
                        color: active ? '#C2410C' : '#44403C',
                        padding: '8px 9px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        marginBottom: 2,
                        fontFamily: 'inherit',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: done ? '#65A30D' : active ? '#C2410C' : '#A8A29E', minWidth: 28 }}>
                          D{String(row.day).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                          {topic}
                          {hasContent && <span style={{ marginLeft: 6, fontSize: 10, color: '#65A30D', fontWeight: 900 }}>자료</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </aside>

          <main style={{ ...S.card, padding: isMobile ? 18 : 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={S.pill}>Day {selected.day}</span>
                  <span style={{ ...S.pill, background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}>{selected.theme}</span>
                  <span style={{ ...S.pill, background: content ? '#F0FDF4' : '#F3F4F6', borderColor: content ? '#BBF7D0' : '#E5E7EB', color: content ? '#166534' : '#6B7280' }}>
                    {content ? '자료 업로드됨' : '업로드 대기'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: isMobile ? 21 : 25, lineHeight: 1.3, letterSpacing: '-0.3px' }}>{selected.topic}</h2>
                {content?.date && <div style={{ fontSize: 12, color: '#78716C', marginTop: 6 }}>작성일 {content.date}</div>}
              </div>
              <button onClick={markDone} style={{
                border: 'none',
                background: selected.day <= doneUntil ? '#65A30D' : '#C2410C',
                color: '#fff',
                borderRadius: 9,
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}>{selected.day <= doneUntil ? '학습 완료됨' : '학습 완료 체크'}</button>
            </div>

            {content ? (
              <>
                <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1C1917' }}>오늘의 진료 카드</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {content.printPath && (
                        <a href={content.printPath} target="_blank" rel="noopener noreferrer" style={{ ...S.actionLink, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>A4 HTML 열기</a>
                      )}
                      {content.pdfPath && (
                        <a href={content.pdfPath} target="_blank" rel="noopener noreferrer" style={{ ...S.actionLink, color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>PDF 다운로드</a>
                      )}
                      {content.masterPath && (
                        <a href={content.masterPath} target="_blank" rel="noopener noreferrer" style={{ ...S.actionLink, color: '#7C2D12', background: '#FFF7ED', border: '1px solid #FED7AA' }}>master 원본</a>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#44403C', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: content.appHtml }} />
                </div>
                {content.revisions?.length > 0 && (
                  <div style={{ border: '1px solid #E7E2D7', background: '#fff', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1C1917', marginBottom: 8 }}>업데이트 이력</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#44403C', fontSize: 13, lineHeight: 1.7 }}>
                      {content.revisions.map((r, idx) => <li key={idx}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1917', marginBottom: 8 }}>작성 원칙</div>
                <div style={{ fontSize: 13.5, color: '#44403C', lineHeight: 1.8 }}>
                  매일 자료는 "내가 의원에서 볼 환자인가, 당일 의뢰할 환자인가"를 먼저 나누고,
                  그 다음 검사, 상병코드, 처방 regimen, 추적 계획으로 내려갑니다.
                  이 주제는 아직 자료 생성 전입니다.
                </div>
              </div>
            )}

            {!content && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {adultDailyTemplate.map((item, idx) => (
                  <div key={item} style={{ border: '1px solid #E7E2D7', borderRadius: 10, padding: '12px 14px', background: '#fff' }}>
                    <div style={{ fontSize: 11, color: '#C2410C', fontWeight: 900, marginBottom: 5 }}>{String(idx + 1).padStart(2, '0')}</div>
                    <div style={{ fontSize: 13.5, color: '#1C1917', lineHeight: 1.55 }}>{item}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 18, border: '1px solid #FED7AA', background: '#FFFBEB', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#92400E', marginBottom: 6 }}>다음 구현 단계</div>
              <div style={{ fontSize: 13, color: '#633806', lineHeight: 1.8 }}>
                현재는 커리큘럼 차례표입니다. 다음 단계에서 매일 생성한 master/A4/app 카드 파일을 연결하면,
                오늘의 자료와 누적 아카이브가 자동으로 채워지도록 만들 수 있습니다.
              </div>
            </div>
          </main>
        </div>
      </div>

      <style>{`
        @media print {
          aside, button { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  )
}
