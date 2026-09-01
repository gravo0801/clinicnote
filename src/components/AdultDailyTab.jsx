import { useEffect, useMemo, useRef, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { adultCurriculum, adultDailyTemplate } from '../data/adultCurriculum'
import { adultDailyContent } from '../data/adultDailyContent'
import { db } from '../firebase'
import { useIsMobile } from './ui'

const ADULT_DAILY_VERSION = 'v2026.09.01'
const ADULT_DAILY_UPDATED_AT = '2026-09-01'
const MATERIALS_COLLECTION = 'adultDailyMaterials'

const planSummary = [
  { label: '목표', value: '개원 전 성인 1차진료 반복 질환을 진료실 루틴으로 만들기' },
  { label: '속도', value: '하루 1주제, 가벼운 주제는 하루 2주제까지 묶음' },
  { label: '산출물', value: 'master 원본 + A4 HTML + iPad용 PDF + 앱 카드' },
  { label: '검토 기준', value: '증상 접근, KCD, 처방, 추적, refer, 환자 설명' },
  { label: '버전', value: `${ADULT_DAILY_VERSION} · 업데이트 ${ADULT_DAILY_UPDATED_AT}` },
]

function flattenCurriculum() {
  const rows = []
  adultCurriculum.forEach(week => {
    week.topics.forEach((topic, idx) => {
      rows.push({
        day: rows.length + 1,
        week: week.week,
        theme: week.theme,
        topic,
        slot: idx + 1,
      })
    })
  })
  return rows
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', 'clinicnote_unsigned')
    form.append('folder', 'clinicnote/adult-daily')

    fetch('https://api.cloudinary.com/v1_1/dvjveqyxo/auto/upload', {
      method: 'POST',
      body: form,
    })
      .then(response => response.json())
      .then(data => {
        if (!data.secure_url) {
          reject(new Error(data.error?.message || '파일 업로드에 실패했습니다.'))
          return
        }
        resolve({
          url: data.secure_url,
          name: file.name,
          type: file.type || data.resource_type || '',
          size: file.size,
          publicId: data.public_id || '',
          resourceType: data.resource_type || '',
        })
      })
      .catch(reject)
  })
}

function timestampValue(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDate(value) {
  const millis = timestampValue(value)
  if (!millis) return '방금 전'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(millis))
}

