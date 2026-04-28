import { useState, useEffect, useRef } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import HealthCheckup from './HealthCheckup'
import { db } from '../firebase'
import { Sheet, SegmentButtons, DangerButton, Spinner, useIsMobile } from './ui'

const CLOUD_NAME = 'dfcvmvlen'
const UPLOAD_PRESET = 'clinicnote_uploads'

const getAge = y => new Date().getFullYear() - y

const STATUS = {
  ongoing:  { label: '진행중',   bg: '#FAEEDA', color: '#633806', dot: '#d97706' },
  resolved: { label: '완료',     bg: '#EAF3DE', color: '#27500A', dot: '#22c55e' },
  followup: { label: '추적필요', bg: '#FCEBEB', color: '#791F1F', dot: '#ef4444' },
}

const followUpStatus = (nextVisit, status) => {
  if (!nextVisit || status === 'resolved') return null
  const diff = (new Date(nextVisit) - new Date()) / 86400000
  if (diff < 0) return 'overdue'
  if (diff <= 14) return 'soon'
  return null
}

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const max = 900
      let { width, height } = img
      if (width > max) { height = Math.round(height * max / width); width = max }
      if (height > max) { width = Math.round(width * max / height); height = max }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve({ data: canvas.toDataURL('image/jpeg', 0.72), name: file.name, type: 'image' })
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
})

async function uploadToCloudinary(file, onProgress) {
  const ext = file.name.split('.').pop().toLowerCase()
  const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext)
  const resourceType = isImg ? 'image' : 'raw'
  if (file.size > 10 * 1024 * 1024) throw new Error(file.name + ' 파일이 10MB를 초과합니다.')
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'clinicnote_family')
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + resourceType + '/upload')
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)) }
    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        resolve({ url: res.secure_url, name: file.name, mime: file.type, size: file.size })
      } else {
        let msg = '업로드 실패 (' + xhr.status + ')'
        try { const err = JSON.parse(xhr.responseText); if (err.error?.message) msg = err.error.message } catch (_) {}
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('네트워크 오류'))
    xhr.send(fd)
  })
}

function MemberInitial({ name, size = 40 }) {
  const initial = name?.charAt(0) || '?'
  const colors = ['#0F6E56','#2563eb','#7c3aed','#db2777','#d97706','#059669']
  const bg = colors[name?.charCodeAt(0) % colors.length] || '#0F6E56'
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </div>
  )
}

