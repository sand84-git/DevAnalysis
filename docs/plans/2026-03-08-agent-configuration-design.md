# 에이전트 구성 설계 문서

## 개요

게임 피드백 분석 도구의 효율적 제작과 코드 효율화를 위한 에이전트 구성 설계.
두 가지 축으로 구성: **제작용 Claude Code 서브에이전트** + **앱 내 AI 에이전트 아키텍처**.

### 설계 조건
- 접근 방식: **레이어 분리형** (수평 레이어로 병렬 제작)
- API 모델: **품질 우선** (Sonnet 기본 + 핵심 판단에 Opus)
- 제작 우선순위: **안정성** (레이어별 독립 테스트)
- 규모: 초기 소규모 (프로젝트 1~2개, 50건, 월 2~3회) → 런칭 후 스케일업

---

## Part 1: 제작용 Claude Code 서브에이전트

### 전체 흐름

```
[Phase 0: 공통 기반] ← 메인에서 직접 작업 (병렬의 전제 조건)
├── 타입 정의 (types/index.ts)
├── Prisma 스키마 + 마이그레이션
├── 전역 레이아웃 + 디자인 토큰 (Tailwind 설정)
└── Claude API 클라이언트 기본 설정

[Phase 1: 4개 서브에이전트 병렬] ← worktree 격리
├── Agent A: 데이터 레이어
├── Agent B: UI 컴포넌트
├── Agent C: AI 파이프라인
└── Agent D: 통합 기능

[Phase 2: 메인에서 통합 + 테스트]
```

### Agent A: 데이터 레이어 (인프라)

```
담당 범위:
├── API Routes 전체 (projects/, builds/, upload/, tasks/, search/)
├── Prisma CRUD 유틸리티 함수
├── 파일 파서 (xlsx-parser, pdf-parser, column-detector)
├── 검색 엔진 (FTS5 설정 + feedback-search.ts)
└── 태스크 이력 관리 (task-history.ts, auto-carryover.ts)

출력물: API가 목 데이터로 동작하는 상태
테스트: 각 API route의 단위 테스트
```

### Agent B: UI 컴포넌트 (프레젠테이션)

```
담당 범위:
├── shadcn/ui 초기 설정
├── 레이아웃 컴포넌트 (Sidebar, ProjectSelector, TabNavigation)
├── 프로젝트/빌드 폼 + 카드 컴포넌트
├── 업로드 UI (FileDropzone, ColumnMapper, ParsePreview)
├── 태스크 UI (TaskForm, TaskBoard, TaskTimeline, StatusBadge)
└── 검색 UI (SearchBar, SearchFilters, SearchResultCard)

출력물: 페이지에 마운트하면 바로 동작하는 컴포넌트
테스트: props 기반 렌더링 테스트
```

### Agent C: AI 파이프라인 (핵심 분석)

```
담당 범위:
├── 프롬프트 템플릿 전체 (prompts/ 디렉토리)
├── Agent 1: 분류자 (classifier.ts)
├── Agent 2: 유저 옹호자 (user-advocate.ts)
├── Agent 3: 기획 옹호자 (design-advocate.ts)
├── Agent 4: 종합 판관 (synthesizer.ts + synthesizer-quick.ts)
├── 오케스트레이터 (qualitative.ts — 레벨별 파이프라인 제어)
├── 정량 분석 (quantitative.ts)
├── 빌드 비교 (cross-build.ts)
├── 태스크 평가 (task-evaluator.ts)
├── 편향/신뢰도 (bias-profiler.ts, reliability-scorer.ts, minority-detector.ts)
└── 비용 추적 모듈 (cost-tracker.ts)

출력물: 목 피드백 데이터 → 분석 결과 JSON 출력
테스트: 고정 입력 → 출력 스키마 검증
```

### Agent D: 통합 기능 (대시보드 + 내보내기)

```
담당 범위:
├── 대시보드 차트 컴포넌트 전체
│   (RadarChart, KeywordBarChart, TrendLineChart, ComparisonTable 등)
├── 대시보드 페이지 (6개 탭 구성)
├── 내보내기 (html-generator, pdf-generator, slack-formatter)
└── 분석 스트리밍 UX (AI 사고 과정 실시간 표시)

출력물: 샘플 분석 데이터로 렌더링되는 대시보드
테스트: 차트 렌더링 + 내보내기 파일 생성 검증
```

### 병렬화 의존성 매트릭스

|          | Agent A | Agent B | Agent C | Agent D |
|----------|---------|---------|---------|---------|
| **의존** | Prisma 스키마 | 타입 + Tailwind | 타입 + Claude 클라이언트 | 타입 |
| **상호 의존** | 없음 | 없음 | 없음 | 차트 데이터 형태만 타입으로 합의 |

Phase 0에서 공유 인터페이스(타입)를 확정하면 4개가 완전 독립 작업 가능.

---

## Part 2: 앱 내 AI 에이전트 아키텍처

### 파이프라인 구조

```
[오케스트레이터: qualitative.ts]
│
├── Quick (API 2회)
│   Agent1(분류/Sonnet) → Agent4-Quick(단일 종합/Opus)
│
├── Standard (API 3회)
│   Agent1(분류/Sonnet) → Agent2(유저옹호/Sonnet) → Agent4(종합/Opus)
│
└── Deep (API 4회, 실질 대기 3단계)
    Agent1(분류/Sonnet) → Agent2(유저옹호/Sonnet) + Agent3(기획옹호/Sonnet) [병렬]
                         → Agent4(종합/Opus)
```

### 모델 배정 (확정)

