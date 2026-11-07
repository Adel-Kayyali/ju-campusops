# Deployment guide (free: GitHub + Neon + Vercel)

```
Browser ──► Vercel (frontend, static React build)
   │
   └──► Vercel (backend, NestJS serverless function /api) ──► Neon PostgreSQL
                         │                                  └► Vercel Blob (photos)
                         └── Vercel Cron, once a day: GET /api/jobs/daily
```

Everything below fits in the free tiers (Vercel Hobby, Neon Free, Vercel Blob Hobby).
You will create **two Vercel projects** from the same GitHub repository: one with root directory
`backend`, one with root directory `frontend`.

## 1. GitHub

```bash
git add . && git commit -m "CampusOps"
git remote add origin https://github.com/<you>/campusops.git
git push -u origin main
```

## 2. Database (Neon)

1. Create a free project at https://neon.tech (region close to Jordan, e.g. *Europe (Frankfurt)*).
2. In **Connection details**, copy two connection strings:
   - **Pooled** connection (host contains `-pooler`) → `DATABASE_URL`. Append `&pgbouncer=true&connect_timeout=15`.
   - **Direct** connection (no `-pooler`) → `DIRECT_URL`.
3. Create the tables and load the demo data **from your computer**:

```bash
cd backend
DATABASE_URL="<direct url>" DIRECT_URL="<direct url>" npx prisma migrate deploy
DATABASE_URL="<direct url>" DIRECT_URL="<direct url>" npm run db:seed
```

> The migration enables the `btree_gist` extension (needed by the "no overlapping locker
> subscriptions" constraint). Neon allows it for the project owner role.

## 3. Backend on Vercel

1. https://vercel.com → **Add New… → Project** → import the repository.
2. **Root Directory: `backend`**. Leave Framework Preset as *Other*; `backend/vercel.json` already sets the
   build command (`npm run vercel-build` = prisma generate + migrate deploy + nest build), the function and the cron job.
3. Environment variables:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled URL (with `pgbouncer=true`) |
| `DIRECT_URL` | Neon direct URL |
| `JWT_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGINS` | the frontend URL, e.g. `https://campusops.vercel.app` (comma-separated if several) |
| `STORAGE_DRIVER` | `vercel-blob` |
| `PUBLIC_API_URL` | the backend URL, e.g. `https://campusops-api.vercel.app` |
| `CRON_SECRET` | a random string (Vercel Cron sends it automatically) |
| `APP_TIMEZONE` | `Asia/Amman` |

4. **Storage → Create → Blob**, connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
5. Deploy, then open `https://<backend>.vercel.app/api/health` → `{"status":"ok","database":"up"}`,
   and `https://<backend>.vercel.app/api/docs` for Swagger.

## 4. Frontend on Vercel

1. **Add New… → Project** → same repository, **Root Directory: `frontend`** (preset *Vite*).
2. Environment variable: `VITE_API_URL = https://<backend>.vercel.app/api`
3. Deploy. `frontend/vercel.json` rewrites every path to `index.html` so deep links work.
4. Go back to the backend project and make sure `CORS_ORIGINS` contains the final frontend URL,
   then **Redeploy** the backend.

## 5. Check

- Log in with `manager@campusops.edu` / `Password123!`.
- Lockers page loads, a subscription can be started; a student can see it under *My lockers*.
- Upload a photo on a request (tests Vercel Blob).
- Vercel → backend project → **Settings → Cron Jobs** shows `/api/jobs/daily` (runs at 04:00 UTC).
  The admin can also run it manually: `POST /api/jobs/daily/run`.

## Notes

- Vercel functions have a 4.5 MB request limit; the API limits uploads to 4 MB per file.
- Neon's free compute sleeps after a few minutes without traffic; the first request then takes about a second longer.
  Open the site a minute before presenting.
- To reset the demo data before the presentation, run the seed again (step 2.3).
