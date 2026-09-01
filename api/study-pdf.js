import fs from 'node:fs'
import path from 'node:path'

const DAYS = {
  11: { file: 'day-11-chest-pain-acs-red-flags.md', name: 'ClinicNote_D11_Chest_Pain.pdf' },
  12: { file: 'day-12-palpitations-ecg-monitoring.md', name: 'ClinicNote_D12_Palpitations.pdf' },
  13: { file: 'day-13-dizziness-bppv-orthostatic-central.md', name: 'ClinicNote_D13_Dizziness.pdf' },
  14: { file: 'day-14-syncope-presyncope-risk-referral.md', name: 'ClinicNote_D14_Syncope.pdf' },
  15: { file: 'day-15-leg-edema-dvt-hf-venous-medication.md', name: 'ClinicNote_D15_Leg_Edema.pdf' },
  16: { file: 'day-16-gerd-dyspepsia.md', name: 'ClinicNote_D16_GERD_Dyspepsia.pdf' },
  17: { file: 'day-17-acute-abdominal-pain.md', name: 'ClinicNote_D17_Acute_Abdominal_Pain.pdf' },
  18: { file: 'day-18-diarrhea.md', name: 'ClinicNote_D18_Diarrhea.pdf' },
}

function textWidthUnits(text) {
  let units = 0
  for (const ch of text) units += /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(ch) ? 2 : 1
  return units
}

function wrapLine(text, maxUnits = 82) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return ['']
  const words = clean.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (textWidthUnits(candidate) <= maxUnits) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    if (textWidthUnits(word) <= maxUnits) {
      current = word
      continue
    }
    let chunk = ''
    for (const ch of word) {
      if (textWidthUnits(chunk + ch) > maxUnits) {
        if (chunk) lines.push(chunk)
        chunk = ch
      } else chunk += ch
    }
    current = chunk
  }
  if (current) lines.push(current)
  return lines
}

function normalizeMarkdown(markdown) {
  const rows = []
  let inFence = false
  for (const raw of markdown.replace(/\r/g, '').split('\n')) {
    let line = raw.trimEnd()
    if (line.trim().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (!line.trim()) {
      rows.push({ text: '', kind: 'space' })
      continue
    }
    if (!inFence) {
      const heading = line.match(/^(#{1,4})\s+(.+)$/)
      if (heading) {
        rows.push({ text: heading[2].replace(/\*\*/g, ''), kind: heading[1].length <= 2 ? 'h1' : 'h2' })
        continue
      }
      line = line.replace(/^>\s?/, '').replace(/^[-*]\s+/, '• ').replace(/\*\*/g, '').replace(/`/g, '')
    }
    rows.push({ text: line, kind: /^\d+[.)]\s/.test(line) ? 'body' : 'body' })
  }
  return rows
}

function ucs2Hex(text) {
  let hex = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    const safe = cp <= 0xffff ? cp : 0x25a1
    hex += safe.toString(16).padStart(4, '0').toUpperCase()
  }
  return hex
}

function makePdf(markdown) {
  const rows = normalizeMarkdown(markdown)
  const pages = []
  let current = []
  let y = 790

  const add = (text, kind = 'body') => {
    const size = kind === 'h1' ? 15 : kind === 'h2' ? 12 : 9.6
    const leading = kind === 'h1' ? 23 : kind === 'h2' ? 19 : 15
    const maxUnits = kind === 'h1' ? 58 : kind === 'h2' ? 70 : 88
    const wrapped = text ? wrapLine(text, maxUnits) : ['']
    for (const line of wrapped) {
      if (y < 56) {
        pages.push(current)
        current = []
        y = 790
      }
      current.push({ text: line, kind, size, y })
      y -= line ? leading : 8
    }
    if (kind === 'h1' || kind === 'h2') y -= 3
  }

  rows.forEach(row => add(row.text, row.kind))
  if (current.length || !pages.length) pages.push(current)

  const objects = new Map()
  const pageNums = []
  const contentNums = []
  let next = 5
  pages.forEach(() => {
    pageNums.push(next)
    contentNums.push(next + 1)
    next += 2
  })

  objects.set(1, Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'))
  objects.set(2, Buffer.from(`<< /Type /Pages /Kids [${pageNums.map(n => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`))
  objects.set(3, Buffer.from('<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [4 0 R] >>'))
  objects.set(4, Buffer.from('<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 1 >> /DW 1000 >>'))

  pages.forEach((lines, index) => {
    const pnum = pageNums[index]
    const cnum = contentNums[index]
    const commands = ['BT']
    for (const line of lines) {
      if (!line.text) continue
      commands.push(`/F1 ${line.size} Tf`)
      commands.push(`1 0 0 1 48 ${line.y} Tm`)
      commands.push(`<${ucs2Hex(line.text)}> Tj`)
    }
    commands.push('ET')
    const stream = Buffer.from(commands.join('\n'), 'ascii')
    objects.set(cnum, Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`), stream, Buffer.from('\nendstream')]))
    objects.set(pnum, Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${cnum} 0 R >>`))
  })

  const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary')]
  const offsets = new Array(next).fill(0)
  let length = chunks[0].length
  for (let i = 1; i < next; i += 1) {
    offsets[i] = length
    const chunk = Buffer.concat([Buffer.from(`${i} 0 obj\n`), objects.get(i), Buffer.from('\nendobj\n')])
    chunks.push(chunk)
    length += chunk.length
  }
  const xref = length
  let trailer = `xref\n0 ${next}\n0000000000 65535 f \n`
  for (let i = 1; i < next; i += 1) trailer += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  trailer += `trailer\n<< /Size ${next} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  chunks.push(Buffer.from(trailer))
  return Buffer.concat(chunks)
}

export default function handler(req, res) {
  const day = Number(req.query.day)
  const config = DAYS[day]
  if (!config) return res.status(404).json({ error: '지원하지 않는 Adult Daily day입니다.' })

  try {
    const masterPath = path.join(process.cwd(), 'public', 'adult-daily', 'master', config.file)
    const markdown = fs.readFileSync(masterPath, 'utf8')
    const pdf = makePdf(markdown)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${config.name}"`)
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600')
    return res.status(200).send(pdf)
  } catch (error) {
    console.error('[study-pdf]', error)
    return res.status(500).json({ error: 'PDF 생성에 실패했습니다.' })
  }
}
