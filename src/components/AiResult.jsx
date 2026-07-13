function AiResult({ data, type }) {
  if (!data) return null
  const Notice = ({ children }) => (
    <div style={{ marginTop:8, fontSize:10, color:'#9ca3af', lineHeight:1.55 }}>
      {children || 'AI 생성 참고 자료입니다. 실제 진료·처방에는 최신 공식 자료와 의료진의 최종 판단을 적용하세요.'}
    </div>
  )
  if (type === 'review') {
    const OC = { '적절':'#C2410C','주의필요':'#d97706','검토필요':'#dc2626' }
    const ST = { ok:{bg:'#EAF3DE',color:'#27500A',icon:'✅'}, warning:{bg:'#FAEEDA',color:'#633806',icon:'⚠️'}, error:{bg:'#FCEBEB',color:'#791F1F',icon:'❌'} }
    return (
      <div style={{ marginTop:10 }}>
        {/* 종합 결과 */}
        <div style={{ background:OC[data.overall]||'#C2410C', borderRadius:9, padding:'10px 14px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{data.overall}</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.9)', maxWidth:'65%', textAlign:'right' }}>{data.summary}</span>
        </div>

        {/* 항목별 검토 */}
        {data.items?.map((item,i) => { const s=ST[item.status]||ST.ok; return (
          <div key={i} style={{ background:s.bg, borderRadius:7, padding:'8px 12px', marginBottom:5 }}>
            <div style={{ fontSize:11, fontWeight:700, color:s.color, marginBottom:3 }}>{s.icon} {item.category}</div>
            <div style={{ fontSize:12, color:'#1C1917', lineHeight:1.5 }}>{item.comment}</div>
          </div>
        )})}

        {/* 제안사항 */}
        {data.suggestions?.length > 0 && (
          <div style={{ background:'#FEF7F0', borderRadius:7, padding:'9px 12px', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#C2410C', marginBottom:5 }}>💡 개선 제안</div>
            {data.suggestions.map((s,i) => <div key={i} style={{ fontSize:12, color:'#1C1917', paddingLeft:10, position:'relative', marginBottom:2 }}><span style={{ position:'absolute', left:0, color:'#C2410C' }}>·</span>{s}</div>)}
          </div>
        )}

        {/* 모범 처방 레지멘 */}
        {data.recommendedRegimen?.length > 0 && (
          <div style={{ background:'#f5f3ff', borderRadius:10, padding:'12px 14px', border:'1px solid #ddd6fe', marginTop:6 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#6d28d9', marginBottom:4 }}>🏆 모범 처방 레지멘 (AI 권장)</div>
            {data.regimenSummary && (
              <div style={{ fontSize:12, color:'#4c1d95', lineHeight:1.6, marginBottom:10, paddingBottom:8, borderBottom:'1px solid #ede9fe' }}>
                {data.regimenSummary}
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {data.recommendedRegimen.map((r,i) => (
                <div key={i} style={{ background:'#fff', borderRadius:8, padding:'10px 12px', border:'1px solid #ede9fe', borderLeft:'3px solid #7c3aed' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1C1917' }}>{r.drugName}</span>
                    <span style={{ fontSize:11, borderRadius:5, padding:'2px 7px', background:r.covered!==false?'#EAF3DE':'#fee2e2', color:r.covered!==false?'#27500A':'#991b1b', fontWeight:600, flexShrink:0, marginLeft:6 }}>
                      {r.covered!==false?'급여':'비급여'}
                    </span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:r.reason?5:0 }}>
                    {[r.dosage, r.freq, r.duration&&r.duration, r.usage].filter(Boolean).map((v,j) => (
                      <span key={j} style={{ fontSize:11, background:'#f5f3ff', border:'1px solid #ede9fe', borderRadius:5, padding:'2px 7px', color:'#6d28d9' }}>{v}</span>
                    ))}
                  </div>
                  {r.reason && (
                    <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.5, marginTop:3 }}>📌 {r.reason}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <Notice>AI 참고 결과입니다. 실제 처방·급여 청구 전 최신 식약처 허가사항, DUR 및 심평원 고시를 확인하세요.</Notice>
      </div>
    )
  }
  if (type==='knowledge' && data.sections) return (
    <div style={{ marginTop:10 }}>
      {data.sections.map((s,i) => (
        <div key={i} style={{ background:'#FAF7F1', borderRadius:7, padding:'10px 13px', marginBottom:7 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#C2410C', marginBottom:4 }}>{s.title}</div>
          <div style={{ fontSize:13, color:'#374151', lineHeight:1.75, whiteSpace:'pre-wrap' }}>{s.content}</div>
        </div>
      ))}
      <Notice />
    </div>
  )
  if (type==='papers' && data.papers) return (
    <div style={{ marginTop:10 }}>{data.papers.map((p,i) => (
      <div key={i} style={{ background:'#eff6ff', borderRadius:9, padding:'12px 14px', marginBottom:10, border:'1px solid #bfdbfe' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4, gap:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8', lineHeight:1.4, flex:1 }}>{p.title}</div>
          {p.level && <span style={{ fontSize:10, background:'#ddd6fe', color:'#5b21b6', borderRadius:4, padding:'2px 7px', fontWeight:700, flexShrink:0 }}>{p.level}</span>}
        </div>
        <div style={{ fontSize:11, color:'#3730a3', marginBottom:8 }}>{p.journal}{p.year ? ' · ' + p.year : ''}</div>
        {p.keyPoints && (
          <div style={{ fontSize:12, color:'#1d4ed8', fontWeight:600, marginBottom:6, background:'#dbeafe', borderRadius:5, padding:'5px 9px', lineHeight:1.6 }}>
            핵심: {p.keyPoints}
          </div>
        )}
        {p.summary && (
          <div style={{ fontSize:12, color:'#374151', lineHeight:1.75, marginBottom: p.recommendation ? 8 : 0, borderLeft:'3px solid #93c5fd', paddingLeft:9 }}>
            {p.summary}
          </div>
        )}
        {p.recommendation && (
          <div style={{ fontSize:12, color:'#C2410C', background:'#FEF7F0', borderRadius:6, padding:'6px 10px', lineHeight:1.7, marginTop:6 }}>
            <span style={{ fontWeight:700 }}>적용: </span>{p.recommendation}
          </div>
        )}
      </div>
    ))}<Notice>AI가 생성한 문헌 요약입니다. 논문명·연도·원문 존재 여부와 최신 가이드라인을 직접 확인하세요.</Notice></div>
  )
  if (type==='revenue' && data.strategies) return (
    <div style={{ marginTop:10 }}>{data.strategies.map((s,i) => (
      <div key={i} style={{ background:'#fffbeb', borderRadius:7, padding:'10px 13px', marginBottom:7, border:'1px solid #fde68a' }}>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:10, background:'#d97706', color:'#fff', borderRadius:4, padding:'2px 7px', fontWeight:700 }}>{s.category}</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>{s.title}</span>
        </div>
        <div style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:4 }}>{s.detail}</div>
        <div style={{ fontSize:11, fontWeight:600, color:'#059669' }}>📈 {s.impact}</div>
      </div>
    ))}<Notice>AI가 생성한 경영 참고 자료입니다. 관련 법령과 실제 청구 기준을 별도로 확인하세요.</Notice></div>
  )
  return null
}


export default AiResult
