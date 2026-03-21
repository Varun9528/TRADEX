import { Link } from 'react-router-dom';
import { Target, Eye, Award, Users, TrendingUp, Shield } from 'lucide-react';

const VALUES = [
  { icon: <Target className="w-12 h-12" />, title: 'Our Mission', desc: 'To democratize investing in India by making it accessible, affordable, and empowering for everyone.' },
  { icon: <Eye className="w-12 h-12" />, title: 'Our Vision', desc: 'To become India\'s most trusted and innovative financial services platform.' },
  { icon: <Award className="w-12 h-12" />, title: 'Excellence', desc: 'We strive for excellence in everything we do, from technology to customer service.' },
];

const STATS = [
  { value: '2.4M+', label: 'Happy Customers' },
  { value: '₹12,000 Cr', label: 'Daily Volume' },
  { value: '15+', label: 'Years Experience' },
  { value: '500+', label: 'Team Members' },
];

const WHY_US = [
  { icon: <TrendingUp className="w-8 h-8" />, title: 'Market Leader', desc: "India's fastest-growing brokerage with 2.4M+ active traders trusting us daily." },
  { icon: <Shield className="w-8 h-8" />, title: 'Secure & Compliant', desc: 'SEBI registered broker with bank-grade security and 99.9% uptime.' },
  { icon: <Users className="w-8 h-8" />, title: 'Customer First', desc: '24/7 support, educational resources, and tools designed for your success.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-[#f0f4ff]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/90 backdrop-blur-md px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div>
            <div className="text-xl font-bold text-[#00d084]">TradeX</div>
            <div className="text-[9px] text-[#4a5580] tracking-widest uppercase -mt-0.5">India</div>
          </div>
        </Link>
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

      {/* Hero */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6">Building India's Most Trusted Trading Platform</h1>
          <p className="text-xl text-[#8b9cc8] leading-relaxed">
            Founded in 2020, TradeX India is revolutionizing how Indians invest and trade. 
            We combine cutting-edge technology with deep market expertise to empower millions of investors.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-[#00d084] mb-2">{stat.value}</div>
                <div className="text-sm text-[#4a5580]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 lg:px-12 pb-20 bg-bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {VALUES.map((value) => (
              <div key={value.title} className="card text-center hover:bg-bg-tertiary transition-all">
                <div className="text-[#00d084] flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-sm text-[#8b9cc8] leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Why Choose TradeX India?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {WHY_US.map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-[#00d084] flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-[#8b9cc8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="mx-6 lg:px-12 mb-20">
        <div className="bg-gradient-to-br from-[#00d084]/10 to-emerald-400/5 border border-[#00d084]/20 rounded-3xl p-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-[#8b9cc8] leading-relaxed">
              <p>
                TradeX India was born from a simple idea: investing should be accessible, affordable, and empowering for every Indian.
              </p>
              <p>
                Our founders, veterans of the financial services industry, saw firsthand how traditional brokers complicated investing 
                with hidden charges, poor technology, and inadequate customer support. They set out to build something different.
              </p>
              <p>
                Today, TradeX India serves 2.4M+ customers with a commitment to transparency, innovation, and customer success. 
                We've eliminated hidden fees, built world-class technology, and created educational resources to help Indians 
                make smarter investment decisions.
              </p>
              <p>
                We're not just a brokerage—we're a partner in your financial journey, dedicated to helping you achieve your dreams 
                through smart investing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 lg:px-12 mb-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-4">Join India's Financial Revolution</h2>
        <p className="text-[#8b9cc8] mb-8">Become part of the TradeX family and start your investment journey today.</p>
        <Link to="/register" className="btn-primary text-base px-10 py-4 rounded-xl inline-flex">
          Open Free Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="max-w-6xl mx-auto text-center text-xs text-[#4a5580]">
          <div className="text-[#8b9cc8] font-medium mb-2">TradeX India Pvt Ltd</div>
          <div>Demo platform. Not real trading. SEBI Registered Broker (Demo): INZ000000000</div>
          <div className="mt-3">© 2025 TradeX India Pvt Ltd. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
