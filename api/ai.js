export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, caseData } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const base = `환자: ${caseData.patient?.gender||''}/${caseData.patient?.age||''}세, 주호소: ${caseData.patient?.chiefComplaint||''}, 진단: ${caseData.diagnosis?.impression||''} (${caseData.diagnosis?.kcd?.code||''})`

  const prompts = {
    knowledge: `당신은 임상의학 전문가입니다. 아래 케이스를 바탕으로 관련 의학 지식을 JSON으로 정리하세요. JSON만 출력, 마크다운 금지.
케이스: ${base}
형식: {"sections":[{"title":"병태생리","content":"..."},{"title":"진단 기준","content":"..."},{"title":"감별 진단","content":"..."},{"title":"치료 원칙","content":"..."},{"title":"예후 및 추적","content":"..."}]}`,

    papers: `당신은 의학문헌 전문가입니다. 아래 케이스 관련 주요 가이드라인 및 근거 논문을 JSON으로 정리하세요. JSON만 출력.
케이스: ${base}
형식: {"papers":[{"title":"논문/가이드라인 제목","journal":"저널명","year":"연도","keyPoints":"핵심 내용 1-2줄","level":"근거수준 (예: Level A, GRADE 1B)"}]}
5개 이내로 정리.`,

    revenue: `당신은 1차 의료기관 경영 컨설턴트입니다. 아래 진단명을 바탕으로 적법한 범위 내에서 매출 증대 방안을 JSON으로 정리하세요. JSON만 출력.
케이스: ${base}
형식: {"strategies":[{"category":"카테고리","title":"전략명","detail":"구체적 방법","impact":"예상 효과"}]}
카테고리 예시: 추가 검사, 만성질환 관리, 건강검진, 예방접종, 교육상담료 등. 5개 이내.`
  }

  const prompt = prompts[type]
  if (!prompt) return res.status(400).json({ error: 'Invalid type' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return res.status(200).json(JSON.parse(clean))
  } catch (err) {
    return res.status(500).json({ error: 'AI 처리 중 오류가 발생했습니다.' })
  }
}
