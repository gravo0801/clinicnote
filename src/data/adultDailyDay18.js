export const adultDailyDay18 = [
  {
    day: 18,
    date: '2026-09-01',
    slug: 'diarrhea-infectious-medication-ibs',
    topic: '설사: 감염성/약물성/IBS, 항생제 적응증',
    printPath: '/adult-daily/print/study.html?day=18',
    pdfPath: '/api/study-pdf?day=18',
    masterPath: '/adult-daily/master/day-18-diarrhea.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 의뢰/전원</div><div>쇼크/저혈압, 의식변화, 심한 AKI 의심, 복막자극·심한 국소복통, 패혈증/독성 소견, 지속 혈변+고열, 경구·IV로도 조절 어려운 중증 탈수. 의원에서 ‘수액 더 맞춰보고’ 시간을 끌지 않는다.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">진료의 핵심</div><div><b>기간 → 중증도 → 탈수 → 노출/약물 → oral vs IV vs ER</b> 순서. 급성 수양성 설사의 대부분은 수분·전해질 보충이 1차이며 항생제는 예외적이다.</div></div>
      </div>

      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px;margin-bottom:14px"><b>v1.2 실전 보강:</b> ‘수액을 할까 말까’ 결정, 500 mL 단위 재평가, 귀가 기준·oral challenge, 진료세트 예시, 24-72시간 재진, 만성 설사 전환, 수액을 포함한 임상적으로 정당한 매출/운영 구조를 추가했다.</div>

      <h3>1. 첫 3분 triage</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>기간:</b> 급성 &lt;14일 / 지속성 14-29일 / 만성 ≥4주.</li>
        <li><b>Red flag:</b> 혈변, 지속 고열, 패혈증/독성, rebound·심한 focal tenderness, 의식변화, 면역저하.</li>
        <li><b>탈수:</b> supine/standing symptom, BP/PR, 점막, capillary refill, 최근 소변, 체중변화, oral intake. 가능하면 수액 전 baseline을 수치화.</li>
        <li><b>노출:</b> 공동식사/집단발생, 여행, 생해산물·덜 익힌 육류, 최근 입원/요양시설·항생제.</li>
        <li><b>약물:</b> metformin, Mg, acarbose, colchicine, SSRI, PPI, GLP-1 RA, 항생제, 하제의 최근 신규/증량.</li>
      </ol>

      <h3>2. 의원에서 수액: 누구에게, 얼마나, 언제 멈출까?</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.65">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900;width:22%">ORS 우선</td><td style="border:1px solid #e7e2d7;padding:8px">활력 안정, 갈증/가벼운 어지럼 정도, 구토 없거나 조절 가능, 소변 유지, 마실 수 있음. ORS를 소량씩 자주 + 식사 조기 재개.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">IV 고려</td><td style="border:1px solid #e7e2d7;padding:8px">기립성 어지럼, tachycardia, 점막 건조·소변 감소, 반복구토/경구섭취 불량 등 <b>중등도 volume depletion</b>이나 현재 shock·acute abdomen은 아닌 경우.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">ER</td><td style="border:1px solid #e7e2d7;padding:8px">저혈압/쇼크, altered mental status, severe AKI, 심한 전해질 이상 의심, 지속 복막자극/패혈증, 수액 후에도 불안정. 원내 observation이 전원을 지연시키면 안 됨.</td></tr>
        </tbody>
      </table>
      <div style="border:1px solid #d1d5db;background:#f9fafb;border-radius:10px;padding:12px;margin-top:8px;line-height:1.75"><b>실무 예시(지침의 고정 처방량이 아니라 의원용 운영 예시):</b> LR 또는 NS 500 mL를 30-60분 정도 투여 → BP/PR, dizziness, mucosa, urine, nausea, lung crackle를 다시 본다. 건강한 성인에서 여전히 필요하면 추가 500 mL를 고려할 수 있다. 고령·HF·CKD는 250-500 mL 단위로 더 보수적으로 반복평가한다. ‘1 L를 맞추는 것’이 목표가 아니라 <b>임상 재평가 후 다음 처분(discharge vs additional fluid vs ER)</b>을 결정하는 것이 목표다.</div>

      <h3>3. 수액 전후 체크리스트</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px">
        <div style="border:1px solid #e7e2d7;border-radius:8px;padding:10px"><b>Before</b><br/>BP/PR/BT, orthostatic symptom, last urine, vomiting 횟수, oral intake, 복부 focal tenderness/rebound, HF/CKD, 약물.</div>
        <div style="border:1px solid #e7e2d7;border-radius:8px;padding:10px"><b>After 500 mL</b><br/>어지럼·갈증 개선? PR/BP 안정? 소변? nausea? crackle/dyspnea? 복통이 focal하게 변했나?</div>
        <div style="border:1px solid #e7e2d7;border-radius:8px;padding:10px"><b>귀가 전</b><br/>물/ORS oral challenge 가능, 활력 안정, 걷기 가능, 소변 회복 경향, 보호자/연락 가능, 24-72h follow-up과 ER 기준 설명.</div>
      </div>

      <h3>4. 실제 진료세트 예시</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.65">
        <tbody>
          <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">A. 단순 수양성</td><td style="border:1px solid #e7e2d7;padding:8px">ORS + 조기 식사. 발열/혈변 없고 활동에 지장 큰 경우 loperamide 또는 racecadotril을 선택적으로. Routine antibiotic/probiotic/IV 불필요.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">B. 구토+중등도 탈수</td><td style="border:1px solid #e7e2d7;padding:8px">표적 lab(Na/K/Cr/BUN/glucose ± CBC) 필요성 판단 → LR/NS 500 mL → 재평가 → oral challenge. 항구토제는 QT/병용약 등 환자 위험을 보고 선택.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">C. 혈변/고열</td><td style="border:1px solid #e7e2d7;padding:8px">antimotility routine 회피, stool culture/multiplex PCR ± Shiga toxin. STEC 가능성 있으면 항생제부터 주지 않는다. toxicity/복통 정도에 따라 병원평가.</td></tr>
          <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">D. 최근 항생제/입원</td><td style="border:1px solid #e7e2d7;padding:8px">설명되지 않는 새 묽은변 ≥3회/24h이면 C. difficile 평가. 완하제 사용 확인. 중증/재발/고위험은 감염·소화기 의뢰.</td></tr>
        </tbody>
      </table>

      <h3>5. 대증약</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>Loperamide:</b> 초회 4 mg, 이후 묽은변마다 2 mg, 최대 16 mg/day, 보통 1-2일. 혈변/발열, 중증 대장염·독성거대결장, 치료 전 CDI 의심이면 피함.</li>
        <li><b>Racecadotril 100 mg:</b> 100 mg tid, 식전 권장, 정상변 2회까지 최대 7일. ORS 대체가 아닌 보조치료.</li>
        <li><b>Probiotics:</b> 급성 감염성 설사 routine 처방 근거는 약함. 면역저하/중심정맥관은 특히 신중.</li>
      </ul>

      <h3>6. 경험적 항생제</h3>
      <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px;line-height:1.75">대부분의 수양성 설사에는 사용하지 않는다. 혈변/점액+발열 또는 전형적 이질, 고열·패혈증을 동반한 여행자 설사, 면역저하자의 혈성 설사 등에서 선별 고려. <b>혈성 설사 + 발열이 낮거나 없음 + 덜 익힌 육류/집단노출</b>이면 STEC/Shiga toxin을 우선 고려하고 항생제를 피한다.</div>

      <h3>7. 4주 이상이면 ‘장염 재진’에서 탈출</h3>
      <ul style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li>CBC, electrolytes/Cr, LFT/albumin, 필요 시 ferritin/iron, TSH.</li>
        <li>분변 calprotectin/lactoferrin, Giardia, tTG-IgA+total IgA를 임상 맥락에 맞게.</li>
        <li>담낭절제/회장질환 + 식후 급박변은 bile acid diarrhea.</li>
        <li>중년·고령의 비혈성 수양성/야간 설사는 microscopic colitis. EGD/colonoscopy 육안 정상이어도 <b>우측+좌측 결장 biopsy</b>가 필요.</li>
        <li>혈변, 체중감소, anemia/hypoalbuminemia, nocturnal symptom, 고령 새 증상, CRC screening 미완료는 colonoscopy/referral.</li>
      </ul>

      <h3>8. KCD-9 / 차팅</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">A09.0</td><td style="border:1px solid #e7e2d7;padding:7px">임상적으로 감염성 위장염이라고 판단·기록.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">A09.9</td><td style="border:1px solid #e7e2d7;padding:7px">감염/비감염 기원을 아직 정하지 못함.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">K52.9</td><td style="border:1px solid #e7e2d7;padding:7px">비감염성이라고 판단한 경우.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:7px;font-weight:800">E86.0</td><td style="border:1px solid #e7e2d7;padding:7px"><b>탈수를 실제 임상 진단했을 때.</b> IV 수액을 했다는 사실만으로 자동 병기하지 않음.</td></tr>
      </tbody></table>

      <h3>9. 개원 운영·매출: ‘수액 매출’이 아니라 hydration pathway</h3>
      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px;line-height:1.8">
        <b>정당한 수익 구조:</b> ① 탈수 문진/활력 기반 IV 적응증 ② 필요한 경우만 electrolyte/Cr 등 표적검사 ③ 500 mL 후 재평가를 실제 진료행위로 남김 ④ oral challenge와 안전한 귀가 판단 ⑤ 필요 시 24-72h 결과·상태 재진 ⑥ ≥2주/≥4주에는 stool/chronic diarrhea pathway로 전환.<br/><br/>
        <b>운영 팁:</b> 간호 체크시트에 수액 전 BP/PR·소변·구토·oral intake, 500 mL 후 재평가, 귀가/추가수액/전원 선택을 넣으면 진료 품질과 workflow가 동시에 좋아진다. 검사·수액·비급여 처치는 적응증과 비용을 설명하고 기록한다.<br/><br/>
        <b>하지 말 것:</b> 설사 환자 전원에 ‘영양수액/비타민수액’ 묶음, 탈수근거 없이 E86 코딩, 반응평가 없이 1-2 L 자동 투여, 수액을 반복 재진의 주목적으로 만드는 것. 이런 방식은 과잉진료·volume overload·신뢰 저하 위험이 있다.
      </div>

      <h3>10. 국내 개원가에서 체득할 패턴</h3>
      <div style="border:1px solid #ddd6fe;background:#f5f3ff;border-radius:10px;padding:12px;line-height:1.75">공식 설문이 아니라 운영 관찰에 기반한 참고다. 급성 장염에서 환자의 ‘수액 기대’가 큰 편이지만, 잘 설계된 의원은 수액 여부를 환자 요구가 아니라 dehydration checklist로 결정하고 500 mL 단위로 재평가한다. 수액 후 좋아졌다고 끝내지 않고 oral intake와 활력, focal pain 변화까지 확인한다. 2-4주 반복되는 환자를 ‘장염’으로 계속 수액치료하지 않고 약물성·IBS-D·microscopic colitis·bile acid diarrhea 경로로 전환한다.</div>

      <h3>11. 환자 설명</h3>
      <div style="border-left:4px solid #0f766e;background:#f0fdfa;padding:10px 12px;line-height:1.75">“수액은 설사를 멈추는 약이 아니라 부족한 수분을 보충하는 치료입니다. 지금은 탈수가 어느 정도인지 보고 수액이 필요한지 결정하겠습니다. 한 팩을 맞은 뒤 혈압·맥박과 어지럼, 물을 마실 수 있는지를 다시 확인해서 더 필요할지, 집에 가도 될지 판단하겠습니다.”</div>
    `,
  },
]
