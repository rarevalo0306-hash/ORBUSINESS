-- Blog de la página de cada negocio. Nuna escribe los artículos; el dueño los edita, oculta o borra.
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 1 and 140),
  excerpt text check (char_length(excerpt) <= 300),
  body text not null check (char_length(body) <= 12000),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);
create index blog_posts_business_created on public.blog_posts (business_id, created_at desc);
alter table public.blog_posts enable row level security;
create policy "public read published" on public.blog_posts for select using (published);
create policy "members read" on public.blog_posts for select using (private.is_member(business_id));
create policy "members insert" on public.blog_posts for insert with check (private.is_member(business_id));
create policy "members update" on public.blog_posts for update using (private.is_member(business_id)) with check (private.is_member(business_id));
create policy "members delete" on public.blog_posts for delete using (private.is_member(business_id));
