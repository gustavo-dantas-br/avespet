begin;
alter table public.campaign_packages
 add column if not exists media_tax_bps integer not null default 1215 check(media_tax_bps between 0 and 10000),
 add column if not exists operating_cents integer not null default 0 check(operating_cents >= 0),
 add column if not exists company_tax_bps integer not null default 0 check(company_tax_bps between 0 and 10000);
alter table public.campaign_packages
 add column if not exists reach_min integer generated always as (case when code='destaque' or media_cents=0 then null else floor((media_cents::numeric - round(media_cents::numeric*media_tax_bps/10000))/600)::integer*100 end) stored,
 add column if not exists reach_max integer generated always as (case when code='destaque' or media_cents=0 then null else floor((media_cents::numeric - round(media_cents::numeric*media_tax_bps/10000))/180)::integer*100 end) stored;
grant select(reach_min,reach_max) on public.campaign_packages to anon,authenticated;
commit;