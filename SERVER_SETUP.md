# Server Setup Instructions

## Prerequisites

1. PostgreSQL database running locally or remotely
2. Node.js 20+ installed

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI (dev dependency)
- `zod` - Schema validation
- `tsx` - TypeScript execution for seed script

### 2. Configure Database

Create a `.env` file in the `next/` directory:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/fitness_finder?schema=public"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma Client based on your `schema.prisma` file.

### 4. Push Schema to Database

For development (creates tables without migrations):

```bash
npm run db:push
```

Or for production (creates migration files):

```bash
npm run db:migrate
```

### 5. Seed Database

Populate the database with initial data:

```bash
npm run db:seed
```

This creates:
- 24 amenities
- 6 locations with full data
- 1 demo user (demo@fitnessfinder.com)

### 6. Run Development Server

```bash
npm run dev
```

## Database Management

### View Database

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

### Reset Database

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Run seed script

## Project Structure

```
next/
├── server/              # Backend layer
│   ├── db/
│   │   └── prisma.ts   # Prisma client singleton
│   ├── services/       # Business logic
│   │   ├── locations.service.ts
│   │   ├── bookmarks.service.ts
│   │   └── users.service.ts
│   ├── validators/     # Zod schemas
│   │   └── locations.schema.ts
│   └── auth/           # Authentication
│       └── session.ts  # Session management
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed script
└── app/api/            # API routes (thin handlers)
    ├── locations/
    ├── bookmarks/
    └── ...
```

## Demo Mode

The server supports demo mode via the `x-demo-user` header:

```typescript
// Frontend example
fetch('/api/bookmarks', {
  headers: {
    'x-demo-user': JSON.stringify({
      name: 'Demo User',
      email: 'demo@fitnessfinder.com'
    })
  }
})
```

This allows testing without real authentication.

## API Endpoints

### Locations

- `GET /api/locations` - Search/filter locations
  - Query params: `query`, `category`, `minRating`, `priceRange`, `amenities[]`, `city`, `state`, `sortBy`, `page`, `limit`
- `GET /api/locations/[id]` - Get location by ID

### Bookmarks

- `GET /api/bookmarks` - Get user's bookmarks (requires auth)
- `POST /api/bookmarks` - Save a location (requires auth)
  - Body: `{ locationId: string }`
- `DELETE /api/bookmarks/[locationId]` - Remove bookmark (requires auth)
- `POST /api/bookmarks/[locationId]` - Toggle bookmark (requires auth)

## Migration to Real Auth

To replace demo mode with real authentication:

1. Update `server/auth/session.ts` to use your auth provider (NextAuth, Clerk, etc.)
2. Remove the `x-demo-user` header check
3. Implement proper session/JWT verification
4. Update frontend to send proper auth headers/cookies

## Troubleshooting

### "Can't reach database server"

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database credentials

### "Module not found: @prisma/client"

```bash
npm run db:generate
```

### "Table does not exist"

```bash
npm run db:push
```

Or if using migrations:

```bash
npm run db:migrate
```
