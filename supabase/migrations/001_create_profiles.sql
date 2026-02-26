-- 유저 건강 프로필 테이블
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  gender text check (gender in ('male', 'female')),
  birth_date date,
  height_cm numeric,
  weight_kg numeric,
  conditions text[] default '{}',
  allergies text[] default '{}',
  pregnancy_status text check (pregnancy_status in ('none', 'pregnant', 'nursing')) default 'none',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 활성화
alter table public.profiles enable row level security;

-- 본인만 조회/수정 가능
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 회원가입 시 자동 프로필 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
