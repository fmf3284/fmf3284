/**
 * React Component Tests
 * Tests for Navbar, AdminBar, FitnessLocationCard, and other UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Reset fetch mock before each test
beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

// ═══════════════════════════════════════════════════════════════════════════
// NAVBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('Navbar Component', () => {

  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: false }),
    });
  });

  test('renders logo', async () => {
    const Navbar = (await import('@/components/Navbar')).default;
    render(<Navbar />);
    
    const logo = screen.getByAltText(/find my fitness/i);
    expect(logo).toBeInTheDocument();
  });

  test('renders navigation links', async () => {
    const Navbar = (await import('@/components/Navbar')).default;
    render(<Navbar />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  test('shows login icon when not authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: false }),
    });
    
    const Navbar = (await import('@/components/Navbar')).default;
    render(<Navbar />);
    
    await waitFor(() => {
      const loginLink = document.querySelector('a[href="/login"]');
      expect(loginLink).toBeInTheDocument();
    });
  });

  test('shows user menu when authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { name: 'Test User', email: 'test@example.com', role: 'user' },
      }),
    });
    
    const Navbar = (await import('@/components/Navbar')).default;
    render(<Navbar />);
    
    await waitFor(() => {
      expect(document.querySelector('button')).toBeInTheDocument();
    });
  });

  test('shows Admin link for admin users', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { name: 'Admin', email: 'admin@example.com', role: 'admin' },
      }),
    });
    
    const Navbar = (await import('@/components/Navbar')).default;
    render(<Navbar />);
    
    await waitFor(() => {
      const dropdownBtn = document.querySelector('button');
      if (dropdownBtn) fireEvent.click(dropdownBtn);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('AdminBar Component', () => {

  test('does not render for non-admin users', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { role: 'user' },
      }),
    });
    
    const AdminBar = (await import('@/components/AdminBar')).default;
    const { container } = render(<AdminBar />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('renders for admin users', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { role: 'admin' },
      }),
    });
    
    const AdminBar = (await import('@/components/AdminBar')).default;
    render(<AdminBar />);
    
    await waitFor(() => {
      expect(screen.getByText(/ADMIN MODE/i)).toBeInTheDocument();
    });
  });

  test('shows admin navigation links', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { role: 'admin' },
      }),
    });
    
    const AdminBar = (await import('@/components/AdminBar')).default;
    render(<AdminBar />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Users/i)).toBeInTheDocument();
      expect(screen.getByText(/Reviews/i)).toBeInTheDocument();
      expect(screen.getByText(/Logs/i)).toBeInTheDocument();
    });
  });

  test('can be minimized', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { role: 'admin' },
      }),
    });
    
    const AdminBar = (await import('@/components/AdminBar')).default;
    render(<AdminBar />);
    
    await waitFor(() => {
      expect(screen.getByText(/ADMIN MODE/i)).toBeInTheDocument();
    });
    
    const minimizeBtn = screen.getByTitle(/minimize/i);
    fireEvent.click(minimizeBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Show Admin Bar/i)).toBeInTheDocument();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FITNESS LOCATION CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('FitnessLocationCard Component', () => {

  const mockLocation = {
    id: '1',
    place_id: 'place_123',
    name: 'Test Gym',
    vicinity: '123 Test Street',
    rating: 4.5,
    user_ratings_total: 100,
    types: ['gym', 'health'],
    geometry: {
      location: { lat: 40.7128, lng: -74.0060 },
    },
    opening_hours: { open_now: true },
    photos: [],
    memberRating: 4.2,
    memberReviewCount: 25,
  };

  test('renders location name', async () => {
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={mockLocation} isLoggedIn={false} />);
    
    expect(screen.getByText('Test Gym')).toBeInTheDocument();
  });

  test('renders location address', async () => {
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={mockLocation} isLoggedIn={false} />);
    
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
  });

  test('renders Google rating', async () => {
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={mockLocation} isLoggedIn={false} />);
    
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  test('shows open status', async () => {
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={mockLocation} isLoggedIn={false} />);
    
    expect(screen.getByText(/Open/i)).toBeInTheDocument();
  });

  test('shows member reviews when logged in', async () => {
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={mockLocation} isLoggedIn={true} />);
    
    expect(screen.getByText('4.2')).toBeInTheDocument();
  });

  test('hides member reviews when not logged in', async () => {
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={mockLocation} isLoggedIn={false} />);
    
    expect(screen.queryByText('Member Rating')).not.toBeInTheDocument();
  });

  test('handles missing rating gracefully', async () => {
    const locationWithoutRating = { ...mockLocation, rating: undefined };
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={locationWithoutRating} isLoggedIn={false} />);
    
    expect(screen.getByText('Test Gym')).toBeInTheDocument();
  });

  test('shows closed status when not open', async () => {
    const closedLocation = { 
      ...mockLocation, 
      opening_hours: { open_now: false } 
    };
    const FitnessLocationCard = (await import('@/components/FitnessLocationCard')).default;
    render(<FitnessLocationCard location={closedLocation} isLoggedIn={false} />);
    
    expect(screen.getByText(/Closed/i)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('Footer Component', () => {

  test('renders footer links', async () => {
    const Footer = (await import('@/components/Footer')).default;
    render(<Footer />);
    
    expect(screen.getByText(/Privacy/i)).toBeInTheDocument();
    expect(screen.getByText(/Terms/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
  });

  test('renders copyright', async () => {
    const Footer = (await import('@/components/Footer')).default;
    render(<Footer />);
    
    expect(screen.getByText(/Find My Fitness/i)).toBeInTheDocument();
  });

  test('renders current year', async () => {
    const Footer = (await import('@/components/Footer')).default;
    render(<Footer />);
    
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('ErrorBoundary Component', () => {

  const ThrowError = () => {
    throw new Error('Test error');
  };

  test('renders children when no error', async () => {
    const ErrorBoundary = (await import('@/components/ErrorBoundary')).default;
    
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders error UI when error thrown', async () => {
    const ErrorBoundary = (await import('@/components/ErrorBoundary')).default;
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGOUT BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('LogoutButton Component', () => {

  test('renders logout button', async () => {
    const LogoutButton = (await import('@/components/LogoutButton')).default;
    render(<LogoutButton />);
    
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  test('calls logout API on click', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    const LogoutButton = (await import('@/components/LogoutButton')).default;
    render(<LogoutButton />);
    
    const button = screen.getByText(/logout/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.any(Object));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADDRESS AUTOCOMPLETE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('AddressAutocomplete Component', () => {

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  test('renders input field', async () => {
    const AddressAutocomplete = (await import('@/components/AddressAutocomplete')).default;
    render(<AddressAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText(/address/i);
    expect(input).toBeInTheDocument();
  });

  test('accepts user input', async () => {
    const AddressAutocomplete = (await import('@/components/AddressAutocomplete')).default;
    render(<AddressAutocomplete onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText(/address/i);
    fireEvent.change(input, { target: { value: '123 Main St' } });
    
    expect(input).toHaveValue('123 Main St');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY CAROUSEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('CategoryCarousel Component', () => {

  test('renders category cards', async () => {
    const CategoryCarousel = (await import('@/components/CategoryCarousel')).default;
    render(<CategoryCarousel />);
    
    expect(screen.getByText(/Gym/i)).toBeInTheDocument();
    expect(screen.getByText(/Yoga/i)).toBeInTheDocument();
    expect(screen.getByText(/Pilates/i)).toBeInTheDocument();
  });

  test('renders category images', async () => {
    const CategoryCarousel = (await import('@/components/CategoryCarousel')).default;
    render(<CategoryCarousel />);
    
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE MAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
describe('GoogleMap Component', () => {

  const mockPlaces = [
    {
      place_id: '1',
      name: 'Test Gym',
      geometry: { location: { lat: () => 40.7128, lng: () => -74.0060 } },
      types: ['gym'],
    },
    {
      place_id: '2',
      name: 'Yoga Studio',
      geometry: { location: { lat: () => 40.7130, lng: () => -74.0065 } },
      types: ['yoga'],
    },
  ];

  test('renders map container', async () => {
    const GoogleMap = (await import('@/components/GoogleMap')).default;
    render(
      <GoogleMap 
        center={{ lat: 40.7128, lng: -74.0060 }} 
        places={mockPlaces}
        onPlaceSelect={jest.fn()}
      />
    );
    
    const mapContainer = document.querySelector('[style*="height"]');
    expect(mapContainer).toBeInTheDocument();
  });
});
