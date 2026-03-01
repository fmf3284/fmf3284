# Google Places Integration - Quick Reference

> **OPTIONAL** - App works without this using seed data

## Quick Setup (3 steps)

### 1. Get API Key

Go to [console.cloud.google.com](https://console.cloud.google.com/)
- Create project
- Enable: Places API, Geocoding API, Maps JavaScript API (optional)
- Create API Key

### 2. Add to Environment

```bash
# Edit .env file
GOOGLE_PLACES_API_KEY=your-api-key-here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here
```

### 3. Import Data

```bash
# Restart server
npm run dev

# Import gyms
npm run import:gyms -- --city "Miami" --state "FL" --limit 50
```

Done! Check `http://localhost:3000/locations`

## Usage

### Command Line

```bash
# By city
npm run import:gyms -- --city "New York" --state "NY" --limit 100

# By coordinates
npm run import:gyms -- --lat 40.7128 --lng -74.0060 --radius 5000

# Help
npm run import:gyms -- --help
```

### Admin API

```bash
# Import via API
curl -X POST http://localhost:3000/api/admin/import \
  -H "Content-Type: application/json" \
  -H "x-demo-user-id: admin-id" \
  -d '{"city":"Miami","state":"FL","limit":50}'

# Check status
curl http://localhost:3000/api/admin/import \
  -H "x-demo-user-id: admin-id"
```

### Service Layer

```typescript
import { GymDataImportService } from '@/server/services/gymDataImport.service';

// Check if configured
if (GymDataImportService.isConfigured()) {
  // Import by city
  const result = await GymDataImportService.importByCity('Miami', 'FL', {
    limit: 50,
    radius: 10000,
  });

  console.log(`Imported: ${result.imported} locations`);
}
```

## Features

✅ Import real gym data from Google Places
✅ Auto-populate location details (address, phone, ratings)
✅ Import business hours
✅ Optional Google Maps integration
✅ Preserves existing seed data
✅ Deduplicates automatically
✅ Admin API for imports
✅ Command-line tool
✅ Works alongside seed data

## Files Created

```
next/
├── server/services/
│   └── gymDataImport.service.ts    # Import logic
├── scripts/
│   └── importGymData.ts            # CLI tool
├── app/api/admin/import/
│   └── route.ts                    # Admin API
└── components/
    └── MapSection.tsx              # Map (updated)
```

## Environment Variables

```env
# Backend (import data)
GOOGLE_PLACES_API_KEY=AIza...

# Frontend (display maps) - optional
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

## Cost

- **Free tier**: $200/month credit
- **Import 100 locations**: ~$2
- **Import once, use forever**

## Important Notes

1. **App works without API key** - Uses seed data
2. **Seed data not affected** - Import adds to database
3. **No duplicates** - Identified by Google Place ID
4. **Rate limited** - Respects Google quotas
5. **Admin only** - API requires admin access

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not configured" | Add `GOOGLE_PLACES_API_KEY` to `.env` |
| "City not found" | Add state: `--state "FL"` |
| "No locations found" | Increase radius: `--radius 20000` |
| Map not showing | Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env` |

## Next Steps

1. ✅ Get API key from Google Cloud Console
2. ✅ Add to `.env` file
3. ✅ Run import command
4. ✅ Check database: `npm run db:studio`
5. ✅ Visit app: `http://localhost:3000/locations`

## Full Documentation

See [/docs/integrations/google-places.md](../docs/integrations/google-places.md) for complete documentation.

---

**Status**: ✅ Implemented, 🔒 Requires API key, ⚠️ Optional
