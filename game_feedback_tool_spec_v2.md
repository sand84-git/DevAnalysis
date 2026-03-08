# 게임 피드백 분석 도구 — 프로젝트 설계 문서 v2

## 1. 프로젝트 개요

### 목적
게임 개발팀이 빌드 테스트 피드백을 업로드하면, 자동으로 키워드 분류·빌드 간 비교·태스크 우선순위 평가를 수행하고 인터랙티브 대시보드를 생성하는 웹 앱.

**여러 게임 프로젝트**를 독립적으로 관리할 수 있으며, 프로젝트 내에서 빌드 버전별 피드백 추적과 태스크 이력 관리를 지원한다.

### 핵심 워크플로우
```
[프로젝트 선택/생성]
    ↓
[빌드 등록] → [피드백 파일 업로드] → [AI 자동 분석]
    ↓
[태스크 입력 (빌드 지정)] → [AI 적합도 평가] → [빌드별 상태 추적]
    ↓
[대시보드 생성] → [내보내기 (HTML/PDF)]
```

### 사용자
- 게임 기획자 / PD (주 사용자)
- 사업팀 / QA팀 (대시보드 열람)

---

## 2. 핵심 구조: 프로젝트 → 빌드 → 피드백/태스크

### 계층 구조
```
[앱]
├── 프로젝트 A (미니크래프트)          ← 완전 독립 데이터
│   ├── 방향 문서
│   ├── 키워드 카테고리 세트
│   ├── 빌드 1 (TGS 9월)
│   │   ├── 피드백 파일들
│   │   ├── 분석 결과
│   │   └── 태스크들 (이 빌드에서 발견/대응)
│   ├── 빌드 2 (업계 12월)
│   │   ├── 피드백 파일들
│   │   ├── 분석 결과
│   │   └── 태스크들
│   ├── 빌드 3 (FGT 1월)
│   │   └── ...
│   ├── 빌드 간 비교 분석 (자동)
│   └── 태스크 이력 보드 (빌드 간 상태 추적)
│
├── 프로젝트 B (다른 게임)             ← 완전 독립 데이터
│   ├── 방향 문서
│   ├── 키워드 카테고리 세트 (별도)
│   └── ...
│
└── 프로젝트 C ...
```

### 데이터 격리 원칙
- 프로젝트 간 데이터는 **완전 독립** — 서로 조회/영향 불가
- 키워드 카테고리 세트도 프로젝트마다 독립 관리
- 분석 결과, 태스크, 대시보드 모두 프로젝트 스코프 내에서만 동작

---

## 3. 기능 명세

### Phase 0: 프로젝트 관리

```
[프로젝트 목록 화면]
├── 프로젝트 카드 목록 (이름, 최근 빌드, 빌드 수, 미해결 태스크 수)
├── 새 프로젝트 생성
│   ├── 프로젝트 이름
│   ├── 프로젝트 설명
│   ├── 방향 문서 업로드 (마크다운/텍스트/PDF, 선택)
│   └── 키워드 카테고리 초기 세트 선택
│       ├── 기본 세트 (뱀서류/로그라이크/캐주얼 등 프리셋)
│       └── 빈 세트 (직접 구성)
├── 프로젝트 설정
│   ├── 방향 문서 수정
│   ├── 키워드 카테고리 관리 (추가/수정/삭제)
│   └── 프로젝트 삭제 (확인 2단계)
└── 프로젝트 전환 (사이드바 또는 헤더)
```

### Phase 1: 빌드 관리 + 피드백 업로드

```
[빌드 목록 화면] — 프로젝트 내부
├── 빌드 카드 목록 (타임라인 형태)
│   각 카드: 이름, 날짜, 테스트 유형, 피드백 수, 분석 상태
│
├── 빌드 등록
│   ├── 빌드 이름 (예: "TGS 빌드", "FGT 빌드")
│   ├── 빌드 버전 (자동 증가 또는 수동, 예: v0.1, v0.2, v0.3)
│   ├── 빌드 날짜
│   ├── 빌드 특징 메모 (자유 텍스트, 마크다운 지원)
│   │   예: "전술카드 유닛스킬로 전환, 튜토리얼 재구성"
│   ├── 이전 빌드 대비 주요 변경사항 (구조화된 입력)
│   │   ├── 추가된 기능 (태그 형태)
│   │   ├── 변경된 기능
│   │   └── 삭제된 기능
│   ├── 테스트 환경 정보
│   │   ├── 테스트 유형 (현장체험 / 내부테스트 / FGT / CBT 등)
│   │   ├── 테스트 대상 (일반유저 / 업계인 / 내부팀 등)
│   │   ├── 테스트 인원
│   │   └── 플레이 시간 (대략)
│   └── 주의사항 메모 (예: "긍정 바이어스 있을 수 있음")
│
└── 피드백 파일 업로드 (빌드 상세 화면에서)
    ├── 드래그앤드롭 (복수 파일 동시)
    ├── 지원 형식: .xlsx, .csv, .pdf, .txt
    ├── 업로드 후 자동 파싱 → 미리보기
    │   ├── 감지된 컬럼 목록 + 타입 추정 (점수/선택지/주관식/메타)
    │   ├── 행 수, 언어 분포
    │   └── 사용자가 컬럼 타입 수정 가능
    └── 파싱 확인 후 "분석 시작" 버튼
```

### Phase 2: AI 자동 분석

#### 2-1. 파일 파싱
- **xlsx**: 시트별 컬럼 자동 감지
  - 숫자 컬럼 → 점수형 (1~5, 1~10 등 범위 추정)
  - 콤마 구분 텍스트 → 복수선택형
  - 긴 텍스트 → 주관식
  - 국가/연령/성별 등 → 메타 정보
- **pdf**: 텍스트 추출 후 섹션 분리
- **자동 언어 감지**: 한국어/영어/일본어/중국어 혼재 처리

#### 2-2. 정량 분석 (자동, API 불필요)
- 만족도/점수 분포 (평균, 중위값, 분포 히스토그램)
- 선택지(복수선택) 빈도 집계
- 세그먼트별 교차 분석 (국가/연령/성별 — 해당 컬럼 존재 시)

