@AGENTS.md

## Session 2026-09-16 05:21

- Diagnosed "works on my machine" issue: frontend hardcodes `127.0.0.1:8000`, backend only exists on dev's PC, so other PCs get 500 errors on `/api/model/metrics`
- Verified backend auto-creates all DB tables on startup via `Base.metadata.create_all()`, so empty DB isn't the cause
- Confirmed no routing/rewrite issues in Next.js config — both next.config files are empty; `/proxy/` prefix comes from external tunnel/cloud-preview
- Determined root cause is connectivity: backend not running or unreachable on other PCs, not a code/routing bug
- Recommended teammates run both backend + frontend locally (each on 127.0.0.1:8000) or set `NEXT_PUBLIC_API_BASE` env var for shared backend
- Next step: commit `backend/veercare.db` with seeded data so cloned code includes demo users/personnel

## Session 2026-09-16 05:25

- Confirmed frontend-backend connectivity issue: `frontend/lib/api.ts:22` hardcodes `127.0.0.1:8000`, making backend unreachable from other PCs on network
- Root cause: backend exists only on developer's local machine; teammates cloning code cannot connect without networking changes
- Provided 4-step deployment fix plan: (1) confirm error type, (2) set `NEXT_PUBLIC_API_BASE` to real host, (3) bind backend to `0.0.0.0:8000`, (4) ensure DB migrations on shared host
- Identified database location: `backend/veercare.db` is SQLite file stored relative to backend startup directory, only exists on developer's machine
- Lazy fix: commit `veercare.db` with seeded data so teammates get working schema + demo users; each runs both services locally (no code changes) or all point to one shared backend

## Session 2026-09-16 06:12

- Root cause found: missing `backend/.env` with Supabase `DATABASE_URL` — backend can't reach shared cloud DB, so teammates' requests 500
- `backend/database.py` calls `load_dotenv()` and falls back to local sqlite if env vars missing; your friend's `.env` points at Supabase, yours/others' point at empty local DB
- Clarified two independent "works on my machine" gaps: backend needs `.env` for DB; frontend needs `NEXT_PUBLIC_API_BASE` for backend URL (different files, different layers)
- Solution: get `.env` file from friend (Slack/DM, not git), drop into `backend/.env`, don't commit to git — it holds live Supabase credentials
- Confirmed frontend has no Supabase client or secrets — only the backend reads `.env`; frontend only sets backend URL via `NEXT_PUBLIC_API_BASE`

## Session 2026-09-16 06:32

- Reconfirmed root cause: `backend/.env` missing `DATABASE_URL` pointing to shared Supabase DB — friend's `.env` connects to cloud, yours falls back to empty local sqlite
- Clarified two independent env files: backend's `backend/.env` (DB connection) vs frontend's `frontend/.env.local` (backend URL via `NEXT_PUBLIC_API_BASE`)
- Verified frontend has no Supabase dependencies or secrets — no `supabase-js` client, only HTTP calls to backend
- Provided fix instructions: create `backend/.env` with `DATABASE_URL` from friend (via DM, never git), restart uvicorn to resolve 500s
- Confirmed `.gitignore` already excludes `.env`; only need to export/share Supabase creds with teammate privately, not commit them
