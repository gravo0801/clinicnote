export const adultDailyDay12to15 = [
  {
    day: 12,
    date: '2026-07-23',
    slug: 'palpitations-ecg-monitoring',
    topic: '두근거림: ECG, 갑상선/빈혈, Holter 의뢰 기준',
    pdfPath: '/adult-daily/pdf/ClinicNote_D12_Palpitations.pdf',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 응급평가</div><div>저혈압, 흉통, 폐부종/호흡곤란, 의식저하, 실신, 지속성 wide-complex tachycardia, 심한 서맥 + 저관류, 불안정 AF/AFL이면 외래 관찰보다 응급이송이 우선.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">핵심 원칙</div><div><b>증상 빈도에 맞는 ECG 기록 장치 선택</b>이 핵심. 진료실 ECG가 정상이어도 간헐성 부정맥을 배제하지 못한다.</div></div>
      </div>
      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 triage</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>현재 증상 + BP/HR/SpO2/의식 확인. 불안정하면 119.</li><li>빠른가, 불규칙한가, 갑자기 시작·종료하는가 확인.</li><li>흉통, 호흡곤란, 실신/전실신, 운동 연관 여부 확인.</li><li>카페인, 술, 니코틴, 감기약, 기관지확장제, 다이어트약, 보충제, 갑상선약 확인.</li><li>12-lead ECG 시행 후 증상 빈도에 맞는 Holter/patch/event monitor 계획.</li></ol>
      <h3 style="margin:14px 0 7px;font-size:15px">ECG + 기본검사</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">ECG</td><td style="border:1px solid #e7e2d7;padding:7px">rate/rhythm, PR/QRS/QTc, pre-excitation, Brugada pattern, ischemia, AV block, ectopy.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">CBC</td><td style="border:1px solid #e7e2d7;padding:7px">빈혈/출혈/감염 단서. Hb 저하 시 원인까지 추적.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">TSH + free T4</td><td style="border:1px solid #e7e2d7;padding:7px">빈맥, 체중변화, 떨림, AF. biotin/갑상선약 확인.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">전해질/Cr</td><td style="border:1px solid #e7e2d7;padding:7px">이뇨제, 구토/설사, QT 문제에서 K/Mg 이상 확인.</td></tr>
      </tbody></table>
      <h3 style="margin:14px 0 7px;font-size:15px">Holter / patch / event monitor</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li><b>매일/거의 매일:</b> 24–48시간 Holter.</li><li><b>주 1회 정도:</b> 7–14일 continuous patch.</li><li><b>월 수회/예측 불가:</b> 2–4주 event/loop monitor.</li><li><b>매우 드문 반복 실신:</b> implantable loop recorder 전문 평가.</li><li><b>운동 유발:</b> 운동부하 ECG 또는 운동 중 monitor를 전문 평가와 연계.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">흔한 리듬별 행동</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li><b>Sinus tachycardia:</b> 항부정맥제보다 발열, 탈수, 빈혈, 갑상선, 통증, 약물 원인부터.</li><li><b>PAC/PVC:</b> 구조적 심질환, 운동 유발, 다형성/빈번성 여부 확인.</li><li><b>안정 regular narrow SVT:</b> 숙련 환경에서 modified Valsalva 고려. 반복 시 심장내과.</li><li><b>새 AF/AFL:</b> 불안정하면 응급. 안정해도 발병 시점, HR, 심부전, stroke risk, 갑상선/전해질 확인 후 빠른 의뢰.</li><li><b>Wide-complex tachycardia:</b> VT로 간주하고 즉시 응급이송.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">KCD / 추적</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff"><b>R00.2</b> 두근거림 · <b>R00.0</b> 상세불명 빈맥 · ECG로 확인된 경우 <b>I48.x</b> AF/AFL, <b>I47.x</b> 발작성 빈맥, <b>I49.1/I49.3</b> PAC/PVC. 안정 sinus tachycardia는 원인 치료 후 보통 1–2주 또는 원인별 재평가.</div>
      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명</h3><div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px">“두근거림은 진료실에서 멈춰 있으면 심전도가 정상일 수 있습니다. 증상 빈도에 맞는 기록 장치를 고르는 것이 중요합니다. 가슴통증, 숨참, 실신이 동반되면 다음 예약을 기다리지 말고 응급평가를 받으세요.”</div>
    `,
    revisions: ['2026-08-19: 기존 2026-07-23 PDF 내용을 ClinicNote 앱 진료 카드로 등록.']
  },
  {
    day: 13,
    date: '2026-07-23',
    slug: 'dizziness-bppv-orthostatic-central',
    topic: '어지럼: BPPV, 기립성저혈압, 중추성 red flag',
    pdfPath: '/adult-daily/pdf/ClinicNote_D13_Dizziness.pdf',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 뇌졸중/응급평가</div><div>새 편측 마비/감각저하, 복시, 구음·연하장애, 시야결손, 심한 gait/truncal ataxia, 새 심한 두통/목통증, 지속 구토, 의식변화, 저혈압/실신.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">TiTrATE</div><div>“빙빙 돈다”는 표현보다 <b>Timing + Trigger</b>가 더 중요. 지속성인지 반복성인지, 자세/기립으로 유발되는지를 먼저 분류.</div></div>
      </div>
      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 triage</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>BP/HR/SpO2/혈당, 의식, 혼자 걷기 가능한지 확인.</li><li>수시간–수일 지속 AVS인지, 분–시간 반복인지, 특정 자세에서 수초–수분 유발인지 분류.</li><li>신경학적 증상, 새 두통/목통증, 새 청력저하 확인.</li><li>기립혈압, 안진/안구운동, 보행을 보고 BPPV 의심 시 Dix-Hallpike.</li><li>약물, 탈수, 출혈, 부정맥 단서 확인.</li></ol>
      <h3 style="margin:14px 0 7px;font-size:15px">HINTS 안전 사용</h3>
      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px"><b>HINTS는 급성 지속성 AVS + 자발안진 환자에서 숙련자가 시행하는 검사.</b> 짧은 체위성 어지럼에 쓰지 않으며, 비숙련 HINTS 음성만으로 posterior stroke를 배제하지 않는다.</div>
      <h3 style="margin:14px 0 7px;font-size:15px">BPPV</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>전형: 머리 위치 변화 후 수초 잠복, 1분 이내 회전성 어지럼.</li><li>Posterior canal BPPV: Dix-Hallpike에서 torsional upbeating nystagmus.</li><li><b>1차 치료는 Epley canalith repositioning.</b></li><li>전정억제제는 장기 관행 처방을 피하고 심한 오심에서 짧게만 고려.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">기립성저혈압</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">누워 안정 후 BP/HR → 서서 1분·3분. 3분 이내 <b>SBP 20 mmHg 또는 DBP 10 mmHg 이상 감소</b> 시 합당. 탈수/출혈, 이뇨제·alpha blocker·nitrate·항고혈압제·진정제, 자율신경병증을 확인.</div>
      <h3 style="margin:14px 0 7px;font-size:15px">검사 / KCD</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>POC glucose, CBC, 전해질/Cr, ECG, 필요 시 TSH.</li><li>중추성/불확실 bedside 소견 또는 TIA/stroke 우려면 응급 MRI/MRA 경로.</li><li><b>R42</b> 원인 미확정 어지럼, <b>H81.1</b> BPPV, <b>I95.1</b> 기립성 저혈압.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명</h3><div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px">“어지럼의 느낌보다 지속시간과 유발자세가 더 중요합니다. 말이 어눌해지거나 한쪽 힘이 빠지거나 혼자 걷기 어렵거나 새 심한 두통이 생기면 즉시 응급실로 가셔야 합니다.”</div>
    `,
    revisions: ['2026-08-19: 기존 2026-07-23 PDF 내용을 ClinicNote 앱 진료 카드로 등록.']
  },
  {
    day: 14,
    date: '2026-07-23',
    slug: 'syncope-presyncope-risk-referral',
    topic: '실신/전실신: 심장성 위험신호, 검사와 의뢰',
    pdfPath: '/adult-daily/pdf/ClinicNote_D14_Syncope.pdf',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">당일 응급평가</div><div>운동 중/누운 상태 실신, 직전 두근거림·흉통·호흡곤란, 구조적 심장질환/심부전/MI 병력, 비정상 ECG, 가족 돌연사, 지속 저혈압·저산소증, 새 신경학적 결손.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">핵심 정의</div><div>Syncope는 전반적 뇌관류 저하에 의한 갑작스럽고 짧은 TLOC로, 자세긴장 소실 뒤 <b>자연스럽고 완전하게 회복</b>하는 사건이다.</div></div>
      </div>
      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 루틴</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>ABCDE, glucose, BP/HR/SpO2, 외상 확인.</li><li>목격자에게 자세, 피부색, 움직임, 지속시간, 회복 양상을 확인.</li><li>운동/누운 상태, 두근거림/흉통, 심장질환, 가족 돌연사 확인.</li><li><b>기립혈압 + 12-lead ECG</b>를 초기 평가의 핵심으로 시행.</li><li>고위험이면 응급/입원 경로, 저위험이면 원인별 targeted evaluation.</li></ol>
      <h3 style="margin:14px 0 7px;font-size:15px">Syncope vs seizure</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><tbody><tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">Syncope 쪽</td><td style="border:1px solid #e7e2d7;padding:7px">오심/발한/시야흐림, 장시간 서기·통증·기립 유발, 빠르고 명료한 회복.</td></tr><tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">Seizure 쪽</td><td style="border:1px solid #e7e2d7;padding:7px">aura, 지속 tonic-clonic, head turning, 긴 postictal confusion, lateral tongue bite.</td></tr></tbody></table>
      <h3 style="margin:14px 0 7px;font-size:15px">ECG red flags</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>Mobitz II/complete AV block, significant pause.</li><li>Sustained/nonsustained VT, frequent multifocal PVC.</li><li>현저한 QTc 연장/단축, Brugada pattern, WPW/pre-excitation.</li><li>Bifascicular block/wide QRS, ischemic change/Q waves.</li><li>LVH/HCM 단서 + 운동성 실신.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">검사: routine 남발 피하기</h3>
      <div style="border:1px solid #e7e2d7;border-radius:10px;padding:12px;background:#fff">Glucose는 급성 TLOC에서 빠르게. CBC/전해질/Cr/troponin/echo는 문진과 심장성 위험에 맞춰 선택. 단순 syncope에 <b>routine brain CT/MRI나 EEG는 권장되지 않음</b>; focal deficit, head trauma, seizure 의심 등 적응증이 있을 때 시행.</div>
      <h3 style="margin:14px 0 7px;font-size:15px">KCD / 추적</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li><b>R55</b> 실신 및 허탈: 원인 확정 전 주상병.</li><li><b>I95.1</b> 기립성 저혈압.</li><li>확인된 전도장애/빈맥성 부정맥은 I44.x/I45.x/I47.x/I48.x로 진단 근거에 맞춰.</li><li>원인 불명·반복·운전/고소작업 관련이면 원인 확인 전 운전과 위험작업 회피를 교육.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명</h3><div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px">“실신은 흔히 미주신경 반응이나 혈압 저하로 생기지만, 운동 중이거나 누워서 갑자기 생기면 심장 원인을 먼저 봐야 합니다. 다시 쓰러지면서 가슴통증, 두근거림, 숨참이 있거나 회복이 늦으면 119를 부르세요.”</div>
    `,
    revisions: ['2026-08-19: 기존 2026-07-23 PDF 내용을 ClinicNote 앱 진료 카드로 등록.']
  },
  {
    day: 15,
    date: '2026-07-23',
    slug: 'leg-edema-dvt-hf-venous-medication',
    topic: '하지부종: 심부전/정맥부전/약물성 감별',
    pdfPath: '/adult-daily/pdf/ClinicNote_D15_Leg_Edema.pdf',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시/당일 의뢰</div><div>갑작스런 편측 부종 + 통증/압통(DVT), 부종 + 호흡곤란/흉통/실신/저산소증(PE), 양측 부종 + 기좌호흡/저산소증/빠른 체중증가(급성 HF), limb ischemia 또는 severe infection.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">첫 분류</div><div><b>한쪽인가 양쪽인가 × 급성인가 만성인가</b>를 먼저 나누면 감별이 급격히 좁아진다.</div></div>
      </div>
      <h3 style="margin:14px 0 7px;font-size:15px">패턴별 우선 감별</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">급성 편측</td><td style="border:1px solid #e7e2d7;padding:7px">DVT, cellulitis, trauma, ruptured Baker cyst, acute venous obstruction.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">만성 편측</td><td style="border:1px solid #e7e2d7;padding:7px">chronic venous insufficiency, lymphedema, post-thrombotic syndrome.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">급성 양측</td><td style="border:1px solid #e7e2d7;padding:7px">acute HF, renal failure, 약물, fluid overload.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">만성 양측</td><td style="border:1px solid #e7e2d7;padding:7px">HF, CKD/nephrotic, liver disease, venous insufficiency, obesity/immobility, medication.</td></tr>
      </tbody></table>
      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 triage</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>BP/HR/RR/SpO2 + 호흡곤란/흉통 확인.</li><li>편측/양측, 시작일, 통증·홍반·열감 확인.</li><li>최근 수술/입원/부동/장거리 이동/암/호르몬/과거 VTE 확인.</li><li>기좌호흡, PND, 체중증가, 소변감소 확인.</li><li>amlodipine 등 CCB, NSAID, steroid, TZD, gabapentinoid, hormone, minoxidil 등 약물 확인.</li></ol>
      <h3 style="margin:14px 0 7px;font-size:15px">Focused exam</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li>양쪽 종아리 둘레를 동일 지점에서 측정.</li><li>pitting 여부, 발등/발가락 침범, Stemmer sign.</li><li>홍반/열감/압통/상처/궤양, varicosity, hyperpigmentation, stasis dermatitis.</li><li>JVP, S3, crackle, hepatojugular reflux, 복수/간질환 단서.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">실전 원칙</h3>
      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px">정맥부전성 부종에 loop diuretic를 반사적으로 장기 처방하지 않는다. 원인이 심장·신장·간·정맥·약물 중 어디인지 먼저 확인하고, compression 전 PAD 위험을 확인한다. DVT 의심 시 마사지나 경험적 보존치료로 시간을 보내지 않는다.</div>
      <h3 style="margin:14px 0 7px;font-size:15px">KCD / Follow-up</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8"><li><b>I87.2</b> 만성 말초정맥부전, <b>I50.x</b> 확립된 심부전, <b>I82.x</b> 확인된 DVT, <b>I89.0</b> 림프부종.</li><li>신장/간 원인 확립 시 N18.x/N04.x, K74.x 등 실제 진단에 맞춰.</li><li>새 양측부종은 보통 1–2주 내 체중, BP, Cr/eGFR, 전해질, 약물 조정 결과 재평가.</li><li>정맥부전 + 피부염/궤양/반복 감염/지속 증상은 혈관외과·피부·상처클리닉 연계.</li></ul>
      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명</h3><div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px">“다리부종은 정맥순환 문제도 흔하지만, 갑자기 한쪽만 붓거나 숨이 차면 혈전과 심장 문제를 먼저 확인해야 합니다. 부종약부터 쓰기보다 원인을 확인하는 것이 안전합니다.”</div>
    `,
    revisions: ['2026-08-19: 기존 2026-07-23 PDF 내용을 ClinicNote 앱 진료 카드로 등록.']
  }
]
