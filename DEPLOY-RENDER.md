# Deploy to Render

The app lives in the `web/` subfolder and is configured for Render hosting.

## 1. Connect to Render

1. Go to [render.com](https://render.com) and sign up
2. **New** → **Blueprint** (or **Web Service**)
3. Connect your GitHub repo
4. Render will detect `render.yaml` and create the web service

## 2. Set Environment Variables

In Render Dashboard → your service → **Environment**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string (postgresql://...) |
| `DIRECT_DATABASE_URL` | Same as DATABASE_URL |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-service.onrender.com` (your Render URL) |
| `STRIPE_SECRET_KEY` | From Stripe (optional at first) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook (optional at first) |
| `CRON_SECRET` | Run `openssl rand -hex 32` |

## 3. Deploy

Render will build and deploy automatically. The build runs from the `web/` directory.

## 4. Run Migrations

After first deploy, run migrations against your production database:

```bash
cd web
# Set DATABASE_URL in .env to your production Supabase URL
npx prisma migrate deploy
npx prisma db seed
```

## 5. Subscription Cron (optional)

To run the subscription processor daily:

1. **New** → **Cron Job**
2. **Schedule:** `0 6 * * *` (6 AM UTC daily)
3. **Build Command:** `true`
4. **Start Command:**
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-service.onrender.com/api/cron/process-subscriptions
   ```
5. Add env var `CRON_SECRET` (same value as the web service)

## Admin Login

After seeding: **admin@addi.local** / **admin123** — change in production!
