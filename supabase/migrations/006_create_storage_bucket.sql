-- 상담 이미지 저장용 스토리지 버킷
insert into storage.buckets (id, name, public)
values ('consultation-images', 'consultation-images', true);

-- 인증된 유저만 업로드 가능
create policy "Authenticated users can upload consultation images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'consultation-images');

-- 본인 폴더에만 업로드 가능
create policy "Users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'consultation-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 누구나 이미지 조회 가능 (public bucket)
create policy "Anyone can view consultation images"
  on storage.objects for select
  to public
  using (bucket_id = 'consultation-images');
