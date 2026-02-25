# Addi's Sourdough Bread

E-commerce site for selling homemade sourdough bread with batch planning, subscriptions, and Stripe payments.

## Setup

1. Copy `.env.example` to `.env` and fill in your values.
2. Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
3. **Database**: For local dev, run `npm run db:dev` in a separate terminal (starts Prisma Postgres). Set `DIRECT_DATABASE_URL` to the `postgres://` URL from the db:dev output. For production, use Supabase or Neon.
4. Run `npm run db:migrate` to apply migrations.
5. Run `npm run db:seed` to create admin user (admin@addi.local / admin123) and sample product.
6. Run `npm run dev` to start the app.

## Stripe

1. Create a Stripe account and add API keys to `.env`
2. For webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Cron (subscriptions)

The subscription cron runs daily at 6 AM (Vercel). Set `CRON_SECRET` and configure your cron to call `/api/cron/process-subscriptions` with `Authorization: Bearer <CRON_SECRET>`.

## Tech Stack

- Next.js 14, TypeScript, Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js
- Stripe
