import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for beginners',
    features: [
      'Zero brokerage on equity delivery',
      '₹20 per intraday order',
      'Basic charts & indicators',
      'Real-time market data',
      'Mobile app access',
      'Email support'
    ],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    description: 'For active traders',
    features: [
      'Everything in Free',
      '₹15 per intraday order',
      'Advanced charts (50+ indicators)',
      'Level 2 market depth',
      'Price alerts',
      'Priority support',
      'API access'
    ],
    cta: 'Try Pro',
    popular: true
  },
  {
    name: 'Premium',
    price: '₹799',
    period: '/month',
    description: 'For professional traders',
    features: [
      'Everything in Pro',
      '₹10 per intraday order',
      'TradingView premium charts',
      'Historical data export',
      'Dedicated relationship manager',
      '24/7 phone support',
      'Custom integrations',
      'Research reports'
    ],
    cta: 'Go Premium',
    popular: false
  }
];

const COMPARISON = [
  { feature: 'Equity Delivery', free: '₹0', pro: '₹0', premium: '₹0' },
  { feature: 'Intraday Trading', free: '₹20/order', pro: '₹15/order', premium: '₹10/order' },
  { feature: 'Futures & Options', free: '₹100/lot', pro: '₹80/lot', premium: '₹60/lot' },
  { feature: 'Commodity', free: '₹50/order', pro: '₹40/order', premium: '₹30/order' },
  { feature: 'Currency', free: '₹20/order', pro: '₹15/order', premium: '₹10/order' },
  { feature: 'Account Opening', free: '₹0', pro: '₹0', premium: '₹0' },
  { feature: 'AMC (Annual Charges)', free: '₹0', pro: '₹0', premium: '₹0' },
];

export default function PricingPage() {
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
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6">Transparent Pricing, Zero Hidden Charges</h1>
          <p className="text-xl text-[#8b9cc8] leading-relaxed">
            Choose the plan that fits your trading style. Start free and upgrade anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`card relative ${plan.popular ? 'border-[#00d084] ring-2 ring-[#00d084]/20' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00d084] text-[#022b1d] px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-[#8b9cc8] mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-[#00d084]">{plan.price}</span>
                    <span className="text-[#4a5580] ml-2">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-[#00d084] flex-shrink-0" />
                      <span className="text-[#8b9cc8]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`btn-primary w-full text-center ${plan.popular ? '' : 'btn-ghost border'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Compare All Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-[#00d084]">Pro</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-4 px-4 text-sm text-[#8b9cc8]">{row.feature}</td>
                    <td className="py-4 px-4 text-sm text-center">{row.free}</td>
                    <td className="py-4 px-4 text-sm text-center font-medium text-[#00d084]">{row.pro}</td>
                    <td className="py-4 px-4 text-sm text-center">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 lg:px-12 mb-20">
        <div className="bg-gradient-to-br from-[#00d084]/10 to-emerald-400/5 border border-[#00d084]/20 rounded-3xl p-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Trading with Zero Brokerage</h2>
          <p className="text-[#8b9cc8] mb-8">Open your Demat account in 5 minutes. Completely free.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-4 rounded-xl inline-flex">
            Open Free Account →
          </Link>
        </div>
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
