import { useState, useEffect, useMemo, useRef } from 'react'
import { searchKCD } from '../data/kcdCodes'
import { S } from '../data/caseStudyStyles'

function DiseaseAutoInput({ value, onChange }) {
  const [text, setText] = useState(value?.code || '')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const results = useMemo(() => text.length >= 1 ? searchKCD(text) : [], [text])

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (value?.code && value.code !== text) setText(value.code)
  }, [value?.code, text])

  const handleChange = e => {
    setText(e.target.value); onChange(null)
    setOpen(e.target.value.length >= 1)
  }
  const select = item => { setText(item.code); onChange(item); setOpen(false) }

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <input value={text} onChange={handleChange}
        onFocus={() => { if (text.length >= 1) setOpen(true) }}
        placeholder="코드/질환명..." aria-label="상병 코드 또는 질환명" style={S.cell} />
      {open && results.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, minWidth:300, width:'max-content', maxWidth:380,
          zIndex:9999, background:'#fff', border:'1px solid #FED7AA', borderRadius:7,
          boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:240, overflowY:'auto',
        }}>
          {results.map(item => (
            <button type="button" key={item.code} onClick={() => select(item)}
              style={{ width:'100%', padding:'9px 12px', fontSize:12, cursor:'pointer', display:'flex', gap:10, alignItems:'center', border:'none', borderBottom:'1px solid #f0f0f0', background:'#fff', textAlign:'left', whiteSpace:'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background='#FEF7F0'}
              onMouseLeave={e => e.currentTarget.style.background='#fff'}>
              <span style={{ fontWeight:700, color:'#C2410C', minWidth:48, flexShrink:0 }}>{item.code}</span>
              <span style={{ color:'#1C1917', flex:1 }}>{item.name}</span>
              <span style={{ fontSize:10, color:'#9ca3af', flexShrink:0 }}>{item.cat}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 상병 테이블 --------------------------------------------

function DiseaseTable({ diseases, onChange }) {
  const add = () => onChange([...diseases, { type:'주상병', kcd:null }])
  const remove = (i) => onChange(diseases.filter((_,idx) => idx !== i))
  const upd = (i,f,v) => onChange(diseases.map((d,idx) => idx===i ? {...d,[f]:v} : d))
  return (
    <div style={{ border:'1px solid #d1d5db', borderRadius:8, overflow:'visible', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'#e8f4f0', borderBottom:'1px solid #d1d5db' }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#C2410C' }}>상병 (질병)</span>
        <button type="button" onClick={add} style={{ background:'#C2410C', color:'#fff', border:'none', borderRadius:5, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ 추가</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead><tr>
          <th style={S.TH(28)}></th><th style={S.TH(36)}>순번</th><th style={S.TH(60)}>코드</th>
          <th style={{ ...S.TH(), textAlign:'left' }}>상병명</th><th style={S.TH(80)}>구분</th>
        </tr></thead>
        <tbody>
          {diseases.length === 0
            ? <tr><td colSpan={5} style={{ padding:'13px', textAlign:'center', color:'#9ca3af', fontSize:12, borderBottom:'1px solid #eee' }}>+ 추가 버튼으로 상병을 입력하세요</td></tr>
            : diseases.map((d,i) => (
              <tr key={i} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                <td style={{ ...S.TD, textAlign:'center' }}>
                  <button type="button" aria-label={`${i+1}번 상병 삭제`} onClick={() => remove(i)} style={{ background:'none', border:'none', color:'#d1d5db', cursor:'pointer', fontSize:15, padding:'2px 6px', fontWeight:700, lineHeight:1 }}
                    onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#d1d5db'}>×</button>
                </td>
                <td style={{ ...S.TD, textAlign:'center', padding:'4px 0' }}><span style={{ fontSize:12, color:'#6b7280' }}>{i+1}</span></td>
                <td style={{ ...S.TD, textAlign:'center', padding:'4px 0' }}><span style={{ fontSize:12, fontWeight:700, color:d.kcd?'#C2410C':'#9ca3af' }}>{d.kcd?.code||'—'}</span></td>
                <td style={{ ...S.TD, minWidth:200 }}>
                  <DiseaseAutoInput value={d.kcd} onChange={v => upd(i,'kcd',v)} />
                  {d.kcd?.name && <div style={{ padding:'0 8px 5px', fontSize:11, color:'#6b7280' }}>{d.kcd.name}</div>}
                </td>
                <td style={{ ...S.TD, textAlign:'center' }}>
                  <select value={d.type||'주상병'} onChange={e => upd(i,'type',e.target.value)}
                    style={{ border:'none', background:'transparent', fontSize:12, cursor:'pointer', padding:'6px 4px', outline:'none', fontFamily:'inherit', color:d.type==='주상병'?'#C2410C':'#374151', fontWeight:d.type==='주상병'?700:400 }}>
                    <option value="주상병">주상병</option><option value="부상병">부상병</option>
                  </select>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

export default DiseaseTable