#### 2-3. 정성 분석 (Claude API)
주관식 응답을 Claude API에 전송:

```json
// 입력
{
  "responses": ["주관식 응답 목록"],
  "categories": ["프로젝트에 설정된 카테고리 목록"],
  "direction_doc": "프로젝트 방향 문서 (있으면)",
  "build_context": "이 빌드의 특징 메모"
}

// 출력
{
  "classified_responses": [
    {
      "id": 1,
      "text": "원문",
      "language": "ko",
      "categories": ["랜덤성", "유닛가독성"],
      "sentiment": "negative",
      "is_key_quote": true,
      "summary": "한줄 요약"
    }
  ],
  "category_summary": {
    "랜덤성": { "count": 25, "sentiment_breakdown": {...}, "top_quotes": [...] }
  },
  "new_category_suggestions": ["AI가 발견한 새 카테고리 제안"]
}
```

#### 2-4. 빌드 간 비교 분석 (2개 이상 빌드 시 자동)
- 키워드 출현 빈도 추이 차트 데이터
- Before → After 자동 비교표
- 개선 / 정체 / 악화 항목 자동 분류
- 유저 인식 변화 추적 ("한 줄 소개" 키워드 클라우드)

### Phase 3: 피드백 원문 검색

```
[검색 화면] — 프로젝트 내 전체 빌드의 피드백을 통합 검색

검색 바
├── 키워드 입력 (예: "지휘관", "boss timer", "랜덤")
├── 필터
│   ├── 빌드 선택 (전체 / 특정 빌드)
│   ├── 카테고리 필터
│   ├── 감정 필터 (긍정/부정/중립)
│   └── 언어 필터
└── 정렬 (관련도 / 빌드 날짜 / 감정)

검색 결과
├── 매칭된 응답 목록
│   각 항목:
│   ├── 원문 텍스트 (키워드 하이라이트)
│   ├── 빌드 이름 + 날짜 배지
│   ├── 카테고리 태그
│   ├── 감정 태그
│   └── 응답자 메타 (국가/연령, 있으면)
├── 검색 통계
│   ├── 빌드별 매칭 건수 바 차트
│   └── 감정 분포
└── 내보내기 (검색 결과를 CSV로)
```

**검색 구현:**
- DB에 피드백 원문 + 분류 결과를 함께 저장
- SQLite FTS5 (Full Text Search) 또는 PostgreSQL tsvector 활용
- 한국어/일본어/중국어는 n-gram 토큰화로 검색 품질 확보

### Phase 4: 태스크 관리 + 빌드별 분류 + 이력 추적

#### 4-1. 태스크 생성

```
[태스크 생성 화면]
├── 기본 정보
│   ├── 섹션/카테고리 (드롭다운, 사용자 정의 가능)
│   ├── 태스크 제목
│   ├── 태스크 설명 (마크다운)
│   └── 우선순위 (P0/P1/P2/논의) — 수동 또는 AI 추천
│
├── 빌드 연결 (핵심 기능)
│   ├── 발견 빌드: 이 이슈가 처음 발견된 빌드 (드롭다운)
│   ├── 대응 빌드: 이 태스크를 해결할 목표 빌드 (드롭다운)
│   └── 현재 상태: 미해결 / 개선중 / 해결됨 / 보류
│
└── AI 자동 평가 (생성 시 자동 실행)
    ├── 피드백 적합도 (1~5)
    ├── 관련 피드백 요약 (top 3 인용문)
    ├── 우선순위 추천
    └── 보완 제안
```

#### 4-2. 태스크 이력 추적 (빌드별 상태 변화)

**핵심 개념:** 하나의 태스크가 여러 빌드에 걸쳐 상태가 변화한다.

```
태스크: "유닛 개별 인지 불가"
├── 빌드1 (TGS) → 발견 [미해결] "히트박스가 안 보인다"
├── 빌드2 (업계) → [미해결] "8명이 난사하니 인지 불가"
├── 빌드3 (FGT) → [미해결] "화면이 산만하다"
└── 빌드4 (소프트런칭) → [대응 예정]

태스크: "전술카드 무의미"
├── 빌드1 → 발견 [미해결] "카드 종류가 없다"
├── 빌드2 → [미해결] "먹을 게 없다"
├── 빌드3 → [개선중] "데미지 차이가 보인다" (유닛스킬 카드 전환)
└── 빌드4 → [해결됨] 또는 [개선중] 지속
```

**데이터 모델:**
```
TaskHistory (태스크 이력 레코드)
├── task_id       → Task
├── build_id      → Build (어떤 빌드 시점의 기록인지)
├── status        → 미해결 / 개선중 / 해결됨 / 보류 / 악화
├── note          → 이 빌드에서의 상태 메모
├── evidence      → 관련 피드백 인용문 (이 빌드의 피드백에서 자동 매칭)
└── created_at
```

**UI 표현:**
```
[태스크 상세 화면]
├── 태스크 기본 정보 (제목, 설명, 우선순위, 피드백 적합도)
│
├── 이력 타임라인 (가로 타임라인)
│   ├── 빌드1 ●─── 빌드2 ●─── 빌드3 ●─── 빌드4 ◯
│   │   [미해결]  [미해결]  [미해결]  [대응예정]
│   │
│   │   각 노드 클릭 시:
│   │   ├── 해당 빌드에서의 상태 + 메모
│   │   └── 관련 피드백 인용문 (자동 매칭)
│   │
│   └── 색상: 미해결(빨강) → 개선중(노랑) → 해결(초록) → 악화(보라)
│
└── 자동 알림
    ├── 3빌드 연속 미해결 → "⚠️ 장기 미해결 이슈" 경고
    └── 해결됨 → 미해결 역행 시 → "🔴 이슈 재발" 경고

[태스크 보드 화면] (프로젝트 전체 태스크 조망)
├── 뷰 모드 전환
│   ├── 빌드별 보기: 각 빌드 컬럼에 해당 빌드의 태스크들
│   ├── 상태별 보기: 미해결 | 개선중 | 해결됨 | 보류 칸반 보드
│   └── 이력 보기: 전체 태스크의 빌드별 상태 변화 매트릭스
│
├── 필터
│   ├── 우선순위 (P0/P1/P2/논의)
│   ├── 카테고리
│   ├── 상태
│   └── 발견 빌드 / 대응 빌드
│
└── 빌드 전환 시 태스크 자동 이월
    새 빌드 등록 시, 이전 빌드의 미해결/개선중 태스크를
    새 빌드로 자동 복사 + 상태 입력 프롬프트
```

