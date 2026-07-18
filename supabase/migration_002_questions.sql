-- ============================================================
-- Migration 002: Questions table
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- This moves questions from the static data/quiz_data.json file
-- into the database, so admins can add/edit/delete them from the
-- admin panel without redeploying the app.
-- ============================================================

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  set_label text not null check (set_label in ('A','B','C','D','E','F','G','H','I','J')),
  q_num int not null,
  section text not null check (section in ('A','B','C','D')),
  text text not null,
  opts jsonb not null,          -- ["option A text", "option B text", "option C text", "option D text"]
  ans text not null check (ans in ('A','B','C','D')),
  steps jsonb not null default '[]'::jsonb,   -- ["step 1", "step 2", ...]
  img_params jsonb,             -- nullable; diagram config, see lib/diagramTypes.js
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (set_label, q_num)
);

create index if not exists idx_questions_set on questions(set_label);

alter table questions enable row level security;
-- No policies added — same default-deny-via-anon-key posture as the
-- other tables. Only the service_role key (server-side only) can
-- read/write this table.

-- Keep updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_questions_updated_at on questions;
create trigger trg_questions_updated_at
  before update on questions
  for each row execute function set_updated_at();
