# DB 스키마 (Supabase)

> 실제 Supabase 테이블 설계의 기준 문서. 컬럼 상세/인덱스는 이 문서를 기준으로 점진적으로 보완한다.

---

## 1. users

- `id` (uuid, PK)
- `email` (text, unique)
- `name` (text)
- `phone` (text, nullable)
- `gender` (text, enum 후보: male/female/other/none)
- `age` (int, nullable)
- `height_cm` (int, nullable)
- `weight_kg` (int, nullable)
- `health_conditions` (jsonb) — 보유 질환, 과거 병력, 유전력, 알레르기, 임신 여부 등
- `role` (text, enum: user / pharmacist / admin)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz)

---

## 2. pharmacists

- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id)
- `license_number` (text)
- `license_verified` (bool, default false)
- `specialties` (text[]) — 전문 분야 태그
- `bio` (text)
- `profile_image_url` (text)
- `rating` (numeric, 예: 2자리 소수)
- `total_answers` (int)
- `created_at` (timestamptz, default now())

---

## 3. consultations (복약상담 + Q&A 공통)

- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id)
- `pharmacist_id` (uuid, FK → pharmacists.id, nullable 배정 전)
- `type` (text, enum: medication_review / qna)
- `status` (text, enum: pending / assigned / answered / closed / cancelled)
- `user_input` (jsonb)  
  - 기본 정보, 건강 정보, 복용 리스트, 증상 등 구조화된 payload
- `pharmacist_answer` (jsonb, nullable)  
  - 겹치는 약, 위험 조합, 추천 제품, 요약 등 구조화
- `price` (int) — 결제 금액 (원)
- `paid_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())
- `answered_at` (timestamptz, nullable)

---

## 4. medications (내 약 서랍)

- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id)
- `name` (text) — 제품명
- `type` (text, enum: medicine / supplement)
- `image_url` (text, nullable)
- `recognized_ingredients` (jsonb, nullable) — OCR/DB 매칭 성분 리스트
- `description` (text, nullable)
- `start_date` (date, nullable)
- `refill_date` (date, nullable)
- `active` (bool, default true)
- `created_at` (timestamptz, default now())

---

## 5. products (추천 제품)

- `id` (uuid, PK)
- `consultation_id` (uuid, FK → consultations.id)
- `name` (text)
- `category` (text) — 예: multivitamin, omega-3 등
- `budget_pick_url` (text, nullable)
- `premium_pick_url` (text, nullable)
- `reason` (text) — 추천 이유
- `created_at` (timestamptz, default now())

---

## 6. payments

- `id` (uuid, PK)
- `consultation_id` (uuid, FK → consultations.id)
- `user_id` (uuid, FK → users.id)
- `provider` (text) — toss / portone 등
- `provider_payment_id` (text)
- `amount` (int)
- `status` (text, enum: pending / paid / failed / refunded)
- `created_at` (timestamptz, default now())

---

## 7. pharmacist_payouts (약사 정산)

- `id` (uuid, PK)
- `pharmacist_id` (uuid, FK → pharmacists.id)
- `consultation_id` (uuid, FK → consultations.id)
- `amount` (int) — 약사 정산 금액
- `status` (text, enum: pending / paid)
- `paid_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

