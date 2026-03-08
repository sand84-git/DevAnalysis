# 기획 방향 문서 파일 업로드 설계

## 요약
기존 Textarea 직접 입력 방식을 파일 업로드(.txt, .md)로 교체한다.

## 요구사항
- 지원 형식: .txt, .md
- 업로드 후 파일명만 표시 (내용 미리보기 없음)
- 기존 Textarea 완전 제거
- DB/API/분석 에이전트 변경 없음

## 접근법
클라이언트 사이드 FileReader로 텍스트 추출 후 기존 directionDoc 필드에 저장.

## 변경 범위
- `src/components/project/ProjectForm.tsx` — Textarea를 드래그&드롭 파일 업로드 영역으로 교체

## UI 동작
1. 드래그&드롭 또는 클릭으로 파일 선택
2. FileReader로 텍스트 읽어서 directionDoc state 저장
3. 업로드 영역 → 파일명 + 삭제 버튼으로 전환
4. 삭제 시 directionDoc 초기화, 업로드 영역 복원
5. 설정 페이지에서 기존 데이터 있으면 "기존 문서 있음" 상태 표시
