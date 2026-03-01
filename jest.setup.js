import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return ({ src, alt, ...props }) => {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock window.fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock Google Maps
global.google = {
  maps: {
    places: {
      PlacesService: jest.fn(),
      PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS', ERROR: 'ERROR' },
    },
    Geocoder: jest.fn(),
    LatLng: jest.fn(),
    Map: jest.fn(),
    Marker: jest.fn(),
    SymbolPath: { CIRCLE: 0 },
    Size: jest.fn(),
    Point: jest.fn(),
  },
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockClear();
});

// Suppress console errors/warnings in tests (optional)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && 
        (args[0].includes('Warning: ReactDOM.render') ||
         args[0].includes('Warning: An update to') ||
         args[0].includes('act(...)'))) {
      return;
    }
    originalError.call(console, ...args);
  };
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('componentWillReceiveProps')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
