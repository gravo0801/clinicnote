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
          reject(new Error(`Anthropic API 오류 (${res.statusCode}): ${data.slice(0, 300)}`))
          return
        }
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`응답 파싱 오류: ${e.message}`)) }
      })
    })
    req.on('error', e => reject(new Error(`네트워크 오류: ${e.message}`)))
    req.write(body)
    req.end()
  })
}

// JSON 문자열 내부의 제어문자·따옴표 등 정제
function sanitizeJsonText(text) {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    // 줄바꿈을 공백으로 (JSON 문자열 내 줄바꿈 방지)
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    // JSON 문자열 value 안의 줄바꿈 제거
    .replace(/"([^"]*?)[\n]([^"]*?)"/g, (m, a, b) => `"${a} ${b}"`)
    // 특수문자 제거 (◆ ▶ ● 등)
    .replace(/[◆▶●★☆■□▲▼◇]/g, '')
    .trim()
}

// 더 안정적인 JSON 추출
function extractJSON(text) {
  const cleaned = sanitizeJsonText(text)
  
  // 1차: 전체를 JSON으로 파싱
  try { return JSON.parse(cleaned) } catch (_) {}
  
  // 2차: { } 블록 추출
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON 블록을 찾을 수 없습니다.')
  
  const jsonStr = cleaned.slice(start, end + 1)
  
  // 3차: 직접 파싱
  try { return JSON.parse(jsonStr) } catch (_) {}
  
  // 4차: 공격적 정제 후 재시도
  const fixed = jsonStr
    // 문자열 내 역슬래시 처리
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    // 줄바꿈 문자 이스케이프
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
  
  return JSON.parse(fixed)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' })

  const { patientAge, patientGender, chiefComplaint, diagnosis, kcdCode, kcdName, drugs, progressNote } = req.body || {}

  const drugList = (Array.isArray(drugs) ? drugs : [])
    .filter(d => d && d.name)
    .map((d, i) => `${i + 1}. ${d.name} (용량:${d.dosage || '-'}, 용법:${d.usage || '-'}, 일수:${d.duration || '-'})`)
    .join(' / ') || '처방 없음'

  // 프롬프트: 예시 포함, 한국어 boolean 제거, 줄바꿈 금지 명시
  const prompt = `당신은 대한민국 심평원 급여기준 전문가입니다. 아래 진료 정보를 분석하고 반드시 유효한 JSON 하나만 출력하세요.

규칙:
- JSON 외 텍스트 절대 금지
- 마크다운 코드블록 금지
- 문자열 값에 줄바꿈 금지 (한 줄로 작성)
- 특수기호(◆▶●) 사용 금지
- covered 필드는 반드시 true 또는 false (문자열 아님)

진료정보: 환자 ${patientGender || '불명'}/${patientAge || '불명'}세, 주호소:${chiefComplaint || '없음'}, 진단:${diagnosis || '없음'}, 상병코드:${kcdCode || '없음'}(${kcdName || ''}), 처방:${drugList}

출력 형식 (이 구조를 정확히 따르세요):
{"overall":"검토필요","summary":"요약 한 문장","items":[{"category":"진단-처방 일치성","status":"ok","comment":"설명"},{"category":"심평원 급여기준","status":"warning","comment":"설명"},{"category":"용량용법 적절성","status":"ok","comment":"설명"},{"category":"처방일수 적절성","status":"ok","comment":"설명"},{"category":"약물 상호작용","status":"ok","comment":"설명"},{"category":"급여청구 유의사항","status":"warning","comment":"설명"}],"suggestions":["제안1","제안2"],"recommendedRegimen":[{"drugName":"약품명","dosage":"1T","freq":"3회/일","duration":"5일","usage":"식후","covered":true,"reason":"추천 이유"}],"regimenSummary":"레지멘 설명 한두 문장"}

overall 값: "적절" 또는 "주의필요" 또는 "검토필요"
status 값: "ok" 또는 "warning" 또는 "error"`

  try {
    const data = await callAnthropic(apiKey, prompt)
    const text = data.content?.[0]?.text || ''
    if (!text) return res.status(500).json({ error: 'AI 응답이 비어 있습니다.' })

    let parsed
    try {
      parsed = extractJSON(text)
    } catch (parseErr) {
      console.error('JSON parse failed. Raw text:', text.slice(0, 500))
      return res.status(500).json({
        error: `JSON 파싱 오류: ${parseErr.message}`,
        rawPreview: text.slice(0, 300)
      })
    }

    // 필수 필드 보정
    if (!parsed.overall) parsed.overall = '검토필요'
    if (!Array.isArray(parsed.items)) parsed.items = []
    if (!Array.isArray(parsed.suggestions)) parsed.suggestions = []
    if (!Array.isArray(parsed.recommendedRegimen)) parsed.recommendedRegimen = []

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('review handler error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
