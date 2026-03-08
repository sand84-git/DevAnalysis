# Game Feedback Analyzer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 게임 피드백 분석 도구 (프로젝트→빌드→피드백/태스크 계층 구조, AI 멀티에이전트 분석, 인터랙티브 대시보드)를 레이어 분리형으로 구축한다.

**Architecture:** Phase 0에서 공통 기반(타입, 스키마, 레이아웃, API 클라이언트)을 확정한 뒤, 4개 서브에이전트(데이터/UI/AI/통합)를 병렬로 실행. Phase 2에서 통합 테스트.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Prisma (SQLite→PostgreSQL), Recharts, Shadcn/UI, Anthropic Claude API (Sonnet 4.6 + Opus 4.6)

**Reference Docs:**
- 스펙: `game_feedback_tool_spec_v2.md`
- 에이전트 설계: `docs/plans/2026-03-08-agent-configuration-design.md`

---

## Phase 0: 공통 기반 (메인에서 직접 작업)

> 이 Phase가 완료되어야 4개 서브에이전트가 병렬 작업 가능.

---

### Task 0-1: Next.js 프로젝트 초기화

**Files:**
- Create: `game-feedback-analyzer/` (프로젝트 루트)

**Step 1: 프로젝트 생성**

```bash
npx create-next-app@latest game-feedback-analyzer \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm
```

**Step 2: 핵심 의존성 설치**

```bash
cd game-feedback-analyzer
npm install prisma @prisma/client
npm install @anthropic-ai/sdk
npm install recharts
npm install exceljs pdf-parse
npm install clsx tailwind-merge class-variance-authority
npm install lucide-react
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-popover
npm install -D @types/pdf-parse
```

**Step 3: 확인**

```bash
npm run dev
```
Expected: localhost:3000에서 Next.js 기본 페이지 표시

**Step 4: 커밋**

```bash
git add .
git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 0-2: Tailwind 디자인 토큰 설정

**Files:**
- Modify: `game-feedback-analyzer/tailwind.config.ts`
- Modify: `game-feedback-analyzer/src/app/globals.css`

**Step 1: Tailwind 설정에 디자인 토큰 추가**

`tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F5F0E8',
        card: '#FFFDF7',
        border: '#E8E0D0',
        text: '#2C2418',
        'text-mid': '#6B5E4A',
        'text-lt': '#9B8E7A',
        accent1: '#E8734A',
        accent2: '#4A90D9',
        accent3: '#6B8E5A',
        accent4: '#C4A35A',
        purple: '#8B6BB5',
        danger: '#D45B5B',
        success: '#5A9B6B',
        warn: '#D4A03C',
        'dark-bg': '#1E1E2A',
        'dark-text': '#E8E0D0',
        'dark-sub': '#C8BCA8',
        'dark-grid': '#333333',
        'd-red': '#FF8A80',
        'd-yellow': '#FFD54F',
        'd-blue': '#82B1FF',
        'd-purple': '#CE93D8',
        'd-green': '#A5D6A7',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: globals.css에 기본 스타일 설정**

`src/app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg text-text-mid font-body;
  }
  h1, h2, h3 {
    @apply text-text font-display;
  }
}
```

**Step 3: 확인**

