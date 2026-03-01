import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Find My Fitness',
  description: 'FindMyFitness.fit was created out of a real need—to make it easy to find gyms, studios, and trainers that align with your goals and connect you with communities that push you forward.',
  openGraph: {
    title: 'About Us | Find My Fitness',
    description: 'Our story, our mission, and why we built FindMyFitness.fit.',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <main className="content-wrapper">
      {/* Hero Section */}
      <section className="splash-screen">
        <h1>Our Story</h1>
        <p>Built from a real need. Designed for people who take fitness seriously.</p>
      </section>

      {/* The Story Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              The Story
            </h2>
            <div className="bg-gray-800 rounded-lg p-8 md:p-10 border border-gray-700 space-y-6">
              <p className="text-gray-300 text-lg leading-relaxed">
                <span className="text-violet-400 font-semibold">FindMyFitness.fit was created by my wife and I out of a real need in our own lives.</span>
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                Between the two of us, we have years of experience in fitness, training, and nutrition. Health has always been a priority—not just as a routine, but as a lifestyle. Whether we were training close to home or traveling, we kept running into the same challenge.
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                <span className="text-white font-medium">Finding a gym or studio that truly fit our needs shouldn't have been difficult—but it was.</span>
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                Too often, the options were outdated, inconsistent, or missing what mattered most: a strong community filled with motivated, like-minded people. We weren't just looking for equipment or classes—we were looking for environments that inspired consistency, accountability, and growth.
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                Every time we traveled, the process felt the same: searching endlessly, calling around, guessing—and sometimes settling. And as people who take fitness and nutrition seriously, <span className="text-violet-400 font-medium">settling never felt right.</span>
              </p>
              
              <div className="border-l-4 border-violet-500 pl-6 py-2 my-8">
                <p className="text-xl text-white font-semibold">
                  That's why we built FindMyFitness.fit.
                </p>
              </div>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                We created this platform for people who care about their health and want more than just a place to work out. It's for individuals, couples, travelers, and families who want access to gyms, studios, and trainers that align with their goals—and connect them with communities that push them forward.
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                <span className="text-white font-medium">Our goal is simple:</span> make it easy to stay consistent, inspired, and connected—wherever life takes you.
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                FindMyFitness.fit isn't about trends or shortcuts. It's about <span className="text-violet-400 font-medium">access, trust, and community</span>—because fitness works best when you're surrounded by people who inspire you to show up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Core Values
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            The principles that guide everything we do.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Community Matters */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-violet-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Community Matters</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                We believe fitness thrives in supportive, motivating environments. The right people, energy, and culture elevate everyone—and turn effort into momentum.
              </p>
            </div>

            {/* Trust is Earned */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-violet-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Trust is Earned</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                We hold ourselves, our platform, and our partners to a high standard. Accuracy, transparency, and integrity guide every decision we make.
              </p>
            </div>

            {/* Health is a Lifestyle */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-violet-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Health is a Lifestyle</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Fitness and nutrition aren't trends or quick fixes. They're daily choices that shape long-term strength, confidence, and well-being.
              </p>
            </div>

            {/* Consistency Drives Success */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-violet-500 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-violet-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Consistency Drives Success</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Real results come from showing up—again and again. We build tools and experiences that make it easier to stay committed, wherever life takes you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to find your fit?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join a community of people who take their health seriously and never settle for less.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/locations"
              className="inline-block px-8 py-4 bg-violet-500 hover:bg-violet-600 text-gray-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Find Locations
            </Link>
            <Link
              href="/contact"
              className="inline-block px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-lg transition-all duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
