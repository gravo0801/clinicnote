import { adultDailyContent } from './adultDailyContent'

const legacyAdultDailyContent = [
  {
    day: 2,
    date: '2026-05-13',
    slug: 'hypertension-followup',
    topic: '고혈압 추적: 증량/병합, 부작용, refer 기준',
    printPath: '/adult-daily/print/day-02-hypertension-followup.html',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">먼저 보낼 환자</div>
          <div>흉통, 호흡곤란, 신경학적 결손, 의식 변화, 시야장애, 폐부종, 급성 신손상 의심이 있으면 조절 불량 외래가 아니라 고혈압 응급으로 본다.</div>
        </div>
        <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#9a330a;margin-bottom:6px">재진 핵심</div>
          <div>진료실 혈압, 가정혈압, 복약 순응도, 염분/음주/NSAID, 부작용을 한 번에 점검한 뒤 유지·증량·병합·의뢰를 결정한다.</div>
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">5분 추적 루틴</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>안정 후 혈압 재측정, 가정혈압 평균과 비교.</li>
        <li>복약 누락, 복용 시간, 비용, 환자 이해도 확인.</li>
        <li>NSAID, 감기약, 음주, 염분, 수면무호흡, 체중 증가 확인.</li>
        <li>CCB 부종/홍조, ARB·ACEi Cr/K 변화, 이뇨제 전해질·요산 부작용 확인.</li>
        <li>목표 초과가 확인되면 증량 또는 다른 계열 병합, 3제 이상 조절 불량은 2차성 평가/의뢰 고려.</li>
      </ol>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up / Refer</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>ACEi/ARB/이뇨제 시작 또는 증량 후 Cr/eGFR, K 확인.</li>
        <li>3제 이상, 이뇨제 포함에도 조절 불량이면 순응도와 측정 오류 확인 후 의뢰.</li>
        <li>젊은 중증 고혈압, 반복 저칼륨혈증, Cr 급상승, 단백뇨/혈뇨 동반 시 빠른 평가.</li>
      </ul>
    `,
    revisions: [
      '2026-05-13: 최초 작성. 대한고혈압학회 2022 focused update, 2023 KSH resistant hypertension consensus, 2024 ESC guideline 반영.',
    ],
  },
  {
    day: 5,
    date: '2026-05-15',
    slug: 'dyslipidemia-statin',
    topic: '이상지질혈증: statin 시작 기준, LFT/근육통 상담',
    printPath: '/adult-daily/print/day-05-dyslipidemia-statin.html',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#9a330a;margin-bottom:6px">시작 판단</div>
          <div>LDL-C 숫자만 보지 말고 ASCVD, 당뇨, CKD, 고혈압, 흡연, 가족력, 나이를 함께 보며 statin 필요성을 설명한다.</div>
        </div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">처방 전 기준값</div>
          <div>Lipid profile, AST/ALT, 필요 시 CK/TSH, 당뇨·신장기능을 확인하고 근육통 병력과 상호작용 약물을 점검한다.</div>
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">초진 루틴</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>ASCVD 병력: 협심증, 심근경색, 뇌졸중/TIA, 말초동맥질환.</li>
        <li>위험인자: 당뇨, CKD, 고혈압, 흡연, 가족력, 조기 관상동맥질환.</li>
        <li>이차 원인: 갑상선저하증, 신증후군, 담즙정체, 약물, 과음.</li>
        <li>임신 가능성 또는 임신 계획이 있으면 statin 사용을 반드시 상의.</li>
      </ol>

      <h3 style="margin:14px 0 7px;font-size:15px">추적과 상담</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>시작 또는 변경 후 4-12주에 지질과 부작용을 확인하고 이후 주기적으로 추적.</li>
        <li>근육통, 근력저하, 콜라색 소변, 심한 피로가 있으면 연락하도록 설명.</li>
        <li>목표 미달 시 순응도, 식이, 상호작용 확인 후 증량 또는 ezetimibe 병합 고려.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #c2410c;background:#fff7ed;padding:10px 12px;border-radius:8px">
        콜레스테롤 약은 수치를 예쁘게 만드는 약이라기보다 앞으로 심근경색과 뇌졸중 위험을 낮추기 위한 약입니다. 간수치와 근육통은 시작 전 기준값을 확인하고, 증상이 생기면 바로 조정할 수 있습니다.
      </div>
    `,
    revisions: [
      '2026-05-15: 최초 작성. 한국지질동맥경화학회 2022 지침, ACC/AHA cholesterol guideline, statin monitoring 자료 반영.',
    ],
  },
]

legacyAdultDailyContent.forEach(item => {
  if (!adultDailyContent.some(existing => existing.day === item.day)) {
    adultDailyContent.push(item)
  }
})

