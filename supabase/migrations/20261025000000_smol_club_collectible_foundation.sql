-- SMOL CLUB collectible foundation: durable ownership for coupon and achievement cards.
create table if not exists public.customer_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null check (card_type in ('coupon','achievement','special')),
  source_id text not null,
  serial_number text not null,
  rarity text not null default 'common' check (rarity in ('common','uncommon','rare','epic','legendary')),
  acquired_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, card_type, source_id),
  unique (user_id, serial_number)
);
create index if not exists customer_cards_user_acquired_idx on public.customer_cards(user_id, acquired_at desc);
alter table public.customer_cards enable row level security;
drop policy if exists "Customers can view their own collectible cards" on public.customer_cards;
create policy "Customers can view their own collectible cards" on public.customer_cards for select to authenticated using (auth.uid() = user_id);
-- No client insert/update/delete policy: ownership changes are server-controlled.

create table if not exists public.achievement_definitions (
  id text primary key,
  title text not null,
  description text not null,
  category text not null default 'orders',
  requirement_type text not null default 'delivered_orders',
  requirement_value integer not null check (requirement_value > 0),
  reward_discount_type text not null default 'percent',
  reward_discount_value numeric not null default 0 check (reward_discount_value >= 0),
  rarity text not null default 'common' check (rarity in ('common','uncommon','rare','epic','legendary')),
  is_secret boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.achievement_definitions enable row level security;
drop policy if exists "Customers can view active public achievements" on public.achievement_definitions;
create policy "Customers can view active public achievements" on public.achievement_definitions for select to authenticated using (is_active = true and is_secret = false);

create table if not exists public.customer_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievement_definitions(id) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);
alter table public.customer_achievements enable row level security;
drop policy if exists "Customers can view their own achievement progress" on public.customer_achievements;
create policy "Customers can view their own achievement progress" on public.customer_achievements for select to authenticated using (auth.uid() = user_id);

-- Existing coupons become durable collectible cards automatically, including admin-granted coupons.
create or replace function public.capture_coupon_collectible()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  card_serial text;
begin
  card_serial := 'CP-' || upper(substr(replace(new.id::text, '-', ''), 1, 10));
  insert into public.customer_cards(user_id, card_type, source_id, serial_number, rarity, metadata)
  values (
    new.user_id, 'coupon', new.id::text, card_serial,
    case when coalesce(new.discount_value, 0) >= 25 then 'rare' else 'common' end,
    jsonb_build_object('code', new.code, 'description', new.description, 'discount_type', new.discount_type, 'discount_value', new.discount_value)
  ) on conflict (user_id, card_type, source_id) do nothing;
  return new;
end;
$$;
drop trigger if exists customer_coupon_collectible_insert on public.customer_coupons;
create trigger customer_coupon_collectible_insert after insert on public.customer_coupons
for each row execute function public.capture_coupon_collectible();

-- Backfill cards for every existing customer coupon.
insert into public.customer_cards(user_id, card_type, source_id, serial_number, rarity, metadata)
select c.user_id, 'coupon', c.id::text,
  'CP-' || upper(substr(replace(c.id::text, '-', ''), 1, 10)),
  case when coalesce(c.discount_value, 0) >= 25 then 'rare' else 'common' end,
  jsonb_build_object('code', c.code, 'description', c.description, 'discount_type', c.discount_type, 'discount_value', c.discount_value)
from public.customer_coupons c
on conflict (user_id, card_type, source_id) do nothing;

-- Seed editable achievements. Admin APIs can manage these definitions later.
insert into public.achievement_definitions
(id,title,description,category,requirement_type,requirement_value,reward_discount_type,reward_discount_value,rarity,is_secret,sort_order)
values
('first-drop','FIRST DROP','Get your first order delivered.','orders','delivered_orders',1,'percent',10,'common',false,10),
('collector-three','COLLECTOR','Have three orders delivered.','orders','delivered_orders',3,'percent',15,'uncommon',false,20),
('inner-circle-five','INNER CIRCLE','Have five orders delivered.','orders','delivered_orders',5,'percent',20,'rare',false,30),
('repeat-legend','REPEAT LEGEND','Have ten orders delivered.','orders','delivered_orders',10,'percent',25,'epic',false,40),
('secret-stuuf','THE SECRET STUUF','A hidden club milestone.','secret','delivered_orders',15,'percent',30,'legendary',true,50)
on conflict (id) do nothing;

-- Track completion whenever an order changes state, without trusting client-side progress.
create or replace function public.refresh_customer_order_achievements()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  delivered integer;
  achievement record;
  card_serial text;
begin
  if new.user_id is null then return new; end if;
  select count(*) into delivered from public.orders where user_id = new.user_id and status = 'delivered';
  for achievement in select * from public.achievement_definitions where is_active = true and requirement_type = 'delivered_orders' loop
    insert into public.customer_achievements(user_id, achievement_id, progress, completed_at, updated_at)
    values(new.user_id, achievement.id, least(delivered, achievement.requirement_value),
      case when delivered >= achievement.requirement_value then now() else null end, now())
    on conflict(user_id, achievement_id) do update set
      progress = excluded.progress,
      completed_at = coalesce(public.customer_achievements.completed_at, excluded.completed_at),
      updated_at = now();
    if delivered >= achievement.requirement_value then
      card_serial := 'AC-' || upper(substr(md5(new.user_id::text || ':' || achievement.id),1,10));
      insert into public.customer_cards(user_id,card_type,source_id,serial_number,rarity,metadata)
      values(new.user_id,'achievement',achievement.id,card_serial,achievement.rarity,
        jsonb_build_object('title',achievement.title,'description',achievement.description,'achievement_id',achievement.id))
      on conflict(user_id,card_type,source_id) do nothing;
    end if;
  end loop;
  return new;
end;
$$;
drop trigger if exists orders_refresh_customer_achievements on public.orders;
create trigger orders_refresh_customer_achievements after insert or update of status on public.orders
for each row execute function public.refresh_customer_order_achievements();

-- Backfill current customers' delivered-order milestones and achievement cards.
do $
begin
  update public.orders set status = status where user_id is not null;
end $;
