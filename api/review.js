import https from 'https'

function callAnthropic(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
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
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`응답 파싱 오류: ${e.message}`))
        }
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured. Vercel 환경변수에 ANTHROPIC_API_KEY를 추가하세요.'
    })
  }

  const {
    patientAge, patientGender,
    chiefComplaint, diagnosis, kcdCode, kcdName,
    drugs, progressNote
  } = req.body || {}

  const drugList = (Array.isArray(drugs) ? drugs : [])
    .filter(d => d && d.name)
    .map((d, i) => `  ${i + 1}. ${d.name} — 용량: ${d.dosage || '-'}, 용법: ${d.usage || '-'}, 일수: ${d.duration || '-'}`)
    .join('\n') || '  처방 없음'

  const prompt = `당신은 대한민국 건강보험심사평가원(심평원) 급여기준 및 임상약학에 정통한 의학 전문가입니다.
아래 진료 정보를 검토하고 반드시 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.

진료 정보:
- 환자: ${patientGender || '불명'}, ${patientAge || '불명'}세
- 주호소: ${chiefComplaint || '미기재'}
- 진단명: ${diagnosis || '미기재'}
- 상병코드: ${kcdCode || '미기재'} (${kcdName || ''})
- Progress Note: ${progressNote || '미기재'}

처방 약물:
${drugList}

다음 JSON 형식으로만 응답하세요:
{"overall":"적절","summary":"요약","items":[{"category":"진단-처방 일치성","status":"ok","comment":"내용"},{"category":"심평원 급여기준","status":"ok","comment":"내용"},{"category":"용량·용법","status":"ok","comment":"내용"},{"category":"처방일수","status":"ok","comment":"내용"},{"category":"약물 상호작용","status":"ok","comment":"내용"}],"suggestions":["제안1"]}

overall 값: "적절" 또는 "주의필요" 또는 "검토필요"
status 값: "ok" 또는 "warning" 또는 "error"`

  try {
    const data = await callAnthropic(apiKey, prompt)
    const text = data.content?.[0]?.text || ''

    if (!text) {
      return res.status(500).json({ error: 'AI 응답이 비어 있습니다.' })
    }

    // JSON 추출 — 마크다운 제거 후 파싱
    const clean = text
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim()

    // JSON 블록만 추출
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: `JSON을 찾을 수 없습니다. 원문: ${text.slice(0, 200)}` })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return res.status(200).json(parsed)

  } catch (err) {
    console.error('review handler error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