| 에이전트 | 역할 | 모델 | 이유 |
|----------|------|------|------|
| Agent 1 (분류) | 카테고리 매칭 + 감정 태깅 | **Sonnet** | 구조화된 패턴 매칭, Sonnet으로 충분 |
| Agent 2 (유저옹호) | 유저 경험 분석, 행간 읽기 | **Sonnet** | 단일 관점 분석 |
| Agent 3 (기획옹호) | 방향 문서 vs 피드백 갭 분석 | **Sonnet** | 단일 관점 분석 |
| Agent 4 (종합) | 충돌 판정, 양날의 검 판별, 최종 우선순위 | **Opus** | 다중 관점 종합 판단, 도구 신뢰도의 핵심 |
| 태스크 평가 | 피드백 적합도 판정 | **Sonnet** | 단일 태스크 판정 |
| 빌드 비교 | 빌드 간 트렌드 분석, 개선/악화 판정 | **Opus** | 여러 빌드 교차 분석, 컨텍스트 크고 판단 복잡 |

### 토큰 최적화 전략

```
[입력 토큰 절약]
├── 배치 처리: 피드백 50건을 1회 API 호출로 (개별 호출 X)
├── 방향 문서: Agent 3에만 전달 (Agent 1,2에는 불필요)
├── 카테고리 목록: Agent 1에만 전달
└── 프롬프트 캐싱: 시스템 프롬프트를 캐시하여 반복 호출 비용 절감

[출력 토큰 절약]
├── JSON only 응답 (설명문 제거)
├── Agent 1 출력을 Agent 2,3에 요약본으로 전달 (원문 재전송 X)
└── Agent 4에는 Agent 2,3 출력만 전달 (원문 불필요)
```

---

## Part 3: API 비용 분석

### 가격 기준 (2026.03)

| 모델 | 입력 | 출력 | 캐시 읽기 |
|------|------|------|-----------|
| Sonnet 4.6 | $3 / 1M tokens | $15 / 1M tokens | $0.30 / 1M tokens |
| Opus 4.6 | $15 / 1M tokens | $75 / 1M tokens | $1.50 / 1M tokens |

### 1회 분석 비용 (피드백 50건)

| 에이전트 | 모델 | 입력 토큰 | 출력 토큰 | 비용 |
|----------|------|-----------|-----------|------|
| Agent 1 (분류) | Sonnet | ~3,500 | ~4,000 | $0.071 |
| Agent 2 (유저옹호) | Sonnet | ~3,000 | ~2,000 | $0.039 |
| Agent 3 (기획옹호) | Sonnet | ~4,000 | ~2,000 | $0.042 |
| Agent 4 (종합) | **Opus** | ~3,500 | ~2,500 | $0.240 |
| **합계 (Deep)** | | ~14,000 | ~10,500 | **~$0.39** |
| **합계 (Standard)** | | ~10,000 | ~8,500 | **~$0.35** |
| **합계 (Quick)** | | ~5,500 | ~5,000 | **~$0.26** |

### 추가 기능별 비용

| 기능 | 모델 | 입력 | 출력 | 비용/회 |
|------|------|------|------|---------|
| 태스크 평가 (1건) | Sonnet | ~2,500 | ~1,500 | $0.030 |
| 빌드 비교 (2~4빌드) | **Opus** | ~8,000 | ~3,000 | $0.345 |

### 월간 비용 추정

| 시나리오 | 분석 횟수 | 레벨 | 추가 기능 | **월 비용** |
|----------|-----------|------|-----------|------------|
| **현재 (소규모)** | 월 3회 × 50건 | Standard 2 + Deep 1 | 태스크 평가 5건 + 빌드비교 1회 | **~$1.55** |
| **성장기** | 월 5회 × 100건 | Standard 3 + Deep 2 | 태스크 평가 10건 + 빌드비교 2회 | **~$4.80** |
| **런칭 후** | 월 10회 × 300건 | Standard 7 + Deep 3 | 태스크 평가 20건 + 빌드비교 3회 | **~$35~40** |

### 비용 추적 모듈 설계

```typescript
// cost-tracker.ts — 모든 API 호출을 감싸서 비용 자동 기록

interface APICallLog {
  agent: 'classifier' | 'user_advocate' | 'design_advocate' | 'synthesizer' | 'task_evaluator' | 'cross_build'
  model: 'sonnet' | 'opus'
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  costUSD: number
  buildId: string
  analysisLevel: 'quick' | 'standard' | 'deep'
  timestamp: Date
}

// 기능:
// - 대시보드에 "이번 분석 비용: $0.39" 표시
// - 프로젝트 설정에서 월간 비용 누적 확인
// - 월간 예산 알림 설정 가능 (선택)
```

---

## 설계 결정 요약

| 항목 | 결정 | 이유 |
|------|------|------|
| 제작 방식 | 레이어 분리형 4-agent 병렬 | 독립 테스트 가능, 안정성 최우선 |
| Phase 0 선행 | 타입 + 스키마 먼저 확정 | 병렬 작업의 전제 조건 |
| AI 모델 (분류/분석) | Sonnet 4.6 | 단일 관점 작업에 충분한 품질 |
| AI 모델 (종합/비교) | Opus 4.6 | PD 의사결정에 직접 사용되는 핵심 판단 |
| Agent 2+3 병렬 | Promise.all | Deep 모드에서도 실질 대기 3단계 |
| 토큰 최적화 | 배치 + 캐싱 + 단계별 요약 전달 | 비용 절감과 컨텍스트 효율 |
| 비용 투명성 | cost-tracker 모듈 | 실시간 비용 모니터링 |