```bash
npm run dev
```
Expected: 배경이 아이보리(#F5F0E8)로 변경됨

**Step 4: 커밋**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: add design token system (colors, fonts)"
```

---

### Task 0-3: Prisma 스키마 + 마이그레이션

**Files:**
- Create: `game-feedback-analyzer/prisma/schema.prisma`

**Step 1: Prisma 초기화**

```bash
npx prisma init --datasource-provider sqlite
```

**Step 2: schema.prisma 작성**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Project {
  id            String   @id @default(cuid())
  name          String
  description   String?
  directionDoc  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  builds        Build[]
  categories    Category[]
  tasks         Task[]
  crossAnalysis CrossBuildAnalysis?
}

model Category {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  group     String?
  order     Int     @default(0)
}

model Build {
  id           String   @id @default(cuid())
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name         String
  version      String?
  date         DateTime
  notes        String?
  changes      String?
  testType     String?
  testTarget   String?
  testCount    Int?
  playTime     String?
  caution      String?
  biasProfile  String?
  order        Int      @default(0)
  createdAt    DateTime @default(now())

  feedbackFiles FeedbackFile[]
  responses     FeedbackResponse[]
  analysis      BuildAnalysis?
  taskHistories TaskHistory[]
}

model FeedbackFile {
  id        String @id @default(cuid())
  buildId   String
  build     Build  @relation(fields: [buildId], references: [id], onDelete: Cascade)
  filename  String
  fileType  String
  fileSize  Int
  rawData   Bytes?

  parsedColumns String?
  rowCount      Int?

  responses FeedbackResponse[]
}

model FeedbackResponse {
  id         String  @id @default(cuid())
  buildId    String
  build      Build   @relation(fields: [buildId], references: [id], onDelete: Cascade)
  fileId     String?
  file       FeedbackFile? @relation(fields: [fileId], references: [id])

  text          String?
  questionType  String
  questionLabel String?
  scoreValue    Float?
  choiceValues  String?

  language    String?
  country     String?
  age         Int?
  gender      String?

  categories  String?
  sentiment   String?
  confidence  Float?
  isKeyQuote  Boolean  @default(false)
  aiSummary   String?
}

model BuildAnalysis {
  id      String @id @default(cuid())
  buildId String @unique
  build   Build  @relation(fields: [buildId], references: [id], onDelete: Cascade)

  scoreDistribution String?
  choiceFrequency   String?
  segmentAnalysis   String?

  categoryCounts     String?
  sentimentDist      String?
  topQuotes          String?
  aiSummary          String?

  sampleReliability  String?
  aiConfidenceAvg    Float?
  biasIndex          Float?

  analysisLevel      String?

  userAdvocateResult   String?
  designAdvocateResult String?
  synthesisResult      String?

  analyzedAt DateTime @default(now())
}

model CrossBuildAnalysis {
  id        String  @id @default(cuid())
  projectId String  @unique
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  keywordTrends       String?
  beforeAfterTable    String?
  perceptionEvolution String?

  analyzedAt DateTime @default(now())
}

model Task {
  id          String  @id @default(cuid())
  projectId   String
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  section     String
  title       String
  description String?
  priority    String

  discoveredBuildId String?
  targetBuildId     String?
  currentStatus     String   @default("open")

  feedbackScore     Int?
  relatedQuotes     String?
  aiRecommendation  String?
  aiSupplement      String?

  userAdvocateEval   String?
  designAdvocateEval String?
  evaluationConsensus String?

  order       Int      @default(0)
  checked     Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  histories   TaskHistory[]
}

model TaskHistory {
  id        String @id @default(cuid())
  taskId    String
  task      Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  buildId   String
  build     Build  @relation(fields: [buildId], references: [id], onDelete: Cascade)

  status    String
  note      String?
  evidence  String?

  createdAt DateTime @default(now())

  @@unique([taskId, buildId])
}

model APICallLog {
  id            String   @id @default(cuid())
  agent         String
  model         String
  inputTokens   Int
  outputTokens  Int
  cachedTokens  Int      @default(0)
  costUSD       Float
  buildId       String?
  projectId     String?
  analysisLevel String?
  createdAt     DateTime @default(now())
}
```

> Note: SQLite는 Json 타입을 지원하지 않으므로 String으로 선언하고, 코드에서 JSON.parse/JSON.stringify로 변환한다.

**Step 3: 마이그레이션 실행**

```bash
npx prisma migrate dev --name init
```
Expected: `prisma/migrations/` 디렉토리에 마이그레이션 파일 생성

**Step 4: Prisma 클라이언트 생성 확인**

```bash
npx prisma generate
```

**Step 5: 커밋**

```bash
git add prisma/
git commit -m "feat: add Prisma schema with all data models"
```

---

### Task 0-4: 공유 타입 정의

**Files:**
- Create: `game-feedback-analyzer/src/types/index.ts`

**Step 1: 타입 파일 작성**

`src/types/index.ts`:
```typescript
// ===== 분석 레벨 =====
export type AnalysisLevel = 'quick' | 'standard' | 'deep';

// ===== 감정 6단계 =====
export type Sentiment =
  | 'positive'
  | 'enthusiastic'
  | 'constructive_negative'
  | 'frustrated'
  | 'neutral'
  | 'mixed';

// ===== 태스크 상태 =====
export type TaskStatus = 'open' | 'improving' | 'resolved' | 'hold' | 'worsened';

// ===== 우선순위 =====
export type Priority = 'P0' | 'P1' | 'P2' | 'discuss';

// ===== 테스트 유형 =====
export type TestType = 'field_test' | 'internal' | 'fgt' | 'cbt' | 'soft_launch' | 'other';

// ===== AI 분류 결과 (Agent 1 출력) =====
export interface ClassifiedResponse {
  id: string;
  text: string;
  language: string;
  categories: string[];
  sentiment: Sentiment;
  confidence: number;
  isKeyQuote: boolean;
  summary: string;
}

export interface ClassificationResult {
  classifiedResponses: ClassifiedResponse[];
  categorySummary: Record<string, {
    count: number;
    sentimentBreakdown: Record<Sentiment, number>;
    topQuotes: string[];
  }>;
  newCategorySuggestions: string[];
}

// ===== Agent 2 출력 (유저 옹호자) =====
export interface UserAdvocateResult {
  criticalPainPoints: Array<{
    issue: string;
    frequency: number;
    intensity: 'high' | 'medium' | 'low';
    quotes: string[];
  }>;
  hiddenFrustrations: Array<{
    issue: string;
    evidence: string[];
  }>;
  strongAttractions: Array<{
    element: string;
    quotes: string[];
  }>;
  churnRiskMoments: Array<{
    moment: string;
    severity: 'critical' | 'warning';
    quotes: string[];
  }>;
}

// ===== Agent 3 출력 (기획 옹호자) =====
export interface DesignAdvocateResult {
  directionGaps: Array<{
    area: string;
    intended: string;
    actual: string;
    gapType: 'design_failure' | 'delivery_failure';
    evidence: string[];
  }>;
  directionConflicts: Array<{
    userDemand: string;
    designDirection: string;
    recommendation: string;
  }>;
  wellDelivered: Array<{
    element: string;
    evidence: string[];
  }>;
  identityAssessment: 'strong' | 'partial' | 'weak';
}

// ===== Agent 4 출력 (종합 판관) =====
export interface SynthesisResult {
  consensus: Array<{
    issue: string;
    strength: 'strong' | 'moderate';
    action: string;
  }>;
  conflicts: Array<{
    issue: string;
    userPerspective: string;
    designPerspective: string;
    aiRecommendation: string;
    evidenceStrength: { user: number; design: number };
    userOverride?: { decision: string; reason: string };
  }>;
  blindSpots: Array<{
    source: 'user_advocate' | 'design_advocate';
    insight: string;
  }>;
  finalPriorityRanking: Array<{
    issue: string;
    rank: number;
    score: number;
    category: string;
  }>;
}

// ===== 빌드 비교 결과 =====
export interface CrossBuildResult {
  keywordTrends: Array<{
    keyword: string;
    buildValues: Array<{
      buildId: string;
      ratio: number;
      count: number;
      confidenceInterval: [number, number];
    }>;
  }>;
  beforeAfterTable: Array<{
    area: string;
    builds: Array<{
      buildId: string;
      description: string;
      trend: 'improved' | 'stagnant' | 'worsened' | 'unconfirmed';
      confidence: number;
    }>;
  }>;
  perceptionEvolution: Array<{
    buildId: string;
    keywords: string[];
  }>;
}

// ===== 태스크 평가 결과 =====
export interface TaskEvaluation {
  feedbackScore: number;
  reasoning: string;
  relatedQuotes: string[];
  priorityRecommendation: Priority;
  supplementSuggestion: string;
  historyInsight?: string;
  userAdvocateEval?: string;
  designAdvocateEval?: string;
  evaluationConsensus?: 'consensus' | 'conflict' | 'complement';
}

// ===== 비용 추적 =====
export interface CostEntry {
  agent: string;
  model: 'sonnet' | 'opus';
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUSD: number;
}

// ===== 대시보드 차트 데이터 =====
export interface RadarChartData {
  categories: string[];
  values: number[];
  buildName: string;
}

export interface TrendLineData {
  keyword: string;
  points: Array<{
    buildName: string;
    ratio: number;
    confidenceLow: number;
    confidenceHigh: number;
  }>;
}

export interface KeywordBarData {
  keyword: string;
  count: number;
  sentiment: Record<Sentiment, number>;
}

// ===== 컬럼 감지 =====
export type ColumnType = 'score' | 'choice' | 'open_text' | 'meta';

export interface DetectedColumn {
  name: string;
  type: ColumnType;
  sampleValues: string[];
}

// ===== 바이어스 프로파일 =====
export interface BiasProfile {
  expectedPositiveRatio: number;
  expectedNegativeRatio: number;
  biasType: string;
  description: string;
}

// ===== 신뢰도 지표 =====
export interface ReliabilityIndicator {
  sampleReliability: 'low' | 'medium' | 'high';
  sampleCount: number;
  aiConfidenceAvg: number;
  biasIndex: number;
}
```

**Step 2: 커밋**

```bash
git add src/types/
git commit -m "feat: add shared type definitions for all layers"
```

---

### Task 0-5: Prisma 클라이언트 + Claude API 클라이언트

**Files:**
- Create: `game-feedback-analyzer/src/lib/db.ts`
- Create: `game-feedback-analyzer/src/lib/claude.ts`

**Step 1: Prisma 클라이언트 싱글톤**

`src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Step 2: Claude API 클라이언트**

`src/lib/claude.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ModelTier = 'sonnet' | 'opus';

const MODEL_IDS: Record<ModelTier, string> = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-6',
};

