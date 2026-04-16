-- 복용 기록 테이블
create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  taken_at timestamptz not null default now(),
  status text not null check (status in ('taken', 'skipped')) default 'taken',
  created_at timestamptz default now()
);

create index medication_logs_user_idx on public.medication_logs(user_id);
create index medication_logs_med_idx on public.medication_logs(medication_id);
create index medication_logs_date_idx on public.medication_logs(taken_at);
-- 같은 약을 같은 날 중복 기록 방지
create unique index medication_logs_unique_daily
  on public.medication_logs(medication_id, (taken_at::date));

alter table public.medication_logs enable row level security;

create policy "Users can manage own logs"
  on public.medication_logs for all
  using (auth.uid() = user_id);
