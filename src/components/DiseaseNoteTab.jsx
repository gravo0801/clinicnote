import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'

const NOTES_PER_PAGE = 8
const CLOUD_NAME = 'dfcvmvlen'
const UPLOAD_PRESET = 'clinicnote_uploads'

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
      resolve({ data: canvas.toDataURL('image/jpeg', 0.72), name: file.name, type: 'image', size: file.size })
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
})

const MAX_CLOUDINARY_MB = 10

function getResourceType(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext)) return 'image'
  if (['mp4','mov','avi','webm','mkv'].includes(ext)) return 'video'
  return 'raw'
}

async function uploadToCloudinary(file, onProgress) {
  if (file.size > MAX_CLOUDINARY_MB * 1024 * 1024) {
    throw new Error(file.name + ' 파일이 ' + MAX_CLOUDINARY_MB + 'MB를 초과합니다. Google Drive 링크 첨부를 이용해 주세요.')
  }
  const resourceType = getResourceType(file)
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'clinicnote')
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/' + resourceType + '/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100))
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        resolve({ url: res.secure_url, name: file.name, mime: file.type, size: file.size, publicId: res.public_id, resourceType })
      } else {
        let msg = '업로드 실패 (' + xhr.status + ')'
        try {
          const err = JSON.parse(xhr.responseText)
          if (err.error && err.error.message) msg = err.error.message
        } catch (_) {}
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('네트워크 오류'))
    xhr.send(fd)
  })
}

function toEmbedUrl(url, mime) {
  if (!url) return null
  if (url.includes('drive.google.com')) {
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview'
  }
  if (url.includes('docs.google.com/presentation')) return url.replace(/\/edit.*$/, '/embed?start=false&loop=false')
  if (url.includes('docs.google.com/document')) return url.replace(/\/edit.*$/, '/preview')
  if (url.includes('docs.google.com/spreadsheets')) return url.replace(/\/edit.*$/, '/preview')
  // Cloudinary URLs: always use Google Docs Viewer (direct iframe blocked by CORS/browser)
  if (url.includes('cloudinary.com')) {
    return 'https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true'
  }
  if (mime === 'application/pdf' || url.match(/\.pdf(\?.*)?$/i)) return url
  if (url.match(/\.(pptx?|docx?|xlsx?)(\?.*)?$/i)) {
    return 'https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true'
  }
  return url
}

function getLinkType(url) {
  if (!url) return 'link'
  if (url.includes('drive.google.com')) return 'gdrive'
  if (url.includes('docs.google.com/presentation')) return 'gslides'
  if (url.includes('docs.google.com/document')) return 'gdocs'
  if (url.includes('docs.google.com/spreadsheets')) return 'gsheets'
  if (url.includes('notebooklm.google')) return 'notebooklm'
  if (url.match(/\.pdf(\?.*)?$/i)) return 'pdf'
  if (url.match(/\.(pptx?)(\?.*)?$/i)) return 'pptx'
  return 'link'
}

const LINK_META = {
  gdrive:     { icon: '[Drive]',  label: 'Google Drive',  color: '#0891b2', bg: '#e0f2fe', embed: true },
  gslides:    { icon: '[Slides]', label: 'Google Slides', color: '#d97706', bg: '#fef3c7', embed: true },
  gdocs:      { icon: '[Docs]',   label: 'Google Docs',   color: '#2563eb', bg: '#eff6ff', embed: true },
  gsheets:    { icon: '[Sheets]', label: 'Google Sheets', color: '#059669', bg: '#ecfdf5', embed: true },
  notebooklm: { icon: '[NLM]',    label: 'NotebookLM',    color: '#7c3aed', bg: '#f5f3ff', embed: false },
  pdf:        { icon: '[PDF]',    label: 'PDF',           color: '#dc2626', bg: '#fee2e2', embed: true },
  pptx:       { icon: '[PPTX]',   label: 'PPTX',          color: '#d97706', bg: '#fef3c7', embed: true },
  link:       { icon: '[Link]',   label: 'Link',          color: '#6b7280', bg: '#f3f4f6', embed: true },
}

