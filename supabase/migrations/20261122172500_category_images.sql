alter table public.categories add column if not exists image_path text;
alter table public.categories add column if not exists image_credit text check (image_credit is null or char_length(image_credit) <= 300);
