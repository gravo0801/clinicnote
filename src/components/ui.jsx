// ── 공통 UI 컴포넌트 (리디자인) ─────────────────────────────
import { useState, useEffect } from 'react'

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : true
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// 모바일: 바텀시트 / 데스크탑: 센터 모달
export function Sheet({ title, onClose, children }) {
  const isMobile = useIsMobile()

  const closeBtn = (
    <button onClick={onClose} style={{
      width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
      background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1,
    }}>×</button>
  )

  if (!isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div className="bg-white overflow-y-auto"
          style={{
            borderRadius: 18, padding: '28px 32px', width: '100%',
            maxWidth: 500, maxHeight: '88vh',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            border: '1px solid var(--border)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>{title}</span>
            {closeBtn}
          </div>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(13,17,23,0.5)' }}
      onClick={onClose}
    >
      <div className="w-full bg-white overflow-y-auto"
        style={{ borderRadius: '18px 18px 0 0', padding: '20px 20px 40px', maxWidth: 600, maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{title}</span>
          {closeBtn}
        </div>
        {children}
      </div>
    </div>
  )
}

const inputBase = {
  width: '100%', padding: '10px 13px', borderRadius: 9,
  border: '1.5px solid var(--border-strong)', fontSize: 13.5,
  fontFamily: 'inherit', outline: 'none', background: 'var(--bg)',
  color: 'var(--text-1)', transition: 'border-color 0.15s',
}

export function Field({ label, value, onChange, placeholder, type = 'text', multiline, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{label}</label>
      {children || (multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...inputBase, resize: 'vertical', minHeight: 80, lineHeight: 1.7 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={inputBase} />
      )}
    </div>
  )
}

export function SegmentButtons({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(({ val, label }) => (
        <button key={val} onClick={() => onChange(val)} style={{
          flex: 1, padding: '9px', borderRadius: 9, fontFamily: 'inherit',
          border: value === val ? 'none' : '1.5px solid var(--border-strong)',
          background: value === val ? 'var(--accent)' : 'var(--surface)',
          color: value === val ? '#fff' : 'var(--text-3)',
          fontSize: 13, fontWeight: value === val ? 700 : 500, cursor: 'pointer',
          transition: 'all 0.15s',
        }}>{label}</button>
      ))}
    </div>
  )
}

export function PrimaryButton({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '12px', borderRadius: 10,
      background: disabled ? '#D1D5DB' : 'var(--accent)',
      color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
      boxShadow: disabled ? 'none' : '0 4px 14px rgba(0,192,127,0.3)',
      transition: 'all 0.15s', letterSpacing: '-0.2px',
    }}>
      {children}
    </button>
  )
}

export function DangerButton({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '12px', borderRadius: 10, marginTop: 8,
      background: 'none', border: '1.5px solid #FECACA',
      color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 13.5, fontWeight: 600, transition: 'background 0.15s',
    }}>
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        border: '2.5px solid var(--border-strong)',
        borderTopColor: 'var(--accent)',
        animation: 'cn-spin 0.75s linear infinite',
      }} />
      <style>{`@keyframes cn-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
