import { Link } from 'react-router-dom';
import { BarChart3, Zap, Shield, Bell, TrendingUp, Smartphone, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: <TrendingUp className="w-10 h-10" />, title: 'Real-Time Market Data', desc: 'Live NSE/BSE quotes with market depth, bid-ask spread, and comprehensive analytics. Make informed decisions with up-to-the-second data.', points: ['Live NSE/BSE quotes', 'Market depth & OI data', '52-week high/low', 'Volume analysis'] },
  { icon: <BarChart3 className="w-10 h-10" />, title: 'Advanced Charts', desc: 'Professional trading charts powered by TradingView. 50+ technical indicators, multiple timeframes, and drawing tools.', points: ['TradingView charts', '50+ technical indicators', 'Multiple timeframes', 'Pattern recognition'] },
  { icon: <Zap className="w-10 h-10" />, title: 'Lightning-Fast Execution', desc: 'Experience sub-millisecond order execution with 99.9% uptime. Never miss a trading opportunity even during peak volatility.', points: ['0.03s order speed', '99.9% uptime', 'High-frequency trading ready', 'Auto retry on failure'] },
  { icon: <Shield className="w-10 h-10" />, title: 'Secure KYC System', desc: 'Paperless KYC completed in minutes. Your documents are encrypted and stored securely with bank-grade security.', points: ['100% online process', 'Aadhaar-based eKYC', 'Instant verification', 'Bank-grade encryption'] },
  { icon: <Smartphone className="w-10 h-10" />, title: 'Wallet & Fund Management', desc: 'Seamlessly add funds, track transactions, and manage your trading capital. Instant transfers with UPI, IMPS, and Net Banking.', points: ['Instant fund transfer', 'Multiple payment options', 'Real-time balance updates', 'Complete transaction history'] },
  { icon: <Bell className="w-10 h-10" />, title: 'Smart Notifications', desc: 'Stay updated with customizable alerts for price changes, order executions, and portfolio movements.', points: ['Price alerts', 'Order notifications', 'P&L updates', 'Corporate actions'] },
];

export default function FeaturesPage() {
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
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6">Powerful Features for Smart Traders</h1>
          <p className="text-xl text-[#8b9cc8] leading-relaxed">
            Everything you need to trade confidently. Professional tools, institutional-grade infrastructure, 
            and seamless user experience.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card hover:bg-bg-tertiary hover:border-border-strong transition-all">
                <div className="text-[#00d084] mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-[#8b9cc8] mb-4 leading-relaxed">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs text-[#8b9cc8]">
                      <CheckCircle className="w-4 h-4 text-[#00d084] flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Banner */}
      <section className="mx-6 lg:px-12 mb-20">
        <div className="bg-gradient-to-br from-[#00d084]/10 to-emerald-400/5 border border-[#00d084]/20 rounded-3xl p-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">More Powerful Tools</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Mutual Funds', desc: '5000+ direct plans' },
                { title: 'IPO Investing', desc: 'Apply in 1 click' },
                { title: 'ETFs', desc: '100+ options' },
                { title: 'Commodity', desc: 'Gold, Silver, Oil' }
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="font-semibold mb-2">{item.title}</div>
                  <div className="text-xs text-[#4a5580]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 lg:px-12 mb-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-4">Ready to Experience These Features?</h2>
        <p className="text-[#8b9cc8] mb-8">Open your free Demat account today and start trading.</p>
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
