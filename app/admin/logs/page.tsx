// ADD THIS TO prisma/schema.prisma — paste after the ActivityLog model (after line 77)

model VisitorLog {
  id          String   @id @default(cuid())
  // Identity
  sessionId   String   // anonymous session fingerprint
  userId      String?  // set if logged in
  // Page
  page        String   // e.g. "/", "/locations", "/blog/slug"
  referrer    String?  // where they came from
  // Device
  userAgent   String?
  device      String?  // "mobile", "tablet", "desktop"
  browser     String?  // "Chrome", "Safari", "Firefox"
  os          String?  // "Windows", "macOS", "iOS", "Android"
  // Location (from IP)
  ipAddress   String?
  country     String?
  countryCode String?
  region      String?
  city        String?
  // Timing
  createdAt   DateTime @default(now())

  @@index([sessionId])
  @@index([userId])
  @@index([page])
  @@index([createdAt])
  @@index([country])
  @@index([ipAddress])
  @@map("visitor_logs")
}
