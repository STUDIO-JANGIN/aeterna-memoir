# Deployment Readiness Checklist

## Supabase Auth & Google OAuth (required for `/create` sign-in)

1. **Vercel → Environment Variables (Production)**  
   - `NEXT_PUBLIC_APP_URL=https://aeternamemoir.com`  
   - `NEXT_PUBLIC_SITE_URL=https://aeternamemoir.com`  
   - `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co` (Supabase → **Settings → API** → Project URL)  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public>` (same page)  
   - `SUPABASE_SERVICE_ROLE_KEY=<service role>` (server-only; never prefix with `NEXT_PUBLIC_`)  
   Code falls back to `https://aeternamemoir.com` for OAuth when the browser is on `*.vercel.app`, but you should still set the URLs above so `redirectTo` is explicit. Redeploy after changing env.

2. **Supabase Dashboard → Authentication → URL Configuration**  
   - **Site URL:** `https://aeternamemoir.com`  
   - **Redirect URLs** (add all that apply):  
     - `https://aeternamemoir.com/auth/callback`  
     - `http://localhost:3000/auth/callback`  

3. **Google Cloud Console** (OAuth client used by Supabase):  
   - Authorized redirect URIs must include Supabase’s callback, e.g.  
     `https://clnxgqhbejscniwhvmjc.supabase.co/auth/v1/callback`  
   (exact value is under Supabase → Authentication → Providers → Google.)

The app exchanges the OAuth `code` at `/auth/callback` (see `src/app/auth/callback/route.ts`) then redirects to `/create` (or `/create?plan=…`).

## 0. Environment Variables (Optional - Landing Background Video)

If you add the following to `.env.local`, the landing page background uses a video. Without it, a calm nature-image placeholder is used.

```bash
# Landing background video (external URLs such as Supabase Storage are supported)
NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL=https://your-project.supabase.co/storage/v1/object/public/.../aeterna-background.mp4

# Poster image during loading / on mobile (optional, default: calm Unsplash nature image)
NEXT_PUBLIC_LANDING_BACKGROUND_POSTER_URL=https://...
```

- If only the video URL is set, uploading to Supabase Storage and pasting that URL is enough.
- If `POSTER_URL` is not set, the default placeholder image is used.

## 1. Run Checks

```bash
node scripts/verify-deploy.mjs
```

- **events table**: verify `preview_film_url` and `full_film_requested_at` columns exist
- **Storage (`photos`)**: verify upload access to `previews/` path (service-role context)

## 2. DB Migration (If Columns Are Missing)

### Option A: Supabase Dashboard (Recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project
2. **SQL Editor** → New query
3. Paste the full contents of `supabase-add-preview-and-full-film.sql`, then click **Run**

### Option B: `psql` (when `DATABASE_URL` is available)

Copy the connection string from Supabase **Project Settings -> Database**, then:

```bash
# Add to .env.local (optional)
# DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

source .env.local  # or export DATABASE_URL=...
node scripts/verify-deploy.mjs   # script attempts migration automatically via psql
```

## 3. Storage (`photos` bucket) - `previews/` Upload

- **Current architecture**: preview videos are uploaded only from the server (Server Action) with `SUPABASE_SERVICE_ROLE_KEY`. Because service role bypasses RLS, uploads to `photos/previews/` work **without additional Storage policies**.
- The verification script uploads and then deletes a test file in `previews/` to confirm this path is healthy.

### (Optional) If direct upload by anon/auth users is needed

If you later switch to client-side direct uploads to `previews/`, configure policies in Supabase Dashboard -> **Storage -> photos -> Policies**:

- **Policy name**: `Allow uploads to previews folder`
- **Allowed operation**: INSERT
- **Target**: `previews/*`
- **Policy**: `true` (or configure `auth.role() = 'authenticated'` as needed)

At present, uploads happen only on the server, so the above policy is not required.

## 4. After Checks Pass

Deployment readiness is complete when the script prints:

```
✅ events table: preview_film_url, full_film_requested_at columns exist
✅ Storage (photos bucket): previews/ path upload allowed (service role)

🎉 Deployment ready
```