export const adultDailyDay03 = {
  day: 3,
  date: '2026-05-21',
  slug: 'diabetes-initial',
  topic: '당뇨 초진: HbA1c 해석, metformin 시작, 합병증 스크리닝',
  printPath: '/adult-daily/print/day-03-diabetes-initial.html',
  masterPath: '/adult-daily/master/day-03-diabetes-initial.md',
  appHtml: `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
      <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
        <div style="font-weight:900;color:#991b1b;margin-bottom:6px">당일 의뢰/응급</div>
        <div>케톤산증 의심, 탈수/의식저하, 체중감소를 동반한 심한 고혈당, A1c 10% 초과 또는 혈당 300 mg/dL 이상이면 인슐린 필요성까지 보고 빠르게 의뢰한다.</div>
      </div>
      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px">
        <div style="font-weight:900;color:#9a330a;margin-bottom:6px">진단 기준</div>
        <div>A1c 6.5% 이상, 공복혈당 126 mg/dL 이상, 2시간 OGTT 200 mg/dL 이상, 또는 전형 증상 + 무작위혈당 200 mg/dL 이상. 무증상이면 재확인한다.</div>
      </div>
    </div>

    <h3 style="margin:14px 0 7px;font-size:15px">첫 방문 5분 루틴</h3>
    <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
      <li>증상과 위험도: 다뇨, 다음, 체중감소, 시야흐림, 감염 반복, 흉통/호흡곤란, 탈수.</li>
      <li>A1c와 혈당 패턴 확인: 진단 수치인지, 전당뇨인지, 바로 치료가 필요한 고혈당인지 나눈다.</li>
      <li>기저검사: eGFR/Cr, AST/ALT, 지질, 소변 ACR, 요검사, 혈압, BMI/허리둘레.</li>
      <li>약 시작 전 금기 확인: eGFR, 위장관 부작용 가능성, 음주, 간질환, 임신 가능성.</li>
      <li>오늘 처방, 생활요법, 합병증 스크리닝, 2-4주 추적 계획을 한 장으로 설명한다.</li>
    </ol>

    <h3 style="margin:14px 0 7px;font-size:15px">처방 시작</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#fff7ed">상황</th><th style="border:1px solid #e7e2d7;padding:7px;background:#fff7ed">선택</th><th style="border:1px solid #e7e2d7;padding:7px;background:#fff7ed">포인트</th></tr></thead>
      <tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:7px">일반 초진, eGFR 45 이상</td><td style="border:1px solid #e7e2d7;padding:7px">Metformin 500 mg qd-bid 시작 후 증량</td><td style="border:1px solid #e7e2d7;padding:7px">식후 복용, 위장관 부작용 설명</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px">ASCVD/HF/CKD 동반</td><td style="border:1px solid #e7e2d7;padding:7px">SGLT2i 또는 GLP-1 RA 계열 우선 고려</td><td style="border:1px solid #e7e2d7;padding:7px">동반질환 이득과 급여 기준 확인</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px">A1c 10% 초과, 혈당 300 이상, catabolic 증상</td><td style="border:1px solid #e7e2d7;padding:7px">인슐린 포함 치료 평가</td><td style="border:1px solid #e7e2d7;padding:7px">당일 의뢰 또는 빠른 전문의 연계</td></tr>
      </tbody>
    </table>

    <h3 style="margin:14px 0 7px;font-size:15px">초진 합병증 스크리닝</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff"><b>신장</b><br>eGFR/Cr, 소변 albumin/creatinine ratio. 단백뇨 또는 eGFR 저하 시 ACEi/ARB와 의뢰 기준 검토.</div>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff"><b>눈</b><br>제2형 당뇨는 진단 시점부터 안저/안과 의뢰. 시야흐림, 오래된 고혈당이면 더 빠르게.</div>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff"><b>발/신경</b><br>감각저하, 저림, 궤양, 맥박, 발 변형 확인. 발관리 교육을 첫날부터 넣는다.</div>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff"><b>심혈관</b><br>혈압, 지질, 흡연, ASCVD 병력 확인. statin 필요성과 목표를 같이 설명한다.</div>
    </div>

    <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
    <div style="border-left:4px solid #c2410c;background:#fff7ed;padding:10px 12px;border-radius:8px">
      당뇨 치료는 혈당 숫자만 낮추는 것이 아니라 눈, 콩팥, 신경, 심혈관 합병증을 줄이는 치료입니다. 오늘은 위험한 고혈당인지 먼저 확인하고, metformin을 시작할 수 있는지 신장기능을 같이 봅니다.
    </div>
  `,
  revisions: [
    '2026-05-21: 최초 작성. ADA Standards of Care in Diabetes 2026, ADA diagnosis/pharmacologic/complication screening sections, KDA 2025 지침 반영.',
  ],
}
