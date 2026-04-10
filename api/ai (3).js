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
      res.on('data', c => { data += c })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API 오류 (${res.statusCode}): ${data.slice(0, 200)}`))
          return
        }
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`파싱 오류: ${e.message}`)) }
      })
    })
    req.on('error', e => reject(new Error(`네트워크 오류: ${e.message}`)))
    req.write(body)
    req.end()
  })
}

function extractJSON(text) {
  const clean = text.replace(/```json/g, '').replace(/```/g, '').replace(/[◆▶●★■□]/g, '').trim()
  try { return JSON.parse(clean) } catch (_) {}
  const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
  if (s === -1 || e === -1) throw new Error('JSON 없음')
  return JSON.parse(clean.slice(s, e + 1))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, caseData } = req.body || {}
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' })

  const p = caseData?.patient || {}
  const dx = caseData?.diagnosis || {}
  const base = `환자:${p.gender || ''}/${p.age || ''}세, 주호소:${p.chiefComplaint || ''}, 진단:${dx.impression || ''}(${dx.diseases?.[0]?.kcd?.code || ''})`

  const prompts = {
    knowledge: `임상의학 전문가로서 아래 케이스 관련 의학 지식을 JSON으로 정리하세요. 마크다운 금지, 순수 JSON만 출력, 문자열에 줄바꿈 금지.
케이스: ${base}
형식: {"sections":[{"title":"병태생리","content":"설명"},{"title":"진단 기준","content":"설명"},{"title":"감별 진단","content":"설명"},{"title":"치료 원칙","content":"설명"},{"title":"예후 및 추적","content":"설명"}]}`,

    papers: `의학문헌 전문가로서 아래 케이스 관련 논문/가이드라인을 JSON으로 정리하세요. 마크다운 금지, 순수 JSON만 출력.
케이스: ${base}
형식: {"papers":[{"title":"논문 제목","journal":"저널명","year":"연도","keyPoints":"핵심 내용 한 줄","level":"근거수준"}]}
5개 이내.`,

    revenue: `1차의료기관 경영 컨설턴트로서 아래 진단 관련 적법한 매출 증대 방안을 JSON으로 정리하세요. 마크다운 금지, 순수 JSON만 출력.
케이스: ${base}
형식: {"strategies":[{"category":"카테고리","title":"전략명","detail":"구체적 방법","impact":"예상 효과"}]}
5개 이내.`
  }

  // disease_note: 상병코드 + 치료 regimen 검색
  if (type === 'disease_note') {
    const noteTitle = caseData?.diagnosis?.impression || ''
    const noteContent = caseData?.noteContent || ''
    const cat = caseData?.category || ''
    const diseasePrompt = 'You are a Korean clinical expert. Based on the disease title and content below, provide KCD codes and standard treatment regimen in JSON only. No markdown. JSON format: {"kcdCodes":[{"code":"J039","name":"급성 편도염"}],"regimen":[{"drug":"아목시실린캡슐500mg","dose":"1T 3회/일","duration":"5일","note":"1차 선택약"}],"summary":"간단한 치료 원칙 설명 (2-3문장)"}. Disease: ' + noteTitle + '. Category: ' + cat + '. Content summary: ' + noteContent.slice(0, 300)
    try {
      const data = await callAnthropic(apiKey, diseasePrompt)
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
      if (s === -1) return res.status(500).json({ error: 'JSON 없음' })
      return res.status(200).json(JSON.parse(clean.slice(s, e + 1)))
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  const prompt = prompts[type]
  if (!prompt) return res.status(400).json({ error: 'Invalid type' })

  try {
    const data = await callAnthropic(apiKey, prompt)
    const text = data.content?.[0]?.text || ''
    const parsed = extractJSON(text)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('ai handler error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}