### Phase 5: 대시보드 생성

분석 결과를 인터랙티브 대시보드로 자동 렌더링:

```
[대시보드 탭 구조]
├── 종합 개요
│   ├── 핵심 지표 카드 (피드백 수, 평균 점수, 미해결 태스크 수)
│   ├── 레이더 차트 (빌드3 또는 최신 빌드)
│   ├── Before → After 비교표 (빌드 간 자동 생성)
│   └── 핵심 발견 사항 (AI 자동 요약)
│
├── 빌드별 상세
│   ├── 키워드 추이 라인 차트
│   └── 각 빌드 카드 (특징 + 강점/약점 + 인용문)
│
├── 심층 분석
│   ├── 키워드 바 차트 (개선 요청 / 좌절 / 리플레이 동기)
│   ├── 교차 분석 (불만 vs 동기)
│   ├── 세그먼트 분석 (국가/연령/성별)
│   └── 각 키워드별 인사이트 카드
│
├── 이슈 트래커
│   ├── 이슈 상태표 (해결/개선중/미해결/회색지대)
│   ├── 태스크 이력 타임라인 (빌드별 상태 변화 한눈에)
│   └── 테마별 유저 인용문 모음
│
├── 방향성 매칭
│   ├── 기획 의도 vs 유저 체감 표 (잘부합/부분/약함)
│   ├── 매칭 진단 요약
│   └── 유저 인식 변화 (빌드별 "한 줄 소개" 키워드)
│
├── 액션 아이템
│   └── 우선순위별 태스크 + AI 평가 + 피드백 근거
│
└── 업무 체크리스트
    ├── 인터랙티브 체크박스 + 진행률 바
    ├── 섹션별 그룹핑
    ├── 피드백 적합도 바
    └── 전체 방향 요약
```

### Phase 6: 내보내기
- **HTML**: 단일 파일 (Chart.js 포함, Netlify/Notion 임베드용)
- **PDF**: 보고서 형태 (차트 이미지 포함)
- **슬랙 요약**: 핵심 지표 + 주요 발견 + 미해결 이슈 텍스트

---

## 4. 기술 스택

### 프론트엔드
```
Next.js 14+ (App Router)
├── React 18 + TypeScript
├── Tailwind CSS
├── Recharts (차트)
├── Shadcn/UI (컴포넌트)
├── React DnD 또는 dnd-kit (드래그앤드롭)
└── cmdk (검색 커맨드 팔레트)
```

### 백엔드
```
Next.js API Routes
├── Anthropic Claude API (정성 분석, 태스크 평가)
├── SheetJS / exceljs (xlsx 파싱)
├── pdf-parse (PDF 텍스트 추출)
├── Prisma ORM
│   ├── 개발: SQLite (+ FTS5 전문 검색)
│   └── 배포: PostgreSQL (+ tsvector 전문 검색)
└── Puppeteer (PDF 내보내기)
```

---

## 5. 데이터 모델

