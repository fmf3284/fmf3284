# Deployment Guide

This guide covers deploying the Find My Fitness full-stack application to production.

## Quick Start (Vercel + Neon)

This is the recommended setup for most production deployments.

### 1. Set up Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. Save it for step 2

### 2. Deploy to Vercel

**Option A: Deploy via GitHub (Recommended)**

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `DATABASE_URL`: (paste Neon connection string)
   - `NODE_ENV`: `production`
6. Click "Deploy"

**Option B: Deploy via CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts to link project

# Add environment variable
vercel env add DATABASE_URL production
# (paste Neon connection string when prompted)
```

### 3. Run Database Migrations

After first deployment:

```bash
# Pull production environment variables
vercel env pull .env.production.local

# Run migrations in production
DATABASE_URL="$(grep DATABASE_URL .env.production.local | cut -d '=' -f2)" npm run db:migrate:deploy
```

Or use Vercel CLI to run a one-time command:

```bash
vercel env pull
npx prisma migrate deploy
```

### 4. Seed Database (Optional)

Only for demo/testing:

```bash
DATABASE_URL="$(grep DATABASE_URL .env.production.local | cut -d '=' -f2)" npm run db:seed
```

### 5. Verify Deployment

```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health

# Should return:
# {
#   "status": "healthy",
#   "database": "connected",
#   "service": "find-my-fitness-api"
# }

# Test locations API
curl https://your-app.vercel.app/api/locations
```

---

## Alternative: Railway (All-in-One)

Railway provides both hosting and PostgreSQL in one platform.

### 1. Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Railway will automatically:
   - Detect Next.js
   - Create a PostgreSQL database
   - Set `DATABASE_URL` environment variable

### 2. Run Migrations

Railway provides a shell you can use:

1. Go to your project → Deployments
2. Click on latest deployment
3. Click "View Logs" → "Shell"
4. Run:

```bash
npm run db:migrate:deploy
npm run db:seed  # optional
```

### 3. Verify

```bash
curl https://your-app.up.railway.app/api/health
```

---

## Alternative: Netlify + Supabase

### 1. Set up Database (Supabase)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → Database → Connection String → URI
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

### 2. Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider and select repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Add environment variables:
   - `DATABASE_URL`: (Supabase connection string)
   - `NODE_ENV`: `production`
6. Click "Deploy site"

### 3. Run Migrations

Use Netlify CLI or run locally with production DATABASE_URL:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Pull environment variables
netlify env:list

# Run migrations with production DATABASE_URL
DATABASE_URL="your-supabase-url" npm run db:migrate:deploy
```

---

## Environment Variables

All platforms require these environment variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | No | Environment (usually auto-set) | `production` |
| `DIRECT_URL` | No | Direct DB connection (for pooling) | Same as DATABASE_URL |
| `NEXT_PUBLIC_APP_URL` | No | Your app's public URL | `https://findmyfitness.fit` |

---

## Database Migrations

### Development vs Production

**Development** (local):
```bash
npm run db:migrate        # Creates and applies migration
```

**Production** (deployed):
```bash
npm run db:migrate:deploy # Only applies existing migrations
```

### Creating Migrations

Always create migrations locally, then commit and deploy:

```bash
# 1. Make schema changes in prisma/schema.prisma
# 2. Create migration
npm run db:migrate

# 3. Test locally
npm run dev

# 4. Commit migration files
git add prisma/migrations
git commit -m "Add new migration"
git push

# 5. Deploy (migrations run automatically via postinstall)
```

---

## Common Issues

### "Can't reach database server"

**Problem:** DATABASE_URL is incorrect or database is not accessible

**Solutions:**
- Verify DATABASE_URL is correct
- Check database is running (Neon: check project status)
- Ensure `?sslmode=require` is in connection string for cloud databases
- Check firewall/network settings

### "Prisma Client not generated"

**Problem:** Prisma Client wasn't generated during build

**Solutions:**
- Ensure `postinstall` script exists in package.json
- Manually run `npm run prisma:generate`
- Check build logs for errors during `prisma generate`

### "Too many database connections"

**Problem:** Serverless functions are creating too many connections

**Solutions:**
- Enable connection pooling in DATABASE_URL
- Use Prisma Data Proxy (recommended for serverless)
- Use PgBouncer
- Add connection limits in Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

### "Migration failed in production"

**Problem:** Migration has breaking changes

**Solutions:**
- Never run destructive migrations on production data
- Test migrations on staging environment first
- Use Neon branches for safe migration testing
- Rollback if needed: `npx prisma migrate resolve --rolled-back <migration-name>`

---

## Health Checks

### Endpoint

```
GET /api/health
```

### Responses

**Healthy:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "service": "find-my-fitness-api",
  "version": "1.0.0"
}
```

**Unhealthy:**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "disconnected",
  "service": "find-my-fitness-api",
  "error": "Database connection failed"
}
```

### Monitoring

Set up health check monitoring:

**Vercel:**
- Add "Health Checks" in project settings
- URL: `https://your-app.vercel.app/api/health`
- Expected status: 200

**External Services:**
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [Better Uptime](https://betteruptime.com)

---

## Performance Optimization

### Database Connection Pooling

For production with high traffic:

**Option 1: Prisma Data Proxy** (Recommended for Vercel)

```bash
# In Prisma Cloud dashboard
# 1. Enable Data Proxy
# 2. Get connection string
# 3. Update DATABASE_URL in Vercel

# prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Option 2: PgBouncer** (For custom hosting)

Add PgBouncer layer between app and database.

**Option 3: Neon Connection Pooling** (Built-in)

Neon provides connection pooling automatically. Use the pooled connection string.

### Caching

Add Redis for API response caching:

```bash
# Add Redis (Upstash for serverless)
# 1. Sign up at upstash.com
# 2. Create Redis database
# 3. Add REDIS_URL to environment variables
```

---

## Rollback Procedure

If deployment breaks:

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

Or via dashboard:
1. Go to Deployments
2. Find working deployment
3. Click "..." → "Promote to Production"

### Railway

1. Go to Deployments tab
2. Find previous working deployment
3. Click "Redeploy"

### Database Rollback

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Revert schema changes in code
git revert <commit-hash>

# Deploy fix
git push
```

---

## Checklist

Before going to production:

- [ ] Database setup complete (Neon/Supabase/Railway)
- [ ] Environment variables configured
- [ ] Migrations applied (`db:migrate:deploy`)
- [ ] Health endpoint returns 200
- [ ] Test all API endpoints work
- [ ] Demo data seeded (if needed)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Error monitoring setup (Sentry)
- [ ] Uptime monitoring active
- [ ] Backup strategy in place

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Railway Docs**: https://docs.railway.app
- **Netlify Docs**: https://docs.netlify.com
