# Deployment Guide

## 1. Push to GitHub

Create a new repository on [github.com/new](https://github.com/new) named `addi-sourdough` (or similar), then run:

```bash
cd "/Users/jon/Projects/Addi Website"
git remote add origin https://github.com/YOUR_USERNAME/addi-sourdough.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add these **Environment Variables** before deploying:

| Name | Value | Notes |
|------|-------|-------|
| `DATABASE_URL` | Your Supabase connection string | From Supabase → Settings → Database |
| `DIRECT_DATABASE_URL` | Same as DATABASE_URL | Use the "Connection pooling" URI for Supabase |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` | Generate a random string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Update after first deploy with your actual URL |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | From Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe webhook (see step 4) |
| `CRON_SECRET` | Run `openssl rand -hex 32` | For subscription cron auth |

4. Click **Deploy**

## 3. Run Database Migrations

After first deploy, run migrations against your production database:

```bash
# Set DATABASE_URL in .env to your production Supabase URL first
npx prisma migrate deploy
npx prisma db seed
```

## 4. Configure Stripe Webhook

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks
2. Add endpoint: `https://YOUR-VERCEL-URL.vercel.app/api/webhooks/stripe`
3. Select event: `checkout.session.completed`
4. Copy the **Signing secret** and add it as `STRIPE_WEBHOOK_SECRET` in Vercel
5. Redeploy in Vercel so the new env var is picked up

## 5. Update NEXTAUTH_URL

In Vercel → Settings → Environment Variables, set `NEXTAUTH_URL` to your live URL (e.g. `https://addi-sourdough.vercel.app`), then redeploy.

## Admin Login

After seeding: **admin@addi.local** / **admin123** — change this in production!