const PRICING: Record<ModelTier, { input: number; output: number; cacheRead: number }> = {
  sonnet: { input: 3 / 1_000_000, output: 15 / 1_000_000, cacheRead: 0.3 / 1_000_000 },
  opus: { input: 15 / 1_000_000, output: 75 / 1_000_000, cacheRead: 1.5 / 1_000_000 },
};

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUSD: number;
  model: ModelTier;
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model: ModelTier = 'sonnet',
  options?: { maxTokens?: number }
): Promise<ClaudeResponse> {
  const response = await anthropic.messages.create({
    model: MODEL_IDS[model],
    max_tokens: options?.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const cacheReadTokens = (response.usage as Record<string, number>).cache_read_input_tokens ?? 0;
  const pricing = PRICING[model];

  const costUSD =
    inputTokens * pricing.input +
    outputTokens * pricing.output +
    cacheReadTokens * pricing.cacheRead;

  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return {
    content,
    inputTokens,
    outputTokens,
    cacheReadTokens: cacheReadTokens,
    costUSD,
    model,
  };
}

export function parseJsonResponse<T>(response: ClaudeResponse): T {
  const text = response.content;
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Claude response');
  }
  const jsonStr = jsonMatch[1] ?? jsonMatch[0];
  return JSON.parse(jsonStr) as T;
}
```

**Step 3: .env.local 설정**

`game-feedback-analyzer/.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="Game Feedback Analyzer"
```

**Step 4: .gitignore에 .env.local 확인**

```bash
grep ".env.local" .gitignore
```
Expected: `.env*.local` 이미 포함됨

**Step 5: 커밋**

```bash
git add src/lib/db.ts src/lib/claude.ts
git commit -m "feat: add Prisma singleton and Claude API client with cost tracking"
```

---

### Task 0-6: 전역 레이아웃 + shadcn/ui 초기화

**Files:**
- Modify: `game-feedback-analyzer/src/app/layout.tsx`
- Create: `game-feedback-analyzer/src/lib/utils.ts`

**Step 1: shadcn/ui 초기화**

```bash
npx shadcn@latest init -d
```

**Step 2: 기본 shadcn 컴포넌트 설치**

```bash
npx shadcn@latest add button card dialog dropdown-menu input label select tabs badge tooltip popover textarea
```

**Step 3: utils.ts 확인/수정**

`src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 4: layout.tsx 수정**

`src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Feedback Analyzer",
  description: "게임 피드백 분석 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg font-body text-text-mid antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 5: 확인**

```bash
npm run dev
```
Expected: 아이보리 배경, DM Sans 폰트 적용

**Step 6: 커밋**

```bash
git add .
git commit -m "feat: initialize shadcn/ui and global layout"
```

---

### Task 0-7: 비용 추적 모듈

**Files:**
- Create: `game-feedback-analyzer/src/lib/analysis/cost-tracker.ts`

**Step 1: cost-tracker.ts 작성**

`src/lib/analysis/cost-tracker.ts`:
```typescript
import { prisma } from '@/lib/db';
import type { ClaudeResponse } from '@/lib/claude';

export async function logAPICost(
  response: ClaudeResponse,
  context: {
    agent: string;
    buildId?: string;
    projectId?: string;
    analysisLevel?: string;
  }
): Promise<void> {
  await prisma.aPICallLog.create({
    data: {
      agent: context.agent,
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      cachedTokens: response.cacheReadTokens,
      costUSD: response.costUSD,
      buildId: context.buildId,
      projectId: context.projectId,
      analysisLevel: context.analysisLevel,
    },
  });
}

export async function getProjectCostSummary(projectId: string) {
  const logs = await prisma.aPICallLog.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  const totalCost = logs.reduce((sum, log) => sum + log.costUSD, 0);
  const byAgent = logs.reduce((acc, log) => {
    acc[log.agent] = (acc[log.agent] || 0) + log.costUSD;
    return acc;
  }, {} as Record<string, number>);

  const thisMonth = logs.filter((log) => {
    const now = new Date();
    return log.createdAt.getMonth() === now.getMonth() &&
           log.createdAt.getFullYear() === now.getFullYear();
  });

  return {
    totalCost,
    monthlyCost: thisMonth.reduce((sum, log) => sum + log.costUSD, 0),
    byAgent,
    callCount: logs.length,
  };
}
```

**Step 2: 커밋**

```bash
git add src/lib/analysis/cost-tracker.ts
git commit -m "feat: add API cost tracking module"
```

---

## Phase 0 완료 체크리스트

Phase 0 완료 후, 아래가 확인되어야 Phase 1 병렬 진입 가능:

- [ ] `npm run dev` 정상 동작
- [ ] `npx prisma studio` 로 DB 스키마 확인
- [ ] `src/types/index.ts` 에 모든 공유 타입 정의
- [ ] `src/lib/claude.ts` 에 Claude API 클라이언트 + 비용 계산
- [ ] `src/lib/db.ts` 에 Prisma 싱글톤
- [ ] shadcn/ui 컴포넌트 설치 완료
- [ ] 디자인 토큰 (Tailwind) 적용 확인

---

## Phase 1: 4개 서브에이전트 병렬 작업

> 각 에이전트는 독립 worktree에서 작업하며, Phase 0의 공유 코드를 기반으로 한다.
> 각 에이전트의 작업이 끝나면 메인으로 머지한다.

---

## Agent A: 데이터 레이어

### Task A-1: Project CRUD API

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[projectId]/route.ts`

**Step 1: 프로젝트 목록 + 생성 API**

`src/app/api/projects/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      builds: { orderBy: { order: 'desc' }, take: 1 },
      tasks: { where: { currentStatus: 'open' } },
      _count: { select: { builds: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, directionDoc, categories } = body;

  if (!name || !directionDoc) {
    return NextResponse.json(
      { error: 'name and directionDoc are required' },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      directionDoc,
      categories: categories?.length
        ? { create: categories.map((c: { name: string; group?: string }, i: number) => ({
            name: c.name,
            group: c.group,
            order: i,
          })) }
        : undefined,
    },
    include: { categories: true },
  });

  return NextResponse.json(project, { status: 201 });
}
```

**Step 2: 프로젝트 상세 + 수정 + 삭제 API**

`src/app/api/projects/[projectId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      builds: { orderBy: { order: 'asc' } },
      categories: { orderBy: { order: 'asc' } },
      tasks: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json();

  const project = await prisma.project.update({
    where: { id: projectId },
    data: body,
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ success: true });
}
```

**Step 3: 커밋**

```bash
git add src/app/api/projects/
git commit -m "feat: add Project CRUD API routes"
```

---

### Task A-2: Build CRUD API

**Files:**
- Create: `src/app/api/builds/route.ts`
- Create: `src/app/api/builds/[buildId]/route.ts`

**Step 1: 빌드 목록(프로젝트별) + 생성 API**

`src/app/api/builds/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const builds = await prisma.build.findMany({
    where: { projectId },
    include: {
      _count: { select: { responses: true, feedbackFiles: true } },
      analysis: { select: { id: true, analysisLevel: true, analyzedAt: true } },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(builds);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, name, version, date, notes, changes, testType, testTarget, testCount, playTime, caution, biasProfile } = body;

  if (!projectId || !name || !date) {
    return NextResponse.json({ error: 'projectId, name, date required' }, { status: 400 });
  }

  const maxOrder = await prisma.build.findFirst({
    where: { projectId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const build = await prisma.build.create({
    data: {
      projectId,
      name,
      version,
      date: new Date(date),
      notes,
      changes: changes ? JSON.stringify(changes) : null,
      testType,
      testTarget,
      testCount,
      playTime,
      caution,
      biasProfile: biasProfile ? JSON.stringify(biasProfile) : null,
      order: (maxOrder?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(build, { status: 201 });
}
```

**Step 2: 빌드 상세 + 수정 + 삭제**

`src/app/api/builds/[buildId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      feedbackFiles: true,
      responses: true,
      analysis: true,
      taskHistories: { include: { task: true } },
    },
  });

  if (!build) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(build);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  const body = await req.json();

  if (body.changes) body.changes = JSON.stringify(body.changes);
  if (body.biasProfile) body.biasProfile = JSON.stringify(body.biasProfile);
  if (body.date) body.date = new Date(body.date);

  const build = await prisma.build.update({
    where: { id: buildId },
    data: body,
  });

  return NextResponse.json(build);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  await prisma.build.delete({ where: { id: buildId } });
  return NextResponse.json({ success: true });
}
```

**Step 3: 커밋**

```bash
git add src/app/api/builds/
git commit -m "feat: add Build CRUD API routes"
```

---

### Task A-3: 파일 업로드 + 파싱 API

**Files:**
- Create: `src/app/api/upload/route.ts`
- Create: `src/lib/parsers/xlsx-parser.ts`
- Create: `src/lib/parsers/pdf-parser.ts`
- Create: `src/lib/parsers/column-detector.ts`

**Step 1: 컬럼 타입 감지기**

`src/lib/parsers/column-detector.ts`:
```typescript
import type { ColumnType, DetectedColumn } from '@/types';

export function detectColumnType(values: (string | number | null)[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonNull.length === 0) return 'meta';

  const numericCount = nonNull.filter((v) => !isNaN(Number(v))).length;
  if (numericCount / nonNull.length > 0.8) return 'score';

  const avgLength = nonNull.reduce((sum, v) => sum + String(v).length, 0) / nonNull.length;
  if (avgLength > 50) return 'open_text';

  const hasCommas = nonNull.filter((v) => String(v).includes(',')).length;
  if (hasCommas / nonNull.length > 0.3) return 'choice';

  const uniqueRatio = new Set(nonNull.map(String)).size / nonNull.length;
  if (uniqueRatio < 0.3) return 'choice';

  if (avgLength > 20) return 'open_text';

  return 'meta';
}

export function detectColumns(
  headers: string[],
  rows: (string | number | null)[][]
): DetectedColumn[] {
  return headers.map((name, colIndex) => {
    const values = rows.map((row) => row[colIndex]);
    const type = detectColumnType(values);
    const sampleValues = values
      .filter((v) => v !== null && v !== undefined && v !== '')
      .slice(0, 5)
      .map(String);

    return { name, type, sampleValues };
  });
}
```

**Step 2: XLSX 파서**

`src/lib/parsers/xlsx-parser.ts`:
```typescript
import ExcelJS from 'exceljs';
import { detectColumns } from './column-detector';
import type { DetectedColumn } from '@/types';

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: (string | number | null)[][];
  columns: DetectedColumn[];
  rowCount: number;
}

export async function parseXlsx(buffer: Buffer): Promise<ParsedSheet[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheets: ParsedSheet[] = [];

  workbook.eachSheet((worksheet) => {
    const rows: (string | number | null)[][] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as (string | number | null)[];
      const cleaned = values.slice(1); // ExcelJS 1-indexed

      if (rowNumber === 1) {
        headers = cleaned.map((v) => String(v ?? ''));
      } else {
        rows.push(cleaned);
      }
    });

    if (headers.length > 0) {
      sheets.push({
        sheetName: worksheet.name,
        headers,
        rows,
        columns: detectColumns(headers, rows),
        rowCount: rows.length,
      });
    }
  });

  return sheets;
}
```

**Step 3: PDF 파서**

`src/lib/parsers/pdf-parser.ts`:
```typescript
import pdfParse from 'pdf-parse';

export interface ParsedPdf {
  text: string;
  pageCount: number;
  sections: string[];
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  const result = await pdfParse(buffer);

  const sections = result.text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return {
    text: result.text,
    pageCount: result.numpages,
    sections,
  };
}
```

**Step 4: 업로드 API route**

`src/app/api/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseXlsx } from '@/lib/parsers/xlsx-parser';
import { parsePdf } from '@/lib/parsers/pdf-parser';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const buildId = formData.get('buildId') as string | null;

  if (!file || !buildId) {
    return NextResponse.json({ error: 'file and buildId required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = file.name.split('.').pop()?.toLowerCase() ?? '';

  let parsedColumns = null;
  let rowCount = null;
  let parseResult = null;

  if (fileType === 'xlsx' || fileType === 'xls') {
    const sheets = await parseXlsx(buffer);
    parseResult = sheets;
    parsedColumns = JSON.stringify(sheets[0]?.columns ?? []);
    rowCount = sheets[0]?.rowCount ?? 0;
  } else if (fileType === 'pdf') {
    const pdf = await parsePdf(buffer);
    parseResult = pdf;
    rowCount = pdf.sections.length;
  } else if (fileType === 'csv') {
    // CSV는 xlsx와 유사하게 처리 (향후 확장)
    return NextResponse.json({ error: 'CSV support coming soon' }, { status: 400 });
  } else {
    return NextResponse.json({ error: `Unsupported file type: ${fileType}` }, { status: 400 });
  }

  const feedbackFile = await prisma.feedbackFile.create({
    data: {
      buildId,
      filename: file.name,
      fileType,
      fileSize: buffer.length,
      rawData: buffer,
      parsedColumns,
      rowCount,
    },
  });

  return NextResponse.json({
    file: feedbackFile,
    parseResult,
  }, { status: 201 });
}
```

**Step 5: 커밋**

```bash
git add src/lib/parsers/ src/app/api/upload/
git commit -m "feat: add file upload API with xlsx/pdf parsers and column detection"
```

---

### Task A-4: Task CRUD + History API

**Files:**
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[taskId]/route.ts`
- Create: `src/app/api/tasks/history/route.ts`
- Create: `src/lib/tasks/task-history.ts`
- Create: `src/lib/tasks/auto-carryover.ts`

**Step 1: 태스크 CRUD**

`src/app/api/tasks/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { histories: { include: { build: true }, orderBy: { createdAt: 'asc' } } },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, section, title, description, priority, discoveredBuildId, targetBuildId } = body;

  if (!projectId || !section || !title || !priority) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      projectId, section, title, description, priority,
      discoveredBuildId, targetBuildId,
    },
  });

  // 발견 빌드가 있으면 이력 자동 생성
  if (discoveredBuildId) {
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        buildId: discoveredBuildId,
        status: 'open',
        note: '최초 발견',
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
```

`src/app/api/tasks/[taskId]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      histories: {
        include: { build: { select: { id: true, name: true, version: true, date: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id: taskId },
    data: body,
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  await prisma.task.delete({ where: { id: taskId } });
  return NextResponse.json({ success: true });
}
```

**Step 2: 태스크 이력 API**

`src/app/api/tasks/history/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskId, buildId, status, note, evidence } = body;

  if (!taskId || !buildId || !status) {
    return NextResponse.json({ error: 'taskId, buildId, status required' }, { status: 400 });
  }

  const history = await prisma.taskHistory.upsert({
    where: { taskId_buildId: { taskId, buildId } },
    update: { status, note, evidence: evidence ? JSON.stringify(evidence) : null },
    create: {
      taskId, buildId, status, note,
      evidence: evidence ? JSON.stringify(evidence) : null,
    },
  });

  // 태스크의 현재 상태도 업데이트
  await prisma.task.update({
    where: { id: taskId },
    data: { currentStatus: status },
  });

  return NextResponse.json(history);
}
```

**Step 3: 자동 이월 로직**

`src/lib/tasks/auto-carryover.ts`:
```typescript
import { prisma } from '@/lib/db';

export async function carryOverTasks(projectId: string, newBuildId: string) {
  // 이전 빌드의 미해결/개선중 태스크를 새 빌드로 이월
  const openTasks = await prisma.task.findMany({
    where: {
      projectId,
      currentStatus: { in: ['open', 'improving'] },
    },
  });

  const histories = openTasks.map((task) => ({
    taskId: task.id,
    buildId: newBuildId,
    status: task.currentStatus,
    note: '이전 빌드에서 자동 이월',
  }));

  if (histories.length > 0) {
    await prisma.taskHistory.createMany({ data: histories });
  }

  return { carriedOver: histories.length, tasks: openTasks };
}
```

`src/lib/tasks/task-history.ts`:
```typescript
import { prisma } from '@/lib/db';

export async function getTaskAlerts(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      histories: { orderBy: { createdAt: 'asc' }, include: { build: true } },
    },
  });

  const alerts: Array<{ taskId: string; title: string; type: string; message: string }> = [];

  for (const task of tasks) {
    // 3빌드 연속 미해결 경고
    const consecutiveOpen = task.histories.filter((h) => h.status === 'open').length;
    if (consecutiveOpen >= 3) {
      alerts.push({
        taskId: task.id,
        title: task.title,
        type: 'long_unresolved',
        message: `${consecutiveOpen}빌드 연속 미해결`,
      });
    }

    // 해결→미해결 역행 경고
    for (let i = 1; i < task.histories.length; i++) {
      const prev = task.histories[i - 1];
      const curr = task.histories[i];
      if (prev.status === 'resolved' && (curr.status === 'open' || curr.status === 'worsened')) {
        alerts.push({
          taskId: task.id,
          title: task.title,
          type: 'regression',
          message: `이슈 재발 (${prev.build.name} → ${curr.build.name})`,
        });
      }
    }
  }

  return alerts;
}
```

**Step 4: 커밋**

```bash
git add src/app/api/tasks/ src/lib/tasks/
git commit -m "feat: add Task CRUD, history tracking, and auto-carryover"
```

---

### Task A-5: 피드백 검색 API

**Files:**
- Create: `src/app/api/search/route.ts`
- Create: `src/lib/search/feedback-search.ts`

**Step 1: 검색 로직**

`src/lib/search/feedback-search.ts`:
```typescript
import { prisma } from '@/lib/db';

