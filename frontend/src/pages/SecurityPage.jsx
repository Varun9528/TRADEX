import { Link } from 'react-router-dom';
import { Shield, Lock, Key, Server, CheckCircle } from 'lucide-react';

const SECURITY_FEATURES = [
  { icon: <Lock className="w-10 h-10" />, title: '256-Bit SSL Encryption', desc: 'All data transmitted between your device and our servers is encrypted with bank-grade 256-bit SSL technology.' },
  { icon: <Key className="w-10 h-10" />, title: 'Two-Factor Authentication', desc: 'Extra layer of security with 2FA for login, withdrawals, and sensitive account changes.' },
  { icon: <Server className="w-10 h-10" />, title: 'Secure Data Centers', desc: 'Your data is stored in ISO 27001 certified data centers with redundant backups and disaster recovery.' },
  { icon: <Shield className="w-10 h-10" />, title: 'SEBI Compliance', desc: 'Fully compliant with SEBI regulations. Regular audits and adherence to strict security standards.' },
];

const MEASURES = [
  'Real-time fraud monitoring and detection',
  'Automatic session timeout after inactivity',
  'Device fingerprinting and IP tracking',
  'Encrypted database storage',
  'Regular security audits by third parties',
  'Penetration testing and vulnerability assessments',
  'Secure API endpoints with rate limiting',
  'DDoS protection and mitigation',
];

export default function SecurityPage() {
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
          <Shield className="w-20 h-20 text-[#00d084] mx-auto mb-6" />
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6">Your Security Is Our Priority</h1>
          <p className="text-xl text-[#8b9cc8] leading-relaxed">
            We employ industry-leading security measures to protect your data, funds, and investments 
            with multiple layers of defense.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise-Grade Security</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY_FEATURES.map((feature) => (
              <div key={feature.title} className="card text-center hover:bg-bg-tertiary transition-all">
                <div className="text-[#00d084] flex justify-center mb-4">{feature.icon}</div>
                <h3 className="font-semibold mb-3">{feature.title}</h3>
                <p className="text-sm text-[#8b9cc8] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="px-6 lg:px-12 pb-20 bg-bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Security Measures</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {MEASURES.map((measure) => (
              <div key={measure} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#00d084] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#8b9cc8]">{measure}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="mx-6 lg:px-12 mb-20">
        <div className="bg-gradient-to-br from-[#00d084]/10 to-emerald-400/5 border border-[#00d084]/20 rounded-3xl p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-6">Trusted by 2.4M+ Investors</h2>
          <p className="text-[#8b9cc8] mb-8 max-w-2xl mx-auto">
            Your trust is our foundation. We maintain the highest security standards to ensure 
            your investments and personal information are always protected.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-[#00d084] mb-2">99.9%</div>
              <div className="text-xs text-[#4a5580]">Platform Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00d084] mb-2">Zero</div>
              <div className="text-xs text-[#4a5580]">Security Breaches</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00d084] mb-2">24/7</div>
              <div className="text-xs text-[#4a5580]">Security Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 lg:px-12 mb-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-4">Trade with Confidence</h2>
        <p className="text-[#8b9cc8] mb-8">Join millions of Indians who trust TradeX with their investments.</p>
        <Link to="/register" className="btn-primary text-base px-10 py-4 rounded-xl inline-flex">
          Open Free Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="max-w-6xl mx-auto text-center text-xs text-[#4a5580]">
          <div className="text-[#8b9cc8] font-medium mb-2">TradeX India</div>
          <div>Demo platform. Not real trading. SEBI Registered Broker (Demo): INZ000000000</div>
          <div className="mt-3">© 2025 TradeX India Pvt Ltd. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
