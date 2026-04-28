// HealthCheckup 설정 - 검진 항목 정의 및 유틸리티
// 이 파일을 수정할 때: GitHub Upload files 드래그앤드롭 사용

export const CHECKUP_CATEGORIES = [
  {
    key: 'body', label: '신체계측',
    items: [
      { key:'height',   label:'신장',     unit:'cm',  type:'num' },
      { key:'weight',   label:'체중',     unit:'kg',  type:'num' },
      { key:'bmi',      label:'BMI',      unit:'',    type:'num', warn:(v) => v>=30?'비만':v>=25?'과체중':v<18.5?'저체중':null },
      { key:'waist',    label:'허리둘레',  unit:'cm',  type:'num', warn:(v,g) => (g==='여'?v>=85:v>=90)?'위험':null },
      { key:'bodyFat',  label:'체지방률',  unit:'%',   type:'num' },
      { key:'abdomFat', label:'복부지방률', unit:'',    type:'num' },
    ]
  },
  {
    key: 'vital', label: '활력징후',
    items: [
      { key:'sbp', label:'수축기혈압', unit:'mmHg', type:'num', warn:(v) => v>=140?'위험':v>=130?'주의':null },
      { key:'dbp', label:'이완기혈압', unit:'mmHg', type:'num', warn:(v) => v>=90?'위험':v>=80?'주의':null },
      { key:'hr',  label:'심박수',    unit:'회/분', type:'num' },
    ]
  },
  {
    key: 'cbc', label: '혈액일반 (CBC)',
    items: [
      { key:'wbc',            label:'WBC',            unit:'10^3/uL', type:'num', warn:(v) => v>10?'높음':v<4?'낮음':null },
      { key:'rbc',            label:'RBC',            unit:'10^6/uL', type:'num' },
      { key:'hemoglobin',     label:'혈색소(Hb)',       unit:'g/dL',   type:'num', warn:(v,g) => (g==='여'?v<12:v<13)?'빈혈':null },
      { key:'hct',            label:'HCT',            unit:'%',       type:'num' },
      { key:'platelet',       label:'혈소판',           unit:'10^3/uL', type:'num', warn:(v) => v<150?'낮음':v>400?'높음':null },
      { key:'mcv',            label:'MCV',            unit:'fL',      type:'num' },
      { key:'mch',            label:'MCH',            unit:'pg',      type:'num' },
      { key:'mchc',           label:'MCHC',           unit:'g/dL',    type:'num' },
      { key:'rdw',            label:'RDW',            unit:'%',       type:'num' },
      { key:'mpv',            label:'MPV',            unit:'fL',      type:'num' },
      { key:'pdw',            label:'PDW',            unit:'%',       type:'num' },
      { key:'pct',            label:'PCT',            unit:'%',       type:'num' },
      { key:'neutrophil',     label:'중성구(Seg.)',     unit:'%',       type:'num' },
      { key:'bandNeutrophil', label:'간상핵중성구(Band)',unit:'%',       type:'num' },
      { key:'lymphocyte',     label:'림프구',           unit:'%',       type:'num' },
      { key:'monocyte',       label:'단핵구',           unit:'%',       type:'num' },
      { key:'eosinophil',     label:'호산구',           unit:'%',       type:'num' },
      { key:'basophil',       label:'호염기구',          unit:'%',       type:'num' },
      { key:'blast',          label:'Blast',          unit:'%',       type:'num' },
      { key:'promyelocyte',   label:'Promyelocyte',   unit:'%',       type:'num' },
      { key:'myelocyte',      label:'Myelocyte',      unit:'%',       type:'num' },
      { key:'metamyelocyte',  label:'Metamyelocyte',  unit:'%',       type:'num' },
    ]
  },
  {
    key: 'lipid', label: '지질검사',
    items: [
      { key:'tc',  label:'총콜레스테롤',  unit:'mg/dL', type:'num', warn:(v) => v>=240?'위험':v>=200?'경계':null },
      { key:'ldl', label:'LDL콜레스테롤', unit:'mg/dL', type:'num', warn:(v) => v>=160?'위험':v>=130?'경계':null },
      { key:'hdl', label:'HDL콜레스테롤', unit:'mg/dL', type:'num', warn:(v) => v<40?'위험':v<60?'경계':null },
      { key:'tg',  label:'중성지방',     unit:'mg/dL', type:'num', warn:(v) => v>=500?'위험':v>=200?'높음':v>=150?'경계':null },
    ]
  },
  {
    key: 'glucose', label: '혈당/당뇨',
    items: [
      { key:'glucose', label:'공복혈당',  unit:'mg/dL', type:'num', warn:(v) => v>=126?'당뇨':v>=100?'공복혈당장애':null },
      { key:'hba1c',   label:'당화혈색소', unit:'%',     type:'num', warn:(v) => v>=6.5?'당뇨':v>=5.7?'주의':null },
    ]
  },
  {
    key: 'liver', label: '간기능',
    items: [
      { key:'ast',             label:'AST(GOT)',  unit:'U/L',   type:'num', warn:(v) => v>=40?'주의':null },
      { key:'alt',             label:'ALT(GPT)',  unit:'U/L',   type:'num', warn:(v) => v>=56?'위험':v>=40?'주의':null },
      { key:'ggt',             label:'감마GTP',    unit:'U/L',   type:'num', warn:(v) => v>=51?'주의':null },
      { key:'alp',             label:'ALP',       unit:'U/L',   type:'num' },
      { key:'ldh',             label:'LDH',       unit:'U/L',   type:'num', warn:(v) => v>=214?'높음':null },
      { key:'bilirubin',       label:'총빌리루빈',  unit:'mg/dL', type:'num' },
      { key:'directBilirubin', label:'직접빌리루빈', unit:'mg/dL', type:'num' },
      { key:'protein',         label:'총단백',     unit:'g/dL',  type:'num' },
      { key:'albumin',         label:'알부민',     unit:'g/dL',  type:'num' },
      { key:'globulin',        label:'글로불린',    unit:'g/dL',  type:'num' },
      { key:'agRatio',         label:'A/G ratio', unit:'',      type:'num' },
    ]
  },
  {
    key: 'kidney', label: '신장기능',
    items: [
      { key:'bun',        label:'BUN',        unit:'mg/dL',   type:'num' },
      { key:'creatinine', label:'크레아티닌',   unit:'mg/dL',   type:'num', warn:(v,g) => (g==='여'?v>=1.3:v>=1.5)?'주의':null },
      { key:'egfr',       label:'eGFR',       unit:'mL/min',  type:'num' },
      { key:'bcRatio',    label:'BUN/Cr',     unit:'',        type:'num' },
    ]
  },
  {
    key: 'electrolyte', label: '전해질',
    items: [
      { key:'sodium',    label:'나트륨(Na)', unit:'mEq/L', type:'num' },
      { key:'potassium', label:'칼륨(K)',    unit:'mEq/L', type:'num', warn:(v) => v>5.5?'높음':v<3.5?'낮음':null },
      { key:'chloride',  label:'염소(Cl)',   unit:'mEq/L', type:'num' },
    ]
  },
  {
    key: 'thyroid', label: '갑상선',
    items: [
      { key:'tsh',    label:'TSH',     unit:'mIU/L', type:'num', warn:(v) => v>4.5?'저하증의심':v<0.4?'항진증의심':null },
      { key:'t3',     label:'T3',      unit:'nmol/L',type:'num' },
      { key:'freeT4', label:'Free T4', unit:'ng/dL', type:'num' },
    ]
  },
  {
    key: 'other_lab', label: '기타 혈액검사',
    items: [
      { key:'uric',      label:'요산',          unit:'mg/dL', type:'num', warn:(v,g) => (g==='여'?v>=6:v>=7)?'주의':null },
      { key:'crp',       label:'CRP(정량)',      unit:'mg/dL', type:'num', warn:(v) => v>=1?'높음':null },
      { key:'vitaminD',  label:'비타민D',         unit:'ng/mL', type:'num', warn:(v) => v<20?'결핍':v<30?'부족':null },
      { key:'amylase',   label:'아밀라제',         unit:'U/L',   type:'num' },
      { key:'lipase',    label:'리파제',           unit:'U/L',   type:'num' },
      { key:'raFactor',  label:'RA인자(RF)',      unit:'IU/mL', type:'num', warn:(v) => v>=14?'높음':null },
      { key:'calcium',   label:'칼슘(Ca)',         unit:'mg/dL', type:'num' },
      { key:'phosphorus',label:'인(P)',            unit:'mg/dL', type:'num' },
      { key:'occultBlood',label:'대변잠혈(Occult)', unit:'',      type:'text' },
      { key:'rpr',       label:'RPR(매독)',        unit:'',      type:'text' },
    ]
  },
  {
    key: 'hepatitis', label: '간염 / 감염',
    items: [
      { key:'havAb',  label:'A형간염 항체(HAV Ab)', unit:'', type:'text' },
      { key:'hbsAg',  label:'B형간염 항원(HBs Ag)', unit:'', type:'text' },
      { key:'hbsAb',  label:'B형간염 항체(HBs Ab)', unit:'', type:'text' },
      { key:'hcvAb',  label:'C형간염 항체(HCV Ab)', unit:'', type:'text' },
    ]
  },
  {
    key: 'tumor', label: '종양표지자',
    items: [
      { key:'cea',   label:'CEA',    unit:'ng/mL', type:'num', warn:(v) => v>=5?'높음':null },
      { key:'afp',   label:'AFP',    unit:'ng/mL', type:'num', warn:(v) => v>=7?'높음':null },
      { key:'ca125', label:'CA-125', unit:'U/mL',  type:'num', warn:(v) => v>=35?'높음':null },
      { key:'ca199', label:'CA19-9', unit:'U/mL',  type:'num', warn:(v) => v>=37?'높음':null },
    ]
  },
  {
    key: 'eye', label: '안과검사',
    items: [
      { key:'visionL',    label:'시력(좌)',    unit:'', type:'num' },
      { key:'visionR',    label:'시력(우)',    unit:'', type:'num' },
      { key:'corrVisionL',label:'교정시력(좌)', unit:'', type:'num' },
      { key:'corrVisionR',label:'교정시력(우)', unit:'', type:'num' },
      { key:'iopL',       label:'안압(좌)',    unit:'mmHg', type:'num' },
      { key:'iopR',       label:'안압(우)',    unit:'mmHg', type:'num' },
      { key:'fundusL',    label:'안저(좌) 소견', unit:'', type:'text' },
      { key:'fundusR',    label:'안저(우) 소견', unit:'', type:'text' },
    ]
  },
  {
    key: 'hearing', label: '청력검사',
    items: [
      { key:'hearingL',     label:'청력검사(좌)',   unit:'dB', type:'num' },
      { key:'hearingR',     label:'청력검사(우)',   unit:'dB', type:'num' },
      { key:'corrHearingL', label:'교정청력(좌)',   unit:'dB', type:'num' },
      { key:'corrHearingR', label:'교정청력(우)',   unit:'dB', type:'num' },
    ]
  },
  {
    key: 'bone', label: '골밀도 (DEXA)',
    items: [
      { key:'bmdSpineT', label:'T-score(요추)', unit:'', type:'num', warn:(v) => v<=-2.5?'골다공증':v<=-1?'골감소증':null },
      { key:'bmdHipT',   label:'T-score(대퇴)', unit:'', type:'num', warn:(v) => v<=-2.5?'골다공증':v<=-1?'골감소증':null },
      { key:'bmdSpineZ', label:'Z-score(요추)', unit:'', type:'num' },
    ]
  },
  {
    key: 'urine', label: '소변검사 (RU)',
    items: [
      { key:'urinePh',          label:'pH(소변)',         unit:'', type:'num' },
      { key:'urineProtein',     label:'단백(소변)',         unit:'', type:'text' },
      { key:'urineGlucose',     label:'당(소변)',           unit:'', type:'text' },
      { key:'urineBlood',       label:'잠혈(소변)',         unit:'', type:'text' },
      { key:'urineWbc',         label:'WBC(소변)',         unit:'', type:'text' },
      { key:'urineNitrite',     label:'아질산염(Nitrite)', unit:'', type:'text' },
      { key:'urineKetone',      label:'케톤(소변)',         unit:'', type:'text' },
      { key:'urineUrobilinogen',label:'우로빌리노겐',        unit:'', type:'text' },
      { key:'urineBilirubin',   label:'빌리루빈(소변)',      unit:'', type:'text' },
      { key:'specificGravity',  label:'비중(소변)',         unit:'', type:'num' },
      { key:'urineMicroscopy',  label:'현미경(소변)',       unit:'', type:'text' },
    ]
  },
  {
    key: 'imaging', label: '영상/기능검사 소견',
    items: [
      { key:'ecg',         label:'심전도',     unit:'', type:'text' },
      { key:'chestXray',   label:'흉부X선',     unit:'', type:'text' },
      { key:'abdomUs',     label:'복부초음파',   unit:'', type:'text' },
      { key:'thyroidUs',   label:'갑상선초음파',  unit:'', type:'text' },
      { key:'breastUs',    label:'유방초음파',   unit:'', type:'text' },
      { key:'mammography', label:'유방촬영',    unit:'', type:'text' },
      { key:'egd',         label:'위내시경',    unit:'', type:'text' },
      { key:'colonoscopy', label:'대장내시경',   unit:'', type:'text' },
      { key:'mri',         label:'MRI',        unit:'', type:'text' },
      { key:'ct',          label:'CT',         unit:'', type:'text' },
      { key:'xray',        label:'기타X선',         unit:'', type:'text' },
      { key:'gyCytology',  label:'자궁경부세포검사', unit:'', type:'text' },
      { key:'etc',         label:'기타 소견',        unit:'', type:'text' },
    ]
  },
]

