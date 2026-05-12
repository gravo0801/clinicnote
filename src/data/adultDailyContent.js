export const adultDailyContent = [
  {
    day: 1,
    date: '2026-05-12',
    slug: 'hypertension-initial',
    topic: '고혈압 초진: 진단 기준, 가정혈압, 초기 약제 선택',
    printPath: '/adult-daily/print/day-01-hypertension-initial.html',
    masterPath: '/adult-daily/master/day-01-hypertension-initial.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 ER</div>
          <div>180/120 전후 이상 + 흉통, 호흡곤란, 신경학적 결손, 의식 변화, 시야장애, 폐부종, 급성 신손상 의심.</div>
        </div>
        <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#9a330a;margin-bottom:6px">진단 기준</div>
          <div>진료실 혈압 140/90 mmHg 이상. 가정혈압 135/85 mmHg 이상. 초진 1회 수치만으로 단정하지 말고 반복 측정.</div>
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 루틴</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>5분 안정 후 재측정. 가능하면 양팔 혈압.</li>
        <li>흉통, 숨참, 한쪽 마비/말 어눌함, 시야장애, 심한 두통 확인.</li>
        <li>NSAID, 감기약, 스테로이드, 다이어트약, 한약/보충제, 음주, 수면무호흡 확인.</li>
        <li>오늘 약 시작 vs 가정혈압 1주 기록 후 결정.</li>
      </ol>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          집혈압, 응급증상, 혈압 올리는 약물, 수면무호흡/체중, 가족력/당뇨/신장/심뇌혈관 병력.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          양팔 혈압, BMI/허리둘레, 심폐청진, 경동맥/복부 bruit, 부종/말초맥박.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#faf7f1">
        CBC, Na/K/Cl, BUN/Cr/eGFR, AST/ALT, FBS 또는 HbA1c, lipid profile, urinalysis, urine ACR 가능하면 권장, ECG.
        ARB/ACEi/이뇨제 시작 또는 증량 후 Cr/eGFR, K 재확인.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">I10</td><td style="border:1px solid #e7e2d7;padding:7px">본태성 고혈압. 진단 확인 후 치료/추적.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R03.0</td><td style="border:1px solid #e7e2d7;padding:7px">고혈압 진단 없이 혈압 상승 소견. 초진/확진 전.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E78.x/E11.x/N18.x</td><td style="border:1px solid #e7e2d7;padding:7px">동반질환 부상병 후보.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">초기 처방 Regimen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#fff7ed">상황</th><th style="border:1px solid #e7e2d7;padding:7px;background:#fff7ed">약제 예</th><th style="border:1px solid #e7e2d7;padding:7px;background:#fff7ed">주의</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">일반 초진</td><td style="border:1px solid #e7e2d7;padding:7px">Amlodipine 5 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">부종/홍조</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">당뇨/단백뇨/CKD 경향</td><td style="border:1px solid #e7e2d7;padding:7px">Losartan 50 mg qd 또는 Telmisartan 40 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">K/Cr, 임신 가능성</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">160/100 이상 또는 목표보다 20/10 이상</td><td style="border:1px solid #e7e2d7;padding:7px">ARB/CCB 저용량 복합제 고려</td><td style="border:1px solid #e7e2d7;padding:7px">어지럼/저혈압 설명</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up / Refer</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>약 시작 전: 가정혈압 1주 기록 후 1-2주 내 재진.</li>
        <li>약 시작 후: 2-4주 뒤 혈압/부작용 확인.</li>
        <li>빠른 의뢰: Cr 급상승, 단백뇨/혈뇨, 반복 저칼륨혈증, 젊은 중증 고혈압, resistant HTN.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #c2410c;background:#fff7ed;padding:10px 12px;border-radius:8px">
        오늘 혈압이 높게 나왔지만 한 번 잰 혈압만으로 평생 약을 결정하지는 않습니다. 집에서 아침, 저녁으로 1주일 재서 평균을 보겠습니다. 다만 가슴통증, 숨참, 한쪽 마비, 말 어눌함, 갑자기 심한 두통이나 시야장애가 생기면 약을 더 먹고 기다리지 말고 응급실로 가셔야 합니다.
      </div>
    `,
    revisions: [
      '2026-05-12: 최초 작성. 대한고혈압학회 2022 focused update, 가정혈압 position statement, ESH 2023 요약 반영.',
    ],
  },
]
