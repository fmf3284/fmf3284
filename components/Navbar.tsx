'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/locations', label: 'Locations' },
  { href: '/blog', label: 'Blog' },
  { href: '/deals', label: 'Deals' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

const linkStyles = "block py-2 px-3 text-gray-300 rounded hover:bg-violet-900/30 md:hover:bg-transparent md:hover:text-violet-400 md:p-0 transition-all duration-300 font-medium";

const NavLink = memo(({ href, label, onClick }: { href: string; label: string; onClick: () => void }) => (
  <li>
    <Link href={href} className={linkStyles} onClick={onClick} prefetch={false}>
      {label}
    </Link>
  </li>
));
NavLink.displayName = 'NavLink';

const UserMenuItem = memo(({ href, label, onClick }: { href: string; label: string; onClick: () => void }) => (
  <li>
    <Link
      href={href}
      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white transition-colors"
      onClick={onClick}
      prefetch={false}
    >
      {label}
    </Link>
  </li>
));
UserMenuItem.displayName = 'UserMenuItem';

function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const toggleDropdown = useCallback(() => setIsDropdownOpen(prev => !prev), []);

  // Check auth status on mount and when storage changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user) {
          setIsLoggedIn(true);
          setUserName(data.user.name);
          setIsAdmin(data.user.role === 'admin' || data.user.role === 'super_admin');
        } else {
          setIsLoggedIn(false);
          setUserName('');
          setIsAdmin(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserName('');
        setIsAdmin(false);
      }
    };
    
    checkAuth();
    
    // Listen for storage changes (for logout in other tabs)
    window.addEventListener('storage', checkAuth);
    
    // Re-check on focus (when user returns to tab after login)
    window.addEventListener('focus', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('focus', checkAuth);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    
    setIsLoggedIn(false);
    setUserName('');
    setIsAdmin(false);
    closeDropdown();
    closeMenu();
    router.push('/');
    router.refresh();
  }, [router, closeDropdown, closeMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <nav className="bg-gradient-to-r from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] text-white fixed w-full z-50 top-0 left-0 border-b border-violet-900/30 shadow-lg shadow-violet-900/10 backdrop-blur-sm">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-3">
        <Link
          href="/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
          prefetch={false}
          aria-label="Find My Fitness Home"
        >
          <Image
            src="/assets/img/logo.png"
            alt="Find My Fitness Logo"
            width={320}
            height={320}
            className="h-32 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              type="button"
              className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 transition-transform hover:scale-105"
              aria-expanded={isDropdownOpen}
              aria-label="User menu"
            >
              <span className="sr-only">Open user menu</span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isLoggedIn ? 'bg-violet-600' : 'bg-gray-600 dark:bg-gray-700'}`}>
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="z-50 absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 dark:bg-gray-700 dark:divide-gray-600 animate-in fade-in slide-in-from-top-2 duration-200">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-600">
                      <div className="font-medium truncate">{userName}</div>
                      {isAdmin && (
                        <div className="text-xs text-violet-400 mt-1">Administrator</div>
                      )}
                    </div>
                    <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                      <UserMenuItem href="/dashboard" label="Dashboard" onClick={closeDropdown} />
                      <UserMenuItem href="/profile" label="Profile" onClick={closeDropdown} />
                      {isAdmin && (
                        <li>
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold transition-colors"
                            onClick={closeDropdown}
                            prefetch={false}
                          >
                            ⚙️ Admin Panel
                          </Link>
                        </li>
                      )}
                      <UserMenuItem href="/help" label="Help" onClick={closeDropdown} />
                    </ul>
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                    <UserMenuItem href="/login" label="Login" onClick={closeDropdown} />
                    <UserMenuItem href="/register" label="Register" onClick={closeDropdown} />
                    <UserMenuItem href="/help" label="Help" onClick={closeDropdown} />
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            onClick={toggleMenu}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 transition-colors"
            aria-controls="navbar-user"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
            </svg>
          </button>
        </div>

        <div
          className={`${
            isMenuOpen ? 'block' : 'hidden'
          } w-full md:block md:w-auto md:order-1`}
          id="navbar-user"
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-700 rounded-lg bg-gray-800 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
            {navLinks.map(link => (
              <NavLink key={link.href} {...link} onClick={closeMenu} />
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default memo(Navbar);
