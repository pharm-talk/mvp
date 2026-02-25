# 코딩 컨벤션 & 네이밍 규칙

---

## 1. 전반

- TypeScript **strict 모드** 기준.
- 컴포넌트는 **함수형 + arrow function** 우선.
- UI 텍스트는 기본 **한국어**.
- 모바일 웹 서비스이므로 **모바일 퍼스트** 레이아웃/스타일 우선.

---

## 2. 폴더 구조 (상위 레벨)

현재 프로젝트 기준:

- `app/` — Next.js App Router 페이지/레이아웃
- `components/` — 공통 UI 컴포넌트 (shadcn/ui 포함 예정)
- `lib/` — 유틸리티, Supabase 클라이언트, 전역 스토어 등
- `docs/` — 제품/기술 문서 (이 파일들)

추가 예정:

- `features/` — 기능 단위 모듈 (예: consultation, qna, medicine-cabinet 등)
- `hooks/` — 재사용 커스텀 훅

---

## 3. 파일/컴포넌트 네이밍

- 파일명: `kebab-case.tsx` / `kebab-case.ts`
- React 컴포넌트: `PascalCase`
- 훅: `useSomething` (camelCase)
- Zustand 스토어: `useXxxStore`
- 페이지 라우트: Next.js App Router 규칙 (`app/(group)/feature/page.tsx`)

예시:
- `app/(user)/consultation/new/page.tsx`
- `components/layout/mobile-nav.tsx`
- `lib/store/ui-store.ts`

---

## 4. 상태 관리

- 서버 상태 (API/Supabase 데이터)
  - **TanStack Query** 사용
  - 쿼리 키: 배열 형태로 도메인 중심 명명  
    - 예: `["consultations", "list"]`, `["medications", userId]`
- 클라이언트 상태 (UI/폼 보조 상태)
  - **Zustand** 사용 (예: 모달 열림 여부, 선택된 탭 등)

---

## 5. 폼 & 밸리데이션

- React Hook Form + Zod 조합 사용
  - 스키마: `z.object({...})` → `type FormValues = z.infer<typeof schema>`
- API 요청/응답의 **입출력 스키마도 Zod로 정의**하여 타입 일관성 유지

---

## 6. 컴포넌트 스타일링

- Tailwind CSS 사용
  - 모바일 퍼스트: `w-full`, `px-4`, `max-w-md` 등을 기본으로 사용
- 공통 버튼/인풋/폼 레이아웃은 **shadcn/ui 컴포넌트** 기반으로 통일
- className 조합은 `clsx` + `tailwind-merge` (또는 `cn` 유틸) 사용

---

## 7. 에러 핸들링

- 서버/클라이언트에서 예외 처리 시:
  - 사용자에게는 **친절한 한국어 메시지** 노출
  - 콘솔/로깅에는 원본 에러 객체 기록
- API 호출은
  - try/catch + 에러 메시지 표준화
  - 가능하면 Zod로 응답 스키마 검증

