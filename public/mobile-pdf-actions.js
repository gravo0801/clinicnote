(function () {
  'use strict'

  function isPdf(url) {
    try { return /\.pdf(?:$|[?#])/i.test(decodeURIComponent(new URL(url, location.href).href)) }
    catch (_) { return /\.pdf(?:$|[?#])/i.test(String(url || '')) }
  }

  function isFoldOrMobile() {
    return window.matchMedia('(max-width: 1100px)').matches || (navigator.maxTouchPoints || 0) > 0
  }

  document.addEventListener('click', function (event) {
    const link = event.target.closest?.('a[href]')
    if (!link || link.dataset.pdfActionBridge === '1') return
    if (link.textContent.trim() !== 'PDF 다운로드' || !isPdf(link.href) || !isFoldOrMobile()) return

    event.preventDefault()
    event.stopPropagation()
    link.dataset.pdfActionBridge = '1'
    const original = link.textContent
    link.textContent = '열기'
    link.click()
    window.setTimeout(function () {
      link.textContent = original
      delete link.dataset.pdfActionBridge
    }, 0)
  }, false)
})()