```prisma
// ===== 프로젝트 (최상위) =====
model Project {
  id            String   @id @default(cuid())
  name          String
  description   String?
  directionDoc  String?  // 프로젝트 방향 문서 (마크다운)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // 관계
  builds        Build[]
  categories    Category[]
  tasks         Task[]
  crossAnalysis CrossBuildAnalysis?
}

// ===== 키워드 카테고리 (프로젝트별 독립) =====
model Category {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String  // "랜덤성", "전투반복" 등
  group     String? // "인게임이슈", "시스템", "외부" 등 상위 그룹
  order     Int     @default(0)
}

// ===== 빌드 =====
model Build {
  id           String   @id @default(cuid())
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name         String   // "TGS 빌드"
  version      String?  // "v0.1"
  date         DateTime
  notes        String?  // 빌드 특징 메모 (마크다운)
  changes      Json?    // { added: [], changed: [], removed: [] }
  testType     String?  // "현장체험" / "FGT" / "내부" 등
  testTarget   String?  // "일반유저" / "업계인" 등
  testCount    Int?
  playTime     String?  // "~10분", "1-2시간"
  caution      String?  // "긍정 바이어스 있을 수 있음"
  order        Int      @default(0) // 빌드 순서
  createdAt    DateTime @default(now())

  // 관계
  feedbackFiles FeedbackFile[]
  responses     FeedbackResponse[]
  analysis      BuildAnalysis?
  taskHistories TaskHistory[]
}

// ===== 피드백 파일 =====
model FeedbackFile {
  id        String @id @default(cuid())
  buildId   String
  build     Build  @relation(fields: [buildId], references: [id], onDelete: Cascade)
  filename  String
  fileType  String // "xlsx", "pdf", "csv"
  fileSize  Int
  rawData   Bytes? // 원본 파일 저장

  // 파싱 결과
  parsedColumns Json? // [{ name, type, sampleValues }]
  rowCount      Int?

  responses FeedbackResponse[]
}

// ===== 개별 피드백 응답 =====
model FeedbackResponse {
  id         String  @id @default(cuid())
  buildId    String
  build      Build   @relation(fields: [buildId], references: [id], onDelete: Cascade)
  fileId     String?
  file       FeedbackFile? @relation(fields: [fileId], references: [id])

  // 원본 데이터
  text          String?  // 주관식 응답 원문
  questionType  String   // "score" / "choice" / "open_text"
  questionLabel String?  // 질문 제목
  scoreValue    Float?   // 점수형인 경우
  choiceValues  Json?    // 선택지형인 경우 ["선택1", "선택2"]

  // 응답자 메타
  language    String?  // "ko", "en", "ja", "zh"
  country     String?
  age         Int?
  gender      String?

  // AI 분류 결과
  categories  Json?    // ["랜덤성", "유닛가독성"]
  sentiment   String?  // "positive" / "negative" / "neutral" / "mixed"
  isKeyQuote  Boolean  @default(false)
  aiSummary   String?  // AI 한줄 요약

  // 전문 검색용 인덱스
  // SQLite: FTS5 virtual table
  // PostgreSQL: tsvector 컬럼
}

// ===== 빌드별 분석 결과 (캐싱) =====
model BuildAnalysis {
  id      String @id @default(cuid())
  buildId String @unique
  build   Build  @relation(fields: [buildId], references: [id], onDelete: Cascade)

  // 정량
  scoreDistribution Json? // { "question1": { avg, median, distribution } }
  choiceFrequency   Json? // { "question1": { "선택1": 30, "선택2": 20 } }
  segmentAnalysis   Json? // { country: {...}, age: {...}, gender: {...} }

  // 정성 (AI)
  categoryCounts     Json? // { "랜덤성": { count, sentiment_breakdown, top_quotes } }
  sentimentDist      Json? // { positive: 30, negative: 25, ... }
  topQuotes          Json? // [{ text, category, sentiment, source }]
  aiSummary          String? // AI 종합 요약

  analyzedAt DateTime @default(now())
}

// ===== 빌드 간 비교 분석 =====
model CrossBuildAnalysis {
  id        String  @id @default(cuid())
  projectId String  @unique
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  keywordTrends       Json? // [{ keyword, buildValues: [{ buildId, count }] }]
  beforeAfterTable     Json? // [{ area, builds: [{ buildId, description, trend }] }]
  perceptionEvolution  Json? // [{ buildId, keywords: ["귀여운 뱀서", ...] }]

  analyzedAt DateTime @default(now())
}

// ===== 태스크 =====
model Task {
  id          String  @id @default(cuid())
  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // 기본 정보
  section     String   // 카테고리/섹션 (예: "유닛인지", "랜덤완화")
  title       String
  description String?  // 마크다운
  priority    String   // "P0" / "P1" / "P2" / "discuss"

  // 빌드 연결
  discoveredBuildId String?  // 이 이슈가 처음 발견된 빌드
  targetBuildId     String?  // 해결 목표 빌드
  currentStatus     String   @default("open") // "open" / "improving" / "resolved" / "hold" / "worsened"

  // AI 평가
  feedbackScore     Int?     // 1~5
  relatedQuotes     Json?    // AI가 매칭한 관련 인용문
  aiRecommendation  String?  // AI 우선순위 추천
  aiSupplement      String?  // AI 보완 제안

  // 메타
  order       Int      @default(0)
  checked     Boolean  @default(false)  // 체크리스트 완료 여부
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 관계
  histories   TaskHistory[]
}

// ===== 태스크 이력 (빌드별 상태 추적) =====
model TaskHistory {
  id        String @id @default(cuid())
  taskId    String
  task      Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  buildId   String
  build     Build  @relation(fields: [buildId], references: [id], onDelete: Cascade)

  status    String   // "open" / "improving" / "resolved" / "hold" / "worsened"
  note      String?  // 이 빌드에서의 상태 메모
  evidence  Json?    // 관련 피드백 인용문 [{ text, responseId }]

  createdAt DateTime @default(now())

  @@unique([taskId, buildId]) // 태스크당 빌드별 1개 이력
}
```

---

## 6. 디렉토리 구조

