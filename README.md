# SafetyMeet — OSHA Safety Meeting & Toolbox Talk Compliance SaaS

A full-stack Next.js 14 application for managing OSHA safety meetings, toolbox talks, and worker compliance tracking. Workers scan QR codes to acknowledge attendance — no app download required.

---

## Features

- **Schedule Safety Meetings** — Create toolbox talks and safety briefings with date/time, supervisor, and agenda details
- **QR Code Attendance** — Generate unique QR codes for each worker per meeting; workers scan to acknowledge on their phone
- **Real-Time Compliance Tracking** — Live dashboard showing who has and hasn't acknowledged, with progress bars
- **Compliance Reports** — Filter, search, and export attendance records to CSV for OSHA documentation
- **Mobile-First Worker Pages** — Large, easy-to-use acknowledgment screens optimized for job-site use
- **No-Auth Worker Flow** — Workers access their unique link via QR code — no login required

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (dark industrial theme)
- **Database**: Supabase (PostgreSQL)
- **QR Codes**: `qrcode` npm package (client-side generation)
- **Date Formatting**: `date-fns`

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repo-url>
cd henry-safetymeet
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings > API

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Note**: `NEXT_PUBLIC_SITE_URL` is used for QR code generation. Set it to your production domain before deploying.

### 5. Set Up the Database

In your Supabase project:

1. Go to the **SQL Editor**
2. Open and run the contents of `schema.sql`

This will:
- Create the `companies`, `meetings`, `workers`, and `attendance_tokens` tables
- Seed a demo company (`Demo Construction Co.`) with 8 sample workers

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Routes Overview

| Route | Description |
|-------|-------------|
| `/` | Dashboard — stats, recent meetings |
| `/meetings/new` | Schedule a new safety meeting |
| `/meetings/[id]` | Meeting detail — live acknowledgment status |
| `/attend/[token]` | **Worker page** — acknowledge attendance via QR |
| `/compliance` | Compliance report — filter + CSV export |
| `/api/meetings/create` | POST — create meeting + generate tokens |
| `/api/attend/acknowledge` | POST — mark worker as acknowledged |

---

## Worker Flow

1. Supervisor creates a meeting at `/meetings/new`
2. System generates a unique QR code link per worker
3. Supervisor prints/texts/shows each worker their QR code
4. Worker scans QR code on their phone and sees safety briefing info
5. Worker taps **"I Acknowledge Attending This Safety Briefing"**
6. Worker is marked as **cleared for shift**
7. Supervisor monitors real-time at `/meetings/[id]`

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial SafetyMeet app"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and create a New Project
2. Import your GitHub repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` set to your Vercel domain (e.g., `https://henry-safetymeet.vercel.app`)
4. Deploy

### 3. Supabase CORS (if needed)

In Supabase, go to Settings > API > CORS allowed origins, and add your Vercel domain.

---

## Database Schema

```
companies
  id, name, created_at

meetings
  id, company_id, title, description, scheduled_at, created_by, created_at

workers
  id, company_id, name, email, employee_id, created_at

attendance_tokens
  id, meeting_id, worker_id, token (unique), acknowledged_at, shift_cleared, created_at
```

---

## OSHA Compliance Notes

- OSHA 29 CFR 1926.21 requires documentation of safety training
- Export compliance records to CSV from `/compliance` and retain for 3+ years
- Each attendance record captures worker name, meeting details, and exact acknowledgment timestamp

---

## Demo Data

The schema seeds the following demo workers for `Demo Construction Co.`:

| Name | Employee ID |
|------|-------------|
| Marcus Johnson | EMP-001 |
| Sarah Williams | EMP-002 |
| Derek Chavez | EMP-003 |
| Amara Patel | EMP-004 |
| James Okafor | EMP-005 |
| Linda Torres | EMP-006 |
| Robert Kim | EMP-007 |
| Fatima Hassan | EMP-008 |

---

## License

MIT
