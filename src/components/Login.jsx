import { useState } from 'react'

const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'clinic1234'

export default function Login({ onLogin }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)

  const attempt = () => {
    setLoading(true)
    setTimeout(() => {
      if (pw === PASSWORD) {
        sessionStorage.setItem('cn_auth', '1')
        onLogin()
      } else {
        setErr(true)
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: '#f5f3ef' }}>
      <div className="w-full bg-white rounded-2xl p-8" style={{ maxWidth: 340, border: '1px solid #ece9e3' }}>
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
            style={{ background: '#0F6E56' }}>🩺</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>ClinicNote</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>가족 건강 · 처방 노하우</p>
        </div>

        {/* Input */}
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-2"
          style={{
            border: err ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
            fontSize: 14, fontFamily: 'inherit',
          }}
        />
        {err && <p className="text-xs mb-2" style={{ color: '#ef4444' }}>비밀번호가 올바르지 않습니다</p>}

        <button
          onClick={attempt}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ background: '#0F6E56', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '확인 중...' : '로그인'}
        </button>
      </div>
    </div>
  )
}
