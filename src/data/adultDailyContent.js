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
  {
    day: 7,
    date: '2026-07-05',
    slug: 'obesity-injection-basics',
    topic: '비만주사 실전 보강판: GLP-1/GIP 상담, 금기, 유지 전략',
    printPath: '/adult-daily/print/day-07-obesity-injection-basics.html',
    pdfPath: '/adult-daily/pdf/day-07-obesity-injection-basics.pdf',
    masterPath: '/adult-daily/master/day-07-obesity-injection-basics.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">중단/의뢰</div>
          <div>심한 지속 상복부 통증, 반복 구토, RUQ pain/황달/발열, 탈수/소변감소, 임신, serious hypersensitivity는 약을 더 맞지 말고 평가.</div>
        </div>
        <div style="border:1px solid #99f6e4;background:#f0fdfa;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#115e59;margin-bottom:6px">3분 상담</div>
          <div>BMI/동반질환, 임신·수유, MTC/MEN2, 췌장염/담낭질환, severe GI disease, insulin/SU 병용과 비용·장기치료 이해도를 확인.</div>
        </div>
      </div>

      <div style="border:1px solid #99f6e4;background:#f0fdfa;border-radius:10px;padding:12px;margin-bottom:14px">
        <b>실전 보강 포인트</b><br>
        비만은 만성 대사질환으로 설명하고, 초진 평가-4주 증량-12주 효과판정-유지기 재진을 표준 흐름으로 잡는다.
        최신 근거는 체중감량뿐 아니라 심혈관 위험 감소와 중단 후 재증가 문제를 함께 보여주므로, 시작 전부터 장기 비용과 유지 전략을 설명한다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          BMI/체중변화, 대사질환, 임신/수유, 췌장염/담석/위마비, MTC/MEN2/약물 알레르기.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          체중, BMI, 허리둘레, BP/HR, 복부압통/RUQ 압통, 갑상선/경부, 근감소 위험.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#faf7f1">
        시작 전 HbA1c/FBS, lipid, AST/ALT, Cr/eGFR. 임신 가능성이 있으면 hCG. 복통/구토가 심하면 lipase/amylase, LFT, 영상 평가를 고려.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E66.x</td><td style="border:1px solid #e7e2d7;padding:7px">비만. BMI와 동반질환, 상담 내용 기록.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R63.5</td><td style="border:1px solid #e7e2d7;padding:7px">비정상 체중 증가 평가 단계.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E11.x/I10/E78.x/K76.0</td><td style="border:1px solid #e7e2d7;padding:7px">당뇨, 고혈압, 이상지질혈증, 지방간 동반 시.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">처방 Regimen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#f0fdfa">약제</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f0fdfa">시작/증량</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f0fdfa">주의</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Liraglutide</td><td style="border:1px solid #e7e2d7;padding:7px">0.6 mg sc qd 시작, 주 단위 증량</td><td style="border:1px solid #e7e2d7;padding:7px">GI/담낭/임신</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Semaglutide</td><td style="border:1px solid #e7e2d7;padding:7px">0.25 mg sc weekly 시작, 보통 4주 간격 증량</td><td style="border:1px solid #e7e2d7;padding:7px">GI, 담낭, pancreatitis 경고</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Tirzepatide</td><td style="border:1px solid #e7e2d7;padding:7px">2.5 mg sc weekly 시작, 4주 이상 간격 증량</td><td style="border:1px solid #e7e2d7;padding:7px">국내 적응증 확인</td></tr>
        </tbody>
      </table>

      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:10px 12px;margin-top:10px">
        MTC/MEN2, serious hypersensitivity, 임신/수유, pancreatitis 병력, severe gastroparesis, active gallbladder disease, insulin/SU 병용 저혈당 위험을 확인.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up / 중단 기준</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>2-4주마다 GI 부작용, 주사법, 탈수, 비용 부담, 증량 가능성 확인.</li>
        <li>유지 용량 도달 후 3개월 안에 체중 5% 이상 감량이 없으면 중단/변경 검토.</li>
        <li>근손실 예방을 위해 단백질과 저항운동을 같이 계획.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #0f766e;background:#f0fdfa;padding:10px 12px;border-radius:8px">
        비만 주사는 식욕을 줄이고 포만감을 오래가게 해서 생활요법을 지속하기 쉽게 만드는 치료입니다.
        심한 복통이 등으로 뻗거나 계속 토하고 물도 못 마시면 약을 더 맞지 말고 바로 연락해야 합니다.
      </div>
    `,
    revisions: [
      '2026-07-05: 실전 보강판. 병태생리, KCD, red flag, 개원 운영, SELECT/STEP/SURMOUNT 근거와 유지 전략 반영.',
    ],
  },
  {
    day: 8,
    date: '2026-07-05',
    slug: 'gout-hyperuricemia',
    topic: '통풍 실전 보강판: 급성기 처방, treat-to-target ULT',
    printPath: '/adult-daily/print/day-08-gout-hyperuricemia.html',
    pdfPath: '/adult-daily/pdf/day-08-gout-hyperuricemia.pdf',
    masterPath: '/adult-daily/master/day-08-gout-hyperuricemia.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">Septic joint 배제</div>
          <div>발열/오한, 면역저하, prosthetic joint, 최근 관절주사/수술, 외상, 통풍 병력 불확실한 심한 단관절염은 의뢰.</div>
        </div>
        <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#92400e;margin-bottom:6px">급성기와 장기약 분리</div>
          <div>오늘은 염증을 끄고, 재발성 통풍·tophi·CKD·결석·요산 9 이상이면 ULT를 treat-to-target으로 설계.</div>
        </div>
      </div>

      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px;margin-bottom:14px">
        <b>실전 보강 포인트</b><br>
        급성 발작은 감염성 관절염 배제가 먼저이고, 장기 관리는 요산 목표 &lt;6 mg/dL까지 증량하는 treat-to-target 구조로 잡는다.
        발작 1주 재진, 안정기 요산 재평가, ULT 증량 재진을 분리하면 통증 해결과 만성질환 관리를 모두 놓치지 않는다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          반복 발작, 발열/외상/상처, CKD/GI/심부전/항응고제, 음주/탈수/과식, ULT 복용/발진 병력.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          관절 열감/발적/종창, 상처/봉와직염, tophi, 체온/맥박, 다관절 침범.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#faf7f1">
        급성기 CBC/CRP 선택, Cr/eGFR, AST/ALT, uric acid. 요산은 급성기에 정상일 수 있다. 감염 의심 시 관절천자/배양 의뢰.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">M10.x</td><td style="border:1px solid #e7e2d7;padding:7px">통풍. 부위와 원인에 따라 세부 코드 조정.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E79.0</td><td style="border:1px solid #e7e2d7;padding:7px">증상 없는 고요산혈증 또는 평가 단계.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">N20.x/N18.x</td><td style="border:1px solid #e7e2d7;padding:7px">요로결석, CKD 동반 시 근거에 따라.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">급성기 처방</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#fffbeb">선택</th><th style="border:1px solid #e7e2d7;padding:7px;background:#fffbeb">예시</th><th style="border:1px solid #e7e2d7;padding:7px;background:#fffbeb">피해야 할 상황</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">NSAID</td><td style="border:1px solid #e7e2d7;padding:7px">Naproxen 250-500 mg bid 등</td><td style="border:1px solid #e7e2d7;padding:7px">eGFR 저하, GI bleeding, 항응고제, 심부전</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Colchicine</td><td style="border:1px solid #e7e2d7;padding:7px">1.2 mg 후 1시간 뒤 0.6 mg</td><td style="border:1px solid #e7e2d7;padding:7px">eGFR 저하, CYP3A4/P-gp inhibitor, 설사</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Steroid</td><td style="border:1px solid #e7e2d7;padding:7px">Prednisolone 20-30 mg qd 3-5일</td><td style="border:1px solid #e7e2d7;padding:7px">감염 배제 안 됨, 혈당 조절 불량</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">ULT</h3>
      <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:10px 12px">
        1년 2회 이상 발작, tophi, 영상 손상, CKD stage 3 이상, 결석, uric acid &gt;9면 시작 고려. Allopurinol 100 mg qd 이하로 시작해 목표 &lt;6 mg/dL까지 증량.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up / Refer</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>급성기 3-7일 내 반응 확인. 악화/발열/다관절이면 재평가.</li>
        <li>ULT 시작 후 2-5주마다 요산 확인, flare prophylaxis 최소 3-6개월.</li>
        <li>감염 감별, CKD 진행, 결석 반복, 약제 과민반응, tophi 기능장애는 의뢰.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #b45309;background:#fffbeb;padding:10px 12px;border-radius:8px">
        통풍약은 급성기 염증을 끄는 약과 요산을 낮추는 장기약이 다릅니다.
        Allopurinol 시작 뒤 발진, 입안 헐음, 열이 나면 바로 중단하고 연락해야 합니다.
      </div>
    `,
    revisions: [
      '2026-07-05: 실전 보강판. septic joint 감별, HLA-B*58:01, ULT titration, 재진 운영, ACR/EULAR 근거 반영.',
    ],
  },
  {
    day: 9,
    date: '2026-07-05',
    slug: 'elevated-liver-enzymes',
    topic: '간수치 상승 실전 보강판: MASLD, FIB-4, 의뢰 기준',
    printPath: '/adult-daily/print/day-09-elevated-liver-enzymes.html',
    pdfPath: '/adult-daily/pdf/day-09-elevated-liver-enzymes.pdf',
    masterPath: '/adult-daily/master/day-09-elevated-liver-enzymes.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">당일 의뢰</div>
          <div>황달+의식변화/출혈, AST/ALT 1000 전후 이상, bilirubin 상승+RUQ pain/발열, acetaminophen 과량, 임신 중 간수치 상승.</div>
        </div>
        <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#166534;margin-bottom:6px">패턴 먼저</div>
          <div>AST/ALT 중심인지 ALP/GGT/bilirubin 중심인지 나누고, 음주·약물·대사위험·viral hepatitis·담도 증상을 확인.</div>
        </div>
      </div>

      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px;margin-bottom:14px">
        <b>실전 보강 포인트</b><br>
        간수치 상승은 AST/ALT 숫자보다 패턴, 합성기능, bilirubin, platelet, FIB-4로 위험을 나누는 것이 핵심이다.
        검진 리뷰-원인감별-2~4주 재검-3개월 대사관리 흐름으로 잡으면 지방간, 음주, 약물, 바이러스 간염을 동시에 관리할 수 있다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          술, 새 약/한약/보충제, 황달/회색변/RUQ pain, 비만/당뇨/지질, B/C형간염 위험.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          공막황달, RUQ 압통, 간비대, 복수/부종, BMI/허리둘레, 만성간질환 소견.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사 루틴</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#f0fdf4">패턴</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f0fdf4">1차 검사</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f0fdf4">행동</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">AST/ALT 중심</td><td style="border:1px solid #e7e2d7;padding:7px">repeat LFT, bilirubin, ALP/GGT, CBC/platelet, albumin, PT/INR 가능 시</td><td style="border:1px solid #e7e2d7;padding:7px">중증도와 기능 확인</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">MASLD 의심</td><td style="border:1px solid #e7e2d7;padding:7px">HbA1c, lipid, FIB-4, 복부초음파</td><td style="border:1px solid #e7e2d7;padding:7px">섬유화 위험 분류</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">viral hepatitis</td><td style="border:1px solid #e7e2d7;padding:7px">HBsAg, anti-HBs, anti-HBc, anti-HCV</td><td style="border:1px solid #e7e2d7;padding:7px">양성이면 활동성 평가/의뢰</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">담즙정체형</td><td style="border:1px solid #e7e2d7;padding:7px">ALP/GGT, bilirubin, 복부초음파</td><td style="border:1px solid #e7e2d7;padding:7px">담도확장/담석 확인</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">FIB-4</h3>
      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:10px 12px">
        &lt;1.3 낮은 위험, 1.3-2.67 중간 위험으로 2차검사/의뢰, &gt;2.67 높은 위험으로 간 의뢰. 65세 이상은 2.0 이상부터 의미 있게 본다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R94.5</td><td style="border:1px solid #e7e2d7;padding:7px">간기능검사 이상 소견.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">K76.0</td><td style="border:1px solid #e7e2d7;padding:7px">지방간/MASLD 근거가 있을 때.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">B18.x/K71.x/K80.x</td><td style="border:1px solid #e7e2d7;padding:7px">만성간염, 약물성, 담도질환 근거가 있을 때.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">Follow-up / Refer</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>경도 상승은 음주/약물/격한 운동 등 원인 제거 후 2-4주 재검.</li>
        <li>3개월 이상 반복 상승이면 원인검사 확장, 6개월 이상 지속이면 의뢰 고려.</li>
        <li>ALT 정상화만 보고 fibrosis risk를 잊지 않는다.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #15803d;background:#f0fdf4;padding:10px 12px;border-radius:8px">
        간수치는 간세포 손상인지 담즙길 문제인지 간 기능 저하인지 나눠서 봐야 합니다.
        지방간에서 중요한 것은 지방 자체보다 간섬유화 위험입니다.
      </div>
    `,
    revisions: [
      '2026-07-05: 실전 보강판. MASLD 용어, FIB-4 위험층화, red flag, 재검 예약 구조, AASLD/EASL/ACG 근거 반영.',
    ],
  },
  {
    day: 10,
    date: '2026-07-05',
    slug: 'thyroid-function-patterns',
    topic: '갑상선 기능 이상 실전 보강판: TSH 패턴, 치료/의뢰 기준',
    printPath: '/adult-daily/print/day-10-thyroid-function-patterns.html',
    pdfPath: '/adult-daily/pdf/day-10-thyroid-function-patterns.pdf',
    masterPath: '/adult-daily/master/day-10-thyroid-function-patterns.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">당일 의뢰</div>
          <div>고열/심한 빈맥/의식변화, 저체온/서맥/의식저하, 새 AF/심부전/협심증 악화, 임신 중 overt 기능 이상, 시력저하/복시.</div>
        </div>
        <div style="border:1px solid #ddd6fe;background:#f5f3ff;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#6d28d9;margin-bottom:6px">TSH + FT4 패턴</div>
          <div>TSH high/low와 FT4/T3를 같이 보고 hypo, subclinical hypo, hyper, subclinical hyper, central pattern을 나눈다.</div>
        </div>
      </div>

      <div style="border:1px solid #ddd6fe;background:#f5f3ff;border-radius:10px;padding:12px;margin-bottom:14px">
        <b>실전 보강 포인트</b><br>
        TSH 단독 이상은 biotin, 약물, 임신, 최근 illness를 먼저 확인하고 TSH/FT4/T3 패턴으로 재검 또는 치료를 결정한다.
        6~8주 재검 예약, levothyroxine 복용법 교육, 항진증 red flag, 초음파 과잉사용 방지가 개원가 운영의 핵심이다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">핵심 문진/PE</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>문진 5개</b><br>
          체중/더위/추위/두근거림, 목통증/산후/요오드, biotin/약물, 임신, 가족력/수술/방사선.
        </div>
        <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">
          <b>PE</b><br>
          HR/BP/체온, tremor/reflex, 부종/서맥, 갑상선 크기/압통/bruit, 안병증.
        </div>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">검사 패턴</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#f5f3ff">패턴</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f5f3ff">의미</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f5f3ff">행동</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">TSH high + FT4 low</td><td style="border:1px solid #e7e2d7;padding:7px">overt hypothyroidism</td><td style="border:1px solid #e7e2d7;padding:7px">levothyroxine 시작, TPOAb</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">TSH high + FT4 normal</td><td style="border:1px solid #e7e2d7;padding:7px">subclinical hypothyroidism</td><td style="border:1px solid #e7e2d7;padding:7px">반복 확인, TPOAb, TSH 10 이상 치료 고려</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">TSH low + FT4/T3 high</td><td style="border:1px solid #e7e2d7;padding:7px">overt hyperthyroidism</td><td style="border:1px solid #e7e2d7;padding:7px">T3/TRAb, CBC/LFT, beta-blocker, 의뢰</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">TSH low + FT4/T3 normal</td><td style="border:1px solid #e7e2d7;padding:7px">subclinical hyperthyroidism</td><td style="border:1px solid #e7e2d7;padding:7px">반복 확인, AF/골다공증 위험 평가</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">처방 Regimen</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#f5f3ff">상황</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f5f3ff">접근</th><th style="border:1px solid #e7e2d7;padding:7px;background:#f5f3ff">주의</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">젊고 심장질환 없는 overt hypo</td><td style="border:1px solid #e7e2d7;padding:7px">Levothyroxine 약 1.6 mcg/kg/day 또는 보수적 시작</td><td style="border:1px solid #e7e2d7;padding:7px">6-8주 뒤 TSH</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">고령/CAD 위험</td><td style="border:1px solid #e7e2d7;padding:7px">12.5-25 mcg qd 시작</td><td style="border:1px solid #e7e2d7;padding:7px">협심증/부정맥 주의</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px">Hyper 증상성 빈맥</td><td style="border:1px solid #e7e2d7;padding:7px">Propranolol 등 beta-blocker</td><td style="border:1px solid #e7e2d7;padding:7px">천식/COPD, 서맥 주의</td></tr>
        </tbody>
      </table>

      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:10px 12px">
        항갑상선제 복용 중 발열, 인후통, 구내염은 agranulocytosis 가능성. 황달, 진한 소변, 심한 가려움은 간독성 평가.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD / Follow-up</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E03.9/E02</td><td style="border:1px solid #e7e2d7;padding:7px">갑상선기능저하증/잠재성 저하증.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E05.x</td><td style="border:1px solid #e7e2d7;padding:7px">갑상선중독증/갑상선기능항진증.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R94.6</td><td style="border:1px solid #e7e2d7;padding:7px">갑상선 기능검사 이상 소견.</td></tr>
        </tbody>
      </table>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>Levothyroxine 시작/변경 후 6-8주 뒤 TSH/FT4.</li>
        <li>경도 subclinical 이상은 3개월 전후 재검.</li>
        <li>임신/임신 계획, central pattern, 안병증, overt hyper는 의뢰.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명 멘트</h3>
      <div style="border-left:4px solid #7c3aed;background:#f5f3ff;padding:10px 12px;border-radius:8px">
        TSH는 갑상선을 조절하는 신호이고 free T4는 실제 갑상선 호르몬입니다. 두 값을 같이 봐야 합니다.
        항진증 약을 먹는 중 열과 목아픔이 갑자기 생기면 바로 연락해야 합니다.
      </div>
    `,
    revisions: [
      '2026-07-05: 실전 보강판. biotin 간섭, subclinical 질환 개별화, 임신/AF/thyroid storm 의뢰 기준, ATA/NICE 근거 반영.',
    ],
  },
]
