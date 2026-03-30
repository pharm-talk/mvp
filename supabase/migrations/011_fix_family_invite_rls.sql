-- 가족 초대 코드로 그룹 참여 시 RLS 문제 수정
-- 문제: 초대 코드로 그룹을 찾으려면 SELECT 권한이 필요한데,
--       아직 멤버가 아닌 유저는 조회가 차단됨

-- 1. 로그인한 유저는 초대 코드로 그룹을 조회할 수 있도록 허용
create policy "Anyone can lookup group by invite code"
  on public.family_groups for select
  using (auth.uid() is not null);

-- 2. 로그인한 유저는 스스로를 family_members에 추가할 수 있도록 허용 (참여)
create policy "Users can join groups"
  on public.family_members for insert
  with check (auth.uid() = user_id);

-- 3. 새 멤버가 family_medication_access 레코드를 생성할 수 있도록 허용
--    (참여 시 양방향 접근 권한 레코드 생성에 필요)
create policy "Members can create access records for their groups"
  on public.family_medication_access for insert
  with check (
    group_id in (
      select group_id from public.family_members
      where user_id = auth.uid()
    )
  );
