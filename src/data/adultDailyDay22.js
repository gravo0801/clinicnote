export const adultDailyDay22 = [
  {
    day: 22,
    date: '2026-09-01',
    slug: 'pneumonia-curb65',
    topic: '폐렴 의심: CXR, CURB-65, 외래 항생제',
    printPath: '/adult-daily/print/study.html?day=22',
    pdfPath: '/api/study-pdf?day=22',
    masterPath: '/adult-daily/master/day-22-pneumonia-curb65.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 전원</div><div>SpO2 &lt;92%, RR ≥30/min, SBP &lt;90, 새 confusion, cyanosis, sepsis/shock. CURB-65가 낮더라도 저산소증·경구섭취 불가·돌봄 부재가 있으면 외래 고집 금지.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">국내 실전 핵심</div><div><b>Disposition 먼저.</b> CURB-65/CRB-65 + SpO2로 외래/입원을 나눈 뒤 항생제를 고른다. 국내에서는 macrolide 단독 경험적 치료를 피하고, quinolone은 결핵을 배제한 뒤 고려한다.</div></div>
      </div>

      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px;margin-bottom:14px"><b>등록 원본:</b> Day22_Pneumonia_CURB65_FM_v1.0.pdf (2026.09). 원문 내용을 기반으로 앱 학습카드·master·PDF 경로만 연결했으며 기존 Day 자료는 변경하지 않았다.</div>

      <h3>1. 폐렴을 먼저 의심할 상황</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>38℃ 이상 발열 지속, tachycardia/tachypnea, SpO2 저하.</li>
        <li>국소 crackle, bronchial breathing, dullness.</li>
        <li>오한·전율, pleuritic chest pain, 심한 무력감.</li>
        <li>고령자는 발열·기침보다 delirium, 식욕저하, 낙상·기능저하가 먼저 올 수 있음.</li>
      </ul>

      <h3>2. CURB-65</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.65"><tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">C</td><td style="border:1px solid #e7e2d7;padding:8px">새 confusion/disorientation</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">U</td><td style="border:1px solid #e7e2d7;padding:8px">BUN &gt;19 mg/dL. 혈액검사 어려우면 CRB-65.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">R</td><td style="border:1px solid #e7e2d7;padding:8px">RR ≥30/min</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">B</td><td style="border:1px solid #e7e2d7;padding:8px">SBP &lt;90 또는 DBP ≤60 mmHg</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">65</td><td style="border:1px solid #e7e2d7;padding:8px">Age ≥65</td></tr>
      </tbody></table>
      <div style="margin-top:8px;line-height:1.8"><b>0-1점:</b> 외래 가능성 높음 + SpO2/oral intake/comorbidity/caregiver 확인. <b>2점:</b> 입원 고려, 의원급은 전원을 기본값으로. <b>≥3점:</b> 고위험, 응급실/입원.</div>

      <h3>3. 외래 항생제</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>위험인자 없는 외래:</b> amoxicillin, amoxicillin/clavulanate 또는 적절한 경구 cephalosporin 등 beta-lactam 중심.</li>
        <li><b>비정형 의심:</b> beta-lactam + azithromycin/clarithromycin.</li>
        <li><b>국내에서는 macrolide 단독 경험적 치료를 피함.</b></li>
        <li><b>호흡기 quinolone:</b> 결핵 배제 후 조건부 선택.</li>
      </ul>

      <h3>4. 48-72시간 재평가</h3>
      <div style="border:1px solid #d1d5db;background:#f9fafb;border-radius:10px;padding:12px;line-height:1.75">해열, HR/RR, BP, SpO2, dyspnea/chest pain, oral intake를 다시 본다. 호전이 없으면 항생제부터 바꾸지 말고 <b>TB, empyema/abscess, PE, cancer/post-obstructive pneumonia, heart failure</b> 등을 재검토한다.</div>

      <h3>5. 개원 운영 포인트</h3>
      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px;line-height:1.8">원내 CXR + 선택적 CBC/CRP/BUN/Cr + CURB-65/SpO2 수치 기록 + 48-72h 지정 재진이 진료와 경영을 동시에 지키는 구조다. 50세 이상/흡연자 등 위험군은 6-8주 추적 CXR을 고려하고, 회복 후 pneumococcal/influenza vaccine·금연으로 예방 진료에 연결한다.</div>

      <h3>6. 복사용 진료 문구</h3>
      <div style="border:1px solid #d1d5db;background:#f9fafb;border-radius:10px;padding:12px;white-space:pre-wrap;line-height:1.65">PE: BP ( ) PR ( ) BT ( ) RR ( ) SpO2 ( )% room air\nCXR: ( )\nCURB-65 = ( ) [C( ) U( ) R( ) B( ) 65( )]\nDisposition: outpatient / transfer\nr/o TB: ( )\nEmpirical antibiotics: ( )\nMacrolide monotherapy avoided / quinolone only after TB consideration\nF/U 48-72 h scheduled; ER precautions explained.</div>
    `,
    revisions: [
      '2026-09-01: 사용자 제공 Day22_Pneumonia_CURB65_FM_v1.0.pdf를 기반으로 ClinicNote Day22 공부자료에 등록. 기존 Day 자료는 변경하지 않음.',
    ],
  },
]
