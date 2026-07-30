-- ============================================================
-- Migration 007: Phone number & school on students
-- Run this in the Supabase SQL Editor AFTER migration_006_self_registration.sql.
--
-- Adds optional contact/school info collected at registration time.
-- Nullable because existing students (added via Admin -> Students,
-- before this migration) won't have these filled in.
-- ============================================================

alter table students add column if not exists phone text;
alter table students add column if not exists school text;
