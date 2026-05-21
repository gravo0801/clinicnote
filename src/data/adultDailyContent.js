export const adultDailyContent = [
  {
    day: 1,
    date: '2026-05-12',
    slug: 'hypertension-initial',
    topic: '고혈압 초진: 진단 기준, 가정혈압, 초기 약제 선택',
    printPath: '/adult-daily/print/day-01-hypertension-initial.html',
    pdfPath: '/adult-daily/pdf/day-01-hypertension-initial.pdf',
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
  {
    day: 2,
    date: '2026-05-13',
    slug: 'hypertension-followup',
    topic: '고혈압 추적: 증량/병합, 부작용, refer 기준',
    printPath: '/adult-daily/print/day-02-hypertension-followup.html',
    pdfPath: '/adult-daily/pdf/day-02-hypertension-followup.pdf',
    masterPath: '/adult-daily/master/day-02-hypertension-followup.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">30초 ER triage</div>
          <div>180/120 전후 이상 + 흉통, 호흡곤란, 신경학적 결손, 의식 변화, 시야장애, 폐부종, 급성 신손상 의심. 임신/산후 중증 고혈압도 즉시 의뢰.</div>
        </div>
        <div style="border:1px solid #99f6e4;background:#f0fdfa;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#115e59;margin-bottom:6px">3분 재진 루틴</div>
          <div>가정혈압 평균, 실제 복약, 부작용, NSAID/감기약/스테로이드/음주/염분, Cr/eGFR·K·Na 추적 필요성을 확인.</div>
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          집혈압 평균, 복약 누락, 어지럼/부종/기침/근경련/성기능, 새 약물, 염분·음주·수면무호흡·체중.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          안정 후 혈압 재측정, 기립혈압, 맥박/리듬, 체중·부종, 심폐청진, 말초맥박/복부 bruit.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#faf7f1">
        ARB/ACEi 시작·증량 후 Cr/eGFR, K를 2-4주 내 확인. Thiazide는 Na/K/Cr/eGFR/uric acid.
        Spironolactone은 eGFR/K 확인 후 신중히. 조절 불량 지속 시 UA, urine ACR, HbA1c, lipid, ECG.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">I10</td><td style="border:1px solid #e7e2d7;padding:7px">본태성 고혈압. 추적·약물 조정 주상병.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">I11.x/I12.x/I13.x</td><td style="border:1px solid #e7e2d7;padding:7px">심장/신장 침범 근거가 있을 때.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">N18.x/E78.x/E11.x</td><td style="border:1px solid #e7e2d7;padding:7px">CKD, 이상지질혈증, 당뇨 동반 부상병 후보.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R60.0/R42</td><td style="border:1px solid #e7e2d7;padding:7px">부종 또는 어지럼 평가.</td></tr>
        </tbody>
      </table>
      <div style="font-size:12px;color:#78716c;margin-top:6px">상병코드는 실무 후보이며 최종 청구는 실제 진단/검사/차팅에 맞춰 조정.</div>

      <h3 style="margin:14px 0 7px;font-size:15px">처방 Regimen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">현재 처방</th><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">목표 미달 시</th><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">주의</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Amlodipine 5 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">10 mg qd 또는 ARB 추가</td><td style="border:1px solid #e7e2d7;padding:7px">부종 있으면 병합/감량</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Losartan 50 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">100 mg qd 또는 CCB 추가</td><td style="border:1px solid #e7e2d7;padding:7px">K/Cr, 임신 가능성</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Telmisartan 40 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">80 mg qd 또는 CCB 추가</td><td style="border:1px solid #e7e2d7;padding:7px">K/Cr, 어지럼</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">2제에도 미달</td><td style="border:1px solid #e7e2d7;padding:7px">ARB + CCB + thiazide-like</td><td style="border:1px solid #e7e2d7;padding:7px">Na/K, 요산, eGFR</td></tr>
        </tbody>
      </table>
      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:10px 12px;margin-top:10px">
        eGFR, K, Na, 간기능, 임신 가능성, 고령/frailty, 항응고제, NSAID/PPI/BZD/quinolone/steroid 위험을 확인.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>약 시작/증량 후 2-4주: 혈압, 부작용, 순응도 확인.</li>
        <li>ARB/ACEi/이뇨제/spironolactone 조정 후 2-4주: Cr/eGFR, K, Na 확인.</li>
        <li>안정화 후 1-3개월, 이후 안정적이면 3개월 단위.</li>
        <li>치료 실패: 가정혈압 135/85 이상 반복, 2제 이상에도 목표 미달, 이뇨제 포함 3제에도 조절 불량.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">Refer</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
        응급: 표적장기손상 증상, ACS/stroke/TIA/대동맥박리/급성 심부전 의심, K 6.0 이상, 급성 신손상, 임신/산후 중증 고혈압.<br>
        빠른 외래: Cr/eGFR 급격 악화, 단백뇨/혈뇨, 반복 저칼륨혈증, 30세 이전 중증, resistant HTN.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #0f766e;background:#f0fdfa;padding:10px 12px;border-radius:8px">
        오늘 혈압이 높다고 바로 약을 많이 올리지는 않겠습니다. 집에서 잰 평균과 실제 복용 여부를 같이 봐야 합니다.
        한 가지 약을 세게 쓰기보다 서로 다른 약을 낮은 용량으로 같이 쓰는 편이 혈압은 더 잘 잡히고 부작용은 줄어드는 경우가 많습니다.
        가슴통증, 숨참, 한쪽 마비, 말 어눌함, 갑자기 심한 두통이나 시야장애가 있으면 응급실로 가셔야 합니다.
      </div>
    `,
    revisions: [
      '2026-05-13: 최초 작성. 대한고혈압학회 2022 focused update, 2023 KSH resistant hypertension consensus, 2024 ESC guideline 반영.',
    ],
  },
  {
    day: 3,
    date: '2026-05-18',
    slug: 'diabetes-initial',
    topic: '당뇨 초진: HbA1c 해석, metformin 시작, 합병증 스크리닝',
    printPath: '/adult-daily/print/day-03-diabetes-initial.html',
    pdfPath: '/adult-daily/pdf/day-03-diabetes-initial.pdf',
    masterPath: '/adult-daily/master/day-03-diabetes-initial.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">30초 응급 triage</div>
          <div>의식 저하, 심한 탈수, 반복 구토/복통, Kussmaul 호흡, ketone 양성, 혈당 300-400 이상+전신상태 불량, 임신, 감염성 당뇨발은 바로 보낸다.</div>
        </div>
        <div style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#065f46;margin-bottom:6px">3분 초진 루틴</div>
          <div>HbA1c/FPG로 진단 확인, 1형/LADA 단서, eGFR·간기능·임신 가능성, ASCVD/HF/CKD/비만을 확인하고 오늘 약 시작 여부를 정한다.</div>
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">진단 기준 / HbA1c 해석</h3>
      <div style="border:1px solid #d1d5db;border-radius:10px;padding:12px;background:#fff">
        HbA1c 6.5% 이상, 공복혈당 126 mg/dL 이상, OGTT 2시간 200 mg/dL 이상, 또는 전형 증상+무작위혈당 200 mg/dL 이상이면 당뇨 기준.
        무증상자는 원칙적으로 반복/확인검사. 빈혈, 수혈/출혈, CKD, 간질환, 임신, 혈색소 이상에서는 HbA1c만 믿지 않는다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          다갈·다뇨·체중감소, 과거 혈당/임신성당뇨, 가족력·ASCVD/CKD, steroid/항정신병약/술, 임신 가능성·eGFR·간질환·탈수.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          활력/탈수, BMI·허리둘레, 혈압, 피부감염/acanthosis, 심혈관·말초맥박, 발 궤양·callus·무좀·감각.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#faf7f1">
        HbA1c, fasting glucose, random glucose, urine ketone/UA, BUN/Cr/eGFR, AST/ALT, lipid profile, urine ACR, CBC 선택, TSH 선택, B12 선택.
        2형당뇨는 진단 시점부터 안저검사 의뢰와 발 진찰을 시작한다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E11.9</td><td style="border:1px solid #e7e2d7;padding:7px">합병증 없는 2형당뇨병. 초진·초기치료 주상병 후보.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E11.2/E11.3/E11.4</td><td style="border:1px solid #e7e2d7;padding:7px">신장/눈/신경 합병증 근거가 있을 때.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R73.0/R73.9</td><td style="border:1px solid #e7e2d7;padding:7px">확진 전 공복혈당장애, 내당능장애, 고혈당 소견.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E66.x/I10/E78.x/K76.0/N18.x</td><td style="border:1px solid #e7e2d7;padding:7px">비만, 고혈압, 이상지질혈증, 지방간, CKD 동반 부상병 후보.</td></tr>
        </tbody>
      </table>
      <div style="font-size:12px;color:#78716c;margin-top:6px">상병코드는 실무 후보이며 최종 청구는 실제 진단/검사/차팅에 맞춰 조정.</div>

      <h3 style="margin:14px 0 7px;font-size:15px">처방 Regimen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">상황</th><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">초기 접근</th><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">주의</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">HbA1c 6.5-7.4%, 무증상</td><td style="border:1px solid #e7e2d7;padding:7px">생활요법+metformin 또는 1-3개월 후 재평가</td><td style="border:1px solid #e7e2d7;padding:7px">확인검사</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">HbA1c 7.5-9.0%</td><td style="border:1px solid #e7e2d7;padding:7px">Metformin 시작, 동반질환 있으면 병합 검토</td><td style="border:1px solid #e7e2d7;padding:7px">eGFR/간기능</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">HbA1c 9 이상</td><td style="border:1px solid #e7e2d7;padding:7px">초기 병합 또는 전문의 의뢰</td><td style="border:1px solid #e7e2d7;padding:7px">단독 지연 주의</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">HbA1c 10 이상 또는 혈당 300 이상+증상</td><td style="border:1px solid #e7e2d7;padding:7px">Insulin 포함 치료 가능성, 빠른 의뢰</td><td style="border:1px solid #e7e2d7;padding:7px">ketone/탈수면 응급</td></tr>
        </tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:10px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">Metformin</th><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">증량</th><th style="border:1px solid #e7e2d7;padding:7px;background:#ecfdf5">eGFR</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">IR 500 mg 저녁 식후 qd</td><td style="border:1px solid #e7e2d7;padding:7px">1-2주 뒤 500 mg bid, 이후 1500-2000 mg/day</td><td style="border:1px solid #e7e2d7;padding:7px">45 이상 시작 가능</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">XR 500 mg 저녁 식후 qd</td><td style="border:1px solid #e7e2d7;padding:7px">1-2주 간격 500 mg씩</td><td style="border:1px solid #e7e2d7;padding:7px">30-44 새 시작 신중</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">고령/저체중</td><td style="border:1px solid #e7e2d7;padding:7px">500 mg qd로 천천히</td><td style="border:1px solid #e7e2d7;padding:7px">30 미만 금기</td></tr>
        </tbody>
      </table>

      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:10px 12px;margin-top:10px">
        Metformin 전 체크: eGFR, 간기능/과음, 임신 가능성, 심부전/저산소증, 탈수/감염, 조영제·수술 예정. NSAID/PPI/BZD/quinolone/steroid 위험도 같이 확인.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>확인검사만 계획: 1-2주 내 결과 확인, 늦어도 4주 내.</li>
        <li>Metformin 시작: 2-4주 뒤 GI 부작용, 복약, 증상 확인.</li>
        <li>HbA1c: 약제 시작/변경 후 3개월 재검.</li>
        <li>eGFR 45-59, 고령, ACEi/ARB/이뇨제/SGLT2i 병용: 1-3개월 내 신기능 재확인.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">Refer</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
        응급: DKA/HHS 의심, ketone+탈수/구토/의식저하, 혈당 300-400 이상+전신상태 불량, 흉통/stroke/심부전/패혈증, 감염성 당뇨발.<br>
        빠른 외래: 1형/LADA 의심, 임신, HbA1c 10 이상 또는 혈당 300 이상+증상, eGFR 30 미만, ACR 300 이상 반복, 안저/신경/족부 합병증.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #047857;background:#ecfdf5;padding:10px 12px;border-radius:8px">
        당화혈색소는 최근 2-3개월 평균 혈당입니다. 6.5% 이상이면 당뇨 기준에 들어가지만, 증상이 없으면 한 번 더 확인해서 확정하겠습니다.
        Metformin은 저녁 식후 낮은 용량으로 시작하고 천천히 올리겠습니다. 구토, 심한 탈수, 복통, 숨이 깊고 빨라짐, 의식이 멍해지는 증상이 있으면 응급실로 가셔야 합니다.
      </div>
    `,
    revisions: [
      '2026-05-18: 최초 작성. ADA Standards of Care 2026, 대한당뇨병학회 2025 진료지침, ADA-KDIGO CKD 합의자료 반영.',
    ],
  },
  {
    day: 5,
    date: '2026-05-15',
    slug: 'dyslipidemia-statin',
    topic: '이상지질혈증: statin 시작 기준, LFT/근육통 상담',
    printPath: '/adult-daily/print/day-05-dyslipidemia-statin.html',
    pdfPath: '/adult-daily/pdf/day-05-dyslipidemia-statin.pdf',
    masterPath: '/adult-daily/master/day-05-dyslipidemia-statin.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">당일 의뢰</div>
          <div>흉통/신경학적 결손, TG 1000 mg/dL 전후 + 복통/구토, CK 현저 상승/콜라색 소변, AST/ALT 3배 이상 지속 상승 또는 황달.</div>
        </div>
        <div style="border:1px solid #c7d2fe;background:#eef2ff;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#3730a3;margin-bottom:6px">시작 기준</div>
          <div>ASCVD 병력, LDL-C 190 이상, 당뇨 40-75세, LDL 160 이상 + 위험인자, TG 500 이상 여부를 먼저 나눈다.</div>
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 루틴</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>ASCVD 병력과 당뇨/CKD/흡연/고혈압/조기 가족력을 확인.</li>
        <li>LDL-C 190 이상 또는 TG 500 이상인지 확인.</li>
        <li>임신 가능성, 수유, 활동성 간질환, 과거 statin 부작용 확인.</li>
        <li>macrolide, azole, cyclosporine, HIV/HCV 약제, gemfibrozil 등 상호작용 확인.</li>
        <li>오늘 결론을 생활요법 단독, statin 시작, TG 치료, 의뢰 중 하나로 정리.</li>
      </ol>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          ASCVD 병력, 조기 심혈관질환 가족력, 당뇨/HTN/흡연/CKD, 음주·단순당·체중, 임신/수유·근육병·상호작용 약물.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          혈압, BMI/허리둘레, 건황색종/각막환, 갑상선 소견, 간비대, 말초맥박·경동맥 bruit.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#faf7f1">
        Lipid profile, AST/ALT baseline. CK는 routine이 아니라 근육병 병력, 과거 statin intolerance, 상호작용 약물, 원인불명 근육통 때 확인.
        2차 원인으로 HbA1c/FBS, TSH, Cr/eGFR, urine ACR, LFT를 본다. 시작/증량 후 lipid profile은 4-12주.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E78.0</td><td style="border:1px solid #e7e2d7;padding:7px">순수 고콜레스테롤혈증. LDL-C 중심 상승.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E78.1</td><td style="border:1px solid #e7e2d7;padding:7px">순수 고글리세라이드혈증. TG 중심 상승.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E78.2</td><td style="border:1px solid #e7e2d7;padding:7px">혼합성 고지질혈증. LDL/TG 동반 상승.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E78.5</td><td style="border:1px solid #e7e2d7;padding:7px">상세불명의 고지질혈증. 검진 이상 초기.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E11.x/I10/N18.x/K76.0</td><td style="border:1px solid #e7e2d7;padding:7px">당뇨, 고혈압, CKD, 지방간 동반 시 근거에 따라 부상병.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">처방 Regimen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#eef2ff">상황</th><th style="border:1px solid #e7e2d7;padding:7px;background:#eef2ff">1차 접근</th><th style="border:1px solid #e7e2d7;padding:7px;background:#eef2ff">추적</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">ASCVD 병력</td><td style="border:1px solid #e7e2d7;padding:7px">High-intensity 또는 최대 내약 statin</td><td style="border:1px solid #e7e2d7;padding:7px">LDL-C 50% 이상 감소</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">LDL-C 190 이상</td><td style="border:1px solid #e7e2d7;padding:7px">High-intensity statin</td><td style="border:1px solid #e7e2d7;padding:7px">가족성 고콜레스테롤혈증 평가</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">당뇨 40-75세</td><td style="border:1px solid #e7e2d7;padding:7px">최소 moderate-intensity</td><td style="border:1px solid #e7e2d7;padding:7px">위험인자 많으면 high-intensity</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">TG 200-499</td><td style="border:1px solid #e7e2d7;padding:7px">LDL/non-HDL 중심 statin</td><td style="border:1px solid #e7e2d7;padding:7px">금주, 체중, 당 조절</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">TG 500 이상</td><td style="border:1px solid #e7e2d7;padding:7px">췌장염 예방 우선</td><td style="border:1px solid #e7e2d7;padding:7px">fenofibrate/omega-3 검토</td></tr>
        </tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:10px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#eef2ff">강도</th><th style="border:1px solid #e7e2d7;padding:7px;background:#eef2ff">약제 예</th><th style="border:1px solid #e7e2d7;padding:7px;background:#eef2ff">메모</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Moderate</td><td style="border:1px solid #e7e2d7;padding:7px">Atorvastatin 10-20 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">상호작용 확인</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Moderate</td><td style="border:1px solid #e7e2d7;padding:7px">Rosuvastatin 5-10 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">신기능 저하/고령 주의</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Moderate</td><td style="border:1px solid #e7e2d7;padding:7px">Pitavastatin 2-4 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">상호작용 맥락에서 선택 가능</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">High</td><td style="border:1px solid #e7e2d7;padding:7px">Atorvastatin 40-80 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">ASCVD, LDL 190 이상</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">High</td><td style="border:1px solid #e7e2d7;padding:7px">Rosuvastatin 20 mg qd</td><td style="border:1px solid #e7e2d7;padding:7px">eGFR 낮으면 용량 주의</td></tr>
        </tbody>
      </table>

      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:10px 12px;margin-top:10px">
        Statin 전 체크: 임신 가능성/수유, 활동성 간질환, AST/ALT 상승, 과거 rhabdomyolysis, CYP3A4 inhibitor, gemfibrozil 병용.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up / Refer</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>시작/증량 후 4-12주: lipid profile, 순응도, 부작용 확인.</li>
        <li>안정화 후 3-12개월마다 lipid profile. 당뇨/간질환/다약제는 더 짧게.</li>
        <li>의뢰: LDL 190 이상 + 가족력/황색종/반응 부족, TG 1000 전후, 췌장염 증상, CK 10배 이상, rhabdomyolysis, AST/ALT 3배 이상 지속 상승.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #4338ca;background:#eef2ff;padding:10px 12px;border-radius:8px">
        콜레스테롤 약은 수치를 예쁘게 만드는 약이라기보다 앞으로 심근경색과 뇌졸중 위험을 낮추기 위한 약입니다.
        간수치와 근육통은 시작 전 기준값을 확인하고 증상이 생기면 바로 조정할 수 있습니다.
        근육통, 근력저하, 콜라색 소변이 있으면 참지 말고 연락 주세요. 임신을 계획하거나 가능성이 생기면 statin은 바로 상의해야 합니다.
      </div>
    `,
    revisions: [
      '2026-05-15: 최초 작성. 한국지질동맥경화학회 2022 지침, ACC/AHA cholesterol guideline, statin monitoring 자료 반영.',
    ],
  },
]
