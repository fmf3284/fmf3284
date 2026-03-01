'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type PlanTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface User {
  id: string;
  name: string;
  email: string;
}

const planPrices: Record<PlanTier, { price: number; original?: number }> = {
  bronze: { price: 9.99 },
  silver: { price: 19.99 },
  gold: { price: 29.99 },
  platinum: { price: 49.99 },
};

export default function JoinPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('platinum');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    card_number: '',
    card_expiry: '',
    card_cvc: '',
  });

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      alert(`Thank you ${user.name}! Your ${selectedPlan.toUpperCase()} membership ($${planPrices[selectedPlan].price}/mo) is being processed.`);
      setProcessing(false);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Format card number with spaces
    if (e.target.name === 'card_number') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    
    // Format expiry date
    if (e.target.name === 'card_expiry') {
      value = value.replace(/\D/g, '').substring(0, 4);
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const scrollToPayment = () => {
    document.getElementById('payment')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Become a Member. Find Your Fitness Anywhere.</h1>
        <button
          onClick={scrollToPayment}
          className="inline-block px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg mt-4"
        >
          Join Now
        </button>
      </section>

      {/* Founders Discount Banner */}
      <section className="py-8 bg-gradient-to-r from-violet-500 to-violet-600">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="text-gray-900 font-bold text-xl">
            🎉 Founders Discount: Be one of the first 200 to sign up and get 25% off your plan for life!
          </p>
        </div>
      </section>

      {/* Membership Tiers */}
      <section id="membership-tiers" className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Membership Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bronze Plan */}
            <div className={`bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 ${selectedPlan === 'bronze' ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-gray-700 hover:border-violet-500'}`}>
              <h3 className="text-2xl font-bold text-white mb-2">Bronze</h3>
              <p className="text-4xl font-bold text-violet-500 mb-6">
                $9.99<span className="text-lg text-gray-400">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  5 Location Searches
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic Blog Access
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Limited Event Viewing
                </li>
              </ul>
              <button
                onClick={() => { setSelectedPlan('bronze'); scrollToPayment(); }}
                className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${selectedPlan === 'bronze' ? 'bg-violet-500 text-gray-900' : 'bg-gray-700 hover:bg-violet-500 text-white hover:text-gray-900'}`}
              >
                {selectedPlan === 'bronze' ? '✓ Selected' : 'Select Bronze'}
              </button>
            </div>

            {/* Silver Plan */}
            <div className={`bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 ${selectedPlan === 'silver' ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-gray-700 hover:border-violet-500'}`}>
              <h3 className="text-2xl font-bold text-white mb-2">Silver</h3>
              <p className="text-4xl font-bold text-violet-500 mb-6">
                $19.99<span className="text-lg text-gray-400">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  10 Location Searches
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full Blog Access
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full Event Viewing
                </li>
              </ul>
              <button
                onClick={() => { setSelectedPlan('silver'); scrollToPayment(); }}
                className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${selectedPlan === 'silver' ? 'bg-violet-500 text-gray-900' : 'bg-gray-700 hover:bg-violet-500 text-white hover:text-gray-900'}`}
              >
                {selectedPlan === 'silver' ? '✓ Selected' : 'Select Silver'}
              </button>
            </div>

            {/* Gold Plan */}
            <div className={`bg-gray-800 rounded-lg p-6 border-2 transition-all duration-300 ${selectedPlan === 'gold' ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-gray-700 hover:border-violet-500'}`}>
              <h3 className="text-2xl font-bold text-white mb-2">Gold</h3>
              <p className="text-4xl font-bold text-violet-500 mb-6">
                $29.99<span className="text-lg text-gray-400">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  15 Location Searches
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full Blog Access
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full Event Viewing
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Exclusive Deals
                </li>
              </ul>
              <button
                onClick={() => { setSelectedPlan('gold'); scrollToPayment(); }}
                className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${selectedPlan === 'gold' ? 'bg-violet-500 text-gray-900' : 'bg-gray-700 hover:bg-violet-500 text-white hover:text-gray-900'}`}
              >
                {selectedPlan === 'gold' ? '✓ Selected' : 'Select Gold'}
              </button>
            </div>

            {/* Platinum Plan - Most Popular */}
            <div className={`bg-gray-800 rounded-lg p-6 border-2 relative transition-all duration-300 ${selectedPlan === 'platinum' ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-violet-500 hover:border-violet-400'}`}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-violet-500 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Platinum</h3>
              <p className="text-4xl font-bold text-violet-500 mb-6">
                $49.99<span className="text-lg text-gray-400">/mo</span>
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <strong className="text-white">Unlimited</strong>&nbsp;Location Searches
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full Blog & Event Access
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Premium Deals & Discounts
                </li>
                <li className="flex items-start text-gray-300">
                  <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority Support
                </li>
              </ul>
              <button
                onClick={() => { setSelectedPlan('platinum'); scrollToPayment(); }}
                className={`w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${selectedPlan === 'platinum' ? 'bg-violet-500 text-gray-900' : 'bg-violet-600 hover:bg-violet-500 text-white hover:text-gray-900'}`}
              >
                {selectedPlan === 'platinum' ? '✓ Selected' : 'Select Platinum'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Section */}
      <section id="payment" className="py-16 bg-gray-900">
        <div className="max-w-xl mx-auto px-4">
          {loading ? (
            // Loading state
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : user ? (
            // LOGGED IN - Show payment form
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-violet-500 text-center mb-2">
                Complete Your Membership
              </h2>
              <p className="text-gray-400 text-center mb-8">
                You're signed in as <span className="text-white font-medium">{user.email}</span>
              </p>

              {/* User Info Display */}
              <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-500 rounded-full flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Selected Plan Summary */}
              <div className="bg-violet-500/10 rounded-lg p-4 mb-6 border border-violet-500/30">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium capitalize">{selectedPlan} Plan</p>
                    <p className="text-gray-400 text-sm">Billed monthly</p>
                  </div>
                  <p className="text-2xl font-bold text-violet-500">${planPrices[selectedPlan].price}/mo</p>
                </div>
              </div>

              {/* Plan Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Change Plan</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(['bronze', 'silver', 'gold', 'platinum'] as PlanTier[]).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`px-3 py-2 rounded-lg border-2 font-medium capitalize transition-all ${
                        selectedPlan === plan
                          ? 'border-violet-500 bg-violet-500 text-gray-900'
                          : 'border-gray-700 text-gray-300 hover:border-violet-500'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="card_number" className="block text-white font-medium mb-2">
                      Card Number <span className="text-violet-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="card_number"
                      name="card_number"
                      value={formData.card_number}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      required
                      maxLength={19}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card_expiry" className="block text-white font-medium mb-2">
                        Expiry Date <span className="text-violet-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="card_expiry"
                        name="card_expiry"
                        value={formData.card_expiry}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        required
                        maxLength={5}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="card_cvc" className="block text-white font-medium mb-2">
                        CVC <span className="text-violet-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="card_cvc"
                        name="card_cvc"
                        value={formData.card_cvc}
                        onChange={handleChange}
                        placeholder="123"
                        required
                        maxLength={4}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg mt-6 disabled:opacity-50 disabled:transform-none"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full"></div>
                    Processing...
                  </span>
                ) : (
                  `Pay $${planPrices[selectedPlan].price}/month`
                )}
              </button>

              <p className="text-gray-500 text-sm text-center mt-4">
                🔒 Secure payment • Cancel anytime
              </p>
            </form>
          ) : (
            // NOT LOGGED IN - Prompt to login/register
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <div className="bg-violet-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Sign In to Continue
              </h2>
              <p className="text-gray-400 mb-6">
                Please sign in or create an account to purchase a membership.
              </p>

              {/* Selected Plan Preview */}
              <div className="bg-violet-500/10 rounded-lg p-4 mb-6 border border-violet-500/30">
                <p className="text-gray-400 text-sm mb-1">Selected Plan</p>
                <p className="text-white font-semibold capitalize text-lg">{selectedPlan} - ${planPrices[selectedPlan].price}/mo</p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full px-6 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold rounded-lg transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all duration-300"
                >
                  Create Account
                </Link>
              </div>

              <p className="text-gray-500 text-sm mt-6">
                After signing in, you'll return here to complete your purchase.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Join?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-violet-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Find Anywhere</h3>
              <p className="text-gray-400">Search fitness centers in any location, anytime</p>
            </div>

            <div className="text-center">
              <div className="bg-violet-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Exclusive Content</h3>
              <p className="text-gray-400">Access blogs, tips, and fitness resources</p>
            </div>

            <div className="text-center">
              <div className="bg-violet-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Special Events</h3>
              <p className="text-gray-400">Get invited to exclusive fitness events</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
