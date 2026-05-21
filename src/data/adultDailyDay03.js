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
        <tr><td style="border:1px solid #e7e2d7;padding:7px">A1c 9% 전후 이상</td><td style="border:1px solid #e7e2d7;padding:7px">초기 병합요법 고려</td><td style="border:1px solid #e7e2d7;padding:7px">저혈당 위험과 비용/순응도 같이 판단</td></tr>
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

    <h3 style="margin:14px 0 7px;font-size:15px">KCD / 추적</h3>
    <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
      <li>E11.9: 합병증을 동반하지 않은 제2형 당뇨병. 합병증이 확인되면 해당 세부코드로 조정.</li>
      <li>R73.x: 당뇨 확진 전 고혈당/전당뇨 평가 단계에서 고려.</li>
      <li>약 시작 후 2-4주에 부작용, 복약, SMBG/증상 확인. A1c는 보통 3개월 간격으로 재평가.</li>
      <li>저혈당 위험 약제 사용 시 운전, 식사 거름, 음주, 증상 대처를 반드시 설명한다.</li>
    </ul>

    <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
    <div style="border-left:4px solid #c2410c;background:#fff7ed;padding:10px 12px;border-radius:8px">
      당뇨 치료는 혈당 숫자만 낮추는 것이 아니라 눈, 콩팥, 신경, 심혈관 합병증을 줄이는 치료입니다. 오늘은 위험한 고혈당인지 먼저 확인하고, metformin을 시작할 수 있는지 신장기능을 같이 봅니다. 약은 식사와 함께 낮은 용량으로 시작해 속 불편감을 줄이고, 2-4주 뒤 복약과 부작용을 다시 보겠습니다.
    </div>
  `,
  revisions: [
    '2026-05-21: 최초 작성. ADA Standards of Care in Diabetes 2026, ADA diagnosis/pharmacologic/complication screening sections, KDA 2025 지침 반영.',
  ],
}
