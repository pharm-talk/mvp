# 기술 스택

## 1. Frontend

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (컴포넌트 라이브러리, 추후 설치)
- Zustand (클라이언트 상태)
- TanStack Query (서버 상태)
- React Hook Form + Zod (폼, 밸리데이션)

## 2. Backend

- Next.js App Router 서버 컴포넌트 / 서버 액션
- (필요 시) Route Handler 기반 API 엔드포인트
- Supabase (PostgreSQL + Auth + Storage + Realtime)

## 3. 인프라

- Vercel (Next.js 호스팅)
- Supabase 호스팅

## 4. 외부 연동

- OCR: Google Cloud Vision API (약/영양제 사진 인식)
- 제휴 링크: 쿠팡 파트너스, 아이허브 어필리에이트 등
- 결제: 토스페이먼츠 또는 포트원(PortOne)

## 5. 선택 이유 요약

- **Next.js 14 App Router**: 서버/클라이언트 컴포넌트 분리, 라우팅 단순화, React 18 기능 활용.
- **Supabase**: Auth + DB + Storage 통합 제공, 초기 MVP 속도 극대화.
- **Zustand**: 얇은 전역 상태 관리 (UI 상태 등)에 적합, 보일러플레이트 적음.
- **TanStack Query**: 서버 상태 캐싱/동기화, Supabase/Route Handler 연동에 적합.
- **React Hook Form + Zod**: 모바일 폼에서 UX 좋고, 타입·밸리데이션 일관성 확보.
- **Tailwind + shadcn/ui**: 모바일 퍼스트 UI를 빠르게 구현, 디자인 일관성 유지.

