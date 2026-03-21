import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  {
    category: 'KYC & Account',
    questions: [
      { q: 'How long does KYC verification take?', a: 'KYC verification typically takes 2-4 hours during business hours. If submitted after 6 PM or on weekends, it may take until the next working day.' },
      { q: 'What documents are required for KYC?', a: 'You need PAN card, Aadhaar card, cancelled cheque or bank statement, and income proof (salary slip or ITR). All documents can be uploaded digitally.' },
      { q: 'Can I open multiple accounts with TradeX?', a: 'No, SEBI regulations allow only one Demat account per person. However, you can open different types of accounts (individual, HUF, NRI) with the same PAN.' },
    ]
  },
  {
    category: 'Trading',
    questions: [
      { q: 'What is the minimum amount to start trading?', a: 'There is no minimum amount required. You can start trading with as little as ₹100. However, we recommend starting with at least ₹5,000-10,000 for better diversification.' },
      { q: 'When can I trade?', a: 'Equity trading is available Monday-Friday, 9:15 AM - 3:30 PM IST. Currency and commodity trading have extended hours. You can place orders anytime, but they execute only during market hours.' },
      { q: 'What is intraday vs delivery trading?', a: 'Intraday means buying and selling on the same day. Delivery means holding stocks for more than one day. Intraday has lower brokerage but higher risk.' },
    ]
  },
  {
    category: 'Charges & Fees',
    questions: [
      { q: 'Is account opening really free?', a: 'Yes! Account opening is completely free with zero charges. There are no hidden fees or mandatory minimum balance requirements.' },
      { q: 'What are the annual maintenance charges (AMC)?', a: 'TradeX charges zero AMC for life. You pay only when you trade - competitive brokerage on transactions.' },
      { q: 'What other charges apply?', a: 'Besides brokerage, statutory charges like STT, GST, stamp duty, and exchange transaction charges apply as per regulations. These are pass-through charges.' },
    ]
  },
  {
    category: 'Funds & Withdrawal',
    questions: [
      { q: 'How do I add funds to my account?', a: 'Use UPI, Net Banking, IMPS, or NEFT. UPI and IMPS are instant and available 24/7. Funds reflect in your trading account immediately.' },
      { q: 'How long does withdrawal take?', a: 'Withdrawal requests are processed within 24 hours on working days. Funds reach your bank account in 1-2 working days via NEFT/IMPS.' },
      { q: 'Is there a limit on withdrawals?', a: 'No, you can withdraw any amount up to your available balance. Minimum withdrawal amount is ₹100.' },
    ]
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

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
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-[#8b9cc8] leading-relaxed">
            Find answers to common questions about trading, KYC, charges, and more.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-4xl mx-auto">
          {FAQS.map((category, catIdx) => (
            <div key={catIdx} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-[#00d084]">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, idx) => {
                  const globalIdx = `${catIdx}-${idx}`;
                  const isOpen = openIndex === globalIdx;
                  return (
                    <div key={idx} className="card hover:bg-bg-tertiary transition-all">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="font-semibold pr-8">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-[#00d084] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="mt-4 pt-4 border-t border-border/50 text-sm text-[#8b9cc8] leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="mx-6 lg:px-12 mb-20">
        <div className="bg-gradient-to-br from-[#00d084]/10 to-emerald-400/5 border border-[#00d084]/20 rounded-3xl p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-[#8b9cc8] mb-8">Our support team is here to help you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-primary px-8 py-3 rounded-lg">Contact Support</Link>
            <a href="mailto:support@tradex.in" className="btn-ghost px-8 py-3 rounded-lg border">Email Us</a>
          </div>
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
