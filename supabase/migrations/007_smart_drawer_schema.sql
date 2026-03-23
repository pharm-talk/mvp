-- ============================================
-- 스마트 약 서랍 대규모 업데이트 스키마
-- ============================================

-- 1. medications 테이블 확장
alter table public.medications
  add column if not exists category text
    check (category in ('chronic', 'prescription', 'supplement'))
    default 'prescription';

alter table public.medications
  add column if not exists start_date date,
  add column if not exists end_date date;

alter table public.medications
  add column if not exists archived boolean default false;

update public.medications
  set category = 'supplement'
  where type = 'supplement' and category = 'prescription';

create index if not exists medications_category_idx
  on public.medications(category);

create index if not exists medications_archived_idx
  on public.medications(archived)
  where archived = false;

-- ============================================
-- 2. 테이블 생성 (RLS 정책 전에 전부 생성)
-- ============================================

-- 가족 그룹
create table public.family_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now()
);

create index family_groups_owner_idx on public.family_groups(owner_id);
create index family_groups_invite_code_idx on public.family_groups(invite_code);

-- 가족 구성원
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

create index family_members_group_idx on public.family_members(group_id);
create index family_members_user_idx on public.family_members(user_id);

-- 가족 약 서랍 접근 권한
create table public.family_medication_access (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  member_id uuid not null references auth.users(id),
  target_user_id uuid not null references auth.users(id),
  can_view boolean default true,
  can_edit boolean default false,
  created_at timestamptz default now(),
  unique(group_id, member_id, target_user_id)
);

create index fma_group_idx on public.family_medication_access(group_id);
create index fma_member_idx on public.family_medication_access(member_id);

-- AI 챗봇 대화 기록
create table public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text default 'food_drug'
    check (type in ('food_drug', 'general', 'family')),
  target_user_id uuid references auth.users(id),
  title text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index ai_chats_user_idx on public.ai_chats(user_id);
create index ai_chats_type_idx on public.ai_chats(type);

-- ============================================
-- 3. RLS 정책 (테이블 전부 생성된 후)
-- ============================================

-- family_groups RLS
alter table public.family_groups enable row level security;

create policy "Owner can manage family groups"
  on public.family_groups for all
  using (auth.uid() = owner_id);

create policy "Members can view their groups"
  on public.family_groups for select
  using (
    id in (
      select group_id from public.family_members
      where user_id = auth.uid()
    )
  );

-- family_members RLS
alter table public.family_members enable row level security;

create policy "Owner can manage members"
  on public.family_members for all
  using (
    group_id in (
      select id from public.family_groups
      where owner_id = auth.uid()
    )
  );

create policy "Members can view group members"
  on public.family_members for select
  using (
    group_id in (
      select group_id from public.family_members fm
      where fm.user_id = auth.uid()
    )
  );

create policy "Members can leave group"
  on public.family_members for delete
  using (auth.uid() = user_id);

-- family_medication_access RLS
alter table public.family_medication_access enable row level security;

create policy "Owner can manage access"
  on public.family_medication_access for all
  using (
    group_id in (
      select id from public.family_groups
      where owner_id = auth.uid()
    )
  );

create policy "Members can view own access"
  on public.family_medication_access for select
  using (auth.uid() = member_id);

-- 가족 멤버가 타 유저의 약 서랍을 조회할 수 있는 정책
create policy "Family members can view shared medications"
  on public.medications for select
  using (
    user_id in (
      select target_user_id from public.family_medication_access
      where member_id = auth.uid() and can_view = true
    )
  );

-- ai_chats RLS
alter table public.ai_chats enable row level security;

create policy "Users can manage own chats"
  on public.ai_chats for all
  using (auth.uid() = user_id);
