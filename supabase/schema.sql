-- La Perle Bleue — schéma PostgreSQL (Supabase) pour la phase 2.
-- BROUILLON : non exécuté. Il reprend les types de src/features/order/types.ts.
-- Montants en centimes (integer). Heures de retrait en heure de Paris.

create type order_status as enum (
  'PENDING', 'PENDING_PAYMENT', 'PAID', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'
);
create type fulfillment_type as enum ('PICKUP', 'DELIVERY');

-- ——— Catalogue (remplacera src/data/menu.ts + src/data/options.ts) ———

create table categories (
  id          text primary key,              -- 'assiettes', 'sandwichs'…
  name        text not null,
  note        text,
  position    int  not null default 0
);

create table products (
  id          text primary key,              -- identifiants actuels conservés ('assiette-mixte'…)
  category_id text not null references categories (id),
  name        text not null,
  description text,
  base_price  int  not null check (base_price >= 0),
  image_key   text,
  badge       text,
  available   boolean not null default true, -- ruptures gérées depuis /admin
  position    int  not null default 0
);

create table option_groups (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references products (id) on delete cascade,
  key         text not null,                 -- 'sauces', 'taille'… (identifiant envoyé par le site)
  name        text not null,
  required    boolean not null default false,
  min         int not null default 0,
  max         int not null default 1,
  summary     text not null default 'always',
  limits_from jsonb,                         -- ex. tacos : {"groupId":"taille","byOption":{…}}
  position    int not null default 0,
  unique (product_id, key)
);

create table options (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references option_groups (id) on delete cascade,
  key         text not null,                 -- 'algerienne', '2-viandes'…
  name        text not null,
  price_delta int  not null default 0,
  is_default  boolean not null default false,
  available   boolean not null default true,
  position    int not null default 0,
  unique (group_id, key)
);

-- ——— Commandes ———

create table orders (
  id                         uuid primary key default gen_random_uuid(),
  number                     text not null unique,          -- « A-042 », lisible au comptoir
  status                     order_status not null default 'PENDING',
  fulfillment                fulfillment_type not null default 'PICKUP',
  pickup_type                text not null check (pickup_type in ('ASAP', 'SCHEDULED')),
  pickup_time                time,                          -- null si ASAP
  customer_first_name        text not null,
  customer_phone             text not null,
  customer_email             text not null,
  note                       text,
  subtotal                   int not null,
  total                      int not null,                  -- calculé par le serveur, jamais par le navigateur
  currency                   text not null default 'EUR',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text unique,
  created_at                 timestamptz not null default now(),
  paid_at                    timestamptz                    -- posé uniquement par le webhook Stripe
);

create table order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders (id) on delete cascade,
  product_id   text not null references products (id),
  product_name text not null,                               -- figé au moment de la commande
  options      jsonb not null default '[]',                 -- OrderItemOption[] figées
  quantity     int not null check (quantity between 1 and 20),
  unit_price   int not null,
  total_price  int not null,
  note         text
);

create index orders_status_created_idx on orders (status, created_at desc);
create index order_items_order_idx on order_items (order_id);

-- ——— Réglages administrables (temps de préparation, etc.) ———

create table settings (
  key   text primary key,                    -- 'prep_time' -> {"min":15,"max":25}
  value jsonb not null
);

-- ——— Sécurité ———
-- Le site public lit le catalogue ; seules les routes serveur (clé service)
-- écrivent les commandes. Aucune écriture directe depuis le navigateur.
alter table categories    enable row level security;
alter table products      enable row level security;
alter table option_groups enable row level security;
alter table options       enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table settings      enable row level security;

create policy "catalogue public" on categories    for select using (true);
create policy "catalogue public" on products      for select using (true);
create policy "catalogue public" on option_groups for select using (true);
create policy "catalogue public" on options       for select using (true);
-- orders / order_items / settings : aucune policy publique (clé service uniquement).
