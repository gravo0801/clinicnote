// CaseStudyTab 계열 공통 스타일
export const S = {
  input: { width:'100%', padding:'8px 10px', borderRadius:7, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', color:'#1C1917' },
  ta: (h=80) => ({ width:'100%', padding:'9px 11px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit', background:'#fff', resize:'vertical', minHeight:h, lineHeight:1.7, color:'#1C1917' }),
  label: { display:'block', fontSize:11, color:'#6b7280', marginBottom:4, fontWeight:600 },
  cell: { border:'none', background:'transparent', fontSize:12, outline:'none', width:'100%', padding:'6px 8px', fontFamily:'inherit', color:'#1C1917', boxSizing:'border-box' },
  TH: (w) => ({ padding:'7px 8px', fontSize:11, fontWeight:700, color:'#374151', background:'#f3f4f6', borderRight:'1px solid #e5e7eb', borderBottom:'2px solid #d1d5db', whiteSpace:'nowrap', width:w, textAlign:'center' }),
  TD: { borderRight:'1px solid #eee', borderBottom:'1px solid #eee', padding:0, verticalAlign:'middle' },
}
