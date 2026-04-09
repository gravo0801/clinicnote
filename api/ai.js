import https from 'https'

function callAnthropic(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Anthropic API 오류 (${res.statusCode}): ${data.slice(0, 300)}`))
          return
        }
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`응답 파싱 오류: ${e.message}`)) }
      })
    })

    req.on('error', (e) => reject(new Error(`네트워크 오류: ${e.message}`)))
    req.write(body)
    req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, caseData } = req.body || {}
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured. Vercel 환경변수에 ANTHROPIC_API_KEY를 추가하세요.' })
  }

  const p = caseData?.patient || {}
  const dx = caseData?.diagnosis || {}
  const base = `환자: ${p.gender||''}/${p.age||''}세, 주호소: ${p.chiefComplaint||''}, 진단: ${dx.impression||''} (${dx.diseases?.[0]?.kcd?.code||''})`

  const prompts = {
    knowledge: `당신은 임상의학 전문가입니다. 아래 케이스를 바탕으로 관련 의학 지식을 JSON으로 정리하세요. 마크다운 없이 순수 JSON만 출력하세요.
케이스: ${base}
형식: {"sections":[{"title":"병태생리","content":"..."},{"title":"진단 기준","content":"..."},{"title":"감별 진단","content":"..."},{"title":"치료 원칙","content":"..."},{"title":"예후 및 추적","content":"..."}]}`,

    papers: `당신은 의학문헌 전문가입니다. 아래 케이스 관련 주요 가이드라인 및 근거 논문을 JSON으로 정리하세요. 마크다운 없이 순수 JSON만 출력하세요.
케이스: ${base}
형식: {"papers":[{"title":"논문/가이드라인 제목","journal":"저널명","year":"연도","keyPoints":"핵심 내용","level":"근거수준"}]}
5개 이내.`,

    revenue: `당신은 1차 의료기관 경영 컨설턴트입니다. 아래 진단명을 바탕으로 적법한 범위 내 매출 증대 방안을 JSON으로 정리하세요. 마크다운 없이 순수 JSON만 출력하세요.
케이스: ${base}
형식: {"strategies":[{"category":"카테고리","title":"전략명","detail":"구체적 방법","impact":"예상 효과"}]}
5개 이내.`
  }

  const prompt = prompts[type]
  if (!prompt) return res.status(400).json({ error: 'Invalid type' })

  try {
    const data = await callAnthropic(apiKey, prompt)
    const text = data.content?.[0]?.text || ''

    const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: `JSON 없음: ${text.slice(0, 200)}` })

    return res.status(200).json(JSON.parse(jsonMatch[0]))
  } catch (err) {
    console.error('ai handler error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