```
game-feedback-analyzer/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                         # 기본 카테고리 세트 시딩
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # 전역 레이아웃
│   │   ├── page.tsx                     # 프로젝트 목록
│   │   │
│   │   ├── project/
│   │   │   ├── new/page.tsx             # 프로젝트 생성
│   │   │   └── [projectId]/
│   │   │       ├── layout.tsx           # 프로젝트 레이아웃 (사이드바)
│   │   │       ├── page.tsx             # 프로젝트 메인 (빌드 타임라인)
│   │   │       ├── settings/page.tsx    # 프로젝트 설정 (방향문서, 카테고리)
│   │   │       ├── builds/
│   │   │       │   ├── new/page.tsx     # 빌드 등록
│   │   │       │   └── [buildId]/
│   │   │       │       ├── page.tsx     # 빌드 상세 + 피드백 업로드
│   │   │       │       └── upload/page.tsx
│   │   │       ├── analysis/page.tsx    # 대시보드
│   │   │       ├── search/page.tsx      # 피드백 원문 검색
│   │   │       ├── tasks/
│   │   │       │   ├── page.tsx         # 태스크 보드
│   │   │       │   ├── new/page.tsx     # 태스크 생성
│   │   │       │   ├── [taskId]/page.tsx # 태스크 상세 + 이력 타임라인
│   │   │       │   └── checklist/page.tsx # 체크리스트 뷰
│   │   │       └── export/page.tsx      # 내보내기
│   │   │
│   │   └── api/
│   │       ├── projects/
│   │       │   ├── route.ts             # CRUD
│   │       │   └── [projectId]/route.ts
│   │       ├── builds/
│   │       │   ├── route.ts
│   │       │   └── [buildId]/route.ts
│   │       ├── upload/route.ts          # 파일 업로드 + 파싱
│   │       ├── analyze/
│   │       │   ├── quantitative/route.ts
│   │       │   ├── qualitative/route.ts # Claude API
│   │       │   └── cross-build/route.ts
│   │       ├── search/route.ts          # 피드백 전문 검색
│   │       ├── tasks/
│   │       │   ├── route.ts
│   │       │   ├── [taskId]/route.ts
│   │       │   ├── evaluate/route.ts    # AI 태스크 평가
│   │       │   └── history/route.ts     # 태스크 이력
│   │       └── export/
│   │           ├── html/route.ts
│   │           ├── pdf/route.ts
│   │           └── slack/route.ts
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn 컴포넌트
│   │   ├── layout/
│   │   │   ├── ProjectSidebar.tsx
│   │   │   ├── ProjectSelector.tsx
│   │   │   └── TabNavigation.tsx
│   │   ├── project/
│   │   │   ├── ProjectCard.tsx
│   │   │   └── ProjectForm.tsx
│   │   ├── build/
│   │   │   ├── BuildTimeline.tsx
│   │   │   ├── BuildCard.tsx
│   │   │   └── BuildForm.tsx
│   │   ├── upload/
│   │   │   ├── FileDropzone.tsx
│   │   │   ├── ColumnMapper.tsx         # 컬럼 타입 매핑 UI
│   │   │   └── ParsePreview.tsx
│   │   ├── dashboard/
│   │   │   ├── RadarChart.tsx
│   │   │   ├── KeywordBarChart.tsx
│   │   │   ├── TrendLineChart.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   ├── CrossAnalysisChart.tsx
│   │   │   ├── SegmentTable.tsx
│   │   │   ├── IssueTracker.tsx
│   │   │   ├── QuoteCard.tsx
│   │   │   ├── DirectionMatchTable.tsx
│   │   │   └── ChecklistSection.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── SearchResultCard.tsx
│   │   └── tasks/
│   │       ├── TaskForm.tsx
│   │       ├── TaskBoard.tsx            # 칸반 보드
│   │       ├── TaskTimeline.tsx         # 이력 타임라인
│   │       ├── TaskEvaluation.tsx       # AI 평가 표시
│   │       └── TaskStatusBadge.tsx
│   │
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── xlsx-parser.ts
│   │   │   ├── pdf-parser.ts
│   │   │   └── column-detector.ts       # 컬럼 타입 자동 감지
│   │   ├── analysis/
│   │   │   ├── quantitative.ts
│   │   │   ├── qualitative.ts           # 에이전트 오케스트레이터
│   │   │   ├── agents/
│   │   │   │   ├── classifier.ts        # Agent 1: 분류자
│   │   │   │   ├── user-advocate.ts     # Agent 2: 유저 옹호자
│   │   │   │   ├── design-advocate.ts   # Agent 3: 기획 옹호자
│   │   │   │   └── synthesizer.ts       # Agent 4: 종합 판관
│   │   │   ├── cross-build.ts
│   │   │   ├── keyword-classifier.ts
│   │   │   └── task-evaluator.ts
│   │   ├── search/
│   │   │   └── feedback-search.ts       # 전문 검색 엔진
│   │   ├── tasks/
│   │   │   ├── task-history.ts          # 이력 관리 로직
│   │   │   └── auto-carryover.ts        # 빌드 전환 시 자동 이월
│   │   ├── claude.ts                    # Claude API 클라이언트
│   │   ├── db.ts                        # Prisma 클라이언트
│   │   └── export/
│   │       ├── html-generator.ts
│   │       ├── pdf-generator.ts
│   │       └── slack-formatter.ts
│   │
│   └── types/
│       └── index.ts
│
├── prompts/                             # Claude API 프롬프트 템플릿
│   ├── agent1-classifier.md             # 분류자
│   ├── agent2-user-advocate.md          # 유저 옹호자
│   ├── agent3-design-advocate.md        # 기획 옹호자
│   ├── agent4-synthesizer.md            # 종합 판관
│   ├── agent4-synthesizer-quick.md      # Quick 모드 (단일 종합)
│   ├── evaluate-task-multi.md           # 태스크 평가 (멀티 에이전트)
│   ├── cross-build-multi.md             # 빌드 비교 (멀티 에이전트)
│   ├── extract-quotes.md               # 핵심 인용문 추출
│   └── direction-match.md              # 기획 방향 매칭
│
└── public/
```

---

## 7. Claude API 프롬프트 설계

### 7-1. 피드백 분류 (classify-feedback.md)
```
당신은 게임 유저 피드백 분석 전문가입니다.

[프로젝트 방향 문서]
{direction_doc}

[이 빌드의 특징]
{build_notes}

[키워드 카테고리]
{category_list}

아래 유저 피드백 응답들을 읽고, 각 응답에 대해:
1. 카테고리 분류 (복수 가능, 위 목록에서 선택)
2. 감정: positive / negative / neutral / mixed
3. 핵심 인용문 여부: true (카테고리를 대표하는 생생한 표현) / false
4. 한줄 요약

기존 카테고리에 맞지 않는 새로운 패턴을 발견하면 new_categories로 제안.

JSON으로만 응답하세요.

[피드백 데이터]
{responses}
```

### 7-2. 태스크 평가 (evaluate-task.md)
```
당신은 게임 행동 분석가입니다.
아래 태스크가 실제 유저 피드백에 얼마나 뒷받침되는지 평가하세요.

[프로젝트 방향 문서]
{direction_doc}

[전체 피드백 분석 요약]
카테고리별 건수: {category_counts}
주요 인용문: {top_quotes}

[이 태스크의 이력]
{task_history} // 빌드별 상태 변화 포함

[평가할 태스크]
제목: {title}
설명: {description}
섹션: {section}

응답 형식:
{
  "feedback_score": 1~5,
  "reasoning": "평가 근거",
  "related_quotes": ["관련 인용문 top 3"],
  "priority_recommendation": "P0/P1/P2",
  "supplement_suggestion": "보완 제안",
  "history_insight": "이력 기반 추가 인사이트 (연속 미해결 등)"
}
```

### 7-3. 빌드 간 비교 (cross-build-compare.md)
```
당신은 게임 피드백 비교 분석 전문가입니다.

[프로젝트 방향 문서]
{direction_doc}

[빌드별 분석 결과]
{build_analyses} // 각 빌드의 카테고리 분포, 주요 인용문

[빌드별 특징 메모]
{build_notes}

다음을 분석하세요:
1. Before→After 비교표: 각 카테고리가 빌드 간 어떻게 변화했는지 (개선▲/정체─/악화▼)
2. 핵심 발견 사항: 가장 중요한 인사이트 5개
3. 유저 인식 변화: "한 줄 소개" 응답의 키워드 변화
4. 방향성 매칭: 기획 의도 vs 실제 유저 체감 (잘부합/부분/약함)

JSON으로 응답하세요.
```

