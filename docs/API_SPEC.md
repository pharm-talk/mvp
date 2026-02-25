# API SPEC (고레벨)

> 실제 구현은 Next.js App Router의 Route Handlers 또는 Server Actions로 진행.  
> 여기서는 엔드포인트/입출력 형태를 고레벨로 정의한다.

---

## 1. 인증 / Auth

실제 인증은 Supabase Auth 사용.  
Next.js 측에서는 세션 조회/보조용 API만 최소한으로 둔다.

- `GET /api/auth/session`
  - 목적: 현재 로그인 유저 세션 정보 조회
  - 응답: `{ user: { id, email, role }, session: {...} }`

---

## 2. 유저 온보딩

- `POST /api/users/profile`
  - 목적: 기본 건강정보 및 프로필 저장/업데이트
  - 요청
    - `gender`, `age`, `height_cm`, `weight_kg`
    - `health_conditions` (질환, 알레르기, 임신 여부 등)
  - 응답
    - 성공 여부 및 저장된 프로필

---

## 3. 내 약 서랍

- `GET /api/medications`
  - 현재 유저의 약/영양제 리스트 조회

- `POST /api/medications`
  - 약/영양제 추가
  - 요청: `name`, `type`, `image_url`, `recognized_ingredients`, `description`, `start_date`, `refill_date`

- `PATCH /api/medications/:id`
  - 특정 약/영양제 수정

- `DELETE /api/medications/:id`
  - 특정 약/영양제 삭제 (soft delete 또는 active=false)

---

## 4. 상담 (복약상담 + Q&A)

- `POST /api/consultations`
  - 상담 요청 생성
  - 요청
    - `type`: medication_review | qna
    - `user_input`: 건강정보, 복용 리스트, 증상/질문 등
    - `price`
  - 응답
    - 생성된 상담 객체 (`id`, `status` = pending 등)

- `GET /api/consultations`
  - 현재 유저의 상담 목록 조회

- `GET /api/consultations/:id`
  - 상담 상세 (유저/약사 모두 사용, 권한 체크)

---

## 5. 약사용 API

- `GET /api/pharmacist/consultations`
  - 약사에게 배정된 상담 목록 조회
  - 필터: status=pending|assigned 등

- `POST /api/pharmacist/consultations/:id/answer`
  - 상담 답변 제출
  - 요청: `pharmacist_answer` (구조화된 JSON), 추천 제품 정보 등

---

## 6. 결제

- `POST /api/payments/checkout`
  - 결제 세션 생성 (토스/포트원 연동)
  - 요청: `consultation_id`, `amount`, `provider`

- `POST /api/payments/webhook`
  - 결제 서비스 웹훅 수신
  - 상태 업데이트 (paid / failed / refunded)

