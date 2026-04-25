import { useState } from 'react'

const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'clinic1234'

function StethoscopeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  )
}

export default function Login({ onLogin }) {
  const [pw, setPw]           = useState('')
  const [err, setErr]         = useState(false)
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>

      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
      }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,192,127,0.07) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,192,127,0.05) 0%, transparent 70%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
        {/* Card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 20,
          padding: '40px 36px 36px',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #00C07F 0%, #00A06A 100%)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,192,127,0.35)',
            }}>
              <StethoscopeIcon />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.5px' }}>ClinicNote</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0', fontWeight: 400 }}>가족 건강 · 처방 노하우</p>
          </div>

          {/* Input */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(false) }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 11,
                border: `1.5px solid ${err ? '#ef4444' : 'var(--border-strong)'}`,
                fontSize: 14, outline: 'none', fontFamily: 'inherit',
                background: err ? '#FFF5F5' : 'var(--bg)',
                color: 'var(--text-1)',
                transition: 'border-color 0.15s',
              }}
            />
            {err && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6, marginLeft: 2 }}>비밀번호가 올바르지 않습니다</p>}
          </div>

          <button
            onClick={attempt}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 11, border: 'none',
              background: loading ? '#D1D5DB' : 'linear-gradient(135deg, #00C07F 0%, #00A06A 100%)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.2px',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(0,192,127,0.35)',
              transition: 'all 0.15s',
            }}
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          개인 의료 기록 관리 시스템
        </p>
      </div>
    </div>
  )
}
