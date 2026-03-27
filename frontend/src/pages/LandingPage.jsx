import { Link } from 'react-router-dom';
import { BarChart3, Zap, Shield, Bell, TrendingUp, Smartphone, Users, Award, ArrowRight, Star } from 'lucide-react';
import { useEffect, useRef } from 'react';

const FEATURES = [
  { icon: <BarChart3 className="w-8 h-8" />, title: 'Advanced Charts', desc: '50+ technical indicators, multiple timeframes, pattern recognition, and real-time chart updates.', color: 'text-blue-400' },
  { icon: <Zap className="w-8 h-8" />, title: 'Lightning Fast', desc: 'Sub-millisecond order execution with 99.9% uptime. Trade with confidence during market volatility.', color: 'text-yellow-400' },
  { icon: <Shield className="w-8 h-8" />, title: 'Bank-Grade Security', desc: '256-bit SSL encryption, 2FA authentication, SEBI-compliant infrastructure with daily backups.', color: 'text-green-400' },
  { icon: <Bell className="w-8 h-8" />, title: 'Smart Alerts', desc: 'Customizable price alerts, order notifications, P&L updates delivered instantly to your device.', color: 'text-purple-400' },
  { icon: <TrendingUp className="w-8 h-8" />, title: 'Real-Time Data', desc: 'Live NSE/BSE quotes, market depth, bid-ask spread, and comprehensive market analytics.', color: 'text-cyan-400' },
  { icon: <Smartphone className="w-8 h-8" />, title: 'Mobile Trading', desc: 'Full-featured iOS and Android apps. Trade anywhere, anytime with complete portfolio control.', color: 'text-pink-400' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register Free', desc: 'Create your account in 2 minutes with basic details. Zero charges for account opening.' },
  { step: '02', title: 'Complete KYC', desc: 'Upload PAN, Aadhaar and bank details. Our automated KYC verifies in minutes.' },
  { step: '03', title: 'Start Trading', desc: 'Add funds to wallet and start investing in stocks, ETFs, and mutual funds.' },
];

const TESTIMONIALS = [
  { name: 'Rajesh Kumar', role: 'Day Trader', text: 'Best platform for intraday trading. Super fast execution and zero downtime during market hours.', rating: 5 },
  { name: 'Priya Sharma', role: 'Long-term Investor', text: 'Love the clean interface and detailed portfolio analytics. Perfect for serious investors.', rating: 5 },
  { name: 'Amit Patel', role: 'Beginner', text: 'As a beginner, I found the educational content and demo mode extremely helpful. Highly recommend!', rating: 5 },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );

    [heroRef, featuresRef, howItWorksRef, testimonialsRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-[#f0f4ff] overflow-x-hidden" style={{ pointerEvents: 'auto' }}>
      {/* Gradient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00d084]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Topnav with Glassmorphism */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-bg-primary/70 backdrop-blur-xl px-6 lg:px-12 py-4 flex items-center justify-between shadow-lg shadow-black/5">
        <div>
          <div className="text-xl font-bold text-[#00d084]">TradeX</div>
          <div className="text-[9px] text-[#4a5580] tracking-widest uppercase -mt-0.5">India</div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#8b9cc8]">
          <Link to="/features" className="hover:text-white transition-colors">Features</Link>
          <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link to="/about" className="hover:text-white transition-colors">About</Link>
          <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/login" className="btn-ghost text-sm px-4 py-2">Login</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">Open Account</Link>
        </div>
      </nav>

      {/* Hero Section with Premium Gradients */}
      <section ref={heroRef} className="relative overflow-hidden px-6 py-20 lg:py-32 opacity-0 translate-y-8 transition-all duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00d084]/5 via-emerald-400/5 to-cyan-400/5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#00d084]/50 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00d084]/10 to-emerald-400/10 border border-[#00d084]/20 backdrop-blur-sm text-[#00d084] px-5 py-2.5 rounded-full text-xs font-semibold mb-8 shadow-lg shadow-[#00d084]/10">
            🇮🇳 India's Most Trusted Trading Platform
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Trade Smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d084] via-emerald-400 to-cyan-400">Grow Faster.</span>
          </h1>
          <p className="text-xl text-[#8b9cc8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Zero brokerage on equity delivery. Advanced charting tools. Lightning-fast execution. 
            Built for modern Indian investors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register" className="group btn-primary text-base px-8 py-4 rounded-xl w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-[#00d084]/25 hover:shadow-[#00d084]/40 transition-all duration-300">
              Start Investing Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-ghost text-base px-8 py-4 rounded-xl w-full sm:w-auto backdrop-blur-sm border border-border/50 hover:border-[#00d084]/30 transition-all duration-300">
              View Demo
            </Link>
          </div>
          
          {/* Stats with Glassmorphism */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '2.4M+', label: 'Active Traders' },
              { value: '₹12,000 Cr', label: 'Daily Volume' },
              { value: '0.03s', label: 'Order Speed' },
              { value: '₹0', label: 'Delivery Brokerage' }
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300 border border-white/5">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#00d084] to-emerald-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-[#4a5580] mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Glassmorphism */}
      <section ref={featuresRef} className="px-6 lg:px-16 py-20 bg-gradient-to-b from-bg-secondary/30 to-bg-primary opacity-0 translate-y-8 transition-all duration-700 delay-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-[#00d084] to-emerald-400 bg-clip-text text-transparent">Everything You Need to Trade</h2>
            <p className="text-[#8b9cc8] text-lg">Professional-grade tools designed for every type of investor</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="glass-card group hover:bg-bg-tertiary/50 hover:border-[#00d084]/30 transition-all duration-300 cursor-default rounded-2xl p-6 backdrop-blur-sm border border-white/5 shadow-lg shadow-black/5 hover:shadow-[#00d084]/10">
                <div className={`mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>{feature.icon}</div>
                <div className="font-semibold mb-2 text-lg">{feature.title}</div>
                <div className="text-sm text-[#8b9cc8] leading-relaxed">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with Gradient Steps */}
      <section ref={howItWorksRef} className="px-6 lg:px-16 py-20 opacity-0 translate-y-8 transition-all duration-700 delay-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Start Trading in 3 Simple Steps</h2>
            <p className="text-[#8b9cc8] text-lg">From registration to your first trade in minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={item.step} className="relative group">
                {idx < 2 && <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#00d084]/20 to-transparent"></div>}
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#00d084]/20 to-emerald-400/10 border-2 border-[#00d084]/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#00d084]/20">
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#00d084] to-emerald-400 bg-clip-text text-transparent">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-[#8b9cc8] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials with Glass Cards */}
      <section ref={testimonialsRef} className="px-6 lg:px-16 py-20 bg-gradient-to-b from-bg-primary to-bg-secondary/30 opacity-0 translate-y-8 transition-all duration-700 delay-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-[#00d084] to-emerald-400 bg-clip-text text-transparent">Trusted by 2.4M+ Investors</h2>
            <p className="text-[#8b9cc8] text-lg">See what our users have to say</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card hover:bg-bg-tertiary/50 transition-all duration-300 rounded-2xl p-6 backdrop-blur-sm border border-white/5 shadow-lg shadow-black/5">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-[#8b9cc8] mb-6 italic leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d084]/20 to-emerald-400/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#00d084]" />
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-[#4a5580]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Premium Gradient */}
      <section className="mx-6 lg:mx-16 my-20 bg-gradient-to-br from-[#00d084]/15 via-emerald-400/10 to-cyan-400/10 border border-[#00d084]/30 rounded-3xl p-16 text-center backdrop-blur-sm shadow-2xl shadow-[#00d084]/10">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-[#00d084] to-emerald-400 bg-clip-text text-transparent">Open Your Free Demat Account</h2>
        <p className="text-[#8b9cc8] mb-8 text-lg">Join 2.4M+ investors. KYC in 5 minutes. Zero delivery brokerage.</p>
        <Link to="/register" className="btn-primary text-base px-10 py-4 rounded-xl inline-flex shadow-lg shadow-[#00d084]/25 hover:shadow-[#00d084]/40 transition-all duration-300">
          Get Started — It's Free
        </Link>
      </section>

      {/* Modern Multi-Column Footer */}
      <footer className="border-t border-border/50 bg-gradient-to-b from-bg-primary to-bg-secondary/50 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-[#00d084] to-emerald-400 bg-clip-text text-transparent">TradeX</div>
                  <div className="text-[9px] text-[#4a5580] tracking-widest uppercase">India</div>
                </div>
              </div>
              <p className="text-xs text-[#8b9cc8] leading-relaxed mb-4">
                India's most trusted trading platform. SEBI Registered Broker. Join 2.4M+ investors today.
              </p>
              <div className="flex gap-3">
                {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((social) => (
                  <a key={social} href="#" className="w-9 h-9 rounded-full bg-bg-tertiary border border-border/50 flex items-center justify-center hover:border-[#00d084]/50 hover:bg-[#00d084]/10 transition-all duration-300">
                    <span className="text-xs text-[#8b9cc8]">{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm">Platform</h4>
              <ul className="space-y-3 text-xs text-[#8b9cc8]">
                <li><Link to="/features" className="hover:text-[#00d084] transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-[#00d084] transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-[#00d084] transition-colors">Mobile App</a></li>
                <li><a href="#" className="hover:text-[#00d084] transition-colors">API Access</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-xs text-[#8b9cc8]">
                <li><Link to="/about" className="hover:text-[#00d084] transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-[#00d084] transition-colors">Blog</Link></li>
                <li><a href="#" className="hover:text-[#00d084] transition-colors">Careers</a></li>
                <li><Link to="/contact" className="hover:text-[#00d084] transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm">Support</h4>
              <ul className="space-y-3 text-xs text-[#8b9cc8]">
                <li><Link to="/faq" className="hover:text-[#00d084] transition-colors">Help Center</Link></li>
                <li><Link to="/security" className="hover:text-[#00d084] transition-colors">Security</Link></li>
                <li><a href="#" className="hover:text-[#00d084] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#00d084] transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8">
            <div className="grid md:grid-cols-3 gap-6 text-xs text-[#4a5580]">
              <div>
                <div className="text-[#8b9cc8] font-semibold mb-2">Registered Office:</div>
                <div>TradeX India Pvt Ltd<br />Bangalore, Karnataka, India</div>
              </div>
              <div className="text-center">
                <div className="text-[#8b9cc8] font-semibold mb-2">SEBI Registration:</div>
                <div>INZ000000000<br />Demo Platform - Not Real Trading</div>
              </div>
              <div className="text-right">
                <div className="text-[#8b9cc8] font-semibold mb-2">Contact:</div>
                <div>support@tradex.in<br />+91 80 1234 5678</div>
              </div>
            </div>
            <div className="mt-8 text-center text-xs text-[#4a5580]">
              © 2025 TradeX India Pvt Ltd. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