interface SearchParams {
  projectId: string;
  query: string;
  buildIds?: string[];
  categories?: string[];
  sentiments?: string[];
  languages?: string[];
  limit?: number;
  offset?: number;
}

export async function searchFeedback(params: SearchParams) {
  const { projectId, query, buildIds, categories, sentiments, languages, limit = 50, offset = 0 } = params;

  // SQLite에서는 LIKE로 검색 (PostgreSQL에서는 tsvector로 교체)
  const where: Record<string, unknown> = {
    build: { projectId },
    text: { contains: query },
  };

  if (buildIds?.length) {
    where.buildId = { in: buildIds };
  }

  if (sentiments?.length) {
    where.sentiment = { in: sentiments };
  }

  if (languages?.length) {
    where.language = { in: languages };
  }

  const results = await prisma.feedbackResponse.findMany({
    where: where as Parameters<typeof prisma.feedbackResponse.findMany>[0]['where'],
    include: {
      build: { select: { id: true, name: true, date: true } },
    },
    take: limit,
    skip: offset,
    orderBy: { build: { date: 'desc' } },
  });

  // 카테고리 필터 (JSON string 내 검색)
  let filtered = results;
  if (categories?.length) {
    filtered = results.filter((r) => {
      if (!r.categories) return false;
      const cats = JSON.parse(r.categories) as string[];
      return categories.some((c) => cats.includes(c));
    });
  }

  const total = await prisma.feedbackResponse.count({
    where: where as Parameters<typeof prisma.feedbackResponse.count>[0]['where'],
  });

  return {
    results: filtered,
    total,
    limit,
    offset,
  };
}
```

**Step 2: 검색 API route**

`src/app/api/search/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchFeedback } from '@/lib/search/feedback-search';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get('projectId');
  const query = searchParams.get('q');

  if (!projectId || !query) {
    return NextResponse.json({ error: 'projectId and q required' }, { status: 400 });
  }

  const result = await searchFeedback({
    projectId,
    query,
    buildIds: searchParams.get('buildIds')?.split(','),
    categories: searchParams.get('categories')?.split(','),
    sentiments: searchParams.get('sentiments')?.split(','),
    languages: searchParams.get('languages')?.split(','),
    limit: Number(searchParams.get('limit') ?? 50),
    offset: Number(searchParams.get('offset') ?? 0),
  });

  return NextResponse.json(result);
}
```

**Step 3: 커밋**

```bash
git add src/lib/search/ src/app/api/search/
git commit -m "feat: add feedback search API with text matching"
```

---

## Agent B: UI 컴포넌트

> 모든 UI 컴포넌트는 스펙의 디자인 시스템(섹션 10)을 따른다.
> shadcn/ui 기반, Tailwind 디자인 토큰 사용.

### Task B-1: 레이아웃 컴포넌트

**Files:**
- Create: `src/components/layout/ProjectSidebar.tsx`
- Create: `src/components/layout/ProjectSelector.tsx`
- Create: `src/components/layout/TabNavigation.tsx`
- Modify: `src/app/layout.tsx`

> 상세 구현은 스펙 섹션 6의 디렉토리 구조와 섹션 10의 컴포넌트 스타일 규칙을 따른다.
> 각 컴포넌트는 카드 스타일(bg-card, border border-border, rounded-[10px], p-6)을 적용한다.

**Step 1: ProjectSidebar**

```typescript
// src/components/layout/ProjectSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, FolderOpen, ListTodo, Search, Settings, Upload } from 'lucide-react';

