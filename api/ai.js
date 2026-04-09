export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, caseData } = req.body || {}
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured. Vercel ?섍꼍蹂?섏뿉 ANTHROPIC_API_KEY瑜?異붽??섏꽭??' })
  }

  const base = `?섏옄: ${caseData?.patient?.gender||''}/${caseData?.patient?.age||''}?? 二쇳샇?? ${caseData?.patient?.chiefComplaint||''}, 吏꾨떒: ${caseData?.diagnosis?.impression||''} (${caseData?.diagnosis?.diseases?.[0]?.kcd?.code||''})`

  const prompts = {
    knowledge: `?뱀떊? ?꾩긽?섑븰 ?꾨Ц媛?낅땲?? ?꾨옒 耳?댁뒪瑜?諛뷀깢?쇰줈 愿???섑븰 吏?앹쓣 JSON?쇰줈 ?뺣━?섏꽭?? JSON留?異쒕젰, 留덊겕?ㅼ슫 湲덉?.
耳?댁뒪: ${base}
?뺤떇: {"sections":[{"title":"蹂묓깭?앸━","content":"..."},{"title":"吏꾨떒 湲곗?","content":"..."},{"title":"媛먮퀎 吏꾨떒","content":"..."},{"title":"移섎즺 ?먯튃","content":"..."},{"title":"?덊썑 諛?異붿쟻","content":"..."}]}`,

    papers: `?뱀떊? ?섑븰臾명뿄 ?꾨Ц媛?낅땲?? ?꾨옒 耳?댁뒪 愿??二쇱슂 媛?대뱶?쇱씤 諛?洹쇨굅 ?쇰Ц??JSON?쇰줈 ?뺣━?섏꽭?? JSON留?異쒕젰.
耳?댁뒪: ${base}
?뺤떇: {"papers":[{"title":"?쇰Ц/媛?대뱶?쇱씤 ?쒕ぉ","journal":"??먮챸","year":"?곕룄","keyPoints":"?듭떖 ?댁슜 1-2以?,"level":"洹쇨굅?섏? (?? Level A, GRADE 1B)"}]}
5媛??대궡濡??뺣━.`,

    revenue: `?뱀떊? 1李??섎즺湲곌? 寃쎌쁺 而⑥꽕?댄듃?낅땲?? ?꾨옒 吏꾨떒紐낆쓣 諛뷀깢?쇰줈 ?곷쾿??踰붿쐞 ?댁뿉??留ㅼ텧 利앸? 諛⑹븞??JSON?쇰줈 ?뺣━?섏꽭?? JSON留?異쒕젰.
耳?댁뒪: ${base}
?뺤떇: {"strategies":[{"category":"移댄뀒怨좊━","title":"?꾨왂紐?,"detail":"援ъ껜??諛⑸쾿","impact":"?덉긽 ?④낵"}]}
移댄뀒怨좊━ ?덉떆: 異붽? 寃?? 留뚯꽦吏덊솚 愿由? 嫄닿컯寃吏? ?덈갑?묒쥌, 援먯쑁?곷떞猷??? 5媛??대궡.`
  }

  const prompt = prompts[type]
  if (!prompt) return res.status(400).json({ error: 'Invalid type' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      return res.status(500).json({ error: `AI API ?ㅻ쪟 (${response.status}): ${errBody.slice(0, 200)}` })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (e) {
      return res.status(500).json({ error: `?묐떟 ?뚯떛 ?ㅻ쪟: ${e.message}` })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    return res.status(500).json({ error: `泥섎━ 以??ㅻ쪟: ${err.message}` })
  }
}
