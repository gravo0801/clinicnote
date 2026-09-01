export const adultDailyDay21 = [
  {
    day: 21,
    date: '2026-09-01',
    slug: 'acute-cough-uri',
    topic: '성인 급성기침/URI: 항생제 회피, 증상별 처방',
    printPath: '/adult-daily/print/study.html?day=21',
    pdfPath: '/api/study-pdf?day=21',
    masterPath: '/adult-daily/master/day-21-acute-cough-uri.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 응급</div><div>SpO2 &lt;92%, RR ≥30/min, SBP &lt;90, 의식저하, 대량 객혈, 흉통+호흡곤란, 기도폐쇄 의심. 감기약 처방 전에 red flag부터 분리한다.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">핵심 축</div><div><b>기간 → red flag → 폐렴/결핵/백일해 → 증후군 분류 → 항생제 적응증</b>. 3주 미만은 대부분 대증치료, 3주 이상이면 지속 기침 경로로 전환한다.</div></div>
      </div>

      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px;margin-bottom:14px"><b>등록 원본:</b> Day21_Acute_Cough_URI_FM_v1.0.pdf (2026.09). 원문 내용을 기반으로 앱 학습카드·master·PDF 경로만 연결했으며 기존 Day 자료는 변경하지 않았다.</div>

      <h3>1. 첫 3분 진료</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>기간:</b> &lt;3주 급성 / 3-8주 아급성 / &gt;8주 만성.</li>
        <li><b>Red flag:</b> SpO2, RR, BP, 의식, 객혈, 흉통·호흡곤란.</li>
        <li><b>폐렴:</b> 지속 고열 + 국소 crackle/기관지음 + 빈맥/빈호흡이면 CXR → Day22 경로.</li>
        <li><b>결핵/백일해:</b> 2-3주 이상 기침, 야간발한·체중감소·객혈 또는 2주 이상 발작성 기침/기침 후 구토를 별도 확인.</li>
        <li><b>증후군:</b> 감기 / 인두염 / 부비동염 / 급성기관지염 / influenza·COVID로 분류.</li>
      </ol>

      <h3>2. 항생제 판단</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.65"><tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">감기·J06.9</td><td style="border:1px solid #e7e2d7;padding:8px">항생제 불필요. 누런 콧물/가래만으로 세균성으로 보지 않는다.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">급성기관지염</td><td style="border:1px solid #e7e2d7;padding:8px">건강한 성인 대부분 바이러스성. 항생제 routine 사용 근거 부족.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">인두편도염</td><td style="border:1px solid #e7e2d7;padding:8px">Centor/McIsaac 2점 이상이면 RADT를 고려하고 양성 시 penicillin/amoxicillin.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">세균성 부비동염</td><td style="border:1px solid #e7e2d7;padding:8px">10일 이상 지속 / 39℃ 이상 고열+화농성 비루 3-4일 / double sickening 중 하나면 고려.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">백일해</td><td style="border:1px solid #e7e2d7;padding:8px">Macrolide. 전파 차단 목적이 크며 제2급 감염병 신고 경로를 확인.</td></tr>
      </tbody></table>

      <h3>3. 아급성 기침 3-8주</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>Postinfectious cough:</b> 대부분 자연호전. “회복 중인 기침” 설명이 불필요한 항생제 재처방을 줄인다.</li>
        <li><b>UACS:</b> cobblestone/후비루 → 비강 steroid ± 항히스타민.</li>
        <li><b>CVA:</b> 야간·운동·찬공기 유발 → 천식 경로 평가.</li>
        <li><b>GERD:</b> 식후·누울 때 악화.</li>
        <li><b>ACEi:</b> 마른기침, 중단 후 수주 경과 관찰.</li>
      </ul>

      <h3>4. 개원 운영 포인트</h3>
      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px;line-height:1.8"><b>항생제를 줄이면서 진료의 가치를 보이는 구조:</b> 지연 처방 + 3일 재진, influenza/COVID/RADT/CXR 등 적응증 기반 검사, 설명자료, 백신 상담, 3주 이상 기침의 CXR·원인감별 경로. 상병을 지표 회피 목적으로 바꾸지 않고 실제 소견과 처방을 일치시킨다.</div>

      <h3>5. 복사용 진료 문구</h3>
      <div style="border:1px solid #d1d5db;background:#f9fafb;border-radius:10px;padding:12px;white-space:pre-wrap;line-height:1.65">CC: Cough onset ( ), duration ( )\nFever ( ) Dyspnea ( ) Chest pain ( ) Hemoptysis ( )\nParoxysmal cough/post-tussive vomiting ( ) TB contact/history ( )\nPE: BP ( ) PR ( ) BT ( ) RR ( ) SpO2 ( )%\nChest: clear / crackle / wheeze / decreased, focality ( )\nAssessment: URI / acute bronchitis / r/o pneumonia / r/o pertussis\nPlan: symptomatic treatment, antibiotic not indicated / indicated because ( )\nF/U 3-5 days; CXR if cough persists ≥3 weeks or red flag develops.</div>
    `,
    revisions: [
      '2026-09-01: 사용자 제공 Day21_Acute_Cough_URI_FM_v1.0.pdf를 기반으로 ClinicNote Day21 공부자료에 등록. 기존 Day 자료는 변경하지 않음.',
    ],
  },
]
