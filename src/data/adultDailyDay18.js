export const adultDailyDay18 = [
  {
    day: 18,
    date: '2026-09-01',
    slug: 'diarrhea-infectious-medication-ibs',
    topic: '설사: 감염성/약물성/IBS, 항생제 적응증',
    printPath: '/adult-daily/print/study.html?day=18',
    pdfPath: '/adult-daily/pdf/Day18_Diarrhea_FM_v1.1_2026-09-01.pdf',
    masterPath: '/adult-daily/master/day-18-diarrhea.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 의뢰/전원</div>
          <div>중증 탈수, 패혈증/독성 소견, 복막자극 또는 심한 국소 복통, AKI·의식변화, 고위험 면역저하자는 의원에서 수액이나 검사를 오래 끌지 않는다.</div>
        </div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px">
          <div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">핵심 원칙</div>
          <div><b>기간 → 중증도 → 탈수 → 노출/약물</b> 순서로 평가한다. 대부분의 급성 수양성 설사는 수분·전해질 보충이 1차 치료이며 경험적 항생제는 좁은 적응증에만 사용한다.</div>
        </div>
      </div>

      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px;margin-bottom:14px">
        <b>v1.1 업데이트:</b> 제2급 감염병은 24시간 이내 신고, 성인 racecadotril 국내 허가, KCD-9 A09.0/A09.9/K52.9 구분, CDI 검사 기준, 만성 수양성 설사 평가, probiotics 근거, 2026 CDC 여행자 설사 중증도 기준을 반영했다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">첫 3분 triage</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>기간:</b> 급성 &lt;14일, 지속성 14-29일, 만성 ≥4주.</li>
        <li><b>Red flag:</b> 혈변, 지속 고열, 패혈증/독성 소견, 반발통·심한 국소 압통, 중증 탈수, 의식변화, 면역저하.</li>
        <li><b>탈수:</b> 기립성 증상, 빈맥, 점막 건조, 소변 감소, 경구 섭취 가능 여부. 노인·CKD·HF는 수액 전후 재평가.</li>
        <li><b>노출:</b> 공동식사/집단발생, 여행, 생해산물·덜 익힌 육류, 최근 입원·요양시설, 항생제.</li>
        <li><b>약물:</b> metformin, Mg, acarbose, colchicine, SSRI, PPI, GLP-1 RA, 항생제, 하제의 최근 3개월 신규·증량 여부.</li>
      </ol>

      <h3 style="margin:14px 0 7px;font-size:15px">대변검사 적응증</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">염증성/중증</td><td style="border:1px solid #e7e2d7;padding:7px">혈변·점액 + 발열, 심한 복통/압통, 패혈증이면 Salmonella, Shigella, Campylobacter, Yersinia, STEC를 포함한 배양 또는 multiplex PCR. STEC 의심 시 Shiga toxin 우선.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">집단발생</td><td style="border:1px solid #e7e2d7;padding:7px">공동노출 또는 공중보건상 원인 확인이 필요하면 검사 범위를 넓히고 보건소와 조기 협의.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">C. difficile</td><td style="border:1px solid #e7e2d7;padding:7px">설명되지 않는 새 발병 묽은변 ≥3회/24시간. 완하제 사용과 항생제·의료기관 노출, 고령·면역저하를 함께 고려.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">지속성/만성</td><td style="border:1px solid #e7e2d7;padding:7px">여행 후 ≥2주면 Giardia 등 원충, ≥4주 수양성이면 만성 설사 경로로 전환.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">치료와 대증약</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">수분·전해질</td><td style="border:1px solid #e7e2d7;padding:7px">경구 가능하면 ORS를 소량씩 자주. 중등도 탈수/반복 구토는 LR 또는 NS 500-1,000 mL 후 활력·증상·소변·폐수포 재평가.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">Loperamide</td><td style="border:1px solid #e7e2d7;padding:7px">초회 4 mg, 이후 묽은변마다 2 mg, 최대 16 mg/일, 보통 1-2일. 혈변/발열, 중증 대장염·독성거대결장 또는 치료 전 CDI 의심 시 피함.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">Racecadotril</td><td style="border:1px solid #e7e2d7;padding:7px">성인 100 mg 1일 3회, 식전 권장. 정상변 2회까지, 최대 7일. ORS를 대체하지 않으며 간·신장애와 중증 피부반응에 주의.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">Probiotics</td><td style="border:1px solid #e7e2d7;padding:7px">급성 감염성 설사에서 routine 처방 근거가 약함. 면역저하·중심정맥관 환자는 특히 신중.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">경험적 항생제</h3>
      <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px">
        대부분의 수양성 설사에는 사용하지 않는다. 혈변/점액변 + 발열 또는 전형적 이질, 고열·패혈증을 동반한 여행자 설사, 면역저하자의 혈성 설사에서 고려한다. 발열이 낮거나 없고 육류·집단노출이 있는 혈성 설사는 STEC를 먼저 의심해 Shiga toxin 검사 후 항생제를 피한다.
      </div>
      <ul style="margin:8px 0 12px 20px;padding:0;line-height:1.8">
        <li>여행자 설사 경증: 항생제 권장하지 않음.</li>
        <li>중등도: 항생제 사용 가능. 혈변/발열이 없으면 loperamide 단독 또는 병용 가능.</li>
        <li>중증 또는 모든 이질: 항생제 권장, azithromycin 선호. 예: 1 g 1회 또는 500 mg 1일 1회 3일.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">C. difficile</h3>
      <div style="border:1px solid #ddd6fe;background:#f5f3ff;border-radius:10px;padding:12px">
        무증상 보균 검사·치료, 같은 episode의 7일 이내 반복검사, test-of-cure는 피한다. 초기 CDI는 fidaxomicin 선호, 경구 vancomycin은 허용 가능한 대안이며 metronidazole은 일반적 1차 선택이 아니다. 저혈압/쇼크, ileus/megacolon, AKI, 현저한 WBC 상승, 재발·고위험 숙주는 의뢰한다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">4주 이상 수양성 설사</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>CBC, 전해질/Cr, 간기능, albumin, 필요 시 ferritin/iron, TSH.</li>
        <li>분변 calprotectin 또는 lactoferrin, Giardia, tTG-IgA + total IgA를 임상 맥락에 맞춰 검사.</li>
        <li>담낭절제·회장질환과 식후 급박변이면 담즙산 설사를 고려.</li>
        <li>현미경적 대장염 의심 시 내시경이 정상이어도 <b>우측+좌측 결장 조직검사</b>를 의뢰서에 명시.</li>
        <li>혈변, 체중감소, 빈혈/저albumin, 야간 증상, 고령 새 증상, CRC screening 미완료는 대장내시경.</li>
      </ul>

      <h3 style="margin:14px 0 7px;font-size:15px">KCD-9</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">A09.0</td><td style="border:1px solid #e7e2d7;padding:7px">임상적으로 감염성 위장염이라고 판단·기록한 경우.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">A09.9</td><td style="border:1px solid #e7e2d7;padding:7px">감염성/비감염성 기원을 정하지 못한 경우.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">K52.9</td><td style="border:1px solid #e7e2d7;padding:7px">비감염성이라고 명시한 경우.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">K58.0 / K59.1</td><td style="border:1px solid #e7e2d7;padding:7px">설사형 IBS / 기능성 설사. 만성·재발성이고 경고증상을 배제한 뒤 사용.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E86.0</td><td style="border:1px solid #e7e2d7;padding:7px">탈수가 임상 진단으로 기록된 경우. IV 수액 시행만으로 자동 병기하지 않음.</td></tr>
        </tbody>
      </table>

      <h3 style="margin:14px 0 7px;font-size:15px">신고와 안전망</h3>
      <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:10px;padding:12px">
        제2급 장관감염병은 24시간 이내 신고한다. 제4급 장관감염증은 지정 표본감시기관이 7일 이내 보고한다. 같은 음식·장소 노출 후 여러 명이 아프면 검사 결과 전이라도 관할 보건소와 조기 상의한다. 혈변, 지속 고열, 소변 감소, 심한 어지럼, 복통 악화는 즉시 재평가한다.
      </div>

      <h3 style="margin:14px 0 7px;font-size:15px">환자 설명</h3>
      <div style="border-left:4px solid #0f766e;background:#f0fdfa;padding:10px 12px;border-radius:8px">
        “급성 설사는 대부분 며칠 안에 좋아지고, 항생제가 필요한 경우는 일부입니다. 지금은 탈수를 막는 것이 가장 중요합니다. 피가 섞이거나 열이 나는 설사에서는 지사제를 혼자 드시면 안 됩니다.”
      </div>
    `,
    revisions: [
      '2026-09-01: Day 18 v1.1 등록. 급성·만성 설사 접근, 대변검사, CDI, 여행자 설사, KCD-9, 법정감염병 신고 기준 반영.',
    ],
  },
]
