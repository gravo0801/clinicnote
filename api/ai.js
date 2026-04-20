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