function formatBytes(size) {
  if (!Number.isFinite(size) || size <= 0) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`
}

const S = {
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '3px 9px',
    fontSize: 11,
    fontWeight: 700,
    background: '#FFEDD5',
    color: '#9A330A',
    border: '1px solid #FED7AA',
  },
  card: {
    background: '#fff',
    border: '1px solid #E7E2D7',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  actionLink: {
    minHeight: 40,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    borderRadius: 8,
    padding: '7px 11px',
    fontWeight: 800,
    textDecoration: 'none',
  },
}

export default function AdultDailyTab() {
  const isMobile = useIsMobile()
  const topics = useMemo(flattenCurriculum, [])
  const contentByDay = useMemo(() => new Map(adultDailyContent.map(item => [item.day, item])), [])
  const fileInputRef = useRef(null)
  const [selectedDay, setSelectedDay] = useState(1)
  const [doneUntil, setDoneUntil] = useState(() => Number(localStorage.getItem('adult_daily_completed') || 0))
  const [materials, setMaterials] = useState([])
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [materialsError, setMaterialsError] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const selected = topics.find(t => t.day === selectedDay) || topics[0]
  const content = contentByDay.get(selected.day)
  const dayMaterials = useMemo(
    () => materials.filter(item => Number(item.day) === Number(selected.day)),
    [materials, selected.day],
  )
  const materialCountByDay = useMemo(() => {
    const counts = new Map()
    materials.forEach(item => {
      const day = Number(item.day)
      counts.set(day, (counts.get(day) || 0) + 1)
    })
    return counts
  }, [materials])

  useEffect(() => {
    setMaterialsLoading(true)
    const unsubscribe = onSnapshot(
      collection(db, MATERIALS_COLLECTION),
      snapshot => {
        const next = snapshot.docs
          .map(item => ({ id: item.id, ...item.data() }))
          .sort((a, b) => timestampValue(b.createdAt) - timestampValue(a.createdAt))
        setMaterials(next)
        setMaterialsError('')
        setMaterialsLoading(false)
      },
      error => {
        console.error('[AdultDaily materials]', error)
        setMaterialsError('업로드 자료 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.')
        setMaterialsLoading(false)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    setUploadTitle('')
    setSelectedFiles([])
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [selected.day])

  const markDone = () => {
    const next = Math.max(doneUntil, selected.day)
    localStorage.setItem('adult_daily_completed', String(next))
    setDoneUntil(next)
    window.dispatchEvent(new Event('storage'))
  }

  const chooseFiles = event => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
    setUploadError('')
    if (!uploadTitle.trim() && files.length === 1) {
      setUploadTitle(files[0].name.replace(/\.[^.]+$/, ''))
    }
  }

  const removeSelectedFile = index => {
    setSelectedFiles(current => current.filter((_, fileIndex) => fileIndex !== index))
  }

  const resetUploadForm = () => {
    setUploadTitle('')
    setSelectedFiles([])
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveMaterials = async () => {
    if (!selectedFiles.length) {
      setUploadError('업로드할 파일을 먼저 선택해 주세요.')
      return
    }

    setUploading(true)
    setUploadError('')
    try {
      const uploadedFiles = await Promise.all(selectedFiles.map(uploadToCloudinary))
      await addDoc(collection(db, MATERIALS_COLLECTION), {
        day: selected.day,
        topic: selected.topic,
        title: uploadTitle.trim() || `${selected.topic} 공부자료`,
        files: uploadedFiles,
        createdAt: serverTimestamp(),
      })
      resetUploadForm()
    } catch (error) {
      console.error('[AdultDaily upload]', error)
      setUploadError(error?.message || '공부자료 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const removeMaterial = async item => {
    const confirmed = window.confirm(`“${item.title || '공부자료'}” 항목을 목록에서 삭제하시겠습니까?`)
    if (!confirmed) return
    try {
      await deleteDoc(doc(db, MATERIALS_COLLECTION, item.id))
    } catch (error) {
      console.error('[AdultDaily delete]', error)
      window.alert('자료를 삭제하지 못했습니다. 다시 시도해 주세요.')
    }
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#F9F6F1', padding: isMobile ? '16px' : '28px 32px 48px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <section style={{ ...S.card, padding: isMobile ? 18 : 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ ...S.pill, marginBottom: 10 }}>Adult Primary Care Daily</div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, lineHeight: 1.25, letterSpacing: '-0.4px' }}>성인 1차진료 학습</h1>
              <p style={{ margin: '8px 0 0', color: '#78716C', fontSize: 14, lineHeight: 1.7 }}>
                동네 의원에서 자주 보는 성인 증상, 만성질환, 비급여 상담 영역을 진료실에서 바로 쓰는 단위로 누적합니다.
              </p>
            </div>
            <div style={{
              border: '1px solid #E7E2D7',
              background: '#FAF7F1',
              color: '#78716C',
              borderRadius: 9,
              padding: '9px 12px',
              fontSize: 12.5,
              lineHeight: 1.45,
              maxWidth: 280,
            }}>출력은 각 단원 카드의 A4 HTML 열기에서 진행합니다.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))', gap: 10, marginTop: 18 }}>
            {planSummary.map(item => (
              <div key={item.label} style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#C2410C', fontWeight: 800, marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: '#1C1917', lineHeight: 1.55 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: 16 }}>
          <aside style={{ ...S.card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3EFE7', background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1917' }}>{adultCurriculum.length}주 커리큘럼</div>
              <div style={{ fontSize: 12, color: '#78716C', marginTop: 3 }}>총 {topics.length}개 주제</div>
            </div>
            <div style={{ maxHeight: isMobile ? 'none' : 'calc(100vh - 260px)', overflowY: 'auto', padding: 10 }}>
              {adultCurriculum.map(week => (
                <div key={week.week} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#9A330A', padding: '6px 8px' }}>
                    Week {week.week}. {week.theme}
                  </div>
                  {week.topics.map(topic => {
                    const row = topics.find(t => t.topic === topic)
                    const active = row.day === selected.day
                    const hasContent = contentByDay.has(row.day)
                    const uploadCount = materialCountByDay.get(row.day) || 0
                    const done = row.day <= doneUntil
                    return (
                      <button key={topic} onClick={() => setSelectedDay(row.day)} style={{
                        width: '100%',
                        border: 'none',
                        borderRadius: 8,
                        background: active ? '#FEF7F0' : done ? '#F0FDF4' : 'transparent',
                        color: active ? '#C2410C' : '#44403C',
                        padding: '8px 9px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        marginBottom: 2,
                        fontFamily: 'inherit',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: done ? '#65A30D' : active ? '#C2410C' : '#A8A29E', minWidth: 28 }}>
                          D{String(row.day).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                          {topic}
                          {hasContent && <span style={{ marginLeft: 6, fontSize: 10, color: '#65A30D', fontWeight: 900 }}>카드</span>}
                          {uploadCount > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: '#2563EB', fontWeight: 900 }}>첨부 {uploadCount}</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </aside>

          <main style={{ ...S.card, padding: isMobile ? 18 : 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={S.pill}>Day {selected.day}</span>
                  <span style={{ ...S.pill, background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}>{selected.theme}</span>
                  <span style={{ ...S.pill, background: content ? '#F0FDF4' : '#F3F4F6', borderColor: content ? '#BBF7D0' : '#E5E7EB', color: content ? '#166534' : '#6B7280' }}>
                    {content ? '진료 카드 있음' : '진료 카드 준비 중'}
                  </span>
                  <span style={{ ...S.pill, background: dayMaterials.length ? '#EFF6FF' : '#F3F4F6', borderColor: dayMaterials.length ? '#BFDBFE' : '#E5E7EB', color: dayMaterials.length ? '#1D4ED8' : '#6B7280' }}>
                    업로드 자료 {dayMaterials.length}개
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: isMobile ? 21 : 25, lineHeight: 1.3, letterSpacing: '-0.3px' }}>{selected.topic}</h2>
                {content?.date && <div style={{ fontSize: 12, color: '#78716C', marginTop: 6 }}>작성일 {content.date}</div>}
              </div>
              <button onClick={markDone} style={{
                minHeight: 44,
                border: 'none',
                background: selected.day <= doneUntil ? '#65A30D' : '#C2410C',
                color: '#fff',
                borderRadius: 9,
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}>{selected.day <= doneUntil ? '학습 완료됨' : '학습 완료 체크'}</button>
            </div>

            <section style={{ border: '1px solid #BFDBFE', background: '#F8FBFF', borderRadius: 12, padding: isMobile ? 14 : 16, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#1E3A8A' }}>공부자료 업로드</div>
                  <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.6, marginTop: 4 }}>
                    현재 선택한 Day {selected.day} · {selected.topic}에 PDF, 이미지, 워드, 엑셀, PPT 파일을 저장합니다.
                  </div>
                </div>
                <span style={{ ...S.pill, color: '#1D4ED8', background: '#EFF6FF', borderColor: '#BFDBFE' }}>첨부 {dayMaterials.length}개</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(180px, 1fr) auto', gap: 9, alignItems: 'center' }}>
                <input
                  value={uploadTitle}
                  onChange={event => setUploadTitle(event.target.value)}
                  placeholder="자료 제목 (선택사항)"
                  style={{
                    width: '100%', minHeight: 44, boxSizing: 'border-box', border: '1px solid #CBD5E1', borderRadius: 9,
                    background: '#fff', padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    minHeight: 44, border: '1px solid #93C5FD', borderRadius: 9, background: '#EFF6FF', color: '#1D4ED8',
                    padding: '9px 14px', fontWeight: 900, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }}
                >파일 선택</button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*,.doc,.docx,.hwp,.hwpx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md"
                  onChange={chooseFiles}
                  style={{ display: 'none' }}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ marginTop: 10, display: 'grid', gap: 7 }}>
                  {selectedFiles.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} style={{
                      display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #DBEAFE', borderRadius: 8,
                      padding: '8px 10px', minWidth: 0,
                    }}>
                      <span style={{ fontSize: 16 }}>📎</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: '#1E293B', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{formatBytes(file.size)}</div>
                      </div>
                      <button type="button" onClick={() => removeSelectedFile(index)} disabled={uploading} style={{
                        minWidth: 40, minHeight: 40, border: 'none', background: 'transparent', color: '#DC2626', fontWeight: 800,
                        cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}>제거</button>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && <div style={{ marginTop: 10, color: '#B91C1C', fontSize: 12.5, fontWeight: 700 }}>{uploadError}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {selectedFiles.length > 0 && (
                  <button type="button" onClick={resetUploadForm} disabled={uploading} style={{
                    minHeight: 44, border: '1px solid #CBD5E1', borderRadius: 9, background: '#fff', color: '#475569',
                    padding: '9px 14px', fontWeight: 800, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  }}>선택 취소</button>
                )}
                <button type="button" onClick={saveMaterials} disabled={uploading || !selectedFiles.length} style={{
                  minHeight: 44, border: 'none', borderRadius: 9, background: uploading || !selectedFiles.length ? '#94A3B8' : '#2563EB',
                  color: '#fff', padding: '9px 16px', fontWeight: 900, cursor: uploading || !selectedFiles.length ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}>{uploading ? '업로드 중…' : '공부자료 업로드'}</button>
              </div>
            </section>

            <section style={{ border: '1px solid #E7E2D7', background: '#fff', borderRadius: 12, padding: isMobile ? 14 : 16, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#1C1917' }}>업로드한 공부자료</div>
                <div style={{ fontSize: 11.5, color: '#78716C' }}>Day {selected.day}</div>
              </div>

              {materialsLoading ? (
                <div style={{ fontSize: 13, color: '#78716C', padding: '10px 0' }}>자료 목록을 불러오는 중입니다…</div>
              ) : materialsError ? (
                <div style={{ fontSize: 13, color: '#B91C1C', padding: '10px 0' }}>{materialsError}</div>
              ) : dayMaterials.length === 0 ? (
                <div style={{ fontSize: 13, color: '#78716C', lineHeight: 1.7, padding: '8px 0' }}>이 Day에 업로드한 공부자료가 아직 없습니다.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {dayMaterials.map(item => (
                    <article key={item.id} style={{ border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, color: '#0F172A', fontWeight: 900, lineHeight: 1.45 }}>{item.title || '공부자료'}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{formatDate(item.createdAt)}</div>
                        </div>
                        <button type="button" onClick={() => removeMaterial(item)} style={{
                          minWidth: 44, minHeight: 44, border: '1px solid #FECACA', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C',
                          fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                        }}>삭제</button>
                      </div>
                      <div style={{ display: 'grid', gap: 7 }}>
                        {(Array.isArray(item.files) ? item.files : []).map((file, index) => (
                          <div key={`${file.url || file.name}-${index}`} style={{
                            display: 'flex', alignItems: 'center', gap: 8, borderTop: index ? '1px solid #E2E8F0' : 'none', paddingTop: index ? 7 : 0,
                          }}>
                            <span style={{ fontSize: 15 }}>{/\.pdf(?:$|[?#])/i.test(file.url || file.name || '') ? '📄' : '📎'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, color: '#334155', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name || '첨부파일'}</div>
                              {file.size > 0 && <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>{formatBytes(file.size)}</div>}
                            </div>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ ...S.actionLink, minHeight: 44, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', flexShrink: 0 }}>열기</a>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {content ? (
              <>
                <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1C1917' }}>오늘의 진료 카드</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {content.printPath && (
                        <a href={content.printPath} target="_blank" rel="noopener noreferrer" style={{ ...S.actionLink, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>A4 HTML 열기</a>
                      )}
                      {content.pdfPath && (
                        <a href={content.pdfPath} target="_blank" rel="noopener noreferrer" style={{ ...S.actionLink, color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>PDF 다운로드</a>
                      )}
                      {content.masterPath && (
                        <a href={content.masterPath} target="_blank" rel="noopener noreferrer" style={{ ...S.actionLink, color: '#7C2D12', background: '#FFF7ED', border: '1px solid #FED7AA' }}>master 원본</a>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#44403C', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: content.appHtml }} />
                </div>
                {content.revisions?.length > 0 && (
                  <div style={{ border: '1px solid #E7E2D7', background: '#fff', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1C1917', marginBottom: 8 }}>업데이트 이력</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#44403C', fontSize: 13, lineHeight: 1.7 }}>
                      {content.revisions.map((revision, index) => <li key={index}>{revision}</li>)}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: '#FAF7F1', border: '1px solid #F3EFE7', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C1917', marginBottom: 8 }}>작성 원칙</div>
                <div style={{ fontSize: 13.5, color: '#44403C', lineHeight: 1.8 }}>
                  매일 자료는 &quot;내가 의원에서 볼 환자인가, 당일 의뢰할 환자인가&quot;를 먼저 나누고,
                  그 다음 검사, 상병코드, 처방 regimen, 추적 계획으로 내려갑니다.
                  이 주제는 아직 자료 생성 전입니다.
                </div>
              </div>
            )}

            {!content && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {adultDailyTemplate.map((item, index) => (
                  <div key={item} style={{ border: '1px solid #E7E2D7', borderRadius: 10, padding: '12px 14px', background: '#fff' }}>
                    <div style={{ fontSize: 11, color: '#C2410C', fontWeight: 900, marginBottom: 5 }}>{String(index + 1).padStart(2, '0')}</div>
                    <div style={{ fontSize: 13.5, color: '#1C1917', lineHeight: 1.55 }}>{item}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 18, border: '1px solid #BFDBFE', background: '#EFF6FF', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#1E3A8A', marginBottom: 6 }}>자료 관리 안내</div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
                각 Day에서 공부자료를 직접 업로드하면 해당 단원에 누적 저장됩니다. PDF의 “열기” 버튼은 PC와 모바일 모두 앱 내부 PDF 뷰어로 연결됩니다.
              </div>
            </div>
          </main>
        </div>
      </div>

      <style>{`
        @media print {
          aside, button, input { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  )
}
