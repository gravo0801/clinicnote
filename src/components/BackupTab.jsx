import { useState } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, orderBy, writeBatch, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

// 백업 대상 컬렉션 목록
const COLLECTIONS = [
  { key: 'prescriptions',      label: '처방 노하우',     icon: 'Rx' },
  { key: 'presetPrescriptions',label: '약속처방',         icon: 'P'  },
  { key: 'caseStudies',        label: '케이스스터디',     icon: 'C'  },
  { key: 'diseaseNotes2',      label: '질환 노트',       icon: 'N'  },
  { key: 'myDrugs',            label: '나의 약물',       icon: 'D'  },
]

function fmt(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1024 / 1024).toFixed(2) + 'MB'
}

function nowStr() {
  const d = new Date()
  return d.getFullYear() + '-'
    + String(d.getMonth()+1).padStart(2,'0') + '-'
    + String(d.getDate()).padStart(2,'0') + '_'
    + String(d.getHours()).padStart(2,'0')
    + String(d.getMinutes()).padStart(2,'0')
}

// Firestore timestamp -> ISO string for JSON
function serializeDoc(data) {
  const out = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && typeof v.toDate === 'function') {
      out[k] = { _type: 'timestamp', value: v.toDate().toISOString() }
    } else if (Array.isArray(v)) {
      out[k] = v
    } else {
      out[k] = v
    }
  }
  return out
}

