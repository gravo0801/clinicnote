export const adultDailyDay19 = [
  {
    day: 19,
    date: '2026-09-01',
    slug: 'constipation-primary-care',
    topic: '변비: 생활요법, PEG/lactulose, 대장내시경 기준',
    printPath: '/adult-daily/print/study.html?day=19',
    pdfPath: '/api/study-pdf?day=19',
    masterPath: '/adult-daily/master/day-19-constipation.md',
    appHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin-bottom:14px">
        <div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px"><div style="font-weight:900;color:#991b1b;margin-bottom:6px">즉시 응급</div><div>급성 심한 복통 + 팽만 + 반복 구토 + 가스/대변 중단, 복막자극/패혈증, 독성 거대결장, 분변매복 합병증 의심. 장폐색 가능성이 있으면 완하제·관장부터 하지 않는다.</div></div>
        <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;padding:12px"><div style="font-weight:900;color:#1d4ed8;margin-bottom:6px">진료의 핵심</div><div><b>Bristol + DRE + 약물검토 + CRC screening</b>. 변비 횟수만 보지 말고 힘주기·잔변감·항문폐쇄감·수지조작을 묻고 DD 여부를 선별한다.</div></div>
      </div>

      <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;padding:12px;margin-bottom:14px"><b>v1.1 업데이트:</b> 2026 AGA refractory constipation CPU, KCD-9 세분코드, 국내 lubiprostone 현황, PEG 설명 정정, 2-4주 titration과 조기 physiology referral 기준을 반영했다.</div>

      <h3>1. 첫 7분 외래 flow</h3>
      <ol style="margin:0 0 12px 20px;padding:0;line-height:1.8">
        <li><b>증상:</b> BM/week, Bristol, straining, incomplete evacuation, anorectal blockage, digital maneuver, 복통과 배변 연관.</li>
        <li><b>Red flag/CRC:</b> 혈변·흑변, 빈혈, 체중감소, 종괴, 새 배변습관 변화, 가족력, screening 누락.</li>
        <li><b>약물:</b> opioid, 항콜린제, TCA, 1세대 항히스타민, CCB, 철분, Ca/Al 제산제, OTC/건기식.</li>
        <li><b>DRE:</b> stool/impaction, mass, fissure/hemorrhoid, resting tone, simulated defecation의 역설적 수축/하강.</li>
        <li><b>DD/impaction:</b> 완하제 증량보다 매복 처치 또는 조기 ARM/BET·biofeedback referral.</li>
        <li><b>일반 기능성 변비:</b> fiber/배변습관 + PEG 또는 MgO/lactulose → stimulant PRN → 불충분 시 prucalopride/접근 가능한 lubiprostone.</li>
        <li><b>F/U:</b> 2-4주 titration. 적절한 regimen 12주에도 불충분하거나 DRE상 DD 강력 의심이면 physiology referral.</li>
      </ol>

      <h3>2. 처방 핵심</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.65"><tbody>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">PEG 4000</td><td style="border:1px solid #e7e2d7;padding:8px">10-20 g/day, 반응에 따라 조절. OTC 중 근거가 강함. lactulose보다 발효성 가스는 적지만 bloating/flatulence 가능.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">MgO</td><td style="border:1px solid #e7e2d7;padding:8px">초기 약 1 g/day 분할. 고령·CKD·고용량은 hyperMg 주의.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">Lactulose</td><td style="border:1px solid #e7e2d7;padding:8px">15-30 mL/day 시작, 필요 시 분할·증량. 가스·복부팽만 흔함.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">Bisacodyl</td><td style="border:1px solid #e7e2d7;padding:8px">5-10 mg qHS PRN rescue. 매일 필요하면 baseline therapy 또는 DD를 재평가.</td></tr>
        <tr><td style="border:1px solid #e7e2d7;padding:8px;font-weight:900">Prucalopride</td><td style="border:1px solid #e7e2d7;padding:8px">2 mg qd. ≥65세, eGFR&lt;30, Child-Pugh C는 1 mg qd 권고.</td></tr>
      </tbody></table>

      <h3>3. KCD-9 실전</h3>
      <div style="border:1px solid #e7e2d7;background:#faf7f1;border-radius:10px;padding:12px;line-height:1.8"><b>K59.09</b> 아형 미확정 변비의 실용적 기본 코드. <b>K59.00</b> 서행성, <b>K59.01</b> 출구기능장애, <b>K59.02</b> 두 기전 병합은 근거가 충분할 때. 반복 복통이 배변/변 형태 변화와 연관되면 <b>K58.1</b> IBS-C를 고려한다.</div>

      <h3>4. 2026 refractory constipation 업데이트</h3>
      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:12px;line-height:1.8">난치성으로 너무 빨리 분류하지 않는다. 대부분은 refractory로 부르기 전에 <b>anorectal manometry + balloon expulsion test</b>로 DD를 평가하고, 적응증이면 biofeedback까지 완료한다. 수술은 객관적 slow-transit 확인 + DD 배제 후 고려한다.</div>

      <h3>5. 복사용 진료 문구</h3>
      <div style="border:1px solid #d1d5db;background:#f9fafb;border-radius:10px;padding:12px;white-space:pre-wrap;line-height:1.65">CC: Constipation, duration ( )\nBM/week ( ) Bristol ( ) Straining ( ) Incomplete evacuation ( )\nDigital maneuver ( ) Anorectal blockage ( )\nAlarm: blood/anemia/weight loss/mass/vomiting-distension-obstipation ( )\nDRE: stool/impaction ( ) mass ( ) simulated defecation paradoxical contraction ( )\nA: Constipation K59.09 / r/o defecatory disorder\nP: bowel routine + soluble fiber / laxative ( ) / 2-week bowel diary / F/U 2-4 weeks\nER if severe pain, vomiting, marked distension, no gas/stool.</div>
    `,
    revisions: [
      '2026-09-01: 사용자 제공 Day19_Constipation_FM_v1.1_2026-09-01 PDF를 기반으로 ClinicNote Day19 공부자료에 신규 등록. 기존 Day 자료는 변경하지 않음.',
    ],
  },
]
