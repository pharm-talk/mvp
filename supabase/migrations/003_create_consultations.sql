-- 상담 요청 테이블
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image_urls text[] default '{}',
  status text check (status in ('pending', 'assigned', 'answered', 'closed')) default 'pending',
  -- 상담 요청 시점의 스냅샷
  health_snapshot jsonb,
  medications_snapshot jsonb,
  -- 약사 답변
  pharmacist_id uuid references auth.users(id),
  answer text,
  answer_products jsonb,
  answered_at timestamptz,
  -- 추가 질문 (1회)
  followup_question text,
  followup_answer text,
  followup_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index consultations_user_id_idx on public.consultations(user_id);
create index consultations_status_idx on public.consultations(status);

alter table public.consultations enable row level security;

-- 유저: 본인 상담만 조회/생성
create policy "Users can view own consultations"
  on public.consultations for select
  using (auth.uid() = user_id);

create policy "Users can create consultations"
  on public.consultations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own consultations"
  on public.consultations for update
  using (auth.uid() = user_id);
