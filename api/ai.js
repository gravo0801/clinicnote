import https from 'https'

function callAnthropic(apiKey, prompt, extraOpts) {
  return new Promise((resolve, reject) => {
    // prompt can be string (text) or array (multimodal)
    const messages = Array.isArray(prompt)
      ? prompt
      : [{ role: 'user', content: prompt }]
    const body = JSON.stringify({
      model: extraOpts?.model || 'claude-haiku-4-5-20251001',
      max_tokens: extraOpts?.max_tokens || 2000,
      messages,
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
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode !== 200) {
            // 오류 응답도 파싱해서 반환 (에러 메시지 포함)
            resolve(parsed)
            return
          }
          resolve(parsed)
        }
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

    papers: `당신은 의학문헌 전문가입니다. 아래 케이스에 관련된 핵심 논문 및 가이드라인을 JSON으로 정리하세요. 마크다운 없이 순수 JSON만 출력하세요.
케이스: ${base}
형식: {"papers":[{"title":"논문 또는 가이드라인 제목","journal":"저널명 또는 학회명","year":"연도","keyPoints":"임상에서 활용할 핵심 내용 1-2줄","summary":"이 논문/가이드라인이 임상에 미친 영향 및 실제 처방에서 어떻게 적용하는지 3-4문장으로 요약","level":"근거수준 (1a/1b/2a/2b/3/4/가이드라인)","recommendation":"실제 처방 또는 치료 결정 시 적용 방법"}]}
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

  // checkup_scan: 건강검진 결과지 이미지 판독
  if (type === 'checkup_scan') {
    const { imageBase64, imageMime } = caseData || {}
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' })
    const mime = imageMime || 'image/jpeg'
    const scanPrompt = `당신은 한국어 건강검진 결과지를 분석하는 전문가입니다. 이미지에서 모든 검사 결과를 추출하여 JSON으로 반환하세요.

중요 규칙:
- 순수 JSON만 출력. 마크다운 절대 금지.
- 이미지에 없는 항목은 포함하지 마세요.
- 숫자 검사값은 숫자로, 소견/판독문은 이미지의 한글 텍스트를 그대로 복사하세요.
- 소견 항목들 (abdomUs, thyroidUs, egd, colonoscopy, chestXray, ecg, breastUs, mammography, fundusL, fundusR, mri, ct, gyCytology 등)은 결과지에 적힌 한글 소견을 전부 그대로 입력하세요. 예: abdomUs 에 "신장 단순 낭종(우측: 약 0.6cm, 좌측: 0.8cm) 그 외 특이사항 없음" 과 같이 전체 문장을 넣으세요.
- 소변검사 결과(urineProtein, urineGlucose 등)는 "Negative", "Positive", "1+" 등 결과 문자열을 그대로.
- 간염 항체(havAb, hbsAg, hbsAb, hcvAb)는 "Positive", "Negative" 또는 수치를 그대로.
- checkupDate는 YYYY-MM-DD 형식.

숫자 키: height,weight,bmi,waist,bodyFat,abdomFat,sbp,dbp,hr,wbc,rbc,hemoglobin,hct,platelet,mcv,mch,mchc,rdw,mpv,pdw,pct,neutrophil,bandNeutrophil,lymphocyte,monocyte,eosinophil,basophil,blast,promyelocyte,myelocyte,metamyelocyte,tc,ldl,hdl,tg,glucose,hba1c,ast,alt,ggt,alp,ldh,bilirubin,directBilirubin,protein,albumin,globulin,agRatio,bun,creatinine,egfr,bcRatio,sodium,potassium,chloride,calcium,phosphorus,tsh,t3,freeT4,uric,crp,vitaminD,amylase,lipase,cea,afp,ca125,ca199,raFactor,visionL,visionR,corrVisionL,corrVisionR,iopL,iopR,bmdSpineT,bmdHipT,bmdSpineZ,urinePh,specificGravity

소견 문자열 키: fundusL,fundusR,hearingL,hearingR,corrHearingL,corrHearingR,urineMicroscopy,urineProtein,urineGlucose,urineBlood,urineWbc,urineNitrite,urineKetone,urineUrobilinogen,urineBilirubin,occultBlood,rpr,havAb,hbsAg,hbsAb,hcvAb,ecg,chestXray,abdomUs,thyroidUs,breastUs,mammography,egd,colonoscopy,mri,ct,gyCytology,checkupDate`
    const multimodalMessages = [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mime, data: imageBase64 } },
        { type: 'text', text: scanPrompt }
      ]
    }]
    try {
      // Sonnet for better Korean OCR accuracy
      const scanRes = await callAnthropic(apiKey, multimodalMessages, { max_tokens: 3000, model: 'claude-sonnet-4-20250514' })
      // 오류 응답 체크
      if (scanRes.error) {
        return res.status(500).json({ error: 'API 오류: ' + JSON.stringify(scanRes.error) })
      }
      const text = scanRes.content?.[0]?.text || ''
      if (!text) {
        const reason = scanRes.stop_reason || 'unknown'
        return res.status(500).json({ error: 'AI 응답 없음 (stop_reason: ' + reason + ')' })
      }
      const clean = text.replace(/```json/g,'').replace(/```/g,'').trim()
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
      if (s === -1) return res.status(500).json({ error: '수치 파싱 실패. 원문: ' + text.slice(0,100) })
      const parsed = JSON.parse(clean.slice(s, e+1))
      return res.status(200).json(parsed)
    } catch(err) {
      console.error('checkup_scan error:', err.message)
      return res.status(500).json({ error: '판독 오류: ' + err.message })
    }
  }

  // checkup_analysis: 검진 이상항목 AI 분석
  if (type === 'checkup_analysis') {
    const { abnormalItems, findingItems, memberInfo } = caseData || {}
    const age = memberInfo?.age || '불명'
    const gender = memberInfo?.gender || '불명'
    const abnormalText = (abnormalItems||[]).map(a => a.label+' '+a.value+(a.unit||'')+' ('+a.status+')').join(', ')
    const findingText = (findingItems||[]).map(f => f.label+': '+f.value).join(' / ')
    const analysisPrompt = `당신은 대한민국 전문의입니다. 아래 건강검진 이상 결과를 분석하고 JSON으로 응답하세요. 마크다운 없이 순수 JSON만 출력하세요.

환자: ${gender} / ${age}세
이상 수치: ${abnormalText || '없음'}
이상 소견: ${findingText || '없음'}

다음 JSON 형식으로 응답하세요:
{
  "impression": "예상 진단 및 임상적 의의 (2-3문장)",
  "riskLevel": "정상/경계/주의/위험 중 하나",
  "explanation": "환자에게 쉽게 설명하는 방법 (비전문용어, 3-4문장)",
  "lifestyle": ["생활습관 교정 항목1", "항목2", "항목3"],
  "treatment": "권고 치료 및 추가 검사 방향",
  "followUp": "향후 추적 관찰 계획 (언제, 어떤 검사)",
  "doctorNote": "처방 및 진료 시 주의사항"
}`

    try {
      const data = await callAnthropic(apiKey, analysisPrompt, { max_tokens: 1500 })
      if (data.error) return res.status(500).json({ error: JSON.stringify(data.error) })
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json/g,'').replace(/```/g,'').trim()
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
      if (s === -1) return res.status(500).json({ error: 'JSON 없음' })
      return res.status(200).json(JSON.parse(clean.slice(s, e+1)))
    } catch(err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // drug_interaction: 약물 상호작용 체크
  if (type === 'drug_interaction') {
    const drugs = caseData?.drugs || []
    if (drugs.length < 2) return res.status(400).json({ error: '2개 이상 약물이 필요합니다.' })
    const drugList = drugs.map((d, i) => (i+1) + '. ' + d).join('\n')

    const diPrompt = `당신은 대한민국 임상약학 전문가입니다.
아래 처방 약물들의 상호작용을 분석하고 JSON으로만 응답하세요. 마크다운 없이 순수 JSON만 출력하세요.

처방 약물 목록:
${drugList}

분석 내용:
- 약물 간 상호작용 (PK/PD)
- 심각도: critical(절대 병용금기) / major(주요 주의) / moderate(중등도 주의) / minor(경미) / none(없음)
- 실제 임상에서 발생 가능한 문제와 대처법

JSON 형식:
{
  "overallRisk": "safe | caution | warning | danger",
  "summary": "전체 처방에 대한 한 줄 평가",
  "interactions": [
    {
      "drugs": ["약물A", "약물B"],
      "severity": "critical | major | moderate | minor",
      "mechanism": "상호작용 기전 (짧게)",
      "effect": "예상되는 임상 효과 또는 부작용",
      "action": "처방의가 취해야 할 조치"
    }
  ],
  "tips": ["처방 전반에 대한 임상 팁 또는 주의사항 (1-3개)"]
}`

    try {
      const data = await callAnthropic(apiKey, diPrompt, { max_tokens: 1500 })
      if (data.error) return res.status(500).json({ error: JSON.stringify(data.error) })
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/\`\`\`json/g,'').replace(/\`\`\`/g,'').trim()
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
      if (s === -1) return res.status(500).json({ error: 'JSON 없음' })
      return res.status(200).json(JSON.parse(clean.slice(s, e+1)))
    } catch(err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // refine_drug_card: Gemini 등 외부 LLM이 만든 약물 정보 텍스트를 우리 스키마로 정리
  // 2-pass: (1) 원문을 약물별로 분할 (2) 각 약물을 병렬로 정리
  if (type === 'refine_drug_card') {
    const rawText = caseData?.rawText || ''
    if (!rawText.trim()) return res.status(400).json({ error: 'rawText required' })

    const splitPrompt = `다음은 한 가지 진단군의 1차 의료 약물 정보입니다. 원문에 포함된 각 약물의 본문을 그대로 분리하여 JSON 배열로 반환하세요. 약물 1개면 배열 길이 1, 5개면 5. 본문은 원문 그대로 잘라 넣고 요약·재작성하지 마세요. 마크다운/설명 금지, JSON만.

스키마:
{ "scenarioGroup": "전체 진단군명 (없으면 빈 문자열)", "drugSections": ["약물1 본문", "약물2 본문", ...] }

원문:
"""
${rawText.slice(0, 12000)}
"""`

    const SYSTEM_CATS = '소화기 / 호흡기 / 순환기 / 비뇨생식기 / 근골격·통증 / 신경 / 피부 / 내분비·대사 / 정신·수면 / 이비인후 / 안과 / 산부인과 / 알레르기·면역 / 감염 / 영양·일반'

    const refineOnePrompt = (section, scenarioGroup) => `JSON 객체 1개만 출력하세요. 첫 글자는 반드시 "{". 설명·머리말·코드블록 금지.

당신은 한국 1차 의료 임상약학 전문가입니다. 아래 단일 약물 정보를 학습용 스키마로 정리하면서 다음을 수행하세요:
1. 의심·불완전 부분 보강·수정 (특히 임산부/소아/노인/금기/약물상호작용 누락 보강)
2. KCD 코드는 단정 금지 — "후보"로 분류, insuranceNote에 "심평원 고시 재확인 필수" 포함
3. 의학적 주장 근거 (KIMS/식약처/UpToDate/심평원 고시 등)를 sourceRefs에 명시
4. 한국 시판 상품명 우선, 성분명 병기
5. 정보 없으면 "정보 없음" 명시 (추측 금지)

진단군 컨텍스트: ${scenarioGroup || '(불명)'}
약물 본문:
"""
${section.slice(0, 4000)}
"""

분류 규칙 (가장 중요):
- systemCategory: 다음 중 정확히 하나만 선택 (한국 1차 의료 계통 분류) — ${SYSTEM_CATS}
- subCategories: 이 약을 처방하는 임상 상황 (진단명·증상명 혼용 가능, 짧게). 1~5개 배열. 예) ["급성 인두편도염", "편도염"], ["GERD", "속쓰림", "소화불량"], ["고혈압", "본태성 고혈압 1단계"]

JSON만 출력 (마크다운/설명 금지):
{
  "systemCategory": "위 목록 중 하나",
  "subCategories": [string],
  "drugName": string, "genericName": string, "drugClass": string,
  "indication": string, "dosage": string, "usage": string, "duration": string,
  "kcdCodes": [string], "insuranceNote": string,
  "patientCounseling": string, "sideEffects": [string],
  "interactions": [string], "contraindications": [string],
  "pregnancy": string, "pediatric": string, "geriatric": string,
  "renalAdjust": string, "hepaticAdjust": string,
  "sourceRefs": [string],
  "claudeNote": "원문 대비 보강·수정·의문 제기한 핵심 1~3가지"
}`

    try {
      // Pass 1: split
      const splitRes = await callAnthropic(apiKey, splitPrompt, { max_tokens: 4000 })
      if (splitRes.error) return res.status(500).json({ error: 'split: ' + JSON.stringify(splitRes.error) })
      const splitText = splitRes.content?.[0]?.text || ''
      let splitParsed
      try { splitParsed = extractJSON(splitText) }
      catch (e) { return res.status(500).json({ error: 'split JSON 파싱 실패: ' + e.message + ' / 원문 일부: ' + splitText.slice(0, 200) }) }

      const scenarioGroup = splitParsed.scenarioGroup || ''
      const sections = Array.isArray(splitParsed.drugSections) ? splitParsed.drugSections.filter(s => typeof s === 'string' && s.trim()) : []
      if (sections.length === 0) return res.status(500).json({ error: '분할 결과 없음' })

      // Pass 2: refine each in parallel
      const results = await Promise.all(sections.map(async (sec) => {
        const r = await callAnthropic(apiKey, refineOnePrompt(sec, scenarioGroup), { max_tokens: 3000 })
        if (r.error) return { _error: 'API: ' + JSON.stringify(r.error) }
        const t = r.content?.[0]?.text || ''
        const stop = r.stop_reason || ''
        try { return extractJSON(t) }
        catch (e) {
          const snippet = t.slice(0, 220).replace(/\s+/g, ' ')
          return { _error: `card JSON 실패: ${e.message} | stop=${stop} | resp="${snippet}"` }
        }
      }))

      const okCards = results.filter(c => !c._error)
      const errCount = results.length - okCards.length
      if (okCards.length === 0) return res.status(500).json({ error: '모든 카드 정리 실패. 첫 오류: ' + (results[0]?._error || 'unknown') })

      return res.status(200).json({
        scenarioGroup,
        cards: okCards,
        ...(errCount > 0 ? { partialError: `${errCount}/${results.length}개 카드 정리 실패` } : {}),
      })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // classify_drug_cards: 기존 카드 일괄 자동 분류 (systemCategory + subCategories)
  if (type === 'classify_drug_cards') {
    const items = caseData?.items || []
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' })

    const SYSTEM_CATS = '소화기 / 호흡기 / 순환기 / 비뇨생식기 / 근골격·통증 / 신경 / 피부 / 내분비·대사 / 정신·수면 / 이비인후 / 안과 / 산부인과 / 알레르기·면역 / 감염 / 영양·일반'
    const classifyPrompt = `한국 1차 의료 약물 카드들을 계통 분류하세요.
각 약마다 systemCategory를 다음 중 정확히 하나 선택: ${SYSTEM_CATS}
subCategories는 그 약을 처방하는 임상 상황(진단명·증상명) 1~5개 배열. 짧고 구체적으로.

입력:
${JSON.stringify(items.slice(0, 50), null, 2)}

JSON만 출력 (마크다운 금지):
{ "results": [ { "id": "<원본 id>", "systemCategory": "...", "subCategories": [string] }, ... ] }`

    try {
      const data = await callAnthropic(apiKey, classifyPrompt, { max_tokens: 4000 })
      if (data.error) return res.status(500).json({ error: JSON.stringify(data.error) })
      const text = data.content?.[0]?.text || ''
      const parsed = extractJSON(text)
      if (!Array.isArray(parsed.results)) return res.status(500).json({ error: 'results 배열 없음' })
      return res.status(200).json(parsed)
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
