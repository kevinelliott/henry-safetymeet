-- ============================================================
-- SafetyMeet — OSHA Safety Meeting & Toolbox Talk Compliance
-- Schema
-- ============================================================

-- Companies
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Meetings (toolbox talks / safety meetings)
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  created_by text not null,
  created_at timestamptz default now()
);

-- Workers
create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  email text,
  employee_id text,
  created_at timestamptz default now()
);

-- Attendance tokens (unique per worker per meeting)
create table if not exists attendance_tokens (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  worker_id uuid references workers(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  acknowledged_at timestamptz,
  shift_cleared boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Seed Data
-- ============================================================

-- Demo company
insert into companies (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Demo Construction Co.')
on conflict (id) do nothing;

-- Demo workers
insert into workers (id, company_id, name, email, employee_id) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Marcus Johnson', 'marcus.johnson@democonstruction.com', 'EMP-001'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Sarah Williams', 'sarah.williams@democonstruction.com', 'EMP-002'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Derek Chavez', 'derek.chavez@democonstruction.com', 'EMP-003'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'Amara Patel', 'amara.patel@democonstruction.com', 'EMP-004'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'James Okafor', 'james.okafor@democonstruction.com', 'EMP-005'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', 'Linda Torres', 'linda.torres@democonstruction.com', 'EMP-006'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', 'Robert Kim', 'robert.kim@democonstruction.com', 'EMP-007'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001', 'Fatima Hassan', 'fatima.hassan@democonstruction.com', 'EMP-008')
on conflict (id) do nothing;

-- Indexes for performance
create index if not exists idx_meetings_company_id on meetings(company_id);
create index if not exists idx_meetings_scheduled_at on meetings(scheduled_at desc);
create index if not exists idx_workers_company_id on workers(company_id);
create index if not exists idx_attendance_tokens_meeting_id on attendance_tokens(meeting_id);
create index if not exists idx_attendance_tokens_worker_id on attendance_tokens(worker_id);
create index if not exists idx_attendance_tokens_token on attendance_tokens(token);