---

## 8. 멀티 에이전트 아키텍처

같은 피드백 데이터를 다른 관점에서 교차 검증하여 편향을 줄이고 "양날의 검" 요소를 정확히 판별하기 위한 구조.

### 왜 에이전트를 나누는가

실제 233건 분석에서 겪은 판단의 어려움:
- "랜덤성"이 불만 1위(55%)이면서 리플레이 동기 3위(23%) → 단일 관점으로 "문제다/아니다" 판단 불가
- "배치 전략"이 유저에게 안 먹히는 게 "시스템 자체가 재미없어서"인지 "체인 효과가 안 보여서"인지 구분 필요
- 유닛 승급 시스템처럼 피드백에 직접 언급은 없지만 여러 문제를 동시에 해결하는 설계 → 단순 키워드 매칭으로 가치 평가 불가

### 에이전트 구조

```
[피드백 원문]
      │
      ▼
  Agent 1: 분류자 (Classifier)
  "객관적 태깅만. 판단 없이 카테고리+감정 분류"
      │
  ┌───┴───┐
  ▼       ▼
Agent 2    Agent 3
유저 옹호자  기획 옹호자
(User)     (Design)
  │         │
  └────┬────┘
       ▼
  Agent 4: 종합 판관 (Synthesizer)
  "충돌과 합의를 정리 → 최종 인사이트"
```

### Agent 1: 분류자 (Classifier)

판단 없이 키워드 분류와 감정 태깅만 수행.

```
역할: 피드백 원문을 카테고리와 감정으로 태깅
규칙:
- 하나의 응답에 여러 카테고리 가능
- 감정은 원문 톤 기반 (positive/negative/neutral/mixed)
- 같은 응답이 긍정+부정 동시 포함 → 반드시 "mixed"
- 해석이나 판단을 추가하지 않음
```

분리 이유: 분류 단계에서 해석이 섞이면 편향 발생. "랜덤성"을 언급한 응답이 불만인지 재미인지는 분류자가 판단하지 않고, 감정 태그로만 구분.

### Agent 2: 유저 옹호자 (User Advocate)

유저 경험과 감정에만 집중. 기획 의도나 기술적 제약은 무시.

```
원칙:
- 유저가 "재미없다"고 하면, 왜 재미없는지 유저 경험 흐름에서 추적
- 직접 말하지 않았더라도 행간의 불편함 포착
- 기획 의도/기술 제약 고려하지 않음 — 순수하게 "이 사람이 뭘 느꼈는가"
- 빈도(몇 명이 말했는가)만큼 강도(얼마나 강하게 느꼈는가)도 중시

출력:
- critical_pain_points: 가장 심각한 문제 (빈도 × 강도)
- hidden_frustrations: 행간에서 읽히는 숨은 불편
- strong_attractions: 유저가 진심으로 좋아하는 요소
- churn_risk_moments: 이탈 위험이 높은 구체적 순간
```

### Agent 3: 기획 옹호자 (Design Advocate)

프로젝트 방향 문서와 기획 의도 관점에서 피드백을 해석. 기획이 의도한 경험과 실제 경험의 갭을 분석.

```
원칙:
- 기획 의도가 유저에게 제대로 전달되었는지 평가
- 유저 불만이 "기획 실패"인지 "전달 실패"인지 구분
  - 기획 실패: 시스템 자체가 재미없음 → 설계 변경 필요
  - 전달 실패: 시스템은 좋으나 유저가 모름/못 느낌 → 연출·가이드 강화
- 유저 요구가 프로젝트 방향과 충돌하는 경우 식별
- 경쟁작 대비 차별점이 유저에게 인식되고 있는지 평가

출력:
- direction_gaps: 기획 의도 vs 유저 체감 갭 + gap_type(design_failure/delivery_failure)
- direction_conflicts: 유저 요구와 기획 방향의 충돌
- well_delivered: 기획 의도가 잘 전달된 요소
- identity_assessment: 게임 정체성 전달도 (strong/partial/weak)
```

### Agent 4: 종합 판관 (Synthesizer)

Agent 2와 3의 분석을 받아 충돌과 합의를 정리하고 최종 인사이트 도출.

```
출력:
- consensus: 양쪽 합의 → 확실한 이슈. 합의 강도 표기.
- conflicts: 양쪽 충돌 → "양날의 검" 또는 "회색지대"
  - 각 관점의 논리 병렬 제시 + 어느 쪽이 근거가 강한지 판단
- blind_spots: 한쪽만 발견한 보완적 인사이트
- final_priority_ranking: 합의 강도 × 심각도 × 빈도로 최종 우선순위
```

### 적용 지점

```
1. 피드백 분석 시 (가장 효과 큼)
   원문 → Agent1(분류) → Agent2(유저) + Agent3(기획) → Agent4(종합)

2. 태스크 평가 시
   태스크 → Agent2("유저 문제를 진짜 해결하는가?")
          → Agent3("기획 방향과 맞는가?")
          → Agent4(적합도 + 우선순위 최종 결정)

3. 빌드 간 비교 시
   빌드 분석들 → Agent2("유저 체감이 나아졌는가?")
              → Agent3("기획 의도가 더 잘 전달되었는가?")
              → Agent4(Before→After 최종 판정)
```

### 비용 최적화: 3단계 분석 레벨

```
Quick   → Agent1 + Agent4(단일 종합)      API 2회  일상적 분석
Standard → Agent1 + Agent2 + Agent4        API 3회  일반 빌드 테스트
Deep    → Agent1 + Agent2 + Agent3 + Agent4 API 4회  소프트런칭/주요 결정
```

UI에서 분석 시작 시 레벨 선택 가능. 기본값 = Standard.

### 검증 사례 (실제 233건 분석 기반)

