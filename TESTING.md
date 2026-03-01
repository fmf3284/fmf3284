# Testing Guide for Find My Fitness

This document describes the comprehensive test suite for the Find My Fitness application.

## 📋 Test Structure

```
__tests__/
├── unit/                    # Unit tests for utilities and services
│   ├── security.test.ts     # Security utilities (password, session, brute force)
│   └── services.test.ts     # Business logic services
├── api/                     # API endpoint tests
│   ├── auth.test.ts         # Authentication endpoints
│   ├── admin.test.ts        # Admin management endpoints
│   └── reviews-locations.test.ts  # Reviews and locations endpoints
├── components/              # React component tests
│   └── components.test.tsx  # UI component tests
├── integration/             # Integration tests
│   └── flows.test.ts        # Complete user flows
└── mocks/                   # Test mocks and utilities
    ├── prisma.ts            # Prisma client mock
    └── testUtils.ts         # Test helper functions
```

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:coverage
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# API tests only
npm run test:api

# Component tests only
npm run test:components

# Integration tests only
npm run test:integration
```

### Single Test File
```bash
npm test -- security.test.ts
npm test -- auth.test.ts
```

## 📊 Test Coverage

The test suite covers:

### Security Utilities (100%)
- ✅ Password hashing (bcrypt)
- ✅ Password verification
- ✅ Password validation (strength, requirements)
- ✅ Session token creation
- ✅ Session token verification
- ✅ Brute force protection
- ✅ Input sanitization (email, HTML)
- ✅ Email validation
- ✅ Super admin protection

### Authentication API (100%)
- ✅ POST /api/auth/login
- ✅ POST /api/auth/register
- ✅ GET /api/auth/session
- ✅ POST /api/auth/logout
- ✅ POST /api/auth/reset-password

### Admin API (100%)
- ✅ GET /api/admin/users
- ✅ PATCH /api/admin/users/:id
- ✅ DELETE /api/admin/users/:id
- ✅ GET /api/admin/reviews
- ✅ PATCH /api/admin/reviews/:id
- ✅ GET /api/admin/logs
- ✅ GET /api/admin/dashboard

### Reviews & Locations API (100%)
- ✅ GET /api/reviews
- ✅ POST /api/reviews
- ✅ DELETE /api/reviews/:id
- ✅ GET /api/reviews/stats
- ✅ GET /api/locations
- ✅ GET /api/locations/:id

### React Components (100%)
- ✅ Navbar
- ✅ AdminBar
- ✅ FitnessLocationCard
- ✅ Footer
- ✅ ErrorBoundary
- ✅ LogoutButton
- ✅ AddressAutocomplete
- ✅ CategoryCarousel
- ✅ GoogleMap

### Services (100%)
- ✅ Users Service
- ✅ Reviews Service
- ✅ Locations Service
- ✅ Bookmarks Service
- ✅ CheckIns Service
- ✅ ReviewVotes Service
- ✅ ActivityLog Service

### Integration Flows (100%)
- ✅ User Registration Flow
- ✅ Password Reset Flow
- ✅ Session Management Flow
- ✅ Admin User Management
- ✅ Super Admin Protection
- ✅ Review Creation Flow
- ✅ Review Moderation Flow
- ✅ Location Search Flow
- ✅ Bookmark Flow
- ✅ Activity Logging Flow

## 🔒 Security Test Cases

### Password Security
| Test | Description |
|------|-------------|
| Hashing | Passwords are hashed with bcrypt (12 rounds) |
| Verification | Correct passwords verify successfully |
| Rejection | Incorrect passwords are rejected |
| Validation | Weak passwords are rejected |
| Requirements | All requirements enforced (length, uppercase, lowercase, number, special) |
| Common | Common passwords are blocked |

### Session Security
| Test | Description |
|------|-------------|
| Token Creation | Valid tokens are created with HMAC signature |
| Token Verification | Valid tokens verify successfully |
| Expiration | Expired tokens are rejected |
| Tampering | Tampered tokens are rejected |
| Data Integrity | Session data matches original |

### Brute Force Protection
| Test | Description |
|------|-------------|
| First Attempt | First login attempt is allowed |
| Tracking | Failed attempts are tracked |
| Lockout | Account locks after 5 failed attempts |
| Clear | Successful login clears attempts |

### Super Admin Protection
| Test | Description |
|------|-------------|
| Cannot Delete | Super admin cannot be deleted without code |
| Cannot Suspend | Super admin cannot be suspended |
| Cannot Demote | Super admin role cannot be changed |
| Master Reset | Can reset with code 1954 |

## 🧪 Test Mocks

### Prisma Mock
All Prisma operations are mocked to avoid database calls:
```typescript
prisma.user.findUnique()
prisma.user.create()
prisma.user.update()
prisma.user.delete()
// ... etc
```

### Next.js Mocks
- `useRouter` - Navigation functions
- `usePathname` - Current path
- `useSearchParams` - URL parameters
- `next/link` - Link component
- `next/image` - Image component

### Browser APIs
- `fetch` - API calls
- `localStorage` - Client storage
- `sessionStorage` - Session storage
- `matchMedia` - Media queries
- `IntersectionObserver` - Scroll detection
- `ResizeObserver` - Size detection

### Google Maps
- `google.maps.places.PlacesService`
- `google.maps.Geocoder`
- `google.maps.Map`
- `google.maps.Marker`

## 📝 Writing New Tests

### Unit Test Example
```typescript
describe('MyFeature', () => {
  test('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### API Test Example
```typescript
describe('POST /api/my-endpoint', () => {
  test('should return 200 for valid request', async () => {
    const { POST } = await import('@/app/api/my-endpoint/route');
    const request = createMockRequest({
      method: 'POST',
      body: { data: 'value' },
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### Component Test Example
```typescript
describe('MyComponent', () => {
  test('renders correctly', async () => {
    const MyComponent = (await import('@/components/MyComponent')).default;
    render(<MyComponent />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 🔧 Configuration Files

### jest.config.js
- Uses `next/jest` for Next.js compatibility
- `jsdom` test environment
- Module path mapping (`@/` → project root)
- Coverage collection from all source files

### jest.setup.js
- Imports `@testing-library/jest-dom`
- Mocks Next.js navigation
- Mocks browser APIs
- Mocks Google Maps

## 📈 CI/CD Integration

For continuous integration:
```bash
npm run test:ci
```

This runs all tests with:
- Coverage reporting
- CI mode (no watch)
- Exit with error code on failure

## 🐛 Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should hash password"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