export default function BackupTab() {
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreLog, setRestoreLog] = useState([])
  const [restoreMode, setRestoreMode] = useState('merge') // merge | overwrite
  const [lastBackup, setLastBackup] = useState(null)
  const [counts, setCounts] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)

  const loadCounts = async () => {
    setLoading(true)
    const c = {}
    for (const col of COLLECTIONS) {
      try {
        const snap = await getDocs(collection(db, col.key))
        c[col.key] = snap.size
      } catch { c[col.key] = 0 }
    }
    // family members + subcollections
    try {
      const fSnap = await getDocs(collection(db, 'familyMembers'))
      let sub = 0
      for (const fdoc of fSnap.docs) {
        for (const subCol of ['records', 'checkups', 'injections']) {
          const ss = await getDocs(collection(db, 'familyMembers', fdoc.id, subCol))
          sub += ss.size
        }
      }
      c['familyMembers'] = fSnap.size + '명 (' + sub + '개 기록)'
    } catch { c['familyMembers'] = '?' }
    setCounts(c)
    setLoading(false)
  }

  const runBackup = async () => {
    setLoading(true)
    setStatus({ _start: true })
    const backup = { _meta: { version: '1.0', date: new Date().toISOString(), app: 'ClinicNote' }, collections: {} }

    // Regular collections
    for (const col of COLLECTIONS) {
      setStatus(p => ({ ...p, [col.key]: 'loading' }))
      try {
        const snap = await getDocs(collection(db, col.key))
        backup.collections[col.key] = snap.docs.map(d => ({ _id: d.id, ...serializeDoc(d.data()) }))
        setStatus(p => ({ ...p, [col.key]: 'done' }))
      } catch(e) {
        setStatus(p => ({ ...p, [col.key]: 'error' }))
      }
    }

    // Family members + subcollections
    setStatus(p => ({ ...p, familyMembers: 'loading' }))
    try {
      const fSnap = await getDocs(collection(db, 'familyMembers'))
      backup.collections['familyMembers'] = []
      for (const fdoc of fSnap.docs) {
        const member = { _id: fdoc.id, ...serializeDoc(fdoc.data()), _subCollections: {} }
        for (const subCol of ['records', 'checkups', 'injections']) {
          const ss = await getDocs(collection(db, 'familyMembers', fdoc.id, subCol))
          member._subCollections[subCol] = ss.docs.map(d => ({ _id: d.id, ...serializeDoc(d.data()) }))
        }
        backup.collections['familyMembers'].push(member)
      }
      setStatus(p => ({ ...p, familyMembers: 'done' }))
    } catch(e) {
      setStatus(p => ({ ...p, familyMembers: 'error' }))
    }

    // Download JSON
    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ClinicNote_backup_' + nowStr() + '.json'
    a.click()
    URL.revokeObjectURL(url)

    const size = fmt(new Blob([json]).size)
    setLastBackup({ date: new Date().toLocaleString('ko-KR'), size })
    setLoading(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setPendingFile(file)
    setShowConfirm(true)
  }

  const runRestore = async () => {
    if (!pendingFile) return
    setShowConfirm(false)
    setRestoring(true)
    setRestoreLog([])
    const log = (msg, type = 'info') => setRestoreLog(p => [...p, { msg, type }])

    try {
      const text = await pendingFile.text()
      const backup = JSON.parse(text)

      if (!backup._meta || !backup.collections) {
        log('유효하지 않은 백업 파일입니다.', 'error')
        setRestoring(false)
        return
      }

      log('백업 파일 확인: ' + backup._meta.date)
      log('복원 모드: ' + (restoreMode === 'merge' ? '병합 (기존 데이터 유지)' : '덮어쓰기 (기존 데이터 삭제)'))

      // Regular collections
      for (const col of COLLECTIONS) {
        const docs = backup.collections[col.key]
        if (!docs) { log(col.label + ': 데이터 없음 (건너뜀)', 'warn'); continue }

        if (restoreMode === 'overwrite') {
          // Delete existing
          const existing = await getDocs(collection(db, col.key))
          const batch = writeBatch(db)
          existing.docs.forEach(d => batch.delete(d.ref))
          await batch.commit()
          log(col.label + ': 기존 ' + existing.size + '개 삭제')
        }

        let added = 0
        for (const item of docs) {
          const { _id, ...data } = item
          // Convert timestamp strings back
          const restored = {}
          for (const [k, v] of Object.entries(data)) {
            if (v && v._type === 'timestamp') {
              restored[k] = new Date(v.value)
            } else {
              restored[k] = v
            }
          }
          restored.restoredAt = serverTimestamp()
          await addDoc(collection(db, col.key), restored)
          added++
        }
        log(col.label + ': ' + added + '개 복원', 'success')
      }

      // Family members
      const fMembers = backup.collections['familyMembers']
      if (fMembers) {
        if (restoreMode === 'overwrite') {
          const existing = await getDocs(collection(db, 'familyMembers'))
          for (const fdoc of existing.docs) {
            for (const subCol of ['records', 'checkups', 'injections']) {
              const ss = await getDocs(collection(db, 'familyMembers', fdoc.id, subCol))
              const batch = writeBatch(db)
              ss.docs.forEach(d => batch.delete(d.ref))
              await batch.commit()
            }
            await deleteDoc(fdoc.ref)
          }
          log('가족 건강: 기존 데이터 삭제')
        }

        for (const member of fMembers) {
          const { _id, _subCollections, ...mData } = member
          const restored = {}
          for (const [k, v] of Object.entries(mData)) {
            restored[k] = (v && v._type === 'timestamp') ? new Date(v.value) : v
          }
          restored.restoredAt = serverTimestamp()
          const newMember = await addDoc(collection(db, 'familyMembers'), restored)
          // Subcollections
          for (const subCol of ['records', 'checkups', 'injections']) {
            const subDocs = _subCollections?.[subCol] || []
            for (const sub of subDocs) {
              const { _id: sid, ...sData } = sub
              const sRestored = {}
              for (const [k, v] of Object.entries(sData)) {
                sRestored[k] = (v && v._type === 'timestamp') ? new Date(v.value) : v
              }
              sRestored.restoredAt = serverTimestamp()
              await addDoc(collection(db, 'familyMembers', newMember.id, subCol), sRestored)
            }
          }
          log('가족 건강 - ' + restored.name + ': 복원', 'success')
        }
      }

      log('복원 완료! 페이지를 새로고침 하세요.', 'success')
    } catch(e) {
      log('오류 발생: ' + e.message, 'error')
    } finally {
      setRestoring(false)
      setPendingFile(null)
    }
  }

  const S = {
    card: { background: '#fff', borderRadius: 14, padding: '20px 22px', marginBottom: 16, border: '1px solid #f0ede8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    btn: (color = '#0F6E56', disabled = false) => ({
      padding: '10px 22px', borderRadius: 9, border: 'none',
      background: disabled ? '#d1d5db' : color,
      color: '#fff', fontSize: 13, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),
    label: { display: 'block', fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 3 },
  }

  const statusIcon = (s) => s === 'loading' ? '...' : s === 'done' ? 'OK' : s === 'error' ? 'ERR' : ''
  const statusColor = (s) => s === 'done' ? '#0F6E56' : s === 'error' ? '#dc2626' : '#9ca3af'

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 28px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>백업 / 복원</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
          모든 임상 데이터를 JSON 파일로 내보내거나 복원합니다. 정기적으로 백업하시길 권장합니다.
        </p>
      </div>

      {/* 데이터 현황 */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>현재 데이터 현황</div>
          <button onClick={loadCounts} disabled={loading} style={{ ...S.btn('#6b7280', loading), padding: '6px 14px', fontSize: 12 }}>
            {loading ? '로딩...' : '현황 확인'}
          </button>
        </div>
        {Object.keys(counts).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {[...COLLECTIONS, { key: 'familyMembers', label: '가족 건강', icon: 'F' }].map(col => (
              <div key={col.key} style={{ background: '#f8f6f2', borderRadius: 9, padding: '10px 13px' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>{col.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0F6E56' }}>{counts[col.key] ?? '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 백업 */}
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>데이터 내보내기 (백업)</div>
        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7, marginBottom: 14 }}>
          모든 컬렉션(처방, 케이스, 노트, 가족 건강)을 JSON 파일로 다운로드합니다.
          <br />월 1회 이상 정기 백업을 권장합니다.
        </p>
        {lastBackup && (
          <div style={{ background: '#f0faf5', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#0F6E56' }}>
            최근 백업: {lastBackup.date} ({lastBackup.size})
          </div>
        )}
        {Object.keys(status).length > 0 && !loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {[...COLLECTIONS, { key: 'familyMembers', label: '가족 건강' }].map(col => (
              <span key={col.key} style={{ fontSize: 11, color: statusColor(status[col.key]), background: status[col.key] === 'done' ? '#f0faf5' : '#f3f4f6', borderRadius: 5, padding: '2px 8px' }}>
                {col.label} {statusIcon(status[col.key])}
              </span>
            ))}
          </div>
        )}
        <button onClick={runBackup} disabled={loading} style={S.btn('#0F6E56', loading)}>
          {loading ? '백업 중...' : 'JSON 백업 파일 다운로드'}
        </button>
      </div>

      {/* 복원 */}
      <div style={S.card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#dc2626' }}>데이터 가져오기 (복원)</div>
        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7, marginBottom: 14 }}>
          이전에 백업한 JSON 파일을 업로드하여 데이터를 복원합니다.
          <br />
          <strong>병합:</strong> 기존 데이터 유지 + 백업 데이터 추가<br />
          <strong>덮어쓰기:</strong> 기존 데이터 삭제 후 백업 데이터로 교체 (주의)
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>복원 방식</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['merge', '병합 (권장)'], ['overwrite', '덮어쓰기 (주의)']].map(([val, lbl]) => (
              <button key={val} onClick={() => setRestoreMode(val)}
                style={{ padding: '7px 14px', borderRadius: 8, border: restoreMode === val ? 'none' : '1px solid #e5e7eb', background: restoreMode === val ? (val === 'overwrite' ? '#dc2626' : '#0F6E56') : '#fff', color: restoreMode === val ? '#fff' : '#6b7280', fontSize: 12, cursor: 'pointer', fontWeight: restoreMode === val ? 700 : 400 }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fee2e2', color: '#991b1b', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: restoring ? 'not-allowed' : 'pointer', border: '1px dashed #fca5a5' }}>
          {restoring ? '복원 중...' : 'JSON 백업 파일 선택'}
          <input type="file" accept=".json" onChange={handleFileSelect} disabled={restoring} style={{ display: 'none' }} />
        </label>

        {restoreLog.length > 0 && (
          <div style={{ marginTop: 14, background: '#f8f6f2', borderRadius: 9, padding: '12px 14px', maxHeight: 240, overflowY: 'auto' }}>
            {restoreLog.map((entry, i) => (
              <div key={i} style={{ fontSize: 12, color: entry.type === 'success' ? '#0F6E56' : entry.type === 'error' ? '#dc2626' : entry.type === 'warn' ? '#d97706' : '#374151', marginBottom: 4, lineHeight: 1.5 }}>
                {entry.type === 'success' ? '[OK] ' : entry.type === 'error' ? '[ERR] ' : entry.type === 'warn' ? '[!] ' : '[>] '}
                {entry.msg}
              </div>
            ))}
            {!restoring && restoreLog.some(e => e.msg.includes('복원 완료')) && (
              <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '7px 16px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                페이지 새로고침
              </button>
            )}
          </div>
        )}
      </div>

      {/* 주의사항 */}
      <div style={{ background: '#fffbeb', borderRadius: 12, padding: '14px 16px', border: '1px solid #fde68a' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>백업 권장 주기</div>
        <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.8 }}>
          - 처방 데이터 주 1회 이상<br />
          - 검진 기록 추가 후 즉시<br />
          - GitHub 파일 교체 작업 전 반드시<br />
          - 백업 파일은 로컬 PC + 클라우드(구글 드라이브 등) 2곳 보관 권장
        </div>
      </div>

      {/* 덮어쓰기 확인 모달 */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: restoreMode === 'overwrite' ? '#dc2626' : '#1a1a1a' }}>
              {restoreMode === 'overwrite' ? '데이터 덮어쓰기 확인' : '데이터 병합 복원 확인'}
            </div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
              {restoreMode === 'overwrite'
                ? '기존 데이터가 모두 삭제되고 백업 파일로 교체됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?'
                : '백업 파일의 데이터가 기존 데이터에 추가됩니다. 계속하시겠습니까?'}
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>파일: {pendingFile?.name}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowConfirm(false); setPendingFile(null) }}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={runRestore}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: restoreMode === 'overwrite' ? '#dc2626' : '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                복원 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
