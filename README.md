# BedCare Connect

Role-based care-coordination platform for bedridden and home-care patients, with offline-first task tracking, an AI care assistant and on-device camera monitoring. Built at a hackathon as a joint team project.

## What it does

- **Four roles, one organisation**: super-admin creates organisations, org-admins onboard caretakers, families and patients, and each role gets its own dashboard.
- **Care tasks**: caretakers log medication, meals and routines; families see completion charts and daily reports.
- **AI assistant**: Gemini-powered chat for patients, caretakers and families, with voice notes and case-sheet upload and summarisation.
- **Camera monitoring** (new): pretrained YOLO + MediaPipe pose/hand models run in the browser or the Capacitor app to flag activity such as "likely medication taken", with confidence scores and family verification. No custom dataset is required.
- **Offline-first**: tasks and monitoring events are stored in IndexedDB and synced to Supabase when the network returns.
- **Multilingual UI** with a dictionary-based language switcher.
- **Mobile**: ships as an Android/iOS app through Capacitor.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, RLS) · Google Gemini · TanStack Query · Recharts · Framer Motion · idb · Capacitor 8 · Cloudinary

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

`.env.local` needs:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only, never ship to the client
NEXT_PUBLIC_GEMINI_API_KEY=
```

Apply the SQL in `supabase/schema.sql` and then the files in `supabase/migrations/` to a fresh Supabase project. Seed and debug helpers live in `scripts/` and read the same environment variables.

Mobile build:

```bash
npm run build && npx cap sync android && npx cap open android
```

## Project layout

```
app/            route groups per role: super-admin, org-admin, caretaker, family, patient
app/api/        monitoring events, permissions, patient monitoring status
components/     chat, charts, voice recorder, sidebar, language provider
lib/monitoring/ activity engine, detectors, AI service
lib/            Supabase client, offline storage, sync engine, translations
supabase/       schema and migrations
```