//  이슈 입력 폼 (트래킹 중심) 
function IssueForm({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0,10))
  const [nextVisit, setNextVisit] = useState(initial?.nextVisit || '')
  const [status, setStatus] = useState(initial?.status || 'ongoing')
  const [note, setNote] = useState(initial?.note || '')
  const [images, setImages] = useState(initial?.images || [])
  const [cloudFiles, setCloudFiles] = useState(initial?.cloudFiles || [])
  const [saving, setSaving] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const handleImages = async (e) => {
    setImgLoading(true)
    const compressed = await Promise.all(Array.from(e.target.files).slice(0,6).map(compressImage))
    setImages(p => [...p, ...compressed].slice(0,10))
    setImgLoading(false)
    e.target.value = ''
  }

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    for (const file of files) {
      const key = file.name + Date.now()
      setUploadProgress(p => ({ ...p, [key]: 0 }))
      try {
        const result = await uploadToCloudinary(file, (pct) => setUploadProgress(p => ({ ...p, [key]: pct })))
        setCloudFiles(p => [...p, result])
      } catch (err) { alert(err.message) }
      finally { setUploadProgress(p => { const n = {...p}; delete n[key]; return n }) }
    }
  }

  const uploading = Object.entries(uploadProgress)
  const disabled = !title.trim() || saving || imgLoading || uploading.length > 0

  const iStyle = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }
  const lStyle = { display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={lStyle}>이상 내용 / 이슈 제목 *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
          placeholder="예: 혈압 상승, 공복혈당 이상, 건강검진 이상소견"
          style={iStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={lStyle}>발견/기록일</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>다음 추적 예정일</label>
          <input type="date" value={nextVisit} onChange={e => setNextVisit(e.target.value)} style={iStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={lStyle}>상태</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} onClick={() => setStatus(k)}
              style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: status === k ? 'none' : '1px solid #e5e7eb', background: status === k ? v.bg : '#fff', color: status === k ? v.color : '#6b7280', fontSize: 12, fontWeight: status === k ? 700 : 400, cursor: 'pointer' }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={lStyle}>메모 / 세부 내용</label>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="수치, 증상, 의사 소견, 생활습관 변화 등 자유롭게 기록..."
          style={{ ...iStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.7 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={lStyle}>사진 첨부</label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f0faf5', color: '#0F6E56', border: '1px dashed #6ee7b7', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {imgLoading ? '처리중...' : '사진 선택'}
          <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
        </label>
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={img.data} alt={img.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 7, border: '1px solid #e5e7eb' }} />
                <button onClick={() => setImages(p => p.filter((_,idx) => idx !== i))}
                  style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>x</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16, background: '#eff6ff', borderRadius: 9, padding: '10px 12px', border: '1px solid #bfdbfe' }}>
        <label style={{ ...lStyle, color: '#1d4ed8', fontSize: 12 }}>검진 결과지 / 파일 업로드 (PDF, 이미지 등 최대 10MB)</label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#2563eb', color: '#fff', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          파일 선택
          <input type="file" multiple accept=".pdf,.doc,.docx,image/*" onChange={handleFiles} style={{ display: 'none' }} />
        </label>
        {uploading.length > 0 && uploading.map(([key, pct]) => (
          <div key={key} style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#1d4ed8', marginBottom: 3 }}>
              <span>업로드 중...</span><span>{pct + '%'}</span>
            </div>
            <div style={{ background: '#bfdbfe', borderRadius: 4, height: 4 }}>
              <div style={{ background: '#2563eb', borderRadius: 4, height: 4, width: pct + '%', transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
        {cloudFiles.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {cloudFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', background: '#fff', borderRadius: 6, marginBottom: 4, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 700 }}>{(f.name||'').split('.').pop().toUpperCase()}</span>
                <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <button onClick={() => setCloudFiles(p => p.filter((_,idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>x</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={async () => { setSaving(true); await onSave({ title: title.trim(), date, nextVisit, status, note, images, cloudFiles }); setSaving(false) }}
        disabled={disabled}
        style={{ width: '100%', padding: '12px', background: disabled ? '#d1d5db' : '#0F6E56', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {saving ? '저장 중...' : uploading.length > 0 ? '업로드 중...' : (initial ? '수정 완료' : '기록 저장')}
      </button>
    </div>
  )
}

//  이슈 카드 (타임라인 스타일) 
function IssueCard({ r, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [imgBig, setImgBig] = useState(null)
  const sm = STATUS[r.status] || STATUS.ongoing
  const fu = followUpStatus(r.nextVisit, r.status)
  const imgCount = (r.images || []).length
  const fileCount = (r.cloudFiles || []).length
  const daysSince = Math.floor((new Date() - new Date(r.date)) / 86400000)

  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
      {/* 타임라인 바 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: sm.dot, border: '2px solid #fff', boxShadow: '0 0 0 2px ' + sm.dot + '44', marginTop: 16, flexShrink: 0 }} />
        <div style={{ width: 2, flex: 1, background: '#e5e7eb', marginTop: 4 }} />
      </div>
      {/* 카드 */}
      <div style={{ flex: 1, marginBottom: 12 }}>
        <div onClick={() => setOpen(p => !p)}
          style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', border: fu === 'overdue' ? '1px solid #fca5a5' : fu === 'soon' ? '1px solid #fcd34d' : '1px solid #f0ede8', boxShadow: open ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{r.title}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{r.date}</span>
                {daysSince > 0 && <span style={{ fontSize: 10, color: '#9ca3af' }}>({daysSince}일 전)</span>}
                {imgCount > 0 && <span style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>{'사진 ' + imgCount}</span>}
                {fileCount > 0 && <span style={{ fontSize: 10, color: '#2563eb', background: '#eff6ff', borderRadius: 4, padding: '1px 6px' }}>{'파일 ' + fileCount}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 10, background: sm.bg, color: sm.color, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{sm.label}</span>
              {r.nextVisit && (
                <span style={{ fontSize: 10, color: fu === 'overdue' ? '#dc2626' : fu === 'soon' ? '#d97706' : '#9ca3af' }}>
                  {fu === 'overdue' ? '추적 지남 ' : '추적 예정 '}{r.nextVisit}{fu === 'overdue' ? ' !' : fu === 'soon' ? ' ~' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {open && (
          <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', padding: '12px 14px', borderTop: '1px solid #f0ede8', border: '1px solid #f0ede8', borderTopWidth: 0 }}>
            {r.note && (
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: imgCount > 0 || fileCount > 0 ? 12 : 0, background: '#fafaf9', borderRadius: 7, padding: '10px 12px', border: '1px solid #f0ede8' }}>
                {r.note}
              </div>
            )}
            {imgCount > 0 && (
              <div style={{ marginBottom: fileCount > 0 ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>{'첨부 사진 (' + imgCount + ')'}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.images.map((img, i) => (
                    <img key={i} src={img.data} alt={img.name} onClick={() => setImgBig(img.data)}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 7, border: '1px solid #e5e7eb', cursor: 'zoom-in' }} />
                  ))}
                </div>
              </div>
            )}
            {fileCount > 0 && (
              <div style={{ marginTop: imgCount > 0 ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>{'첨부 파일 (' + fileCount + ')'}</div>
                {r.cloudFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: '#f8f6f2', borderRadius: 7, marginBottom: 5, border: '1px solid #f0ede8' }}>
                    <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 700 }}>{(f.name||'').split('.').pop().toUpperCase()}</span>
                    <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    {f.size && <span style={{ fontSize: 10, color: '#9ca3af' }}>{(f.size/1024/1024).toFixed(1) + 'MB'}</span>}
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 7px', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>열기</a>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f0ede8' }}>
              <button onClick={() => onEdit(r)}
                style={{ fontSize: 11, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>수정</button>
              <button onClick={() => onDelete(r.id)}
                style={{ fontSize: 11, color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>삭제</button>
            </div>
          </div>
        )}
        {imgBig && (
          <div onClick={() => setImgBig(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
            <img src={imgBig} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        )}
      </div>
    </div>
  )
}

//  상태별 요약 배지 
function StatusSummary({ recs, small }) {
  const counts = { followup: recs.filter(r => r.status === 'followup').length, ongoing: recs.filter(r => r.status === 'ongoing').length, resolved: recs.filter(r => r.status === 'resolved').length }
  const alertCount = recs.filter(r => followUpStatus(r.nextVisit, r.status) === 'overdue').length
  if (small) return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {counts.followup > 0 && <span style={{ fontSize: 10, background: '#FCEBEB', color: '#791F1F', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>{'추적 ' + counts.followup}</span>}
      {counts.ongoing > 0 && <span style={{ fontSize: 10, background: '#FAEEDA', color: '#633806', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>{'진행 ' + counts.ongoing}</span>}
      {alertCount > 0 && <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>{'지남 ' + alertCount}</span>}
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Object.entries(STATUS).map(([k, v]) => (
        <div key={k} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{counts[k]}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{v.label}</div>
        </div>
      ))}
      {alertCount > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{alertCount}</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>기간 초과</div>
        </div>
      )}
    </div>
  )
}


// ---- 주사 스케줄러 탭 ----
const PRESET_INTERVALS = [
  { label: '6개월 (프롤리아 등)', days: 182 },
  { label: '3개월 (졸레드론산, 데포 등)', days: 91 },
  { label: '1개월 (루크린 등)', days: 30 },
  { label: '2주 (격주 주사)', days: 14 },
  { label: '1주 (주 1회)', days: 7 },
  { label: '1년 (연 1회)', days: 365 },
  { label: '직접입력', days: 0 },
]

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0,10)
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

function googleCalendarUrl(title, date, note) {
  const dt = date.replace(/-/g, '')
  const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(title)
    + '&dates=' + dt + '/' + dt
    + '&details=' + encodeURIComponent(note || '')
    + '&sf=true'
  return url
}

function InjectionScheduler({ memberId, memberName }) {
  const [shots, setShots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState({ drug: '', date: new Date().toISOString().slice(0,10), intervalPreset: 182, intervalDays: 182, note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!memberId) return
    const q = query(collection(db, 'familyMembers', memberId, 'injections'), orderBy('nextDate', 'asc'))
    return onSnapshot(q, snap => { setShots(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
  }, [memberId])

  const openForm = (shot) => {
    if (shot) {
      setEditTarget(shot)
      setForm({ drug: shot.drug, date: shot.lastDate, intervalPreset: shot.intervalDays, intervalDays: shot.intervalDays, note: shot.note || '' })
    } else {
      setEditTarget(null)
      setForm({ drug: '', date: new Date().toISOString().slice(0,10), intervalPreset: 182, intervalDays: 182, note: '' })
    }
    setShowForm(true)
  }

  const save = async () => {
    if (!form.drug.trim()) return
    setSaving(true)
    const nextDate = addDays(form.date, form.intervalDays)
    const payload = { drug: form.drug.trim(), lastDate: form.date, intervalDays: form.intervalDays, nextDate, note: form.note, updatedAt: serverTimestamp() }
    if (editTarget) {
      await updateDoc(doc(db, 'familyMembers', memberId, 'injections', editTarget.id), payload)
    } else {
      await addDoc(collection(db, 'familyMembers', memberId, 'injections'), { ...payload, createdAt: serverTimestamp() })
    }
    setSaving(false); setShowForm(false); setEditTarget(null)
  }

  const deleteShot = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'familyMembers', memberId, 'injections', id))
  }

  const recordNext = async (shot) => {
    const today = new Date().toISOString().slice(0,10)
    const nextDate = addDays(today, shot.intervalDays)
    await updateDoc(doc(db, 'familyMembers', memberId, 'injections', shot.id), { lastDate: today, nextDate, updatedAt: serverTimestamp() })
  }

  const iStyle = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>주사 스케줄 관리</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>정기 주사 치료 일정 추적</div>
        </div>
        <button onClick={() => openForm(null)}
          style={{ padding: '6px 14px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          + 주사 등록
        </button>
      </div>

      {loading && <div style={{ color: '#9ca3af', fontSize: 13 }}>로딩 중...</div>}

      {!loading && shots.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px 0', color: '#9ca3af', fontSize: 13 }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>💉</div>
          <div>등록된 주사 스케줄이 없습니다</div>
          <button onClick={() => openForm(null)} style={{ marginTop: 12, padding: '8px 20px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            첫 주사 등록
          </button>
        </div>
      )}

      {shots.map(shot => {
        const diff = daysUntil(shot.nextDate)
        const isOverdue = diff !== null && diff < 0
        const isSoon = diff !== null && diff >= 0 && diff <= 14
        const statusColor = isOverdue ? '#dc2626' : isSoon ? '#d97706' : '#0F6E56'
        const statusBg = isOverdue ? '#fee2e2' : isSoon ? '#fef3c7' : '#f0faf5'
        const statusLabel = isOverdue ? '기간 초과 ' + Math.abs(diff) + '일' : isSoon ? diff + '일 후' : diff + '일 후'
        const gcUrl = googleCalendarUrl(
          memberName + ' ' + shot.drug + ' 주사',
          shot.nextDate,
          '다음 ' + shot.drug + ' 주사 예정일. 마지막 투여: ' + shot.lastDate
        )

        return (
          <div key={shot.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid ' + (isOverdue ? '#fca5a5' : isSoon ? '#fde68a' : '#f0ede8'), boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 5 }}>💉 {shot.drug}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#6b7280' }}>
                  <span>마지막: <strong>{shot.lastDate}</strong></span>
                  <span>간격: <strong>{shot.intervalDays}일</strong></span>
                  <span>다음: <strong style={{ color: statusColor }}>{shot.nextDate}</strong></span>
                </div>
                {shot.note && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{shot.note}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0, marginLeft: 10 }}>
                <span style={{ fontSize: 12, background: statusBg, color: statusColor, borderRadius: 8, padding: '3px 10px', fontWeight: 700 }}>
                  {isOverdue ? '!' : ''} {statusLabel}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <button onClick={() => recordNext(shot)}
                style={{ fontSize: 11, color: '#0F6E56', background: '#f0faf5', border: '1px solid #6ee7b7', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                오늘 투여 기록
              </button>
              <a href={gcUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', fontWeight: 600 }}>
                구글 캘린더 등록
              </a>
              <button onClick={() => openForm(shot)}
                style={{ fontSize: 11, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>수정</button>
              <button onClick={() => deleteShot(shot.id)}
                style={{ fontSize: 11, color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>삭제</button>
            </div>
          </div>
        )
      })}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 16px' }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, padding: '22px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f0ede8' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editTarget ? '주사 스케줄 수정' : '주사 스케줄 등록'}</div>
              <button onClick={() => { setShowForm(false); setEditTarget(null) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>x</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>약제명 *</label>
              <input value={form.drug} onChange={e => setForm(p => ({ ...p, drug: e.target.value }))} placeholder="예: 프롤리아주, 비타민D 주사, 인슐린" style={iStyle} autoFocus />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>마지막 투여일 *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={iStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>투여 간격</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {PRESET_INTERVALS.map(p => (
                  <button key={p.days} onClick={() => setForm(f => ({ ...f, intervalPreset: p.days, intervalDays: p.days || f.intervalDays }))}
                    style={{ padding: '4px 10px', borderRadius: 16, border: form.intervalPreset === p.days ? 'none' : '1px solid #e5e7eb', background: form.intervalPreset === p.days ? '#0F6E56' : '#fff', color: form.intervalPreset === p.days ? '#fff' : '#6b7280', fontSize: 11, cursor: 'pointer', fontWeight: form.intervalPreset === p.days ? 700 : 400 }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" value={form.intervalDays} onChange={e => setForm(p => ({ ...p, intervalDays: parseInt(e.target.value)||1, intervalPreset: 0 }))}
                  style={{ ...iStyle, width: 80, textAlign: 'center' }} min={1} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>일 마다</span>
                <span style={{ fontSize: 12, color: '#0F6E56', fontWeight: 600 }}>
                  다음 예정: {form.date ? addDays(form.date, form.intervalDays) : '-'}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>메모</label>
              <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="처방의, 부작용 주의사항 등" style={iStyle} />
            </div>
            <button onClick={save} disabled={!form.drug.trim() || saving}
              style={{ width: '100%', padding: '12px', background: !form.drug.trim() || saving ? '#d1d5db' : '#0F6E56', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: !form.drug.trim() || saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '저장 중...' : editTarget ? '수정 완료' : '등록'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FamilyTab() {
  const isMobile = useIsMobile()
  const [members, setMembers] = useState([])
  const [records, setRecords] = useState({})
  const [selId, setSelId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [memberTab, setMemberTab] = useState('tracking')
  const [addMember, setAddMember] = useState(false)
  const [addRecord, setAddRecord] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [delConfirm, setDelConfirm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [mf, setMf] = useState({ name: '', relation: '', birthYear: '', gender: '남' })

  useEffect(() => {
    const q = query(collection(db, 'familyMembers'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMembers(list)
      if (!selId && list.length > 0) setSelId(list[0].id)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (members.length === 0) return
    const unsubs = members.map(m => {
      const q = query(collection(db, 'familyMembers', m.id, 'records'), orderBy('date', 'desc'))
      return onSnapshot(q, snap => {
        setRecords(prev => ({ ...prev, [m.id]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [members.length])

  const saveMember = async () => {
    if (!mf.name.trim()) return
    const ref = await addDoc(collection(db, 'familyMembers'), { ...mf, birthYear: parseInt(mf.birthYear) || 2000, createdAt: serverTimestamp() })
    setSelId(ref.id)
    setMf({ name: '', relation: '', birthYear: '', gender: '남' })
    setAddMember(false)
  }

  const saveRecord = async (payload) => {
    if (!selId) return
    if (editRecord) {
      await updateDoc(doc(db, 'familyMembers', selId, 'records', editRecord.id), { ...payload, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'familyMembers', selId, 'records'), { ...payload, createdAt: serverTimestamp() })
    }
    setAddRecord(false); setEditRecord(null)
  }

  const deleteRecord = async (rid) => {
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'familyMembers', selId, 'records', rid))
  }

  const deleteMember = async () => {
    if (!selId) return
    await deleteDoc(doc(db, 'familyMembers', selId))
    setDelConfirm(false); setSelId(null)
  }

  const sel = members.find(m => m.id === selId)
  const recs = records[selId] || []
  const filteredRecs = filterStatus === 'all' ? recs : recs.filter(r => r.status === filterStatus)

  if (loading) return <Spinner />

  const formSheet = (addRecord || editRecord) ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '16px 12px' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 680, padding: '24px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginTop: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f0ede8' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{editRecord ? '기록 수정' : '이상 내용 기록'}</div>
            {sel && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sel.name}</div>}
          </div>
          <button onClick={() => { setAddRecord(false); setEditRecord(null) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>x</button>
        </div>
        <IssueForm initial={editRecord} onSave={saveRecord} onClose={() => { setAddRecord(false); setEditRecord(null) }} />
      </div>
    </div>
  ) : null

  const Sheets = (
    <>
      {addMember && (
        <Sheet title="가족 추가" onClose={() => setAddMember(false)}>
          {[['이름 또는 별칭','name','text','예: 배우자, 어머니'],['관계','relation','text','배우자 / 자녀 / 부모'],['출생연도','birthYear','number','예: 1990']].map(([l,k,t,ph]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>{l}</label>
              <input type={t} value={mf[k]} onChange={e => setMf(p => ({...p,[k]:e.target.value}))} placeholder={ph}
                style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>성별</label>
            <SegmentButtons options={[{val:'남',label:'남'},{val:'여',label:'여'}]} value={mf.gender} onChange={v => setMf(p => ({...p,gender:v}))} />
          </div>
          <button onClick={saveMember} style={{ width: '100%', padding: '12px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>추가하기</button>
        </Sheet>
      )}
      {delConfirm && (
        <Sheet title="가족 삭제" onClose={() => setDelConfirm(false)}>
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>'{sel?.name}'을 삭제하면 모든 기록도 함께 삭제됩니다.</p>
          <DangerButton onClick={deleteMember}>삭제하기</DangerButton>
        </Sheet>
      )}
    </>
  )

  if (isMobile) {
    return (
      <div style={{ paddingBottom: 80 }}>
        {/* 멤버 선택 */}
        <div style={{ padding: '12px 16px 8px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
            {members.map(m => {
              const mRecs = records[m.id] || []
              const hasAlert = mRecs.some(r => followUpStatus(r.nextVisit, r.status))
              const active = selId === m.id
              return (
                <button key={m.id} onClick={() => setSelId(m.id)}
                  style={{ padding: '7px 16px', borderRadius: 20, border: active ? 'none' : '1px solid #e5e7eb', background: active ? '#0F6E56' : '#fff', color: active ? '#fff' : '#374151', fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {m.name}
                  {hasAlert && <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : '#ef4444', display: 'inline-block' }} />}
                </button>
              )
            })}
            <button onClick={() => setAddMember(true)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px dashed #d1d5db', color: '#9ca3af', background: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>+ 추가</button>
          </div>
        </div>
        {sel && (
          <div style={{ margin: '0 16px 14px', borderRadius: 16, padding: '16px 20px', background: '#0F6E56', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{sel.name}</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{sel.relation}  /  {sel.gender}  /  {getAge(sel.birthYear)}세</div>
              </div>
              <MemberInitial name={sel.name} size={44} />
            </div>
            <StatusSummary recs={recs} small={false} />
          </div>
        )}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f0ede8', borderRadius: 10, padding: 4, marginBottom: 14 }}>
            {[['tracking','트래킹'],['injection','💉 주사'],['checkup','건강검진']].map(([k,l]) => (
              <button key={k} onClick={() => setMemberTab(k)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: memberTab === k ? '#fff' : 'transparent', color: memberTab === k ? '#0F6E56' : '#9ca3af', fontSize: 12, fontWeight: memberTab === k ? 700 : 400, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          {memberTab === 'checkup' ? (
            sel && <HealthCheckup memberId={sel.id} memberGender={sel.gender} />
          ) : memberTab === 'injection' ? (
            sel && <InjectionScheduler memberId={sel.id} memberName={sel.name} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[['all','전체'],['followup','추적'],['ongoing','진행'],['resolved','완료']].map(([v,l]) => (
                    <button key={v} onClick={() => setFilterStatus(v)}
                      style={{ padding: '4px 10px', borderRadius: 12, border: filterStatus === v ? 'none' : '1px solid #e5e7eb', background: filterStatus === v ? '#0F6E56' : '#fff', color: filterStatus === v ? '#fff' : '#6b7280', fontSize: 11, cursor: 'pointer', fontWeight: filterStatus === v ? 700 : 400 }}>{l}</button>
                  ))}
                </div>
                <button onClick={() => setAddRecord(true)} style={{ padding: '6px 14px', borderRadius: 20, background: '#0F6E56', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ 기록</button>
              </div>
              {filteredRecs.length === 0
                ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>기록이 없습니다</div>
                : <div>{filteredRecs.map(r => <IssueCard key={r.id} r={r} onEdit={setEditRecord} onDelete={deleteRecord} />)}</div>
              }
            </>
          )}
        </div>
        {Sheets}
        {formSheet}
      </div>
    )
  }

  // 데스크탑
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: 260, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 14px 12px', borderBottom: '1px solid #f0ede8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>가족 구성원</span>
          <button onClick={() => setAddMember(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ 추가</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {members.map(m => {
            const mRecs = records[m.id] || []
            const active = selId === m.id
            return (
              <button key={m.id} onClick={() => { setSelId(m.id); setMemberTab('tracking') }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, border: 'none', background: active ? '#f0faf5' : 'transparent', cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
                <MemberInitial name={m.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#0F6E56' : '#1a1a1a' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.relation}  /  {getAge(m.birthYear)}세</div>
                  <StatusSummary recs={mRecs} small={true} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef' }}>
        {!sel
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 36, marginBottom: 10 }}></div><div style={{ fontSize: 14 }}>왼쪽에서 가족을 선택하세요</div></div>
            </div>
          : <div style={{ maxWidth: 820, padding: '28px 32px' }}>
              <div style={{ borderRadius: 18, padding: '22px 28px', background: '#0F6E56', color: '#fff', marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <MemberInitial name={sel.name} size={52} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 21, fontWeight: 700 }}>{sel.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 3 }}>{sel.relation}  /  {sel.gender}  /  {getAge(sel.birthYear)}세</div>
                  </div>
                  <button onClick={() => setDelConfirm(true)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer' }}>삭제</button>
                </div>
                <StatusSummary recs={recs} small={false} />
              </div>

              <div style={{ display: 'flex', gap: 4, background: '#f0ede8', borderRadius: 10, padding: 4, marginBottom: 20 }}>
                {[['tracking','트래킹'],['injection','💉 주사'],['checkup','건강검진']].map(([k,l]) => (
                  <button key={k} onClick={() => setMemberTab(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: memberTab === k ? '#fff' : 'transparent', color: memberTab === k ? '#0F6E56' : '#9ca3af', fontSize: 12, fontWeight: memberTab === k ? 700 : 400, cursor: 'pointer', boxShadow: memberTab === k ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>{l}</button>
                ))}
              </div>

              {memberTab === 'checkup' ? (
                <HealthCheckup memberId={sel.id} memberGender={sel.gender} />
              ) : memberTab === 'injection' ? (
                <InjectionScheduler memberId={sel.id} memberName={sel.name} />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['all','전체'],['followup','추적필요'],['ongoing','진행중'],['resolved','완료']].map(([v,l]) => (
                        <button key={v} onClick={() => setFilterStatus(v)}
                          style={{ padding: '5px 12px', borderRadius: 16, border: filterStatus === v ? 'none' : '1px solid #e5e7eb', background: filterStatus === v ? '#0F6E56' : '#fff', color: filterStatus === v ? '#fff' : '#6b7280', fontSize: 12, cursor: 'pointer', fontWeight: filterStatus === v ? 700 : 400 }}>{l} {v === 'all' ? '(' + recs.length + ')' : '(' + recs.filter(r => r.status === v).length + ')'}</button>
                      ))}
                    </div>
                    <button onClick={() => setAddRecord(true)} style={{ padding: '8px 18px', borderRadius: 20, background: '#0F6E56', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 기록 추가</button>
                  </div>
                  {filteredRecs.length === 0
                    ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                        <div style={{ fontSize: 14, marginBottom: 12 }}>기록이 없습니다</div>
                        <button onClick={() => setAddRecord(true)} style={{ padding: '9px 22px', borderRadius: 20, background: '#0F6E56', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>첫 기록 추가하기</button>
                      </div>
                    : <div>{filteredRecs.map(r => <IssueCard key={r.id} r={r} onEdit={setEditRecord} onDelete={deleteRecord} />)}</div>
                  }
                </>
              )}
            </div>
        }
      </div>
      {Sheets}
      {formSheet}
    </div>
  )
}
