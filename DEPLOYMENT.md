# Vercel Deployment Guide for Plinko Game

## Prerequisites

- A [Vercel account](https://vercel.com)
- A [Turso account](https://turso.tech) (for hosted SQLite database)
- Your code pushed to GitHub/GitLab/Bitbucket

---

## Step 1: Set Up Turso Database

### Install Turso CLI
```bash
# macOS
brew install tursodatabase/tap/turso

# Or using curl
curl -sSfL https://get.tur.so/install.sh | bash
```

### Create Database
```bash
# Login to Turso
turso auth login

# Create your database
turso db create plinko-game

# Get the database URL (save this!)
turso db show plinko-game --url
# Output: libsql://plinko-game-yourusername.turso.io

# Create an auth token (save this!)
turso db tokens create plinko-game
# Output: eyJhbGciOiJFZERTQS...
```

### Apply Migrations to Turso
```bash
# Push your schema to Turso
npx prisma db push
```

> **Note**: For `prisma db push` to work with Turso, you'll need to temporarily set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in your `.env` file, or use:
> ```bash
> TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx prisma db push
> ```

---

## Step 2: Push Code to Git

```bash
# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Push to GitHub (create repo first on github.com)
git remote add origin https://github.com/yourusername/plinko-game.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Option B: Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Click "Deploy"

---

## Step 4: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `TURSO_DATABASE_URL` | `libsql://plinko-game-yourusername.turso.io` | Production |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQS...` | Production |

> **Important**: Do NOT add `DATABASE_URL` - it's only used for local SQLite development.

---

## Step 5: Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

Or in Dashboard: Deployments → ... → Redeploy

---

## File Structure for Deployment

Your project should have:

```
plinko-game/
├── .env                    # Local dev only (not deployed)
├── .env.example            # For reference
├── lib/db/prisma.ts        # Handles both SQLite and Turso
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json            # build script includes prisma generate
└── ...
```

---

## Troubleshooting

### "Table does not exist" on Vercel
Run migrations against Turso:
```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx prisma db push
```

### Build fails on Vercel
Ensure `package.json` has:
```json
"build": "prisma generate && next build"
```

### Local dev stopped working
Make sure `.env` still has:
```
DATABASE_URL="file:./prisma/dev.db"
```

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Local dev | `npm run dev` |
| Run tests | `npm test` |
| Push schema to Turso | `npx prisma db push` |
| Open Prisma Studio | `npx prisma studio` |
| Deploy to Vercel | `vercel --prod` |
