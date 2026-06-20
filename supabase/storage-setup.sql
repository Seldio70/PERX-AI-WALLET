-- Public bucket for offer hero images and provider logos.
-- Run once in the Supabase SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'offer-images',
  'offer-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "offer images public read" on storage.objects;
create policy "offer images public read"
on storage.objects for select
to public
using (bucket_id = 'offer-images');

drop policy if exists "offer images anon insert" on storage.objects;
create policy "offer images anon insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'offer-images');

drop policy if exists "offer images anon update" on storage.objects;
create policy "offer images anon update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'offer-images');
