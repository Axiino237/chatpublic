# LoveLink Chat — Supabase Serverless

A real-time chat application built with **React + Supabase** (fully serverless, $0/month on free tier).

## 🚀 Quick Start (After Cloning)

### Step 1 — Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste the contents of `supabase/migrations/001_initial_schema.sql` → Run
3. Go to **Storage** → New Bucket → Name: `chat-media` → Public: ✅

### Step 2 — Frontend Environment
```bash
cd frontend
cp .env.example .env
# Fill in your Supabase URL and anon key from:
# https://supabase.com/dashboard/project/_/settings/api
```

Your `.env` should look like:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3 — Run Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Step 4 — Deploy Edge Functions (optional for production)
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy send-message
supabase functions deploy send-private-message
supabase functions deploy get-rooms
supabase functions deploy get-history
supabase functions deploy mute-user
supabase functions deploy block-user
supabase functions deploy report-user
supabase functions deploy upload-media
```

### Step 5 — Deploy Frontend to Vercel
```bash
npm install -g vercel
vercel --prod
# Set env vars in Vercel dashboard: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

## 🏗 Architecture

```
Frontend (React + Vite)  →  Supabase Auth       (login/register/OTP/guest)
                         →  Supabase Realtime   (live messages, presence, typing)
                         →  Supabase Database   (PostgreSQL with RLS)
                         →  Supabase Storage    (images/media)
                         →  Edge Functions      (business logic: mute/block/report)
```

## 📁 Project Structure
```
chat/
├── frontend/               # React + Vite app
│   └── src/
│       ├── lib/
│       │   └── supabase.ts              # Supabase client
│       ├── services/
│       │   ├── supabase-auth.service.ts # Auth (login/register/guest/OTP)
│       │   └── supabase-realtime.service.ts # Chat realtime
│       └── pages/          # Chat pages
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Full DB schema
│   └── functions/          # Edge Functions (serverless)
│       ├── send-message/
│       ├── send-private-message/
│       ├── get-rooms/
│       ├── get-history/
│       ├── mute-user/
│       ├── block-user/
│       ├── report-user/
│       └── upload-media/
└── vercel.json             # Frontend deployment config
```

## 💰 Cost
| Service | Free Tier |
|---|---|
| Database | 500 MB |
| Auth | 50,000 MAU |
| Realtime | 500 concurrent connections |
| Edge Functions | 500K calls/month |
| Storage | 1 GB |
| **Total** | **$0/month** |
