# ClinicNote 리디자인 패키지

## 적용 방법

아래 파일들을 기존 프로젝트의 동일 경로에 **덮어쓰기** 하세요.

---

### 1. `index.html` (루트)
Noto Sans KR → **Pretendard** 폰트로 교체

### 2. `src/index.css`
CSS 디자인 토큰 추가 (색상, 반경, 그림자)

### 3. `src/App.jsx`
다크 사이드바 (`#0D1117`) + SVG 아이콘 적용

### 4. `src/components/Login.jsx`
세련된 로그인 화면 리디자인

### 5. `src/components/ui.jsx`
공통 컴포넌트 (Sheet, Field, Button 등) 업데이트

### 6. `src/components/DiseaseNoteTab.jsx`
질환 노트 카드 스타일 개선

### 7. `src/components/RxTab.jsx`
처방 노하우 탭 스타일 개선

### 8. `src/components/FamilyTab.jsx`
가족 건강 탭 스타일 개선

### 9. `src/components/PresetRxTab.jsx`
약속처방 탭 색상 토큰 적용

### 10. `src/components/CaseStudyTab.jsx`
케이스 스터디 탭 색상 토큰 적용

### 11. `src/components/HealthCheckup.jsx`
건강검진 탭 색상 토큰 적용

---

## 디자인 토큰 (CSS 변수)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--accent` | `#00C07F` | 메인 컬러 (기존 #0F6E56 대체) |
| `--bg` | `#F4F6F9` | 페이지 배경 |
| `--surface` | `#FFFFFF` | 카드/패널 배경 |
| `--border` | `#EDF0F4` | 기본 테두리 |
| `--sidebar-bg` | `#0D1117` | 다크 사이드바 |
| `--text-1` | `#0D1117` | 주요 텍스트 |
| `--text-muted` | `#9CA3AF` | 보조 텍스트 |

## 변경 후 색상 확인

기존 → 신규
- `#0F6E56` → `#00C07F` (브라이트 에메랄드)
- `#f5f3ef` → `#F4F6F9` (쿨 라이트 그레이)
- `#ece9e3` → `#EDF0F4` (모던 보더)
- Noto Sans KR → **Pretendard**
