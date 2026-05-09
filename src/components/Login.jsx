import { useState } from 'react'

const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'clinic1234'

function StethIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  )
}

export default function Login({ onLogin }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)

  const attempt = () => {
    setLoading(true)
    setTimeout(() => {
      if (pw === PASSWORD) { sessionStorage.setItem('cn_auth', '1'); onLogin() }
      else { setErr(true); setLoading(false) }
    }, 400)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{
          background: 'var(--paper)', borderRadius: 14,
          padding: '40px 36px 32px',
          border: '1px solid var(--line)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 48, height: 48, margin: '0 auto 14px',
              background: 'var(--accent)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <StethIcon />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.5px' }}>ClinicNote</h1>
            <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '6px 0 0' }}>가족 건강 · 처방 노하우</p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(false) }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 9,
                border: `1px solid ${err ? 'var(--danger)' : 'var(--line-2)'}`,
                fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
                background: 'var(--cream)', color: 'var(--ink)',
              }}
            />
            {err && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6, marginLeft: 2 }}>비밀번호가 올바르지 않습니다</p>}
          </div>

          <button onClick={attempt} disabled={loading} style={{
            width: '100%', padding: '11px', borderRadius: 9, border: 'none',
            background: loading ? 'var(--line-2)' : 'var(--ink)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', letterSpacing: '-0.1px',
          }}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 18 }}>
          개인 의료 기록 관리 시스템
        </p>
      </div>
    </div>
  )
}
