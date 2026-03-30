-- 상담 태그 컬럼 추가
alter table public.consultations
  add column if not exists tags text[] default '{}';

-- 배열 검색용 GIN 인덱스
create index if not exists consultations_tags_idx
  on public.consultations using gin(tags);
