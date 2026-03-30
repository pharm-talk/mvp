-- 약사 검증 완료된 상담은 모든 로그인 유저가 조회 가능
create policy "Anyone can view verified consultations"
  on public.consultations for select
  using (verified_at is not null);

-- 공개 상담 목록 조회 성능용 부분 인덱스
create index consultations_verified_at_idx
  on public.consultations(verified_at)
  where verified_at is not null;
