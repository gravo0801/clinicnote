export const adultDailyDay20 = [
  {
    day: 20,
    date: '2026-09-01',
    slug: 'nausea-vomiting-primary-care',
    topic: '오심/구토: 탈수 판단, 항구토제, 응급 의뢰',
    printPath: '/adult-daily/print/study.html?day=20',
    pdfPath: '/api/study-pdf?day=20',
    masterPath: '/adult-daily/master/day-20-nausea-vomiting.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 응급</div><div>장폐색/복막염, GI 출혈, 갑작스러운 심한 두통·국소신경 이상, ACS, DKA/eDKA·부신위기, 중증 탈수·전해질 이상. 구토를 증상으로만 보고 항구토제부터 반복하지 않는다.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">진료의 핵심</div><div><b>임신 가능성 → red flag → 탈수/중증도 → 원인 → 수분·원인교정 → 최단 항구토제</b>. 물을 유지할 수 있는지와 oral challenge가 disposition을 좌우한다.</div></div>
      </div>

      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px;margin-bottom:14px"><b>v1.1 업데이트:</b> AGA 2025 위마비, UEG-ESNM 2025 만성 오심·구토, RCOG 2024 임신오조, eDKA, thiamine before glucose, QT/Mg, 국내 metoclopramide/domperidone 허가사항을 반영했다.</div>

      <h3>1. 오심-구토 3분 알고리즘</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>임신:</b> LMP·피임·가능성 확인. 불확실하거나 약물/영상 결정에 영향이 있으면 urine/serum hCG.</li>
        <li><b>Red flag:</b> 폐쇄/복막염, 출혈, 중추신경, ACS, DKA/eDKA·부신위기 → 대증치료 중단 후 즉시 평가/전원.</li>
        <li><b>중증도:</b> 활력·기립, 점막, 배뇨, 체중, 구토 횟수, 물 유지 가능 여부. 경증 ORS; 중등도 이상 검사 + IV fluid 후 oral challenge.</li>
        <li><b>원인:</b> 위장관 / 약물(GLP-1 RA 포함) / 대사 / 전정 / 임신 / 편두통 / CVS·CHS·반추.</li>
        <li><b>치료:</b> 원인 교정 + 허가범위 내 최단 항구토제. 장기 섭취불량·영양실조 위험이면 glucose 전 thiamine 검토.</li>
        <li><b>지속:</b> 4주 이상 또는 반복·진행하면 대증치료 고정 루프를 끊고 EGD/영상/전문평가.</li>
      </ol>

      <h3>2. 실전 약제</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.65"><tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">Metoclopramide</td><td style="border:1px solid #e7e2d7;padding:8px">PO 10-30 mg/day 2-3회 분할, 간격 ≥6h. IV/IM 10 mg. 최대 30 mg/day 또는 0.5 mg/kg/day, 최대 5일. EPS·Parkinson 악화·신장/간 감량 확인.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">Domperidone</td><td style="border:1px solid #e7e2d7;padding:8px">10 mg TID 식전, 최대 30 mg/day, 일반적으로 1주 이내. QT·심실부정맥, 전해질 이상, QT 약/CYP3A4 강력 억제제 주의.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">Ondansetron</td><td style="border:1px solid #e7e2d7;padding:8px">단순 AGE routine 급여 처방으로 제시하지 않음. 국내 허가·급여 확인, QT 연장·변비 주의.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">Doxylamine+B6</td><td style="border:1px solid #e7e2d7;padding:8px">임신 NVP에서 단계적 증량, 최대 4정/day. 장용정 공복 복용, 분할·분쇄 금지, 진정·운전 주의.</td></tr>
      </tbody></table>

      <h3>3. 놓치면 안 되는 포인트</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>SGLT2:</b> 혈당이 정상 또는 경도 상승이어도 eDKA 가능. ketone + HCO3/anion gap/VBG.</li>
        <li><b>담즙성 구토:</b> 단독으로 폐쇄 확진이 아니다. 지속성 + 팽만·가스/대변 중단·통증/복막징후 조합이 경고.</li>
        <li><b>HG:</b> 케톤뇨만으로 중증도 판단 금지. 증상·기능·섭취·체중·활력/검사로 평가.</li>
        <li><b>위마비:</b> 기계적 폐쇄 배제 후 표준 고형식 4시간 위배출검사. 증상만으로 진단하지 않는다.</li>
        <li><b>GLP-1 RA:</b> 흔한 부작용이라도 지속 심한 구토나 심한 복통을 췌담도질환·폐쇄 없이 단정하지 않는다.</li>
      </ul>

      <h3>4. 재진과 의뢰</h3>
      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px;line-height:1.8"><b>당일:</b> 수액 후에도 물을 못 마시거나 소변 감소·통증·활력 악화면 ER. <b>24-48h:</b> 중등도 탈수/검사 시행/고령·기저질환 재평가. <b>2-4주:</b> GLP-1 RA·원인약 조정 추적. <b>4주 이상:</b> 반복 처방을 중단하고 EGD/영상·GI/산부인과/신경계 평가로 전환.</div>

      <h3>5. 복사용 진료 문구</h3>
      <div style="border:1px solid #d1d5db;background:#f9fafb;border-radius:10px;padding:12px;white-space:pre-wrap;line-height:1.65">CC: Nausea/Vomiting onset ( ) frequency ( /day) last oral intake ( ) last urine ( )\nVomitus clear/bilious/bloody/coffee-ground/feculent ( )\nAbdominal pain ( ) headache/visual symptom ( ) vertigo ( ) chest symptom ( )\nPregnancy: LMP ( ) possibility ( ) hCG ( )\nDrugs: GLP-1 RA ( ) metformin ( ) SGLT2 ( ) NSAID ( ) opioid ( )\nPE: BP/PR/BT/RR ( ) orthostatic ( ) mucosa ( ) abdomen ( ) neuro ( )\nA: Nausea with vomiting R11.3 / suspected cause ( ) / volume depletion E86 if supported\nP: ORS/IV indication ( ) antiemetic-dose-duration ( ) renal/QT/EPS checked ( ) oral challenge ( )\nSafety net: blood/bilious-feculent emesis, severe pain/headache/chest symptom, oliguria, unable to keep fluids.</div>
    `,
    revisions: [
      '2026-09-01: 사용자 제공 Day20_Nausea_Vomiting_FM_v1.1_2026-09-01 PDF를 기반으로 ClinicNote Day20 공부자료에 신규 등록. 기존 Day 자료는 변경하지 않음.',
    ],
  },
]
