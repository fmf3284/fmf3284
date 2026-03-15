import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { CategoryCarousel, LocationsCarousel, MapSection } from '@/components/ClientDynamicWrapper';

export const metadata: Metadata = {
  title: 'Find Your Fitness Anywhere | Find My Fitness',
  description: 'Discover the perfect workout for you, wherever you are. Browse gyms, yoga studios, personal trainers, and more.',
  openGraph: {
    title: 'Find Your Fitness Anywhere',
    description: 'Discover the perfect workout for you, wherever you are.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <main className="content-wrapper">
      {/* Hero Section with Video/Image Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#0f0f1a]" />
        
        {/* Animated Accent Elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-gray-200">Trusted by 50,000+ fitness enthusiasts</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight tracking-tight">
            <span className="text-white">Find Your</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Perfect Fitness
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            Discover gyms, yoga studios, personal trainers, and more — all in one place. Your fitness journey starts here.
          </p>
          
          {/* Search Bar Style CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto mb-8">
            <Link
              href="/locations"
              className="flex-1 px-8 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-2xl hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/30 text-lg"
            >
              🔍 Explore Locations
            </Link>
            <Link
              href="/register"
              className="flex-1 px-8 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all duration-300 text-lg"
            >
              Join Free →
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free to use
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              10,000+ locations
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Real reviews
            </span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0f0f1a]">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Why Choose Find My Fitness?
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to discover, compare, and join the best fitness spots near you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🗺️"
              title="Discover Nearby"
              description="Find gyms, studios, and trainers in your area with our interactive map and smart search."
            />
            <FeatureCard
              icon="⭐"
              title="Real Reviews"
              description="Read honest reviews from real members to make informed decisions about where to train."
            />
            <FeatureCard
              icon="💰"
              title="Exclusive Deals"
              description="Access special offers and discounts from top fitness facilities in your city."
            />
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="categories-section animate-pulse bg-[#1a1a2e] h-96" />}>
        <CategoryCarousel />
      </Suspense>

      <Suspense fallback={<div className="locations-section animate-pulse bg-[#1a1a2e] h-96" />}>
        <LocationsCarousel />
      </Suspense>

      <Suspense fallback={<div className="map-section animate-pulse bg-[#1a1a2e] h-96" />}>
        <MapSection />
      </Suspense>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-gray-400 text-center mb-12">Three simple steps to find your fitness home</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Search"
              description="Enter your location and browse thousands of fitness options near you."
            />
            <StepCard
              number="2"
              title="Compare"
              description="Read reviews, check amenities, and compare prices to find the perfect fit."
            />
            <StepCard
              number="3"
              title="Join"
              description="Contact facilities directly or claim exclusive deals through our platform."
            />
          </div>
        </div>
      </section>

      {/* Blog & Deals Section */}
      <section className="py-20 bg-[#0f0f1a]">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Resources & Savings
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Blog Tile */}
            <Link
              href="/blog"
              className="group relative rounded-3xl overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <div className="relative z-10 p-10 min-h-[300px] flex flex-col justify-end">
                <span className="text-violet-400 font-semibold mb-2">FITNESS BLOG</span>
                <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                  Tips, Guides & Inspiration
                </h3>
                <p className="text-gray-300 mb-4">
                  Expert advice to elevate your fitness journey
                </p>
                <span className="inline-flex items-center text-white font-semibold group-hover:gap-3 gap-2 transition-all">
                  Read Articles 
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Deals Tile */}
            <Link
              href="/deals"
              className="group relative rounded-3xl overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <div className="relative z-10 p-10 min-h-[300px] flex flex-col justify-end">
                <span className="text-orange-400 font-semibold mb-2">EXCLUSIVE DEALS</span>
                <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                  Save on Memberships
                </h3>
                <p className="text-gray-300 mb-4">
                  Special offers on gyms, classes, and training sessions
                </p>
                <span className="inline-flex items-center text-white font-semibold group-hover:gap-3 gap-2 transition-all">
                  View Deals
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10K+', label: 'Fitness Locations' },
              { number: '50K+', label: 'Active Members' },
              { number: '500+', label: 'Cities Covered' },
              { number: '4.9⭐', label: 'Average Rating' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-6xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0f0f1a]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> Fitness Journey</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of members who've found their perfect workout spot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-2xl hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-300 transform hover:scale-105 text-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/locations"
              className="px-10 py-5 bg-white/5 border-2 border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 text-lg"
            >
              Browse Locations
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gradient-to-br from-[#1e1e2d] to-[#2a2a3d] rounded-2xl p-8 border border-violet-900/30 hover:border-violet-500/50 transition-all duration-300 group">
      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
