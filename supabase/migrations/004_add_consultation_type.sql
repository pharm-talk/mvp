-- 상담 유형 추가 (복약 / 영양제)
alter table public.consultations
  add column type text check (type in ('medication', 'supplement')) default 'medication';
