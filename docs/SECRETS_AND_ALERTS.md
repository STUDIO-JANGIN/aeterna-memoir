# Secrets, Vercel, and Slack alerts

## Where secrets must live for this Next.js app

The Aeterna app runs on **Vercel** (or similar) as a **Next.js** server. Server code reads configuration from **`process.env`**, which comes from:

- **Local:** `.env.local` (never committed; see `.gitignore`)
- **Production / Preview:** **Vercel → Project → Settings → Environment Variables**

**Supabase Dashboard → Secrets** (sometimes called “Secrets” for Edge Functions or project settings) are **not** automatically injected into the Next.js runtime. If you store `LUMA_API_KEY`, `LUMA_WEBHOOK_SECRET`, or `SLACK_WEBHOOK_URL` only there, **API routes and Server Actions will not see them** until the same names and values are also set on **Vercel**.

**Recommended:** Keep the canonical values in your password manager, then:

1. Set them in **Vercel** (required for `/api/*`, Luma, Stripe webhooks, Slack).
2. Optionally mirror them in Supabase if you use other Supabase features that read those secrets—**but Vercel is still required for this app.**

## Variables used by Luma & Slack

| Variable | Used by | Notes |
|----------|---------|--------|
| `LUMA_API_KEY` | `src/lib/ai/video-engine.ts` | Bearer token for Dream Machine API |
| `LUMA_API_BASE_URL` | optional | Default: Luma Dream Machine v1 base URL |
| `LUMA_WEBHOOK_SECRET` | `src/app/api/ai/luma-webhook/route.ts` | Must match header `x-luma-signature` on incoming webhooks if set |
| `LUMA_VIDEO_RESOLUTION` | optional | Default `1080p` (override e.g. `720p`) |
| `LUMA_VIDEO_DURATION` | optional | Default `9s` |
| `SLACK_WEBHOOK_URL` or `SLACK_AETERNA_ALERT_WEBHOOK_URL` | `src/lib/notifyAdmin.ts` | Incoming webhook URL |

Luma’s callback URL is built from your public app origin (`getAppBaseUrl()`), e.g.  
`https://your-domain.com/api/ai/luma-webhook?eventId=…&slug=…` — configure that URL in the Luma dashboard if required.

## Slack notifications (high level)

When `SLACK_WEBHOOK_URL` (or `SLACK_AETERNA_ALERT_WEBHOOK_URL`) is set, notifications are sent for events such as:

- **Stripe:** `premium_film` checkout (Premium AI film alert + email path), Plus/Premium revenue line, **platform tip**, **family support** payments; **unhandled webhook handler errors**
- **Luma:** **render started** (admin requests full film), **video completed** (with link), **render failed** / credit refund path, **DB update failures**, **unhandled webhook errors**
- **Legacy / alternate path:** `generateVideoAction` failures and successful job start (if used)

Slack calls are best-effort: failures are logged and do not block payments or video jobs.
