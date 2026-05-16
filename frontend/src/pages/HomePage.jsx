import { Link } from 'react-router-dom';
import { Wrench, Star, Shield, Clock, ChevronRight, CheckCircle } from 'lucide-react';

const SERVICES = [
  { icon: '🔧', name: 'Plumbing' },
  { icon: '⚡', name: 'Electrical' },
  { icon: '🧹', name: 'Cleaning' },
  { icon: '🪚', name: 'Carpentry' },
  { icon: '🎨', name: 'Painting' },
  { icon: '❄️', name: 'HVAC' },
  { icon: '🌿', name: 'Landscaping' },
  { icon: '🔌', name: 'Appliance Repair' },
];

const FEATURES = [
  { icon: Shield, title: 'Verified Professionals', desc: 'All workers undergo background checks and credential verification.' },
  { icon: Clock, title: 'Book Anytime', desc: 'Schedule services at your convenience, 24/7.' },
  { icon: Star, title: 'Rated & Reviewed', desc: 'Read real reviews from real customers before booking.' },
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-blue-950 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-400 rounded-xl flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="text-white font-extrabold text-lg">ServiceHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-blue-300 hover:text-white text-sm font-medium transition-colors">Sign In</Link>
            <Link to="/register" className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-600/40 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
            <CheckCircle size={14} className="text-emerald-400" />
            Trusted by hundreds of homeowners
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            Home Services,<br />
            <span className="text-blue-300">Simplified.</span>
          </h1>
          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            Book verified, professional home service workers in minutes. Plumbing, electrical, cleaning, and more — all in one platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="bg-white text-blue-900 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-lg flex items-center gap-2">
              Book a Service <ChevronRight size={20} />
            </Link>
            <Link to="/register-worker" className="border-2 border-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-800 transition-colors text-lg">
              Become a Worker
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Services</h2>
            <p className="text-gray-500 text-lg">Find professionals for every home need.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICES.map(s => (
              <div key={s.name} className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100 hover:border-blue-200">
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose ServiceHub?</h2>
            <p className="text-gray-500 text-lg">We make home services reliable and stress-free.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={26} className="text-blue-700" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-950 py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-blue-300 mb-8 text-lg">Join ServiceHub today — free for customers.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="bg-white text-blue-900 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-lg">
            Create Free Account
          </Link>
          <Link to="/login" className="border-2 border-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-800 transition-colors text-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} ServiceHub. All rights reserved. | BSIT Capstone Project</p>
      </footer>
    </div>
  );
};

export default HomePage;
