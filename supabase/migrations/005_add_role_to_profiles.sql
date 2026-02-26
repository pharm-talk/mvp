-- 유저 역할 추가 (일반 유저 / 약사)
alter table public.profiles
  add column role text check (role in ('user', 'pharmacist')) default 'user';

-- 약사 면허 정보
alter table public.profiles
  add column license_number text;

-- 약사가 상담 목록 조회 가능하도록 RLS 추가
create policy "Pharmacists can view pending consultations"
  on public.consultations for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'pharmacist'
    )
  );

-- 약사가 상담에 답변(업데이트) 가능
create policy "Pharmacists can update consultations"
  on public.consultations for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'pharmacist'
    )
  );