const S = {
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#F8F9FB', borderRadius: 8, border: '1px solid #F0F4F8', marginBottom: 8 },
  badge: function(color, bg) { return { fontSize: 10, color: color, background: bg, borderRadius: 4, padding: '1px 6px', fontWeight: 700, flexShrink: 0 } },
  btn: function(active) { return { fontSize: 11, color: active ? '#00C07F' : '#6b7280', background: active ? '#EDFFF8' : '#fff', border: '1px solid #e5e7eb', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 } },
  linkBtn: { fontSize: 11, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 8px', textDecoration: 'none', fontWeight: 600 },
  input: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#0D1117' },
  label: { display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 },
}

function CloudinaryFilePreview({ file }) {
  const [show, setShow] = useState(false)
  const [blobUrl, setBlobUrl] = useState(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  const isPdf = file.mime === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
  const isPptx = !!(file.name?.toLowerCase().match(/\.(pptx?)$/))
  const isDoc = !!(file.name?.toLowerCase().match(/\.(docx?)$/))
  const isXls = !!(file.name?.toLowerCase().match(/\.(xlsx?)$/))
  const isImage = !!(file.mime?.startsWith('image/') || file.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/))
  const icon = isImage ? '[IMG]' : isPdf ? '[PDF]' : isPptx ? '[PPT]' : isDoc ? '[DOC]' : isXls ? '[XLS]' : '[FILE]'
  const color = isImage ? '#0891b2' : isPdf ? '#dc2626' : isPptx ? '#d97706' : isDoc ? '#2563eb' : '#6b7280'
  const bg = isImage ? '#e0f2fe' : isPdf ? '#fee2e2' : isPptx ? '#fef3c7' : isDoc ? '#eff6ff' : '#f3f4f6'
  const canPreview = isImage || isPdf || isPptx || isDoc || isXls

  const handlePreview = async () => {
    if (show) { setShow(false); return }
    setShow(true)
    if (isPdf && !blobUrl && !loadingPdf) {
      setLoadingPdf(true)
      setPdfError(null)
      try {
        const res = await fetch(file.url)
        if (!res.ok) throw new Error('fetch failed')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
      } catch (e) {
        setPdfError('PDF 로드 실패. 다운로드 버튼을 이용해 주세요.')
      } finally {
        setLoadingPdf(false)
      }
    }
  }

  const googleViewerUrl = 'https://docs.google.com/viewer?url=' + encodeURIComponent(file.url) + '&embedded=true'

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={S.row}>
        <span style={S.badge(color, bg)}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0D1117', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
        {file.size && <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{(file.size / 1024 / 1024).toFixed(1) + 'MB'}</span>}
        {canPreview && <button style={S.btn(show)} onClick={handlePreview}>{show ? '접기' : '미리보기'}</button>}
        <a href={file.url} target="_blank" rel="noopener noreferrer" style={S.linkBtn}>다운로드</a>
      </div>
      {show && (
        <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden', background: '#fff' }}>
          {isImage && (
            <img src={file.url} alt={file.name} style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', background: '#f0f0f0' }} />
          )}
          {isPdf && (
            <>
              {loadingPdf && (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>PDF 불러오는 중...</div>
              )}
              {pdfError && (
                <div style={{ padding: '16px', fontSize: 13, color: '#991b1b', background: '#fee2e2' }}>
                  {pdfError}
                  <br />
                  <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>새 탭에서 열기</a>
                </div>
              )}
              {blobUrl && !loadingPdf && (
                <iframe src={blobUrl} style={{ width: '100%', height: 640, border: 'none', display: 'block' }} title={file.name} />
              )}
            </>
          )}
          {(isPptx || isDoc || isXls) && (
            <>
              <iframe src={googleViewerUrl} style={{ width: '100%', height: 580, border: 'none', display: 'block' }} title={file.name} allowFullScreen />
              <div style={{ padding: '6px 12px', background: '#fffbeb', fontSize: 11, color: '#92400e', borderTop: '1px solid #fde68a' }}>
                Google Docs 뷰어 - 로딩에 10~20초 소요 가능. 안 보이면 다운로드 후 열어보세요.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function LinkPreview({ link }) {
  const [show, setShow] = useState(false)
  const t = getLinkType(link.url)
  const meta = LINK_META[t] || LINK_META.link
  const embedUrl = toEmbedUrl(link.url, '')
  const canEmbed = meta.embed && embedUrl
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={S.row}>
        <span style={S.badge(meta.color, meta.bg)}>{meta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0D1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.title || link.url}</div>
          <div style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
        </div>
        <span style={S.badge(meta.color, meta.bg)}>{meta.label}</span>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {canEmbed && <button onClick={() => setShow(p => !p)} style={S.btn(show)}>{show ? '접기' : '미리보기'}</button>}
          <a href={link.url} target="_blank" rel="noopener noreferrer" style={S.linkBtn}>열기</a>
        </div>
      </div>
      {show && canEmbed && (
        <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
          <iframe src={embedUrl} style={{ width: '100%', height: t === 'gslides' ? 480 : 520, border: 'none', display: 'block' }} title={link.title || 'preview'} allowFullScreen />
          <div style={{ padding: '5px 10px', background: '#fffbeb', fontSize: 10, color: '#92400e' }}>Google 계정 로그인 또는 파일 공유 설정이 필요할 수 있습니다.</div>
        </div>
      )}
    </div>
  )
}

function ImagePreview({ img, onRemove }) {
  const [big, setBig] = useState(false)
  const src = img.data || img.url || ''
  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img src={src} alt={img.name} onClick={() => setBig(true)}
          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', display: 'block' }} />
        {onRemove && (
          <button onClick={onRemove}
            style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>x</button>
        )}
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</div>
      </div>
      {big && (
        <div onClick={() => setBig(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={src} alt={img.name} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </>
  )
}

const CATEGORIES = ['전체','내과','호흡기','소화기','순환기','내분비','근골격','신경','감염','소아','피부','이비인후','안과','비뇨기','정신','기타']

function LinkInput({ links, onChange }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const t = getLinkType(url)
  const meta = LINK_META[t] || LINK_META.link
  const add = () => {
    if (!url.trim()) return
    onChange([...links, { url: url.trim(), title: title.trim() || url.trim() }])
    setUrl(''); setTitle('')
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Google Drive / Slides / Docs / PDF URL"
          style={{ ...S.input, flex: 1, fontSize: 12 }} />
        <button onClick={add} disabled={!url.trim()}
          style={{ padding: '8px 14px', background: url.trim() ? '#00C07F' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: url.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>추가</button>
      </div>
      {url && <div style={{ marginBottom: 8 }}><span style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>{meta.label} 감지됨</span></div>}
      <div style={{ fontSize: 11, color: '#9ca3af' }}>지원: Google Drive / Slides / Docs / Sheets / PDF URL</div>
      {links.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {links.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: '#F8F9FB', borderRadius: 7, marginBottom: 5, border: '1px solid #F0F4F8' }}>
              <span style={{ fontSize: 11, color: LINK_META[getLinkType(l.url)]?.color || '#6b7280', fontWeight: 700 }}>{LINK_META[getLinkType(l.url)]?.icon || '?'}</span>
              <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || l.url}</span>
              <button onClick={() => onChange(links.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>x</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AiSearch({ title, content, category }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'disease_note', caseData: { patient: {}, diagnosis: { impression: title }, noteContent: content, category: category } })
      })
      if (!res.ok) { const t = await res.text(); throw new Error('서버 오류 ' + res.status + ': ' + t.slice(0, 100)) }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const roleColors = { '주처방': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }, '항생제': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }, '해열': { bg: '#fef3c7', color: '#92400e', border: '#fde68a' }, '소염': { bg: '#fef3c7', color: '#92400e', border: '#fde68a' }, '거담': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, '위장': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' }, '기본': { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe' } }
  const getRoleStyle = (role) => { if (!role) return roleColors['기본']; for (const k of Object.keys(roleColors)) { if (role.includes(k)) return roleColors[k] } return roleColors['기본'] }

  return (
    <div style={{ background: '#EDFFF8', borderRadius: 10, padding: '14px', border: '1px solid #90EDD4', marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: result || error ? 14 : 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#00C07F' }}>AI 완성 처방 세트</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>상병코드 + 주처방 + 대증치료 + 위장보호 포함</div>
        </div>
        <button onClick={search} disabled={loading}
          style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: loading ? '#d1d5db' : '#00C07F', color: '#fff', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
          {loading ? '생성 중...' : 'AI 처방 생성'}
        </button>
      </div>
      {error && <div style={{ background: '#fee2e2', borderRadius: 7, padding: '9px 12px', fontSize: 12, color: '#991b1b', marginBottom: 10 }}>오류: {error}</div>}
      {result && (
        <div>
          {result.kcdCodes && result.kcdCodes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#00C07F', marginBottom: 6 }}>KCD 상병코드</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {result.kcdCodes.map((k, i) => <span key={i} style={{ fontSize: 12, background: '#e6f4ef', color: '#00C07F', borderRadius: 6, padding: '3px 10px', fontWeight: 700, border: '1px solid #90EDD4' }}>{k.code}  {k.name}</span>)}
              </div>
            </div>
          )}
          {result.regimen && result.regimen.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0D1117' }}>{result.prescriptionTitle || '완성 처방 세트'}</div>
                <span style={{ fontSize: 10, background: '#00C07F', color: '#fff', borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>{'전체 ' + result.regimen.length + '종 함께 처방'}</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ background: '#F8F9FB', padding: '7px 12px', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>아래 약물 전체가 하나의 완성된 처방 세트입니다.</div>
                {result.regimen.map((r, i) => {
                  const rs = getRoleStyle(r.role)
                  return (
                    <div key={i} style={{ padding: '10px 14px', borderBottom: i < result.regimen.length - 1 ? '1px solid #F0F4F8' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 3, flexShrink: 0, alignSelf: 'stretch', background: rs.border, borderRadius: 2, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0D1117' }}>{r.drug}</span>
                          {r.role && <span style={{ fontSize: 10, background: rs.bg, color: rs.color, borderRadius: 4, padding: '1px 7px', fontWeight: 700, flexShrink: 0 }}>{r.role}</span>}
                          <span style={{ fontSize: 11, color: r.covered !== false ? '#00C07F' : '#dc2626', background: r.covered !== false ? '#EDFFF8' : '#fee2e2', borderRadius: 4, padding: '1px 6px', fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}>{r.covered !== false ? '급여' : '비급여'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: r.reason ? 4 : 0 }}>
                          {[r.dosage, r.freq, r.duration, r.usage].filter(Boolean).map((v, j) => <span key={j} style={{ fontSize: 11, background: '#f3f4f6', color: '#374151', borderRadius: 5, padding: '2px 8px' }}>{v}</span>)}
                        </div>
                        {r.reason && <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{r.reason}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {result.summary && <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 13px', fontSize: 12, color: '#1d4ed8', lineHeight: 1.75, marginBottom: 8, border: '1px solid #bfdbfe' }}><span style={{ fontWeight: 700 }}>처방 원칙: </span>{result.summary}</div>}
          {result.caution && <div style={{ background: '#fef3c7', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#92400e', lineHeight: 1.6, marginBottom: 8, border: '1px solid #fde68a' }}><span style={{ fontWeight: 700 }}>주의/대체: </span>{result.caution}</div>}
          {result.followUp && <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#5b21b6', lineHeight: 1.6, border: '1px solid #ddd6fe' }}><span style={{ fontWeight: 700 }}>추적 계획: </span>{result.followUp}</div>}
        </div>
      )}
    </div>
  )
}

function NoteForm({ initial, onSave }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [category, setCat] = useState(initial?.category || '내과')
  const [tags, setTagsStr] = useState((initial?.tags || []).join(', '))
  const [content, setContent] = useState(initial?.content || '')
  const [images, setImages] = useState(initial?.images || [])
  const [cloudFiles, setCloudFiles] = useState(initial?.cloudFiles || [])
  const [links, setLinks] = useState(initial?.links || [])
  const [saving, setSaving] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const handleImages = async (e) => {
    setImgLoading(true)
    const compressed = await Promise.all(Array.from(e.target.files).slice(0, 6).map(compressImage))
    setImages(p => [...p, ...compressed].slice(0, 10))
    setImgLoading(false)
    e.target.value = ''
  }

  const handleCloudUpload = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    for (const file of files) {
      const key = file.name + Date.now()
      setUploadProgress(p => ({ ...p, [key]: 0 }))
      try {
        const result = await uploadToCloudinary(file, (pct) => {
          setUploadProgress(p => ({ ...p, [key]: pct }))
        })
        setCloudFiles(p => [...p, result])
      } catch (err) {
        alert(file.name + ' 업로드 실패: ' + err.message)
      } finally {
        setUploadProgress(p => { const n = { ...p }; delete n[key]; return n })
      }
    }
  }

  const uploadingFiles = Object.entries(uploadProgress)

  const handleSave = async () => {
    if (!title.trim() || uploadingFiles.length > 0) return
    setSaving(true)
    await onSave({ title: title.trim(), category, tags: tags.split(',').map(t => t.trim()).filter(Boolean), content, images, cloudFiles, links })
    setSaving(false)
  }

  const disabled = !title.trim() || saving || imgLoading || uploadingFiles.length > 0

  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>제목 *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 급성 기관지염 치료 가이드라인 요약" style={S.input} autoFocus />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>카테고리</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {CATEGORIES.filter(c => c !== '전체').map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding: '4px 10px', borderRadius: 20, border: category === c ? 'none' : '1px solid #e5e7eb', background: category === c ? '#00C07F' : '#fff', color: category === c ? '#fff' : '#6b7280', fontSize: 12, cursor: 'pointer', fontWeight: category === c ? 700 : 400 }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>태그 (쉼표로 구분)</label>
        <input value={tags} onChange={e => setTagsStr(e.target.value)} placeholder="예: 항생제, P-CAB, 소아처방" style={S.input} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>내용</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="교재, 가이드라인, 논문 요약 등을 자유롭게 작성하세요..."
          style={{ ...S.input, resize: 'vertical', minHeight: 300, lineHeight: 1.8 }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>이미지 첨부</label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: '#EDFFF8', color: '#00C07F', border: '1px dashed #5DE8BC', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {imgLoading ? '압축중...' : '이미지 선택'}
          <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
        </label>
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {images.map((img, i) => <ImagePreview key={i} img={img} onRemove={() => setImages(p => p.filter((_, idx) => idx !== i))} />)}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 14, background: '#eff6ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #bfdbfe' }}>
        <label style={{ ...S.label, color: '#1d4ed8', fontSize: 12 }}>PDF / PPTX / DOCX 파일 업로드 (파일당 최대 10MB)</label>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>10MB 초과 파일(NotebookLM PPT 등)은 아래 Google Drive 링크 첨부를 이용하세요.</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          파일 선택 (PDF/PPTX/DOCX)
          <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" onChange={handleCloudUpload} style={{ display: 'none' }} />
        </label>
        {uploadingFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {uploadingFiles.map(([key, pct]) => (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#1d4ed8', marginBottom: 3 }}>
                  <span>업로드 중...</span><span>{pct + '%'}</span>
                </div>
                <div style={{ background: '#bfdbfe', borderRadius: 4, height: 5 }}>
                  <div style={{ background: '#2563eb', borderRadius: 4, height: 5, width: pct + '%', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {cloudFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {cloudFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', borderRadius: 7, marginBottom: 5, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>{(f.name || '').split('.').pop().toUpperCase()}</span>
                <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                {f.size && <span style={{ fontSize: 10, color: '#9ca3af' }}>{(f.size / 1024 / 1024).toFixed(1) + 'MB'}</span>}
                <button onClick={() => setCloudFiles(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>x</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16, background: '#F8F9FB', borderRadius: 10, padding: '12px 14px', border: '1px solid #F0F4F8' }}>
        <label style={{ ...S.label, marginBottom: 8, fontSize: 12, color: '#374151' }}>링크 첨부 (Google Drive / Slides / Docs / PDF URL)</label>
        <LinkInput links={links} onChange={setLinks} />
      </div>
      <button onClick={handleSave} disabled={disabled}
        style={{ width: '100%', padding: '12px', background: disabled ? '#d1d5db' : '#00C07F', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {saving ? '저장 중...' : uploadingFiles.length > 0 ? '파일 업로드 중...' : (initial ? '수정 완료' : '노트 저장')}
      </button>
    </div>
  )
}

function NoteCard({ note, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const dateStr = note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : ''
  const imgCount = (note.images || []).length
  const fileCount = (note.cloudFiles || []).length
  const linkCount = (note.links || []).length
  const hasText = !!(note.content?.trim())

  return (
    <div style={{ border: `1px solid ${open ? '#E2E8F0' : '#EDF0F4'}`, borderRadius: 14, overflow: 'hidden', marginBottom: 10, boxShadow: open ? '0 4px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 16px', background: open ? '#EDFFF8' : '#fff', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#00C07F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginTop: 1, color: '#fff', fontWeight: 700 }}>N</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1117', marginBottom: 5, letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title || '제목 없음'}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{dateStr}</span>
            {note.category && <span style={{ fontSize: 10, color: '#00C07F', background: '#EDFFF8', border: '1px solid #C7F7E8', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>{note.category}</span>}
            {imgCount > 0 && <span style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>{'사진 ' + imgCount}</span>}
            {fileCount > 0 && <span style={{ fontSize: 10, color: '#2563eb', background: '#eff6ff', borderRadius: 4, padding: '1px 6px' }}>{'파일 ' + fileCount}</span>}
            {linkCount > 0 && <span style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>{'링크 ' + linkCount}</span>}
            {hasText && <span style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>텍스트</span>}
            {(note.tags || []).map(t => <span key={t} style={{ fontSize: 10, color: '#00C07F', background: '#EDFFF8', border: '1px solid #C7F7E8', borderRadius: 10, padding: '1px 6px' }}>{t}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); onEdit(note) }} style={{ fontSize: 11, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>수정</button>
          <button onClick={e => { e.stopPropagation(); onDelete(note.id) }} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>삭제</button>
          <span style={{ fontSize: 10, color: '#9ca3af', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>v</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '16px', borderTop: '1px solid #F0F4F8', background: '#fff' }}>
          {hasText && <div style={{ fontSize: 13, color: '#0D1117', lineHeight: 1.85, whiteSpace: 'pre-wrap', marginBottom: 14, background: '#FAFBFC', borderRadius: 8, padding: '12px 14px', border: '1px solid #F0F4F8' }}>{note.content}</div>}
          {imgCount > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>{'사진 (' + imgCount + ')'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {note.images.map((img, i) => <ImagePreview key={i} img={img} />)}
              </div>
            </div>
          )}
          {fileCount > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>{'파일 (' + fileCount + ')'}</div>
              {note.cloudFiles.map((f, i) => <CloudinaryFilePreview key={i} file={f} />)}
            </div>
          )}
          {linkCount > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>{'링크 (' + linkCount + ')'}</div>
              {note.links.map((l, i) => <LinkPreview key={i} link={l} />)}
            </div>
          )}
          <AiSearch title={note.title} content={note.content} category={note.category} />
        </div>
      )}
    </div>
  )
}

function Pagination({ total, page, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 20, paddingBottom: 12 }}>
      <button onClick={() => onChange(1)} disabled={page === 1} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === 1 ? '#d1d5db' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>처음</button>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === 1 ? '#d1d5db' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>이전</button>
      {pages.map(p => <button key={p} onClick={() => onChange(p)} style={{ padding: '6px 11px', borderRadius: 7, border: page === p ? 'none' : '1px solid #e5e7eb', background: page === p ? '#00C07F' : '#fff', color: page === p ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 700 : 400 }}>{p}</button>)}
      <button onClick={() => onChange(page + 1)} disabled={page === Math.ceil(total / perPage)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === Math.ceil(total / perPage) ? '#d1d5db' : '#374151', cursor: page === Math.ceil(total / perPage) ? 'not-allowed' : 'pointer', fontSize: 12 }}>다음</button>
      <button onClick={() => onChange(Math.ceil(total / perPage))} disabled={page === Math.ceil(total / perPage)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === Math.ceil(total / perPage) ? '#d1d5db' : '#374151', cursor: page === Math.ceil(total / perPage) ? 'not-allowed' : 'pointer', fontSize: 12 }}>마지막</button>
      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>{page + ' / ' + Math.ceil(total / perPage) + ' 페이지'}</span>
    </div>
  )
}

function EmptyState({ onAdd, search }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>{search ? ('"' + search + '" 검색 결과 없음') : '질환 노트가 없습니다'}</div>
      <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>{search ? '다른 키워드로 검색해보세요.' : '교재, 가이드라인, PDF/PPTX 파일을 첨부하세요.'}</div>
      {!search && <button onClick={onAdd} style={{ background: '#00C07F', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>첫 노트 작성하기</button>}
    </div>
  )
}

export default function DiseaseNoteTab() {
  const isMobile = useIsMobile()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('전체')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const q = query(collection(db, 'diseaseNotes2'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => { setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
  }, [])

  useEffect(() => { setPage(1) }, [search, catFilter])

  const saveNote = async (payload) => {
    if (editTarget) { await updateDoc(doc(db, 'diseaseNotes2', editTarget.id), { ...payload, updatedAt: serverTimestamp() }) }
    else { await addDoc(collection(db, 'diseaseNotes2'), { ...payload, createdAt: serverTimestamp() }) }
    setShowForm(false); setEditTarget(null)
  }

  const deleteNote = async (id) => {
    if (!window.confirm('노트를 삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'diseaseNotes2', id))
  }

  const filtered = useMemo(() => notes.filter(n => {
    const catOk = catFilter === '전체' || n.category === catFilter
    const q = search.toLowerCase()
    return catOk && (!q || [n.title, n.content, n.category, ...(n.tags || [])].some(t => t?.toLowerCase().includes(q)))
  }), [notes, catFilter, search])

  const paginated = useMemo(() => filtered.slice((page - 1) * NOTES_PER_PAGE, page * NOTES_PER_PAGE), [filtered, page])

  const formSheet = (showForm || editTarget) ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '16px 12px' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 960, padding: '28px 36px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #F0F4F8' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0D1117' }}>{editTarget ? '노트 수정' : '새 질환 노트'}</div>
          <button onClick={() => { setShowForm(false); setEditTarget(null) }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>x</button>
        </div>
        <NoteForm initial={editTarget} onSave={saveNote} />
      </div>
    </div>
  ) : null

  if (loading) return <Spinner />

  const catCounts = CATEGORIES.reduce((acc, c) => { acc[c] = c === '전체' ? notes.length : notes.filter(n => n.category === c).length; return acc }, {})

  if (isMobile) {
    return (
      <div style={{ padding: '12px 16px', paddingBottom: 80 }}>
        <div style={{ marginBottom: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목, 내용, 태그 검색..." style={{ ...S.input, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '4px 11px', borderRadius: 20, border: catFilter === c ? 'none' : '1px solid #e5e7eb', background: catFilter === c ? '#00C07F' : '#fff', color: catFilter === c ? '#fff' : '#6b7280', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: catFilter === c ? 700 : 400 }}>{catCounts[c] > 0 ? (c + ' (' + catCounts[c] + ')') : c}</button>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length + '개 노트'}</span>
          <button onClick={() => setShowForm(true)} style={{ background: '#00C07F', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 새 노트</button>
        </div>
        {filtered.length === 0 ? <EmptyState onAdd={() => setShowForm(true)} search={search} /> : paginated.map(n => <NoteCard key={n.id} note={n} onEdit={n2 => setEditTarget(n2)} onDelete={deleteNote} />)}
        <Pagination total={filtered.length} page={page} perPage={NOTES_PER_PAGE} onChange={setPage} />
        {formSheet}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid #EDF0F4', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #F0F4F8' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="노트 검색..." style={{ ...S.input, fontSize: 12, padding: '7px 9px', background: '#F4F6F9', border: '1.5px solid #EDF0F4' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => setCatFilter(c)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 8, border: 'none', background: catFilter === c ? '#EDFFF8' : 'transparent', color: catFilter === c ? '#00C07F' : '#374151', fontSize: 13, fontWeight: catFilter === c ? 700 : 400, cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
            <span>{c}</span>
            {catCounts[c] > 0 && <span style={{ fontSize: 11, background: catFilter === c ? '#D0F7EC' : '#f3f4f6', color: catFilter === c ? '#00C07F' : '#9ca3af', borderRadius: 10, padding: '1px 7px' }}>{catCounts[c]}</span>}
          </button>)}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #F0F4F8' }}>
          <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '11px', background: '#00C07F', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,192,127,0.3)', letterSpacing: '-0.2px' }}>+ 새 질환 노트</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#F4F6F9', padding: '24px 28px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{catFilter === '전체' ? '전체 노트' : (catFilter + ' 노트')}</h2>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{filtered.length + '개'}</div>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background: '#00C07F', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 새 노트</button>
        </div>
        {filtered.length === 0 ? <EmptyState onAdd={() => setShowForm(true)} search={search} /> : paginated.map(n => <NoteCard key={n.id} note={n} onEdit={n2 => setEditTarget(n2)} onDelete={deleteNote} />)}
        <Pagination total={filtered.length} page={page} perPage={NOTES_PER_PAGE} onChange={setPage} />
      </div>
      {formSheet}
    </div>
  )
}
