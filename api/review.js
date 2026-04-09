// Vercel serverless function ???ы룊??AI 寃??export default async function handler(req, res) {
  // CORS ?덉슜
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured. Vercel ?섍꼍蹂?섏뿉 ANTHROPIC_API_KEY瑜?異붽??섏꽭??' })
  }

  const {
    patientAge, patientGender,
    chiefComplaint, diagnosis, kcdCode, kcdName,
    drugs, progressNote
  } = req.body || {}

  const drugList = (drugs || [])
    .filter(d => d.name)
    .map((d, i) => `  ${i + 1}. ${d.name} ???⑸웾: ${d.dosage || '-'}, ?⑸쾿: ${d.usage || '-'}, ?쇱닔: ${d.duration || '-'}`)
    .join('\n')

  const prompt = `?뱀떊? ??쒕?援?嫄닿컯蹂댄뿕?ъ궗?됯????ы룊?? 湲됱뿬湲곗? 諛??꾩긽?쏀븰???뺥넻???섑븰 ?꾨Ц媛?낅땲??
?꾨옒 吏꾨즺 ?뺣낫瑜?寃?좏븯怨?援ъ“?붾맂 JSON?쇰줈留??묐떟?섏꽭?? JSON ???ㅻⅨ ?띿뒪?몃뒗 ?덈? 異쒕젰?섏? 留덉꽭??

?먯쭊猷??뺣낫??- ?섏옄: ${patientGender || '遺덈챸'}, ${patientAge || '遺덈챸'}??- 二쇳샇?? ${chiefComplaint || '誘멸린??}
- 吏꾨떒紐? ${diagnosis || '誘멸린??}
- ?곷퀝肄붾뱶: ${kcdCode || '誘멸린??} (${kcdName || ''})
- Progress Note: ${progressNote || '誘멸린??}

?먯쿂諛??쎈Ъ??${drugList || '  泥섎갑 ?놁쓬'}

?ㅼ쓬 JSON ?뺤떇?쇰줈 ?뺥솗???묐떟?섏꽭??
{
  "overall": "?곸젅" ?먮뒗 "二쇱쓽?꾩슂" ?먮뒗 "寃?좏븘??,
  "summary": "??臾몄옣 ?붿빟 (50???대궡)",
  "items": [
    {
      "category": "移댄뀒怨좊━紐?,
      "status": "ok" ?먮뒗 "warning" ?먮뒗 "error",
      "comment": "?곸꽭 ?댁슜"
    }
  ],
  "suggestions": ["?쒖븞?ы빆1", "?쒖븞?ы빆2"]
}

寃????ぉ:
1. 吏꾨떒-泥섎갑 ?쇱튂??(?곷퀝肄붾뱶? 泥섎갑?쎈Ъ??遺?⑺븯?붿?)
2. ?ы룊??湲됱뿬湲곗? (媛??쎈Ъ???대떦 ?곷퀝肄붾뱶 湲곗? 湲됱뿬 ?몄젙 ?щ?)
3. ?⑸웾쨌?⑸쾿 ?곸젅??(?깆씤 ?쒖? ?⑸웾 湲곗? 怨쇰떎/怨쇱냼 ?щ?)
4. 泥섎갑?쇱닔 ?곸젅??(吏덊솚 ?뱀꽦???곸젙 泥섎갑?쇱닔)
5. ?쎈Ъ ?곹샇?묒슜 (二쇱슂 DDI 媛?μ꽦)
6. 湲됱뿬 泥?뎄 ???좎쓽?ы빆`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Anthropic API error:', response.status, errBody)
      return res.status(500).json({ error: `AI API ?ㅻ쪟 (${response.status}): ${errBody.slice(0, 200)}` })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    if (!text) {
      return res.status(500).json({ error: 'AI ?묐떟??鍮꾩뼱 ?덉뒿?덈떎.' })
    }

    // JSON ?뚯떛 ??```json ... ``` 留덊겕?ㅼ슫 ?쒓굅
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    
    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'raw text:', text)
      return res.status(500).json({ error: `?묐떟 ?뚯떛 ?ㅻ쪟: ${parseErr.message}. ?먮Ц: ${text.slice(0, 300)}` })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Review handler error:', err)
    return res.status(500).json({ error: `泥섎━ 以??ㅻ쪟: ${err.message}` })
  }
}
