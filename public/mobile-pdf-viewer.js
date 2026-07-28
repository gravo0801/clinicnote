(function () {
  'use strict'

  const VERSION = '3.11.174'
  const WORKER = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${VERSION}/build/pdf.worker.min.js`
  const TOUCH = 44
  let readyPromise

  function pdfjs() {
    if (readyPromise) return readyPromise
    readyPromise = new Promise((resolve, reject) => {
      let count = 0
      const poll = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER
          resolve(window.pdfjsLib)
        } else if (++count > 80) reject(new Error('PDF.js 로드 실패'))
        else setTimeout(poll, 100)
      }
      poll()
    })
    return readyPromise
  }

  function isPdf(url) {
    if (!url) return false
    try { return /\.pdf(?:$|[?#])/i.test(decodeURIComponent(new URL(url, location.href).href)) }
    catch (_) { return /\.pdf(?:$|[?#])/i.test(String(url)) }
  }

  function iframeSource(iframe) {
    const src = iframe.getAttribute('src') || ''
    if (src.startsWith('blob:')) return src
    try {
      const url = new URL(src, location.href)
      if (url.hostname === 'docs.google.com' && url.pathname.includes('/viewer')) {
        const original = url.searchParams.get('url')
        return isPdf(original) ? original : null
      }
    } catch (_) {}
    return null
  }

  function style(el, rules) { Object.assign(el.style, rules); return el }

  function originalLink(url, label) {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.dataset.pdfOriginal = '1'
    link.textContent = label || '원본 열기'
    return style(link, {
      minHeight: `${TOUCH}px`, padding: '9px 13px', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
      border: '1px solid #bfdbfe', borderRadius: '8px', background: '#eff6ff',
      color: '#2563eb', fontSize: '13px', fontWeight: '700', textDecoration: 'none'
    })
  }

  function viewerShell(url, title, modal) {
    const root = style(document.createElement('section'), {
      width: '100%', height: modal ? '100%' : 'min(72vh,760px)',
      minHeight: modal ? '0' : '420px', display: 'flex', flexDirection: 'column',
      background: '#f3f4f6', overflow: 'hidden', boxSizing: 'border-box'
    })
    root.className = 'cn-pdfjs-viewer'
    const bar = style(document.createElement('div'), {
      minHeight: `${TOUCH}px`, padding: '8px 10px', display: 'flex', alignItems: 'center',
      gap: '8px', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: '0'
    })
    const name = style(document.createElement('div'), {
      flex: '1', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis',
      whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '700'
    })
    name.textContent = title || 'PDF 문서'
    const progress = style(document.createElement('span'), { fontSize: '12px', color: '#6b7280', flexShrink: '0' })
    progress.textContent = '준비 중…'
    bar.append(name, progress, originalLink(url))
    const viewport = style(document.createElement('div'), {
      flex: '1', minHeight: '0', overflow: 'auto', WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain', padding: '12px 8px 24px', boxSizing: 'border-box'
    })
    const pages = style(document.createElement('div'), { width: '100%', maxWidth: '980px', margin: '0 auto' })
    viewport.append(pages)
    root.append(bar, viewport)
    return { root, viewport, pages, progress }
  }

  function fail(shell, url, error) {
    const box = style(document.createElement('div'), {
      maxWidth: '560px', margin: '20px auto', padding: '20px', textAlign: 'center',
      background: '#fff', border: '1px solid #fecaca', borderRadius: '12px', boxSizing: 'border-box'
    })
    const title = style(document.createElement('div'), { color: '#991b1b', fontSize: '14px', fontWeight: '800', marginBottom: '8px' })
    title.textContent = 'PDF를 앱 안에서 열지 못했습니다.'
    const detail = style(document.createElement('div'), { color: '#6b7280', fontSize: '12px', lineHeight: '1.6', marginBottom: '14px' })
    detail.textContent = error?.message || '네트워크 또는 파일 형식을 확인해 주세요.'
    box.append(title, detail, originalLink(url, '원본 PDF 열기'))
    shell.pages.replaceChildren(box)
    shell.progress.textContent = '열기 실패'
  }

  async function bytes(url) {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
    if (!response.ok) throw new Error(`파일 요청 실패 (${response.status})`)
    if ((response.headers.get('content-type') || '').includes('text/html')) throw new Error('PDF 대신 HTML 응답을 받았습니다.')
    const data = new Uint8Array(await response.arrayBuffer())
    if (!data.byteLength) throw new Error('빈 PDF 파일입니다.')
    return data
  }

  async function renderPage(pdf, number, holder, scroller) {
    if (holder.dataset.busy === '1' || holder.dataset.done === '1') return
    holder.dataset.busy = '1'
    try {
      const page = await pdf.getPage(number)
      if (!holder.isConnected) return
      const base = page.getViewport({ scale: 1 })
      const width = Math.max(260, Math.min(960, (scroller.clientWidth || 700) - 18))
      const scale = width / base.width
      const cssViewport = page.getViewport({ scale })
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const renderViewport = page.getViewport({ scale: scale * dpr })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(renderViewport.width)
      canvas.height = Math.floor(renderViewport.height)
      style(canvas, {
        width: `${Math.floor(cssViewport.width)}px`, height: `${Math.floor(cssViewport.height)}px`,
        maxWidth: '100%', display: 'block'
      })
      canvas.setAttribute('aria-label', `PDF ${number}쪽`)
      holder.replaceChildren(canvas)
      holder.style.minHeight = `${Math.floor(cssViewport.height)}px`
      holder.dataset.done = '1'
      const task = page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport: renderViewport })
      holder.__task = task
      await task.promise
      page.cleanup()
    } catch (error) {
      if (error?.name !== 'RenderingCancelledException') {
        holder.textContent = `${number}쪽 렌더링 실패`
        holder.style.color = '#991b1b'
      }
    } finally { holder.dataset.busy = '0' }
  }

  async function render(url, title, host, modal) {
    const shell = viewerShell(url, title, modal)
    host.replaceChildren(shell.root)
    let pdf
    let observer
    const cleanup = () => {
      observer?.disconnect()
      shell.pages.querySelectorAll('[data-page]').forEach((holder) => { try { holder.__task?.cancel() } catch (_) {} })
      try { pdf?.destroy() } catch (_) {}
    }
    shell.root.__pdfCleanup = cleanup
    try {
      const lib = await pdfjs()
      shell.progress.textContent = '파일 불러오는 중…'
      const data = url.startsWith('blob:') ? new Uint8Array(await (await fetch(url)).arrayBuffer()) : await bytes(url)
      pdf = await lib.getDocument({ data }).promise
      if (!shell.root.isConnected) return cleanup()
      shell.progress.textContent = `${pdf.numPages}쪽`
      const estimated = Math.max(420, Math.min(1280, (shell.viewport.clientWidth || 700) * 1.42))
      const holders = []
      for (let n = 1; n <= pdf.numPages; n += 1) {
        const holder = style(document.createElement('article'), {
          width: 'fit-content', maxWidth: '100%', minHeight: `${estimated}px`, margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff',
          color: '#9ca3af', fontSize: '12px', boxShadow: '0 1px 4px rgba(0,0,0,.15)'
        })
        holder.dataset.page = String(n)
        holder.textContent = `${n}쪽 준비 중…`
        shell.pages.append(holder)
        holders.push(holder)
      }
      observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        observer.unobserve(entry.target)
        renderPage(pdf, Number(entry.target.dataset.page), entry.target, shell.viewport)
      }), { root: shell.viewport, rootMargin: '900px 0px', threshold: .01 })
      holders.forEach((holder) => observer.observe(holder))
      const removal = new MutationObserver(() => {
        if (!shell.root.isConnected) { removal.disconnect(); cleanup() }
      })
      removal.observe(document.documentElement, { childList: true, subtree: true })
    } catch (error) {
      console.error('[ClinicNote PDF viewer]', error)
      fail(shell, url, error)
    }
  }

  function enhanceIframe(iframe) {
    if (!iframe || iframe.dataset.pdfEnhanced === '1') return
    const url = iframeSource(iframe)
    if (!url) return
    iframe.dataset.pdfEnhanced = '1'
    const host = style(document.createElement('div'), { width: '100%', minHeight: '420px', background: '#f3f4f6' })
    const title = iframe.getAttribute('title') || 'PDF 문서'
    iframe.replaceWith(host)
    render(url, title, host, false)
  }

  function enlargeControls(root) {
    const nodes = [root, ...Array.from(root.querySelectorAll?.('button,a[href]') || [])]
    nodes.forEach((el) => {
      if (!(el instanceof HTMLElement)) return
      const label = el.textContent?.trim()
      const href = el instanceof HTMLAnchorElement ? el.href : ''
      const context = el.parentElement?.parentElement?.textContent || el.parentElement?.textContent || ''
      if (!(context.includes('[PDF]') || isPdf(href))) return
      if (!['미리보기', '접기', '열기'].includes(label)) return
      style(el, { minHeight: `${TOUCH}px`, minWidth: `${TOUCH}px`, paddingTop: '8px', paddingBottom: '8px', boxSizing: 'border-box' })
      if (el instanceof HTMLAnchorElement) style(el, { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' })
    })
  }

  function scan(root) {
    if (!root || root.nodeType !== 1) return
    enlargeControls(root)
    if (root.matches?.('iframe')) enhanceIframe(root)
    root.querySelectorAll?.('iframe').forEach(enhanceIframe)
  }

  function modal(url, title) {
    const overlay = style(document.createElement('div'), {
      position: 'fixed', inset: '0', zIndex: '10050', display: 'flex', flexDirection: 'column', background: '#f3f4f6'
    })
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    const header = style(document.createElement('div'), {
      minHeight: '56px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px',
      background: '#fff', borderBottom: '1px solid #e5e7eb'
    })
    const heading = style(document.createElement('div'), {
      flex: '1', minWidth: '0', fontSize: '14px', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    })
    heading.textContent = title || 'PDF 문서'
    const body = style(document.createElement('div'), { flex: '1', minHeight: '0', overflow: 'hidden' })
    const previous = document.body.style.overflow
    const close = () => {
      try { body.querySelector('.cn-pdfjs-viewer')?.__pdfCleanup?.() } catch (_) {}
      document.removeEventListener('keydown', onKey)
      overlay.remove()
      document.body.style.overflow = previous
    }
    const onKey = (event) => { if (event.key === 'Escape') close() }
    const closeButton = document.createElement('button')
    closeButton.type = 'button'
    closeButton.textContent = '닫기'
    style(closeButton, {
      minHeight: `${TOUCH}px`, minWidth: `${TOUCH}px`, padding: '9px 13px', border: '1px solid #C2410C',
      borderRadius: '8px', background: '#C2410C', color: '#fff', fontWeight: '700', cursor: 'pointer'
    })
    closeButton.addEventListener('click', close)
    header.append(heading, closeButton)
    overlay.append(header, body)
    document.body.style.overflow = 'hidden'
    document.body.append(overlay)
    document.addEventListener('keydown', onKey)
    closeButton.focus()
    render(url, title, body, true)
  }

  function onClick(event) {
    const link = event.target.closest?.('a[href]')
    if (!link || link.dataset.pdfOriginal === '1' || link.textContent.trim() !== '열기' || !isPdf(link.href)) return
    event.preventDefault()
    event.stopPropagation()
    const title = link.parentElement?.querySelector('span:nth-of-type(2)')?.textContent?.trim() || 'PDF 문서'
    modal(link.href, title)
  }

  function start() {
    scan(document.documentElement)
    new MutationObserver((changes) => changes.forEach((change) => change.addedNodes.forEach(scan)))
      .observe(document.documentElement, { childList: true, subtree: true })
    document.addEventListener('click', onClick, true)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
})()