**사례 1: 랜덤성 — 대표적 "충돌" 사례**
- Agent 2(유저): "개선 요청 1위. 전략이 불가능하다는 강한 좌절."
- Agent 3(기획): "럭 가챠가 코어. 랜덤 제거 = 정체성 훼손. 리플레이 동기이기도 함."
- Agent 4(종합): **충돌. 해법은 "제거"가 아닌 "선택 가능한 랜덤"으로 전환. 유닛 승급 시스템이 정확한 해법.**

**사례 2: 지휘관 — "전달 실패" 판별**
- Agent 2(유저): "65건 리뷰 중 지휘관 언급 0건. 존재하지 않는 시스템."
- Agent 3(기획): "기획 핵심인데 전달 실패(delivery_failure). 시스템 변경 불필요, 연출 강화 필요."
- Agent 4(종합): **합의(심각). 유저 관점만 보면 "제거하자"가 되지만, 기획 관점이 "전달 실패 vs 설계 실패"를 구분해줌.**

**사례 3: 전술카드 — "한쪽만 발견"**
- Agent 2(유저): "빌드3에서 체감 개선 확인. 유저 만족."
- Agent 3(기획): "방향은 올바르지만 빌드 다양성(17건)은 기획 목표 미달. 확장 필요."
- Agent 4(종합): **유저 만족에 안주하지 않고, 기획 목표와의 갭 추적. 기획 관점의 blind_spot.**

### 대시보드 반영

멀티 에이전트 분석 결과는 대시보드에 다음과 같이 표시:

```
[심층 분석 탭]
├── 기존 키워드 차트들
└── 교차 검증 섹션 (Deep 분석 시)
    ├── ✅ 합의 영역: 양쪽이 동의하는 확실한 이슈들
    ├── ⚡ 충돌 영역: 유저 vs 기획 관점이 다른 "양날의 검" 이슈들
    │   각 이슈마다 유저 관점 / 기획 관점 / 종합 판단 병렬 표시
    └── 💡 한쪽만 발견: 보완적 인사이트

[태스크 평가]
├── 피드백 적합도 (1~5)
├── 유저 관점 평가: "이 태스크가 유저 문제를 해결하는가?"
├── 기획 관점 평가: "프로젝트 방향과 맞는가?"
└── 종합 판정: 합의/충돌 표기
```

### 프롬프트 파일 구조

```
prompts/
├── agent1-classifier.md          # 분류자
├── agent2-user-advocate.md       # 유저 옹호자
├── agent3-design-advocate.md     # 기획 옹호자
├── agent4-synthesizer.md         # 종합 판관
├── agent4-synthesizer-quick.md   # Quick 모드용 (단일 종합)
├── evaluate-task-multi.md        # 태스크 평가 (멀티 에이전트)
└── cross-build-multi.md          # 빌드 비교 (멀티 에이전트)
```

### 데이터 모델 추가

```prisma
// BuildAnalysis 모델에 추가
model BuildAnalysis {
  // ... 기존 필드들 ...

  analysisLevel      String?  // "quick" / "standard" / "deep"

  // 멀티 에이전트 결과 (Deep 분석 시)
  userAdvocateResult   Json?  // Agent 2 출력
  designAdvocateResult Json?  // Agent 3 출력
  synthesisResult      Json?  // Agent 4 출력 (consensus, conflicts, blind_spots)
}

// Task 모델에 추가
model Task {
  // ... 기존 필드들 ...

  // 멀티 에이전트 평가 (Deep 시)
  userAdvocateEval   String?  // "유저 문제를 해결하는가?" 한줄 평가
  designAdvocateEval String?  // "기획 방향과 맞는가?" 한줄 평가
  evaluationConsensus String? // "합의" / "충돌" / "보완"
}
```

---

## 9. 구현 순서 (Claude Code)

### Sprint 1: 프로젝트 기반 구축 (1일)
1. Next.js + TypeScript + Tailwind + Prisma 초기화
2. 데이터 모델 스키마 작성 + 마이그레이션
3. 프로젝트 CRUD (목록, 생성, 설정)
4. 기본 레이아웃 (사이드바 + 프로젝트 전환)
5. Claude API 클라이언트 설정

### Sprint 2: 빌드 관리 + 파일 업로드 + 파싱 (1~2일)
6. 빌드 타임라인 UI + CRUD
7. 파일 업로드 드롭존
8. xlsx 파서 (컬럼 자동 감지 + 매핑 UI)
9. pdf 파서
10. 파싱 미리보기 + 확인

### Sprint 3: AI 분석 파이프라인 + 멀티 에이전트 (2~3일)
11. 정량 분석 모듈 (점수, 선택지, 세그먼트)
12. Agent 1: 분류자 (키워드 + 감정 태깅)
13. Agent 2: 유저 옹호자 + Agent 3: 기획 옹호자
14. Agent 4: 종합 판관 (합의/충돌/보완 도출)
15. 분석 레벨 선택 UI (Quick/Standard/Deep)
16. 분석 결과 DB 저장 + 캐싱
17. 빌드 간 비교 분석

### Sprint 4: 피드백 검색 + 대시보드 (2일)
18. 피드백 원문 검색 (FTS 인덱스 + 검색 UI + 필터)
19. 대시보드 종합 개요 탭
20. 빌드별 상세 + 심층 분석 탭 (교차 검증 섹션 포함)
21. 이슈 트래커 + 방향성 매칭 탭

### Sprint 5: 태스크 관리 + 이력 추적 (2일)
22. 태스크 CRUD + 빌드 연결
23. AI 자동 평가 (멀티 에이전트: 유저 관점 + 기획 관점 이중 평가)
24. 태스크 이력 타임라인 UI
25. 빌드 전환 시 자동 이월 로직
26. 태스크 보드 (칸반/빌드별/이력 뷰)
27. 체크리스트 뷰

### Sprint 6: 내보내기 + 배포 (1일)
28. HTML 단일 파일 내보내기
29. PDF 보고서 생성
30. 슬랙 요약 텍스트
31. Vercel 배포 설정

---

## 10. 디자인 시스템

기존 대시보드 HTML에서 검증된 컬러셋과 타이포그래피를 그대로 계승한다.

