// ─── 공통 UI 컴포넌트 ──────────────────────────────────────

export function Sheet({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white overflow-y-auto"
        style={{ borderRadius: '18px 18px 0 0', padding: '20px 20px 36px', maxWidth: 600, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <span style={{ fontSize: 16, fontWeight: 500 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, value, onChange, placeholder, type = 'text', multiline, children }) {
  const cls = "w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-white transition-colors"
  const style = { border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit' }
  return (
    <div className="mb-3">
      <label className="block mb-1" style={{ fontSize: 12, color: '#6b7280' }}>{label}</label>
      {children || (multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={cls} style={{ ...style, resize: 'vertical', minHeight: 76 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={cls} style={style} />
      )}
    </div>
  )
}

export function SegmentButtons({ options, value, onChange }) {
  // options: [{ val, label }]
  return (
    <div className="flex gap-2">
      {options.map(({ val, label }) => (
        <button key={val} onClick={() => onChange(val)}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            border: value === val ? 'none' : '1px solid #e5e7eb',
            background: value === val ? '#0F6E56' : '#fff',
            color: value === val ? '#fff' : '#6b7280',
            cursor: 'pointer',
          }}>{label}</button>
      ))}
    </div>
  )
}

export function PrimaryButton({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-3 rounded-lg text-sm font-medium mt-1 transition-opacity"
      style={{ background: '#0F6E56', color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  )
}

export function DangerButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      className="w-full py-3 rounded-lg text-sm mt-2"
      style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200"
        style={{ borderTopColor: '#0F6E56', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
