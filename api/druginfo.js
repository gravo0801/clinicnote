import https from 'https'

function callAnthropic(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
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
      res.on('data', c => { data += c })
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`API 오류 (${res.statusCode}): ${data.slice(0,200)}`)); return }
        try { resolve(JSON.parse(data)) } catch (e) { reject(new Error('파싱 오류')) }
      })
    })
    req.on('error', e => reject(new Error(`네트워크 오류: ${e.message}`)))
    req.write(body); req.end()
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { drugName } = req.body || {}
  if (!drugName) return res.status(400).json({ error: '약물명이 필요합니다.' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const prompt = `당신은 대한민국 임상약학 전문가입니다. 아래 약물에 대한 핵심 정보를 JSON으로 정리하세요. 마크다운 없이 순수 JSON만 출력하세요.

약물명: ${drugName}

다음 JSON 형식으로만 응답하세요:
{
  "korName": "한글 약품명",
  "engName": "성분명(영문)",
  "category": "약물 분류",
  "indication": "주요 적응증 (한국 식약처 기준)",
  "dosage": "성인 표준 용량 및 용법",
  "pediatricDosage": "소아 용량 (해당 시)",
  "sideEffects": "주요 부작용 (3~5개)",
  "contraindication": "금기 사항",
  "interaction": "주요 약물 상호작용",
  "insuranceCoverage": "심평원 급여 기준 (주요 상병코드 포함)",
  "precaution": "임상 주의사항 및 처방 팁",
  "pregnancyCategory": "임부 투여 안전성"
}`

  try {
    const data = await callAnthropic(apiKey, prompt)
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/^```json\s*/m,'').replace(/^```\s*/m,'').replace(/```\s*$/m,'').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: `JSON 없음: ${text.slice(0,200)}` })
    return res.status(200).json(JSON.parse(jsonMatch[0]))
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
