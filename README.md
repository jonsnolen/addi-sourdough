# Addi's Sourdough Bread

E-commerce site for selling homemade sourdough bread. Hosted on **Render**.

## Project Structure

```
├── render.yaml      # Render deployment config
├── web/             # Next.js app
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── prisma/
│   └── ...
└── DEPLOY-RENDER.md # Deployment instructions
```

## Local Development

```bash
cd web
cp .env.example .env   # Add your DATABASE_URL, etc.
npm install
npm run db:migrate     # Requires database running
npm run db:seed
npm run dev
```

For local database: run `npm run db:dev` in a separate terminal (Prisma Postgres).

## Deploy to Render

See [DEPLOY-RENDER.md](DEPLOY-RENDER.md).