### 컬러 토큰 (Tailwind CSS 변수)

```css
/* ===== 라이트 테마 (기본) ===== */
--bg:        #F5F0E8;   /* 페이지 배경 — 따뜻한 아이보리 */
--card:      #FFFDF7;   /* 카드/패널 배경 */
--border:    #E8E0D0;   /* 테두리, 구분선 */

/* 텍스트 */
--text:      #2C2418;   /* 제목, 강조 텍스트 */
--text-mid:  #6B5E4A;   /* 본문 텍스트 */
--text-light:#9B8E7A;   /* 보조 텍스트, 캡션 */

/* 액센트 (기능별) */
--accent1:   #E8734A;   /* 주 강조 — 오렌지. CTA, 활성 탭, 핵심 데이터 */
--accent2:   #4A90D9;   /* 보조 강조 — 블루. 링크, P2, 빌드1 */
--accent3:   #6B8E5A;   /* 긍정/확인 — 올리브 그린. 빌드3, 진행률 */
--accent4:   #C4A35A;   /* 경고/중립 — 골드. 인용문 보더, P1 */
--purple:    #8B6BB5;   /* 보조 — 퍼플. 논의 필요, 빌드 다양성 */

/* 시맨틱 */
--danger:    #D45B5B;   /* 에러, 미해결, P0 */
--success:   #5A9B6B;   /* 해결, 긍정, 체크 완료 */
--warn:      #D4A03C;   /* 회색지대, 개선중 */

/* ===== 다크 서페이스 (심층 분석 차트 영역) ===== */
--dark-bg:   #1E1E2A;   /* 다크 차트 배경 */
--dark-text: #E8E0D0;   /* 다크 영역 텍스트 */
--dark-sub:  #C8BCA8;   /* 다크 영역 보조 텍스트 */
--dark-grid: #333333;   /* 다크 영역 그리드선 */

/* 다크 영역 전용 액센트 (밝은 톤) */
--d-red:     #FF8A80;   /* 위험/랜덤성 */
--d-yellow:  #FFD54F;   /* 경고/성장체감 */
--d-blue:    #82B1FF;   /* 정보/전투반복 */
--d-purple:  #CE93D8;   /* 보조/설명부족 */
--d-green:   #A5D6A7;   /* 긍정/좌절없음 */
```

### Tailwind 설정 매핑

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        bg:        '#F5F0E8',
        card:      '#FFFDF7',
        border:    '#E8E0D0',
        text:      '#2C2418',
        'text-mid':'#6B5E4A',
        'text-lt': '#9B8E7A',
        accent1:   '#E8734A',
        accent2:   '#4A90D9',
        accent3:   '#6B8E5A',
        accent4:   '#C4A35A',
        purple:    '#8B6BB5',
        danger:    '#D45B5B',
        success:   '#5A9B6B',
        warn:      '#D4A03C',
        'dark-bg': '#1E1E2A',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
    },
  },
};
```

### 타이포그래피

| 용도 | 폰트 | 사이즈 | 색상 |
|------|------|--------|------|
| 페이지 타이틀 | Playfair Display 800 | 24~28px | --text |
| 섹션 타이틀 | Playfair Display 700 | 19~21px | --text |
| 카드 소제목 | DM Sans 700 | 14~15px | --text |
| 본문 | DM Sans 400 | 12~13px | --text-mid |
| 보조 텍스트 | DM Sans 400 | 10~11px | --text-light |
| 배지/태그 | DM Sans 700 | 10~11px | 각 시맨틱 색상 |
| 숫자 강조 | Playfair Display 800 | 22~26px | --text 또는 시맨틱 |

### 컴포넌트 스타일 규칙

```
카드:        bg-card, border border-border, rounded-[10px], p-6
배지 (P0):   bg-danger text-white text-[10px] font-800 px-2 py-0.5 rounded
배지 (P1):   bg-warn text-white ...
배지 (P2):   bg-accent2 text-white ...
배지 (논의): bg-purple text-white ...
태그:        bg-{color}/10 text-{color} border border-{color}/20 rounded-full px-2.5 py-0.5
인용문 카드:  border-l-3 border-accent4 bg-bg p-3 rounded-r-lg
다크 섹션:   bg-dark-bg text-dark-text
차트 배경:   라이트 영역 = bg-card, 다크 영역 = bg-dark-bg
```

### 디자인 원칙 (기존 대시보드에서 검증)

- **아이보리 메인 톤** — SF 게임이지만 네온/다크 UI를 지양. 따뜻하고 아날로그적 감성
- **다크 서페이스는 차트 영역에만** — 키워드 바 차트 등 데이터 시각화에서만 다크 배경 사용
- **색상으로 상태 구분** — 빨강(미해결/P0), 노랑(개선중/P1), 파랑(이후/P2), 초록(해결), 보라(논의)
- **Playfair Display는 제목에만** — 본문은 전부 DM Sans
- **최소한의 그림자** — 카드는 border만, 그림자 사용 안 함

---

## 11. 환경 변수

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="Game Feedback Analyzer"
```

---

## 12. 검증된 분석 패턴 (기본 카테고리 프리셋)

### 뱀서류/로그라이크/캐주얼 게임 프리셋
실제 233건 분석에서 검증:

**인게임 이슈**: 랜덤성, 전투반복, 빌드다양성, 난이도, 조작감, 유닛가독성, 배치전략, 보스전
**시스템**: 튜토리얼, 성장체감, 재화시스템, 시인성, 편의성
**외부**: 아트, 스토리, 오디오, 버그, BM/수익화
**시그널**: 좌절없음(긍정), 차별화부족, 경쟁작비교

### 자동 분석 규칙
- 불만 vs 리플레이 동기에 같은 키워드 → "양날의 검" 태그
- "좌절 없음" ≥30% → "코어 루프 작동 증거"
- 같은 카테고리 3빌드 연속 미해결 → "⚠️ 장기 미해결" 경고
- 해결됨→미해결 역행 → "🔴 이슈 재발" 경고
