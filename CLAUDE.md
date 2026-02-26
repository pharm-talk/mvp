# CLAUDE.md

## 프로젝트 개요

모바일 웹 애플리케이션 (풀스택). 모바일 퍼스트 디자인이 최우선.

## 기술 스택

- **Frontend**: Next.js + TypeScript + React
- **Styling**: Tailwind CSS (모바일 퍼스트)
- **상태 관리**: (프로젝트에 맞게 수정 — zustand / jotai / React Query 등)
- **Backend**: (프로젝트에 맞게 수정 — Next.js API Routes / Express / FastAPI 등)
- **배포**: (프로젝트에 맞게 수정)

## ⚠️ 절대 하지 마

### 디자인

- Inter, Roboto, Arial 같은 뻔한 폰트 쓰지 마. Pretendard, Noto Sans KR, SUIT 등 한글 지원되면서 개성 있는 폰트 써.
- 보라색 그라데이션 + 흰 배경 조합 금지. AI가 만든 티 나는 디자인 하지 마.
- 모바일에서 좌우 스크롤 절대 발생하지 않게 해. `overflow-x: hidden` 남발하지 말고 근본적으로 해결해.
- 터치 타겟 44px 이상 반드시 확보. 버튼, 링크 등 터치 영역이 너무 작으면 안 됨.
- padding, margin을 px로 하드코딩하지 마. Tailwind 유틸리티 또는 rem 사용.

### 코드

- `any` 타입 사용 금지. 반드시 적절한 타입 정의.
- `console.log` 디버깅 코드 커밋하지 마.
- 한 컴포넌트가 200줄 넘으면 분리해.
- CSS-in-JS와 Tailwind 혼용하지 마. Tailwind로 통일.
- `!important` 사용 금지.
- 인라인 스타일 사용 금지 (동적 값 제외).

## ✅ 반드시 지켜

### 모바일 웹 필수 규칙

- **모바일 퍼스트**: 항상 모바일 레이아웃 먼저 작성하고 `sm:`, `md:`, `lg:` 순서로 반응형 확장.
- **뷰포트 단위 활용**: `h-dvh` (dynamic viewport height) 사용해서 모바일 브라우저 주소창 고려.
- **Safe area**: `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` 항상 고려 (노치, 홈바 영역).
- **터치 인터랙션**: hover 대신 active/focus 상태 우선. `@media (hover: hover)` 로 hover 기능 분기.
- **스크롤 성능**: `-webkit-overflow-scrolling: touch`, `will-change` 적절히 사용.
- **폰트 크기**: 본문 최소 16px (모바일 입력 시 자동 줌 방지).
- **이미지**: 모바일 환경 고려해서 `next/image` 사용. WebP/AVIF 포맷, `sizes` 속성 필수.
- **로딩 상태**: Skeleton UI 사용. 빈 화면 표시 금지.

### 디자인 퀄리티

- 컬러 팔레트를 CSS 변수 (`--color-primary` 등)로 정의하고 일관되게 사용.
- 다크 모드 지원 필수: `dark:` 프리픽스 활용.
- 간격(spacing)은 4px 단위로 통일 (Tailwind 기본 스케일).
- 그림자, 라운딩 등 디자인 토큰을 프로젝트 전체에서 일관되게 유지.
- 빈 상태(empty state), 에러 상태, 로딩 상태를 반드시 디자인에 포함.
- 트랜지션은 `transition-all duration-200 ease-out` 기본. 300ms 초과 금지.
- 모달/바텀시트는 모바일에서 바텀시트 패턴으로 처리 (화면 하단에서 올라오는 형태).

### 한국어 UI 규칙

- 한국어 줄바꿈: `word-break: keep-all` 적용.
- 날짜 형식: `YYYY.MM.DD` 또는 `M월 D일` (한국 기준).
- 숫자: 천 단위 콤마 표시.
- 에러 메시지, placeholder, 버튼 텍스트 모두 자연스러운 한국어로.

### 코드 품질

- 컴포넌트 구조: `components/`, `hooks/`, `utils/`, `types/`, `constants/` 디렉토리 분리.
- 커스텀 훅으로 로직 분리. 컴포넌트는 UI에만 집중.
- API 호출은 별도 서비스 레이어로 분리.
- 에러 바운더리 필수 적용.
- 접근성(a11y): `aria-label`, `role`, 시맨틱 HTML 태그 사용.

## 디렉토리 구조 (참고)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 라우트 그룹
│   ├── (main)/            # 메인 라우트 그룹
│   ├── api/               # API Routes
│   ├── layout.tsx         # 루트 레이아웃
│   └── globals.css        # 글로벌 스타일, CSS 변수
├── components/
│   ├── ui/                # 공통 UI 컴포넌트 (Button, Input, Modal 등)
│   ├── layout/            # 레이아웃 컴포넌트 (Header, BottomNav, Container)
│   └── features/          # 기능별 컴포넌트
├── hooks/                 # 커스텀 훅
├── lib/                   # 유틸리티, API 클라이언트
├── types/                 # TypeScript 타입 정의
└── constants/             # 상수 (색상, 브레이크포인트 등)
```

## 브레이크포인트

```
모바일: 기본 (0~639px)
태블릿: sm (640px~)
데스크톱: md (768px~), lg (1024px~)
```

## 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
style: UI/디자인 변경 (코드 로직 변경 없음)
refactor: 리팩토링
chore: 설정, 의존성 변경
```

## 작업 순서 가이드

새로운 페이지/기능 만들 때:

1. 모바일 레이아웃부터 구현 (데스크톱은 나중에)
2. 핵심 기능 동작 확인
3. 로딩/에러/빈 상태 UI 추가
4. 반응형 확장 (태블릿 → 데스크톱)
5. 다크 모드 확인
6. 접근성 점검
