import { useState, useEffect, useMemo, useRef } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { Sheet, Spinner, useIsMobile } from './ui'

const NOTES_PER_PAGE = 8

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

function readFileAsBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

function toEmbedUrl(url) {
  if (!url) return null
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (driveMatch) return 'https://drive.google.com/file/d/' + driveMatch[1] + '/preview'
  if (url.includes('docs.google.com/presentation')) return url.replace(/\/edit.*$/, '/embed?start=false&loop=false')
  if (url.includes('docs.google.com/document')) return url.replace(/\/edit.*$/, '/preview')
  if (url.includes('docs.google.com/spreadsheets')) return url.replace(/\/edit.*$/, '/preview')
  if (url.match(/\.(pdf|pptx|docx|xlsx)(\?.*)?$/i)) return 'https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true'
  return url
}

function getLinkType(url) {
  if (!url) return 'link'
  if (url.includes('drive.google.com')) return 'gdrive'
  if (url.includes('docs.google.com/presentation')) return 'gslides'
  if (url.includes('docs.google.com/document')) return 'gdocs'
  if (url.includes('docs.google.com/spreadsheets')) return 'gsheets'
  if (url.includes('notebooklm.google')) return 'notebooklm'
  if (url.match(/\.(pdf)(\?.*)?$/i)) return 'pdf'
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
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8f6f2', borderRadius: 8, border: '1px solid #f0ede8', marginBottom: 8 },
  badge: function(color, bg) { return { fontSize: 10, color: color, background: bg, borderRadius: 4, padding: '1px 6px', fontWeight: 700, flexShrink: 0 } },
  btn: function(active) { return { fontSize: 11, color: active ? '#0F6E56' : '#6b7280', background: active ? '#f0faf5' : '#fff', border: '1px solid #e5e7eb', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 } },
  linkBtn: { fontSize: 11, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 8px', textDecoration: 'none', fontWeight: 600 },
  input: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#1a1a1a' },
  label: { display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 },
}

function FileAttachPreview({ file }) {
  const [show, setShow] = useState(false)
  const isImage = file.type === 'image' || (file.mime && file.mime.startsWith('image/'))
  const isPdf = file.name && file.name.toLowerCase().endsWith('.pdf')
  const isPptx = file.name && (file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt'))
  const isDoc = file.name && (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc'))
  const canPreview = isImage || isPdf || isPptx || isDoc

  const getEmbedSrc = () => {
    if (!file.data) return null
    if (isImage) return file.data
    if (isPdf) return file.data
    return 'https://docs.google.com/viewer?url=' + encodeURIComponent(file.url || '') + '&embedded=true'
  }

  const icon = isImage ? '[IMG]' : isPdf ? '[PDF]' : isPptx ? '[PPT]' : isDoc ? '[DOC]' : '[FILE]'
  const color = isImage ? '#0891b2' : isPdf ? '#dc2626' : isPptx ? '#d97706' : isDoc ? '#2563eb' : '#6b7280'
  const bg = isImage ? '#e0f2fe' : isPdf ? '#fee2e2' : isPptx ? '#fef3c7' : isDoc ? '#eff6ff' : '#f3f4f6'

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={Object.assign({}, S.row, { cursor: canPreview ? 'pointer' : 'default' })} onClick={() => canPreview && setShow(p => !p)}>
        <span style={S.badge(color, bg)}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
        {file.size && <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{(file.size / 1024 / 1024).toFixed(1) + 'MB'}</span>}
        {canPreview && (
          <button style={S.btn(show)} onClick={e => { e.stopPropagation(); setShow(p => !p) }}>
            {show ? '접기' : '미리보기'}
          </button>
        )}
      </div>
      {show && canPreview && file.data && (
        <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
          {isImage && <img src={file.data} alt={file.name} style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', background: '#f0f0f0' }} />}
          {isPdf && (
            <iframe src={file.data} style={{ width: '100%', height: 600, border: 'none', display: 'block' }} title={file.name} />
          )}
          {(isPptx || isDoc) && (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
              <div style={{ marginBottom: 10 }}>PPTX/DOC 파일은 로컬에서 직접 열기를 권장합니다.</div>
              <a href={file.data} download={file.name} style={{ background: '#0F6E56', color: '#fff', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                파일 다운로드
              </a>
            </div>
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
  const embedUrl = toEmbedUrl(link.url)
  const canEmbed = meta.embed && embedUrl
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={S.row}>
        <span style={S.badge(meta.color, meta.bg)}>{meta.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.title || link.url}</div>
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
  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img src={img.data} alt={img.name} onClick={() => setBig(true)}
          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', display: 'block' }} />
        {onRemove && (
          <button onClick={onRemove}
            style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>x</button>
        )}
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</div>
      </div>
      {big && (
        <div onClick={() => setBig(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={img.data} alt={img.name} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }} />
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
          style={{ padding: '8px 14px', background: url.trim() ? '#0F6E56' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: url.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
          추가
        </button>
      </div>
      {url && <div style={{ marginBottom: 8 }}><span style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>{meta.label} 감지됨</span></div>}
      <div style={{ fontSize: 11, color: '#9ca3af' }}>지원: Google Drive / Slides / Docs / Sheets / PDF URL</div>
      {links.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {links.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: '#f8f6f2', borderRadius: 7, marginBottom: 5, border: '1px solid #f0ede8' }}>
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
        body: JSON.stringify({
          type: 'disease_note',
          caseData: {
            patient: {},
            diagnosis: { impression: title },
            noteContent: content,
            category: category
          }
        })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error('서버 오류 ' + res.status + ': ' + txt.slice(0, 100))
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const roleColors = {
    '주처방': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    '항생제': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    '해열': { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    '소염': { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    '거담': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    '위장': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    '기본': { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe' },
  }

  const getRoleStyle = (role) => {
    if (!role) return roleColors['기본']
    for (const key of Object.keys(roleColors)) {
      if (role.includes(key)) return roleColors[key]
    }
    return roleColors['기본']
  }

  return (
    <div style={{ background: '#f0faf5', borderRadius: 10, padding: '14px', border: '1px solid #a7f3d0', marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: result || error ? 14 : 0 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>AI 완성 처방 세트</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>상병코드 + 주처방 + 대증치료 + 위장보호 포함 완성 처방</div>
        </div>
        <button onClick={search} disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, border: 'none', background: loading ? '#d1d5db' : '#0F6E56', color: '#fff', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
          {loading ? '생성 중...' : 'AI 처방 생성'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', borderRadius: 7, padding: '9px 12px', fontSize: 12, color: '#991b1b', marginBottom: 10 }}>
          오류: {error}
        </div>
      )}

      {result && (
        <div>
          {result.kcdCodes && result.kcdCodes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', marginBottom: 6 }}>KCD 상병코드</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {result.kcdCodes.map((k, i) => (
                  <span key={i} style={{ fontSize: 12, background: '#e6f4ef', color: '#0F6E56', borderRadius: 6, padding: '3px 10px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                    {k.code}  {k.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.regimen && result.regimen.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>
                  {result.prescriptionTitle || '완성 처방 세트'}
                </div>
                <span style={{ fontSize: 10, background: '#0F6E56', color: '#fff', borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>
                  {'전체 ' + result.regimen.length + '종 함께 처방'}
                </span>
              </div>
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ background: '#f8f6f2', padding: '7px 12px', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                  아래 약물 전체가 하나의 완성된 처방 세트입니다. 상황에 따라 일부 조정 가능.
                </div>
                {result.regimen.map((r, i) => {
                  const rs = getRoleStyle(r.role)
                  return (
                    <div key={i} style={{ padding: '10px 14px', borderBottom: i < result.regimen.length - 1 ? '1px solid #f0ede8' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 3, flexShrink: 0, alignSelf: 'stretch', background: rs.border, borderRadius: 2, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{r.drug}</span>
                          {r.role && (
                            <span style={{ fontSize: 10, background: rs.bg, color: rs.color, borderRadius: 4, padding: '1px 7px', fontWeight: 700, flexShrink: 0 }}>
                              {r.role}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: r.covered !== false ? '#0F6E56' : '#dc2626', background: r.covered !== false ? '#f0faf5' : '#fee2e2', borderRadius: 4, padding: '1px 6px', fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}>
                            {r.covered !== false ? '급여' : '비급여'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: r.reason ? 4 : 0 }}>
                          {[r.dosage, r.freq, r.duration, r.usage].filter(Boolean).map((v, j) => (
                            <span key={j} style={{ fontSize: 11, background: '#f3f4f6', color: '#374151', borderRadius: 5, padding: '2px 8px' }}>{v}</span>
                          ))}
                        </div>
                        {r.reason && <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{r.reason}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {result.summary && (
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 13px', fontSize: 12, color: '#1d4ed8', lineHeight: 1.75, marginBottom: 8, border: '1px solid #bfdbfe' }}>
              <span style={{ fontWeight: 700 }}>처방 원칙: </span>{result.summary}
            </div>
          )}
          {result.caution && (
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#92400e', lineHeight: 1.6, marginBottom: 8, border: '1px solid #fde68a' }}>
              <span style={{ fontWeight: 700 }}>주의/대체: </span>{result.caution}
            </div>
          )}
          {result.followUp && (
            <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#5b21b6', lineHeight: 1.6, border: '1px solid #ddd6fe' }}>
              <span style={{ fontWeight: 700 }}>추적 계획: </span>{result.followUp}
            </div>
          )}
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
  const [attachedFiles, setAttachedFiles] = useState(initial?.attachedFiles || [])
  const [links, setLinks] = useState(initial?.links || [])
  const [saving, setSaving] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)

  const handleImages = async (e) => {
    setImgLoading(true)
    const compressed = await Promise.all(Array.from(e.target.files).slice(0, 6).map(compressImage))
    setImages(p => [...p, ...compressed].slice(0, 10))
    setImgLoading(false)
    e.target.value = ''
  }

  const handleFiles = async (e) => {
    setFileLoading(true)
    const files = Array.from(e.target.files).slice(0, 5)
    const results = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(file.name + ' 파일이 10MB를 초과합니다.')
        continue
      }
      const data = await readFileAsBase64(file)
      results.push({ name: file.name, data: data, mime: file.type, size: file.size, type: file.type.startsWith('image/') ? 'image' : 'file' })
    }
    setAttachedFiles(p => [...p, ...results])
    setFileLoading(false)
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title: title.trim(), category, tags: tags.split(',').map(t => t.trim()).filter(Boolean), content, images, attachedFiles, links })
    setSaving(false)
  }

  const disabled = !title.trim() || saving || imgLoading || fileLoading

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
              style={{ padding: '4px 10px', borderRadius: 20, border: category === c ? 'none' : '1px solid #e5e7eb', background: category === c ? '#0F6E56' : '#fff', color: category === c ? '#fff' : '#6b7280', fontSize: 12, cursor: 'pointer', fontWeight: category === c ? 700 : 400 }}>
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
        <label style={S.label}>내용 (자유롭게 붙여넣기)</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="교재, 가이드라인, 논문 요약, 처방 팁 등을 자유롭게 작성하세요..."
          style={{ ...S.input, resize: 'vertical', minHeight: 300, lineHeight: 1.8 }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>이미지 첨부 (최대 10장)</label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: '#f0faf5', color: '#0F6E56', border: '1px dashed #6ee7b7', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {imgLoading ? '처리중...' : '이미지 선택'}
          <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
        </label>
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {images.map((img, i) => <ImagePreview key={i} img={img} onRemove={() => setImages(p => p.filter((_, idx) => idx !== i))} />)}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>파일 첨부 (PDF, PPTX, DOCX 등 각 10MB 이하)</label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: '#eff6ff', color: '#2563eb', border: '1px dashed #bfdbfe', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {fileLoading ? '업로드중...' : 'PDF/PPTX/DOCX 선택'}
          <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" onChange={handleFiles} style={{ display: 'none' }} />
        </label>
        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>PDF는 앱 내 미리보기 가능</span>
        {attachedFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {attachedFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8f6f2', borderRadius: 7, marginBottom: 5, border: '1px solid #f0ede8' }}>
                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>{f.name.split('.').pop().toUpperCase()}</span>
                <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                {f.size && <span style={{ fontSize: 10, color: '#9ca3af' }}>{(f.size / 1024 / 1024).toFixed(1) + 'MB'}</span>}
                <button onClick={() => setAttachedFiles(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>x</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16, background: '#f8f6f2', borderRadius: 10, padding: '12px 14px', border: '1px solid #f0ede8' }}>
        <label style={{ ...S.label, marginBottom: 8, fontSize: 12, color: '#374151' }}>링크 첨부 (Google Drive / Slides / Docs / PDF URL)</label>
        <LinkInput links={links} onChange={setLinks} />
      </div>
      <button onClick={handleSave} disabled={disabled}
        style={{ width: '100%', padding: '12px', background: disabled ? '#d1d5db' : '#0F6E56', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {saving ? '저장 중...' : fileLoading ? '파일 처리 중...' : (initial ? '수정 완료' : '노트 저장')}
      </button>
    </div>
  )
}

function NoteCard({ note, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const dateStr = note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : ''
  const imgCount = (note.images || []).length
  const fileCount = (note.attachedFiles || []).length
  const linkCount = (note.links || []).length
  const hasText = !!(note.content?.trim())

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 10, boxShadow: open ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}>
      <div onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 16px', background: open ? '#f0faf5' : '#fff', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, marginTop: 1, color: '#fff', fontWeight: 700 }}>N</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title || '제목 없음'}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{dateStr}</span>
            {note.category && <span style={{ fontSize: 10, color: '#0F6E56', background: '#f0faf5', border: '1px solid #d1fae5', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>{note.category}</span>}
            {imgCount > 0 && <span style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>{'사진 ' + imgCount}</span>}
            {fileCount > 0 && <span style={{ fontSize: 10, color: '#2563eb', background: '#eff6ff', borderRadius: 4, padding: '1px 6px' }}>{'파일 ' + fileCount}</span>}
            {linkCount > 0 && <span style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>{'링크 ' + linkCount}</span>}
            {hasText && <span style={{ fontSize: 10, color: '#6b7280', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>텍스트</span>}
            {(note.tags || []).map(t => <span key={t} style={{ fontSize: 10, color: '#0F6E56', background: '#f0faf5', border: '1px solid #d1fae5', borderRadius: 10, padding: '1px 6px' }}>{t}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); onEdit(note) }} style={{ fontSize: 11, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>수정</button>
          <button onClick={e => { e.stopPropagation(); onDelete(note.id) }} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: '1px solid #fca5a5', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>삭제</button>
          <span style={{ fontSize: 10, color: '#9ca3af', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>v</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '16px', borderTop: '1px solid #f0ede8', background: '#fff' }}>
          {hasText && <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.85, whiteSpace: 'pre-wrap', marginBottom: 14, background: '#fafaf9', borderRadius: 8, padding: '12px 14px', border: '1px solid #f0ede8' }}>{note.content}</div>}
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
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>{'첨부 파일 (' + fileCount + ')'}</div>
              {note.attachedFiles.map((f, i) => <FileAttachPreview key={i} file={f} />)}
            </div>
          )}
          {linkCount > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8 }}>{'첨부 링크 (' + linkCount + ')'}</div>
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
      <button onClick={() => onChange(1)} disabled={page === 1}
        style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === 1 ? '#d1d5db' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
        처음
      </button>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === 1 ? '#d1d5db' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
        이전
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          style={{ padding: '6px 11px', borderRadius: 7, border: page === p ? 'none' : '1px solid #e5e7eb', background: page === p ? '#0F6E56' : '#fff', color: page === p ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 700 : 400 }}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === totalPages ? '#d1d5db' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}>
        다음
      </button>
      <button onClick={() => onChange(totalPages)} disabled={page === totalPages}
        style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: page === totalPages ? '#d1d5db' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}>
        마지막
      </button>
      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>{page + ' / ' + totalPages + ' 페이지'}</span>
    </div>
  )
}

function EmptyState({ onAdd, search }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
        {search ? ('"' + search + '" 검색 결과 없음') : '질환 노트가 없습니다'}
      </div>
      <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
        {search ? '다른 키워드로 검색해보세요.' : '교재, 가이드라인 요약, 이미지, 파일을 첨부하세요.'}
      </div>
      {!search && <button onClick={onAdd} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>첫 노트 작성하기</button>}
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
    return onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  useEffect(() => { setPage(1) }, [search, catFilter])

  const saveNote = async (payload) => {
    if (editTarget) {
      await updateDoc(doc(db, 'diseaseNotes2', editTarget.id), { ...payload, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'diseaseNotes2'), { ...payload, createdAt: serverTimestamp() })
    }
    setShowForm(false); setEditTarget(null)
  }

  const deleteNote = async (id) => {
    if (!window.confirm('노트를 삭제하시겠습니까?')) return
    await deleteDoc(doc(db, 'diseaseNotes2', id))
  }

  const filtered = useMemo(() => notes.filter(n => {
    const catOk = catFilter === '전체' || n.category === catFilter
    const q = search.toLowerCase()
    const sOk = !q || [n.title, n.content, n.category, ...(n.tags || [])].some(t => t?.toLowerCase().includes(q))
    return catOk && sOk
  }), [notes, catFilter, search])

  const paginated = useMemo(() => {
    const start = (page - 1) * NOTES_PER_PAGE
    return filtered.slice(start, start + NOTES_PER_PAGE)
  }, [filtered, page])

  const formSheet = (showForm || editTarget) ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '16px 12px' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 960, padding: '32px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginTop: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f0ede8' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>{editTarget ? '노트 수정' : '새 질환 노트'}</div>
          <button onClick={() => { setShowForm(false); setEditTarget(null) }}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>x</button>
        </div>
        <NoteForm initial={editTarget} onSave={saveNote} />
      </div>
    </div>
  ) : null

  if (loading) return <Spinner />

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === '전체' ? notes.length : notes.filter(n => n.category === c).length
    return acc
  }, {})

  if (isMobile) {
    return (
      <div style={{ padding: '12px 16px', paddingBottom: 80 }}>
        <div style={{ marginBottom: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목, 내용, 태그 검색..."
            style={{ ...S.input, fontSize: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding: '4px 11px', borderRadius: 20, border: catFilter === c ? 'none' : '1px solid #e5e7eb', background: catFilter === c ? '#0F6E56' : '#fff', color: catFilter === c ? '#fff' : '#6b7280', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: catFilter === c ? 700 : 400 }}>
              {catCounts[c] > 0 ? (c + ' (' + catCounts[c] + ')') : c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length + '개 노트'}</span>
          <button onClick={() => setShowForm(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 새 노트</button>
        </div>
        {filtered.length === 0 ? <EmptyState onAdd={() => setShowForm(true)} search={search} /> : paginated.map(n => <NoteCard key={n.id} note={n} onEdit={n => setEditTarget(n)} onDelete={deleteNote} />)}
        <Pagination total={filtered.length} page={page} perPage={NOTES_PER_PAGE} onChange={setPage} />
        {formSheet}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #f0ede8' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="노트 검색..."
            style={{ ...S.input, fontSize: 12, padding: '7px 9px' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 8, border: 'none', background: catFilter === c ? '#f0faf5' : 'transparent', color: catFilter === c ? '#0F6E56' : '#374151', fontSize: 13, fontWeight: catFilter === c ? 700 : 400, cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
              <span>{c}</span>
              {catCounts[c] > 0 && <span style={{ fontSize: 11, background: catFilter === c ? '#dcfce7' : '#f3f4f6', color: catFilter === c ? '#0F6E56' : '#9ca3af', borderRadius: 10, padding: '1px 7px' }}>{catCounts[c]}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #f0ede8' }}>
          <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '10px', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 새 질환 노트</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f3ef', padding: '24px 28px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{catFilter === '전체' ? '전체 노트' : (catFilter + ' 노트')}</h2>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{filtered.length + '개'}</div>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ 새 노트</button>
        </div>
        {filtered.length === 0 ? <EmptyState onAdd={() => setShowForm(true)} search={search} /> : paginated.map(n => <NoteCard key={n.id} note={n} onEdit={n2 => setEditTarget(n2)} onDelete={deleteNote} />)}
        <Pagination total={filtered.length} page={page} perPage={NOTES_PER_PAGE} onChange={setPage} />
      </div>
      {formSheet}
    </div>
  )
}
