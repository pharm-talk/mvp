-- 내 약 서랍 테이블
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text check (type in ('medicine', 'supplement')) default 'medicine',
  dosage text,
  frequency text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 인덱스
create index medications_user_id_idx on public.medications(user_id);

-- RLS 활성화
alter table public.medications enable row level security;

-- 본인만 조회/수정/삭제 가능
create policy "Users can view own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Users can insert own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medications"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "Users can delete own medications"
  on public.medications for delete
  using (auth.uid() = user_id);