export const CHECKUP_ITEMS = CHECKUP_CATEGORIES.flatMap(c => c.items)
export const NUM_ITEMS = CHECKUP_ITEMS.filter(i => i.type !== 'text')

export const STATUS_COLORS = {
  '위험':'#dc2626','주의':'#d97706','공복혈당장애':'#d97706','경계':'#d97706',
  '높음':'#d97706','당뇨':'#dc2626','빈혈':'#dc2626','비만':'#d97706','과체중':'#d97706',
  '저체중':'#9ca3af','저하증의심':'#2563eb','항진증의심':'#dc2626','낮음':'#9ca3af',
  '결핍':'#dc2626','부족':'#d97706','골다공증':'#dc2626','골감소증':'#d97706',
}

// 이상 항목 감지
export function detectAbnormal(items, gender) {
  const result = []
  NUM_ITEMS.forEach(item => {
    if (!item.warn) return
    const v = parseFloat(items?.[item.key])
    if (isNaN(v)) return
    const ws = item.warn(v, gender)
    if (ws) result.push({ key: item.key, label: item.label, value: v, unit: item.unit, status: ws })
  })
  return result
}

// 소견 이상 감지 (특정 키워드)
const FINDING_WARNINGS = ['의심','이상','병변','용종','암','종양','결절','낭종','협착','역류','만성','급성','비정상','비정형','재검','추적','요망']
export function detectFindingAbnormal(items) {
  const result = []
  CHECKUP_ITEMS.filter(i => i.type === 'text').forEach(item => {
    const v = items?.[item.key]
    if (!v) return
    const hasWarning = FINDING_WARNINGS.some(w => v.includes(w))
    if (hasWarning) result.push({ key: item.key, label: item.label, value: v })
  })
  return result
}