interface SidebarProps {
  projectId: string;
  projectName: string;
}

const navItems = [
  { href: '', label: '빌드 타임라인', icon: FolderOpen },
  { href: '/analysis', label: '대시보드', icon: BarChart3 },
  { href: '/search', label: '피드백 검색', icon: Search },
  { href: '/tasks', label: '태스크 관리', icon: ListTodo },
  { href: '/settings', label: '프로젝트 설정', icon: Settings },
];

export function ProjectSidebar({ projectId, projectName }: SidebarProps) {
  const pathname = usePathname();
  const basePath = `/project/${projectId}`;

  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen p-4">
      <div className="mb-6">
        <h2 className="font-display text-lg text-text truncate">{projectName}</h2>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const fullPath = `${basePath}${item.href}`;
          const isActive = pathname === fullPath || (item.href !== '' && pathname.startsWith(fullPath));
          return (
            <Link
              key={item.href}
              href={fullPath}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-accent1/10 text-accent1 font-medium'
                  : 'text-text-mid hover:bg-bg hover:text-text'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 2: TabNavigation**

```typescript
// src/components/layout/TabNavigation.tsx
'use client';

import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-4 py-2 text-sm font-body transition-colors border-b-2 -mb-px',
            activeTab === tab.id
              ? 'border-accent1 text-accent1 font-medium'
              : 'border-transparent text-text-lt hover:text-text-mid'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 3: 커밋**

```bash
git add src/components/layout/
git commit -m "feat: add layout components (Sidebar, TabNavigation)"
```

---

### Task B-2: 프로젝트/빌드 폼 + 카드

**Files:**
- Create: `src/components/project/ProjectCard.tsx`
- Create: `src/components/project/ProjectForm.tsx`
- Create: `src/components/build/BuildCard.tsx`
- Create: `src/components/build/BuildForm.tsx`
- Create: `src/components/build/BuildTimeline.tsx`

> 각 컴포넌트의 상세 구현은 스펙 Phase 0, Phase 1의 UI 명세를 따른다.
> ProjectCard: 이름, 최근 빌드, 빌드 수, 미해결 태스크 수 표시
> BuildCard: 이름, 날짜, 테스트 유형, 피드백 수, 분석 상태 표시
> BuildTimeline: 빌드 카드를 타임라인 형태로 배치

**커밋:**

```bash
git add src/components/project/ src/components/build/
git commit -m "feat: add Project and Build UI components"
```

---

### Task B-3: 업로드 UI

**Files:**
- Create: `src/components/upload/FileDropzone.tsx`
- Create: `src/components/upload/ColumnMapper.tsx`
- Create: `src/components/upload/ParsePreview.tsx`

> FileDropzone: 드래그앤드롭 파일 업로드, 복수 파일 동시 지원
> ColumnMapper: 감지된 컬럼 타입(점수/선택지/주관식/메타) 수정 UI
> ParsePreview: 파싱 결과 미리보기 (행 수, 언어 분포, 컬럼 목록)

**커밋:**

```bash
git add src/components/upload/
git commit -m "feat: add file upload UI components"
```

---

### Task B-4: 태스크 UI

**Files:**
- Create: `src/components/tasks/TaskForm.tsx`
- Create: `src/components/tasks/TaskBoard.tsx`
- Create: `src/components/tasks/TaskTimeline.tsx`
- Create: `src/components/tasks/TaskStatusBadge.tsx`
- Create: `src/components/tasks/TaskEvaluation.tsx`

> TaskBoard: 3가지 뷰 모드 (빌드별/상태별/이력 매트릭스)
> TaskTimeline: 가로 타임라인 (빌드별 상태 변화, 색상: 빨강→노랑→초록→보라)
> TaskStatusBadge: 상태별 배지 색상 매핑

**커밋:**

```bash
git add src/components/tasks/
git commit -m "feat: add Task management UI components"
```

---

### Task B-5: 검색 UI

**Files:**
- Create: `src/components/search/SearchBar.tsx`
- Create: `src/components/search/SearchFilters.tsx`
- Create: `src/components/search/SearchResultCard.tsx`

**커밋:**

```bash
git add src/components/search/
git commit -m "feat: add feedback search UI components"
```

---

### Task B-6: 페이지 조립

**Files:**
- Create: `src/app/page.tsx` (프로젝트 목록)
- Create: `src/app/project/new/page.tsx`
- Create: `src/app/project/[projectId]/layout.tsx`
- Create: `src/app/project/[projectId]/page.tsx`
- Create: `src/app/project/[projectId]/settings/page.tsx`
- Create: `src/app/project/[projectId]/builds/new/page.tsx`
- Create: `src/app/project/[projectId]/builds/[buildId]/page.tsx`
- Create: `src/app/project/[projectId]/search/page.tsx`
- Create: `src/app/project/[projectId]/tasks/page.tsx`
- Create: `src/app/project/[projectId]/tasks/new/page.tsx`
- Create: `src/app/project/[projectId]/tasks/[taskId]/page.tsx`

> 각 페이지는 해당 컴포넌트를 조립하고 API를 호출한다.

**커밋:**

```bash
git add src/app/
git commit -m "feat: add all page routes with component assembly"
```

---

## Agent C: AI 파이프라인

### Task C-1: 프롬프트 템플릿

**Files:**
- Create: `prompts/agent1-classifier.md`
- Create: `prompts/agent2-user-advocate.md`
- Create: `prompts/agent3-design-advocate.md`
- Create: `prompts/agent4-synthesizer.md`
- Create: `prompts/agent4-synthesizer-quick.md`
- Create: `prompts/evaluate-task-multi.md`
- Create: `prompts/cross-build-multi.md`

> 스펙 섹션 7, 8의 프롬프트를 마크다운 파일로 저장.
> 템플릿 변수는 `{variable_name}` 형태로 표기.

**커밋:**

```bash
git add prompts/
git commit -m "feat: add all AI agent prompt templates"
```

---

### Task C-2: Agent 1 — 분류자

**Files:**
- Create: `src/lib/analysis/agents/classifier.ts`

**Step 1: 구현**

```typescript
// src/lib/analysis/agents/classifier.ts
import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import type { ClassificationResult } from '@/types';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPT_TEMPLATE = readFileSync(
  join(process.cwd(), 'prompts/agent1-classifier.md'),
  'utf-8'
);

interface ClassifyInput {
  responses: Array<{ id: string; text: string }>;
  categories: string[];
  buildNotes?: string;
  buildId: string;
  projectId: string;
  analysisLevel: string;
}

export async function classifyFeedback(input: ClassifyInput): Promise<ClassificationResult> {
  const systemPrompt = PROMPT_TEMPLATE;

  const userMessage = JSON.stringify({
    responses: input.responses,
    categories: input.categories,
    build_notes: input.buildNotes ?? '',
  });

  const response = await callClaude(systemPrompt, userMessage, 'sonnet', { maxTokens: 8192 });

  await logAPICost(response, {
    agent: 'classifier',
    buildId: input.buildId,
    projectId: input.projectId,
    analysisLevel: input.analysisLevel,
  });

  return parseJsonResponse<ClassificationResult>(response);
}
```

**Step 2: 커밋**

```bash
git add src/lib/analysis/agents/classifier.ts
git commit -m "feat: add Agent 1 (Classifier) with Sonnet"
```

---

### Task C-3: Agent 2 — 유저 옹호자

**Files:**
- Create: `src/lib/analysis/agents/user-advocate.ts`

> 동일 패턴: Sonnet 호출, UserAdvocateResult 반환
> 입력: Agent 1의 분류 결과 요약본 (원문 재전송 X)

**커밋:**

```bash
git add src/lib/analysis/agents/user-advocate.ts
git commit -m "feat: add Agent 2 (User Advocate) with Sonnet"
```

---

### Task C-4: Agent 3 — 기획 옹호자

**Files:**
- Create: `src/lib/analysis/agents/design-advocate.ts`

> Sonnet 호출, DesignAdvocateResult 반환
> 입력: Agent 1 분류 결과 + 방향 문서 (이 에이전트에만 방향 문서 전달)

**커밋:**

```bash
git add src/lib/analysis/agents/design-advocate.ts
git commit -m "feat: add Agent 3 (Design Advocate) with Sonnet"
```

---

### Task C-5: Agent 4 — 종합 판관

**Files:**
- Create: `src/lib/analysis/agents/synthesizer.ts`

> **Opus** 호출 — 핵심 판단 에이전트
> 입력: Agent 2 + Agent 3 결과 (원문 불필요)
> Quick 모드: Agent 1 결과만으로 단일 종합

**Step 1: 구현**

```typescript
// src/lib/analysis/agents/synthesizer.ts
import { callClaude, parseJsonResponse } from '@/lib/claude';
import { logAPICost } from '@/lib/analysis/cost-tracker';
import type { SynthesisResult, UserAdvocateResult, DesignAdvocateResult, ClassificationResult } from '@/types';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPT_DEEP = readFileSync(join(process.cwd(), 'prompts/agent4-synthesizer.md'), 'utf-8');
const PROMPT_QUICK = readFileSync(join(process.cwd(), 'prompts/agent4-synthesizer-quick.md'), 'utf-8');

interface SynthesizeDeepInput {
  userResult: UserAdvocateResult;
  designResult?: DesignAdvocateResult;
  buildId: string;
  projectId: string;
}

interface SynthesizeQuickInput {
  classification: ClassificationResult;
  buildId: string;
  projectId: string;
}

export async function synthesizeDeep(input: SynthesizeDeepInput): Promise<SynthesisResult> {
  const userMessage = JSON.stringify({
    user_advocate: input.userResult,
    design_advocate: input.designResult ?? null,
  });

  // Opus for critical synthesis
  const response = await callClaude(PROMPT_DEEP, userMessage, 'opus', { maxTokens: 8192 });

  await logAPICost(response, {
    agent: 'synthesizer',
    buildId: input.buildId,
    projectId: input.projectId,
    analysisLevel: input.designResult ? 'deep' : 'standard',
  });

  return parseJsonResponse<SynthesisResult>(response);
}

export async function synthesizeQuick(input: SynthesizeQuickInput): Promise<SynthesisResult> {
  const userMessage = JSON.stringify({
    classification: input.classification,
  });

  // Quick mode still uses Opus for quality
  const response = await callClaude(PROMPT_QUICK, userMessage, 'opus', { maxTokens: 4096 });

  await logAPICost(response, {
    agent: 'synthesizer',
    buildId: input.buildId,
    projectId: input.projectId,
    analysisLevel: 'quick',
  });

  return parseJsonResponse<SynthesisResult>(response);
}
```

**Step 2: 커밋**

```bash
git add src/lib/analysis/agents/synthesizer.ts
git commit -m "feat: add Agent 4 (Synthesizer) with Opus for critical judgments"
```

---

### Task C-6: 오케스트레이터

**Files:**
- Create: `src/lib/analysis/qualitative.ts`

**Step 1: 파이프라인 오케스트레이터**

```typescript
// src/lib/analysis/qualitative.ts
import { classifyFeedback } from './agents/classifier';
import { analyzeAsUserAdvocate } from './agents/user-advocate';
import { analyzeAsDesignAdvocate } from './agents/design-advocate';
import { synthesizeDeep, synthesizeQuick } from './agents/synthesizer';
import type { AnalysisLevel, ClassificationResult, UserAdvocateResult, DesignAdvocateResult, SynthesisResult } from '@/types';

interface AnalysisInput {
  responses: Array<{ id: string; text: string }>;
  categories: string[];
  buildNotes?: string;
  directionDoc?: string;
  buildId: string;
  projectId: string;
  level: AnalysisLevel;
}

interface AnalysisOutput {
  classification: ClassificationResult;
  userAdvocate?: UserAdvocateResult;
  designAdvocate?: DesignAdvocateResult;
  synthesis: SynthesisResult;
  level: AnalysisLevel;
}

export async function runQualitativeAnalysis(input: AnalysisInput): Promise<AnalysisOutput> {
  // Step 1: Agent 1 — 분류 (Sonnet)
  const classification = await classifyFeedback({
    responses: input.responses,
    categories: input.categories,
    buildNotes: input.buildNotes,
    buildId: input.buildId,
    projectId: input.projectId,
    analysisLevel: input.level,
  });

  // Quick mode: Agent 1 → Agent 4 (Quick)
  if (input.level === 'quick') {
    const synthesis = await synthesizeQuick({
      classification,
      buildId: input.buildId,
      projectId: input.projectId,
    });

    return { classification, synthesis, level: 'quick' };
  }

  // Standard mode: Agent 1 → Agent 2 → Agent 4
  // Deep mode: Agent 1 → Agent 2 + Agent 3 (parallel) → Agent 4
  const classificationSummary = {
    categorySummary: classification.categorySummary,
    newCategorySuggestions: classification.newCategorySuggestions,
    totalResponses: classification.classifiedResponses.length,
    sentimentOverview: aggregateSentiments(classification),
  };

  let userResult: UserAdvocateResult;
  let designResult: DesignAdvocateResult | undefined;

  if (input.level === 'deep' && input.directionDoc) {
    // Deep: Agent 2 + Agent 3 병렬
    [userResult, designResult] = await Promise.all([
      analyzeAsUserAdvocate({
        classificationSummary,
        buildId: input.buildId,
        projectId: input.projectId,
      }),
      analyzeAsDesignAdvocate({
        classificationSummary,
        directionDoc: input.directionDoc,
        buildId: input.buildId,
        projectId: input.projectId,
      }),
    ]);
  } else {
    // Standard: Agent 2 only
    userResult = await analyzeAsUserAdvocate({
      classificationSummary,
      buildId: input.buildId,
      projectId: input.projectId,
    });
  }

  // Agent 4: 종합 (Opus)
  const synthesis = await synthesizeDeep({
    userResult,
    designResult,
    buildId: input.buildId,
    projectId: input.projectId,
  });

  return {
    classification,
    userAdvocate: userResult,
    designAdvocate: designResult,
    synthesis,
    level: input.level,
  };
}

function aggregateSentiments(classification: ClassificationResult) {
  const sentiments: Record<string, number> = {};
  for (const r of classification.classifiedResponses) {
    sentiments[r.sentiment] = (sentiments[r.sentiment] || 0) + 1;
  }
  return sentiments;
}
```

**Step 2: 커밋**

```bash
git add src/lib/analysis/qualitative.ts
git commit -m "feat: add analysis orchestrator with Quick/Standard/Deep pipelines"
```

---

### Task C-7: 정량 분석 + 빌드 비교 + 태스크 평가

**Files:**
- Create: `src/lib/analysis/quantitative.ts`
- Create: `src/lib/analysis/cross-build.ts`
- Create: `src/lib/analysis/task-evaluator.ts`
- Create: `src/lib/analysis/bias-profiler.ts`
- Create: `src/lib/analysis/reliability-scorer.ts`
- Create: `src/lib/analysis/minority-detector.ts`

> quantitative.ts: 만족도 분포, 선택지 빈도, 세그먼트 교차 분석 (API 불필요)
> cross-build.ts: **Opus** 호출 — 빌드 간 비교 분석
> task-evaluator.ts: Sonnet 호출 — 태스크 피드백 적합도 평가
> bias-profiler.ts: 테스트 유형별 바이어스 프로파일 생성 (로컬 계산)
> reliability-scorer.ts: 신뢰도 지표 계산 (로컬 계산)
> minority-detector.ts: 소수 의견 세그먼트 교차 분석 (로컬 계산)

**커밋:**

```bash
git add src/lib/analysis/
git commit -m "feat: add quantitative analysis, cross-build comparison (Opus), and support modules"
```

---

### Task C-8: 분석 API Routes

**Files:**
- Create: `src/app/api/analyze/quantitative/route.ts`
- Create: `src/app/api/analyze/qualitative/route.ts`
- Create: `src/app/api/analyze/cross-build/route.ts`
- Create: `src/app/api/tasks/evaluate/route.ts`

> 각 route는 해당 분석 모듈을 호출하고 결과를 DB에 저장한다.

**커밋:**

```bash
git add src/app/api/analyze/ src/app/api/tasks/evaluate/
git commit -m "feat: add analysis API routes"
```

---

## Agent D: 통합 기능 (대시보드 + 내보내기)

### Task D-1: 대시보드 차트 컴포넌트

**Files:**
- Create: `src/components/dashboard/RadarChart.tsx`
- Create: `src/components/dashboard/KeywordBarChart.tsx`
- Create: `src/components/dashboard/TrendLineChart.tsx`
- Create: `src/components/dashboard/ComparisonTable.tsx`
- Create: `src/components/dashboard/CrossAnalysisChart.tsx`
- Create: `src/components/dashboard/SegmentTable.tsx`
- Create: `src/components/dashboard/IssueTracker.tsx`
- Create: `src/components/dashboard/QuoteCard.tsx`
- Create: `src/components/dashboard/DirectionMatchTable.tsx`
- Create: `src/components/dashboard/ChecklistSection.tsx`

> 모든 차트는 Recharts 사용.
> 다크 서페이스 차트: bg-dark-bg, 밝은 톤 액센트 사용
> 라이트 영역 차트: bg-card
> 스펙 섹션 10의 디자인 규칙 준수

**커밋:**

```bash
git add src/components/dashboard/
git commit -m "feat: add dashboard chart components with design system"
```

---

### Task D-2: 대시보드 페이지 (6탭)

**Files:**
- Create: `src/app/project/[projectId]/analysis/page.tsx`

> 탭 구성:
> 1. 종합 개요 (기본 랜딩) — 핵심 지표 카드, 레이더 차트, Before→After 비교표
> 2. 빌드별 상세 — 키워드 추이 라인 차트, 빌드 카드
> 3. 심층 분석 — 키워드 바 차트, 교차 분석, 세그먼트 분석, 교차 검증 섹션
> 4. 이슈 트래커 — 상태표, 태스크 이력 타임라인
> 5. 방향성 매칭 — 기획 의도 vs 유저 체감
> 6. 액션 아이템 — 우선순위별 태스크 + 체크리스트

**커밋:**

```bash
git add src/app/project/*/analysis/
git commit -m "feat: add 6-tab dashboard page"
```

---

### Task D-3: 내보내기

**Files:**
- Create: `src/lib/export/html-generator.ts`
- Create: `src/lib/export/pdf-generator.ts`
- Create: `src/lib/export/slack-formatter.ts`
- Create: `src/app/api/export/html/route.ts`
- Create: `src/app/api/export/pdf/route.ts`
- Create: `src/app/api/export/slack/route.ts`
- Create: `src/app/project/[projectId]/export/page.tsx`

> HTML: Chart.js 포함 단일 파일, 인터랙티브 유지
> PDF: Puppeteer로 HTML → PDF 변환
> 슬랙: 핵심 지표 + 주요 발견 텍스트

**커밋:**

```bash
git add src/lib/export/ src/app/api/export/ src/app/project/*/export/
git commit -m "feat: add export functionality (HTML/PDF/Slack)"
```

---

### Task D-4: 분석 스트리밍 UX

**Files:**
- Create: `src/components/dashboard/AnalysisProgress.tsx`

> AI 분석 진행 시 "분류 중..." → "유저 관점 분석 중..." → "기획 관점 분석 중..." → "종합 중..."
> 각 Agent의 중간 결과를 실시간 표시

**커밋:**

```bash
git add src/components/dashboard/AnalysisProgress.tsx
git commit -m "feat: add analysis streaming progress UX"
```

---

## Phase 2: 통합 + 최종 테스트

### Task I-1: 4개 에이전트 머지

**Step 1:** Agent A~D의 worktree를 순서대로 메인에 머지
**Step 2:** 충돌 해결 (주로 types/index.ts 추가 타입)
**Step 3:** 빌드 확인

```bash
npm run build
```

---

### Task I-2: 통합 테스트

**Step 1:** 프로젝트 생성 → 빌드 등록 → 파일 업로드 → 분석 실행 전체 플로우 테스트
**Step 2:** 대시보드 렌더링 확인
**Step 3:** 태스크 생성 → AI 평가 → 이력 추적 확인
**Step 4:** 내보내기 (HTML/PDF) 생성 확인

---

### Task I-3: 시드 데이터 + 데모

**Files:**
- Create: `prisma/seed.ts`

> 기본 카테고리 프리셋 (뱀서류/로그라이크/캐주얼) 시딩
> 샘플 프로젝트 + 빌드 + 피드백 데이터로 데모 가능 상태

**커밋:**

```bash
git add prisma/seed.ts
git commit -m "feat: add seed data with default category presets"
```

---

### Task I-4: 배포 설정

**Files:**
- Modify: `next.config.js`
- Create: `vercel.json` (필요 시)

**Step 1:** Vercel 배포 설정
**Step 2:** 환경 변수 설정 (ANTHROPIC_API_KEY, DATABASE_URL)
**Step 3:** 배포 확인

---

## 실행 순서 요약

```
Phase 0 (순차, 메인)
  0-1 → 0-2 → 0-3 → 0-4 → 0-5 → 0-6 → 0-7
  ✓ 확인: npm run dev, prisma studio

Phase 1 (병렬, 4 worktree)
  Agent A: A-1 → A-2 → A-3 → A-4 → A-5
  Agent B: B-1 → B-2 → B-3 → B-4 → B-5 → B-6
  Agent C: C-1 → C-2 → C-3 → C-4 → C-5 → C-6 → C-7 → C-8
  Agent D: D-1 → D-2 → D-3 → D-4

Phase 2 (순차, 메인)
  I-1 → I-2 → I-3 → I-4
```
