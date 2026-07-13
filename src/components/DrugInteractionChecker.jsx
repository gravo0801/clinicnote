import { useEffect, useState } from 'react'

const SEVERITY_CONFIG = {
  critical: { label: '절대 금기', color: '#fff', bg: '#dc2626', border: '#dc2626' },
  major:    { label: '주요 주의', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
  moderate: { label: '중등도 주의', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  minor:    { label: '경미', color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  none:     { label: '이상 없음', color: '#065f46', bg: '#f0faf5', border: '#6ee7b7' },
}

const RISK_CONFIG = {
  safe:    { label: '주요 신호 없음', color: '#065f46', bg: '#f0faf5', icon: '✅' },
  caution: { label: '주의', color: '#92400e', bg: '#fffbeb', icon: '⚠️' },
  warning: { label: '경고', color: '#991b1b', bg: '#fee2e2', icon: '🚨' },
  danger:  { label: '위험 - 즉시 확인 필요', color: '#7f1d1d', bg: '#fee2e2', icon: '⛔' },
}

export default function DrugInteractionChecker({ drugs }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  const validDrugs = drugs.filter(d => d.name && d.name.trim())
  const drugSignature = validDrugs.map(d => [d.name, d.dosage, d.freq, d.route, d.usage].join('|')).join('||')

  useEffect(() => {
    setResult(null)
    setError(null)
    setOpen(false)
  }, [drugSignature])

  const check = async () => {
    if (validDrugs.length < 2) return
    setLoading(true); setError(null); setOpen(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'drug_interaction',
          caseData: { drugs: validDrugs.map(d => [
            d.name.replace(/^\[INJ-\w+\] /, ''),
            d.dosage,
            d.freq && `${d.freq}회/일`,
            d.route || d.usage,
          ].filter(Boolean).join(' · ')) }
        })
      })
      if (!res.ok) throw new Error('서버 오류 ' + res.status)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  if (validDrugs.length < 2) return null
  const riskCfg = result ? (RISK_CONFIG[result.overallRisk] || RISK_CONFIG.caution) : null

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" onClick={check} disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #fde68a', background: loading ? '#f9fafb' : '#fffbeb', color: loading ? '#9ca3af' : '#92400e', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '분석 중...' : '🤖 AI 상호작용 참고 점검 (' + validDrugs.length + '종)'}
      </button>
      <div style={{ marginTop:6, fontSize:10, color:'#9ca3af', lineHeight:1.5 }}>
        참고용 AI 결과이며 공식 DUR을 대체하지 않습니다. 환자 상태와 최신 허가사항을 함께 확인하세요.
      </div>
      {open && (
        <div aria-live="polite" style={{ marginTop: 10, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>약물 상호작용 분석 결과</span>
            <button type="button" aria-label="상호작용 분석 결과 닫기" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ padding: '12px 14px' }}>
            {loading && <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>AI 분석 중... (10-20초 소요)</div>}
            {error && <div style={{ background: '#fee2e2', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#991b1b' }}>오류: {error}</div>}
            {result && !loading && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: riskCfg.bg, borderRadius: 9, marginBottom: 12, border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: riskCfg.color }}>{riskCfg.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: riskCfg.color }}>전체 위험도: {riskCfg.label}</div>
                    {result.summary && <div style={{ fontSize: 12, color: riskCfg.color, marginTop: 2, opacity: 0.85 }}>{result.summary}</div>}
                  </div>
                </div>
                {result.interactions && result.interactions.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 7 }}>상호작용 {result.interactions.length}건</div>
                    {result.interactions.map((inter, i) => {
                      const sev = SEVERITY_CONFIG[inter.severity] || SEVERITY_CONFIG.moderate
                      return (
                        <div key={i} style={{ background: sev.bg, borderRadius: 9, padding: '10px 12px', marginBottom: 7, border: '1px solid ' + sev.border }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, background: sev.bg, color: sev.color, border: '1px solid ' + sev.border, borderRadius: 5, padding: '1px 8px', fontWeight: 700, flexShrink: 0 }}>{sev.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{(inter.drugs || []).join(' + ')}</span>
                          </div>
                          {inter.mechanism && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>기전: {inter.mechanism}</div>}
                          {inter.effect && <div style={{ fontSize: 12, color: '#374151', marginBottom: 5, lineHeight: 1.6 }}>{inter.effect}</div>}
                          {inter.action && <div style={{ fontSize: 12, color: '#1d4ed8', background: '#eff6ff', borderRadius: 6, padding: '5px 9px', fontWeight: 600 }}>조치: {inter.action}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
                {result.tips && result.tips.length > 0 && (
                  <div style={{ background: '#f5f3ff', borderRadius: 9, padding: '10px 12px', border: '1px solid #ddd6fe' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>임상 팁</div>
                    {result.tips.map((tip, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#4c1d95', lineHeight: 1.7, paddingLeft: 10, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0 }}>-</span>{tip}
                      </div>
                    ))}
                  </div>
                )}
                {result.interactions && result.interactions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: '#0F6E56', fontSize: 13, fontWeight: 600 }}>주요 상호작용 없음</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
