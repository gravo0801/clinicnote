export const adultDailyDay11 = [
  {
    day: 11,
    date: '2026-08-19',
    slug: 'chest-pain-acs-red-flags',
    topic: '흉통: ACS red flag, 의원에서 할 것과 바로 보낼 것',
    printPath: '/adult-daily/print/day-11-chest-pain-acs-red-flags.html',
    masterPath: '/adult-daily/master/day-11-chest-pain-acs-red-flags.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">핵심 원칙</div>
          <div><b>의원의 목표는 ACS 확진이 아니라, 의원에서 안전하게 배제할 수 없는 환자를 지체 없이 definitive care가 가능한 곳으로 보내는 것.</b> 검사가 전원을 늦추면 검사를 줄이는 것이 맞다.</div>
        </div>
        <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#9a330a;margin-bottom:6px">119 우선</div>
          <div>현재 지속되는 전형적 흉통, hemodynamic instability, 심한 호흡곤란/저산소증, 실신, acute aortic syndrome·PE 의심이면 <b>119 호출을 먼저</b> 하고 ECG는 가능하면 동시에 시행.</div>
        </div>
      </div>

      <div style="border:1px solid #bae6fd;background:#f0f9ff;border-radius:10px;padding:12px;margin-bottom:14px">
        <b>진료실 사고방식</b><br>
        Rule-in보다 <b>risk recognition → disposition</b>이 우선이다. 정상 ECG 한 장으로 ACS가 배제되지 않으며, troponin/CXR/추가 채혈을 의원에서 기다리느라 이송을 늦추지 않는다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 triage</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>증상 onset·현재 지속 여부·지속시간</b>을 먼저 확인.</li>
        <li>압박감/조임/무거움, 운동 또는 휴식 시 발생, 팔·턱·등 방사, 식은땀, 구역/구토, 호흡곤란, 실신/presyncope 확인.</li>
        <li>BP/HR/RR/SpO2/의식상태 측정. shock appearance, pulmonary edema, marked tachy/bradycardia 여부 확인.</li>
        <li>동시에 대동맥박리, 폐색전증, 긴장성 기흉 등 다른 lethal chest pain을 스크리닝.</li>
        <li>red flag가 있으면 <b>검사 계획보다 disposition을 먼저 결정</b>: 119 호출 → 가능하면 ECG → handoff.</li>
      </ol>

      <h3 style="margin:14px 0 7px;font-size:15px">바로 응급실/119를 강하게 고려할 소견</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr><th style="border:1px solid #e7e2d7;padding:7px;background:#fef2f2">범주</th><th style="border:1px solid #e7e2d7;padding:7px;background:#fef2f2">실전 red flag</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">ACS</td><td style="border:1px solid #e7e2d7;padding:7px">현재 지속되는 압박성 흉통, 새로운 안정 시 흉통, 반복/악화되는 통증, 방사통, diaphoresis, dyspnea, nausea/vomiting, syncope/presyncope, 알려진 CAD + 새로운 증상.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">불안정 상태</td><td style="border:1px solid #e7e2d7;padding:7px">저혈압, shock appearance, 의식변화, 심한 저산소증, pulmonary edema, 심한 빈맥/서맥 또는 불안정 부정맥 의심.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">Aortic syndrome</td><td style="border:1px solid #e7e2d7;padding:7px">갑작스런 최대강도 흉통/등통증, pulse/BP asymmetry, 새 신경학적 결손, 새로운 AR 의심 소견.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">PE</td><td style="border:1px solid #e7e2d7;padding:7px">갑작스런 dyspnea + pleuritic pain, hypoxemia/tachycardia, unilateral leg swelling, 최근 수술/부동/암/VTE history.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">Pneumothorax</td><td style="border:1px solid #e7e2d7;padding:7px">갑작스런 호흡곤란 + 일측 호흡음 현저 감소, hemodynamic compromise.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">의원에서 할 검사 vs 하지 말아야 할 지연</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px">
        <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px">
          <b style="color:#166534">해도 좋은 것</b><br>
          V/S + SpO2, focused history/PE, 12-lead ECG를 <b>즉시</b> 할 수 있으면 시행. 이송 준비와 병행한다.
        </div>
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <b style="color:#991b1b">전원을 늦추면 하지 말 것</b><br>
          troponin 결과 대기, 반복 채혈, CXR/기타 영상 예약, 장시간 observation, “검사 다 해보고 보내기”.
        </div>
      </div>
      <div style="font-size:12px;color:#78716c;margin-top:7px">ECG는 급성 흉통에서 매우 중요하지만, 정상/비진단적 초기 ECG만으로 ACS가 배제되지 않는다.</div>

      <h3 style="margin:14px 0 7px;font-size:15px">약물/처치 실전</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>산소는 routine이 아니라 저산소증/호흡부전이 있을 때 사용.</li>
        <li>ACS가 임상적으로 의심되고 aspirin 금기·활동성 출혈이 없으며 acute aortic syndrome이 의심되지 않는 상황에서는 aspirin 투여를 고려할 수 있으나, <b>투여 여부 때문에 이송을 지연시키지 않는다.</b></li>
        <li>흉통 완화를 위해 진통제나 위장약 반응을 보고 ACS를 배제하지 않는다.</li>
        <li>불안정 환자는 의원에서 “관찰”하지 말고 즉시 이송한다.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD 실무</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R07.4</td><td style="border:1px solid #e7e2d7;padding:7px">상세불명의 흉통. 의원에서 확진 전 가장 안전한 symptom code 후보.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">R07.2 / R07.8</td><td style="border:1px solid #e7e2d7;padding:7px">전흉부통 / 기타 흉통 등 실제 기록에 맞춰 사용.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">I20.x / I21.x</td><td style="border:1px solid #e7e2d7;padding:7px">협심증/급성심근경색을 의원에서 단순 의심만으로 확정 상병처럼 쓰지 말고, 실제 진단 근거와 최종 진단에 맞춘다.</td></tr>
        </tbody>
      </table>
      <div style="font-size:12px;color:#78716c;margin-top:6px">상병코드는 실무 후보이며 최종 청구는 실제 진단·검사·차팅과 일치하도록 조정.</div>

      <h3 style="margin:14px 0 7px;font-size:15px">법적 리스크를 줄이는 차팅 원칙</h3>
      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px">
        <b>면책 문구보다 당시 판단 과정이 보이게 기록한다.</b><br>
        ① onset/지속 여부 ② 핵심 red flag ③ V/S ④ ACS·aortic syndrome·PE 등 위험감별 ⑤ 의원에서 안전하게 배제할 수 없는 이유 ⑥ ER/119 권고 및 설명 ⑦ 실제 이송/거부 결과를 시간 순서로 기록한다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">권장 차팅 템플릿 — 즉시 전원</h3>
      <pre style="white-space:pre-wrap;background:#111827;color:#f9fafb;border-radius:10px;padding:12px;font-size:12px;line-height:1.65;overflow:auto">[Acute chest pain triage]
Onset: ____ / 현재 지속 여부: Y/N / 지속시간: ____
Character/radiation: ____________________
Associated sx: dyspnea __ / diaphoresis __ / N/V __ / syncope-presyncope __
CV risk: CAD __ DM __ HTN __ dyslipidemia __ smoking __ CKD __
V/S: BP ____/____, HR ____, RR ____, SpO2 ____, BT ____
Focused PE: consciousness __ / heart __ / lung __ / edema __ / pulse asymmetry __ / neuro deficit __

Assessment:
Acute chest pain. ACS 및 기타 life-threatening cause를 의원급 외래에서 안전하게 배제하기 어렵다고 판단함.
추가적인 의원 내 검사로 definitive evaluation 및 치료가 지연될 가능성이 있어 응급실 즉시 평가가 필요하다고 판단함.

ECG: 시행/미시행, 시간 ____
(정상/비진단적 ECG라도 임상적으로 ACS 배제되지 않음.)

Plan:
환자에게 심근경색, 치명적 부정맥, 급격한 상태 악화 가능성을 설명하고 즉시 응급실 평가 필요성을 설명함.
119 이송 권고 __:__ / 119 호출 __:__ / 출발 __:__
handoff 및 제공자료: ECG / medication list / allergy / 주요 과거력 / 증상 onset
이송 당시 상태: ____________________</pre>

      <h3 style="margin:14px 0 7px;font-size:15px">119 이송을 환자가 거부할 때</h3>
      <pre style="white-space:pre-wrap;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;font-size:12px;line-height:1.65;overflow:auto">ACS 가능성을 배제할 수 없어 119 구급차를 이용한 즉시 응급실 이송을 강하게 권고함.
이동 중 급격한 상태 악화, 치명적 부정맥, 심근경색 및 사망 가능성을 설명함.
환자는 설명 내용을 이해하고 의사결정능력이 있는 상태이나 119 이송을 거부함.
자가운전은 하지 말 것을 설명하고, 보호자 동행 및 증상 악화 시 즉시 119 요청하도록 재차 설명함.
거부 사유: ____________________
보호자 설명 여부/성명: ____________________
설명 시각: ____ / 퇴실 시각: ____ / 퇴실 당시 상태: ____________________</pre>
      <div style="font-size:12px;color:#78716c;margin-top:6px">서명 한 장 자체가 면책을 의미하지 않는다. 설명 내용, 의사결정능력, 구체적 거부 내용과 대안 제시를 사실대로 contemporaneous charting 하는 것이 핵심.</div>

      <h3 style="margin:14px 0 7px;font-size:15px">외래 평가가 가능한 쪽</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>현재 증상이 없고 hemodynamically stable하며 acute change/red flag가 없는 경우.</li>
        <li>수주~수개월 동일 양상의 stable symptom은 CAD pretest probability와 위험인자를 평가하고, 필요 시 심장내과 외래/CCTA/stress testing 경로를 계획.</li>
        <li>그래도 새로 악화된 양상, 안정 시 발생, 빈도/강도 증가가 있으면 acute pathway로 재분류한다.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">의원 운영용 FAST TRACK</h3>
      <div style="border-left:4px solid #dc2626;background:#fef2f2;padding:10px 12px;border-radius:8px">
        접수에서 “가슴이 아프다/조인다/답답하다”, “숨이 차면서 가슴이 이상하다”, “팔·턱까지 아프다”, “식은땀이 난다”는 표현이 나오면 대기시키지 않는다.<br>
        <b>즉시 진료실/처치실 → V/S·SpO2 → 원장 평가 → red flag면 119 먼저 → ECG는 가능하면 동시에.</b>
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">근거 / 참고</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain.</li>
        <li>2025 ACC/AHA Guideline for the Management of Patients With Acute Coronary Syndromes.</li>
        <li>대한민국 「응급의료에 관한 법률」 제11조: 해당 의료기관의 능력으로 적절한 응급의료가 어렵다고 판단하면 지체 없이 적절한 의료기관으로 이송.</li>
      </ul>
      <div style="font-size:12px;color:#78716c">본 자료는 임상 학습용이며 실제 진료 시 환자 상태, 지역 응급의료체계, 최신 가이드라인과 법령을 함께 적용한다. 차팅 예시는 사실과 일치할 때만 사용하며 사후에 없는 사실을 보강해서는 안 된다.</div>
    `,
    revisions: [
      '2026-08-19: Day 11 신규 작성. 의원급 ACS triage, 119 우선 전략, 정상 ECG 한계, 전원/거부 차팅, 응급의료법 제11조 반영.',
    ],
  },
]
