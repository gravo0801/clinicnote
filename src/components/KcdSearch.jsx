import { useState, useRef, useEffect, useMemo } from 'react'
import { searchKCD } from '../data/kcdCodes'

export default function KcdSearch({ value, onChange, placeholder = '상병코드 또는 질환명 검색...' }) {
  const [query, setQuery] = useState(value?.name ? `${value.code} ${value.name}` : '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dropPos, setDropPos] = useState(null)
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const calcPos = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 300) })
    }
  }

  const handleInput = (e) => {
    const v = e.target.value
    setQuery(v)
    if (v.length >= 1) {
      setResults(searchKCD(v))
      calcPos()
      setOpen(true)
    } else {
      setResults([])
      setOpen(false)
    }
    onChange(null)
  }

  const select = (item) => {
    setQuery(`${item.code}  ${item.name}`)
    onChange(item)
    setOpen(false)
  }

  const clear = () => {
    setQuery('')
    onChange(null)
    setOpen(false)
  }

  const CAT_COLORS = {
    '호흡기': '#dbeafe', '순환기': '#fee2e2', '내분비': '#fef9c3',
    '소화기': '#D0F7EC', '근골격': '#f3e8ff', '비뇨기': '#ffedd5',
    '피부': '#fce7f3',   '신경': '#e0f2fe',   '정신': '#f0fdf4',
    '이비인후': '#fef3c7','안과': '#ede9fe',   '증상': '#f1f5f9',
  }
  const CAT_TEXT = {
    '호흡기': '#1e40af', '순환기': '#991b1b', '내분비': '#854d0e',
    '소화기': '#166534', '근골격': '#6b21a8', '비뇨기': '#9a3412',
    '피부': '#9d174d',   '신경': '#0c4a6e',   '정신': '#166534',
    '이비인후': '#92400e','안과': '#4c1d95',   '증상': '#475569',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          onFocus={() => { setFocused(true); if (query.length >= 1 && results.length > 0) { calcPos(); setOpen(true) } }}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 36px 10px 12px', borderRadius: 8,
            border: focused ? '1.5px solid #00C07F' : '1px solid #e5e7eb',
            fontSize: 14, outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit', background: '#fff',
          }}
          onBlur={() => setFocused(false)}
        />
        {query && (
          <button onClick={clear} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1,
          }}>✕</button>
        )}
      </div>

      {/* 선택된 상병코드 표시 */}
      {value && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, background: '#00C07F', color: '#fff',
            borderRadius: 6, padding: '2px 8px',
          }}>{value.code}</span>
          <span style={{ fontSize: 12, color: '#374151' }}>{value.name}</span>
          <span style={{
            fontSize: 11, borderRadius: 20, padding: '1px 7px',
            background: CAT_COLORS[value.cat] || '#f3f4f6',
            color: CAT_TEXT[value.cat] || '#374151',
          }}>{value.cat}</span>
        </div>
      )}

      {/* 드롭다운 — fixed position으로 overflow:hidden 탈출 */}
      {open && results.length > 0 && dropPos && (
        <div style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width,
          zIndex: 9999, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.13)', maxHeight: 260, overflowY: 'auto',
        }}>
          {results.map(item => (
            <div key={item.code} onMouseDown={e => { e.preventDefault(); select(item) }}
              style={{
                padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid #f9fafb',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#EDFFF8'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{
                fontSize: 12, fontWeight: 700, background: '#EDFFF8', color: '#00C07F',
                borderRadius: 5, padding: '2px 7px', flexShrink: 0, minWidth: 48, textAlign: 'center',
              }}>{item.code}</span>
              <span style={{ fontSize: 13, color: '#0D1117', flex: 1 }}>{item.name}</span>
              <span style={{
                fontSize: 11, borderRadius: 10, padding: '1px 6px', flexShrink: 0,
                background: CAT_COLORS[item.cat] || '#f3f4f6',
                color: CAT_TEXT[item.cat] || '#374151',
              }}>{item.cat}</span>
            </div>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.length >= 1 && dropPos && (
        <div style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width,
          zIndex: 9999, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          padding: '12px 14px', fontSize: 13, color: '#9ca3af',
        }}>검색 결과 없음</div>
      )}
    </div>
  )
}
