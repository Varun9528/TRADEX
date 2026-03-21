import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageSquare, Clock, Send } from 'lucide-react';

export default function ContactPage() {
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
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6">Get in Touch</h1>
          <p className="text-xl text-[#8b9cc8] leading-relaxed">
            Have questions? We're here to help you succeed in your investment journey.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card text-center hover:bg-bg-tertiary transition-all">
              <Mail className="w-10 h-10 text-[#00d084] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-sm text-[#8b9cc8]">support@tradex.in</p>
              <p className="text-xs text-[#4a5580] mt-1">Response within 24 hours</p>
            </div>
            <div className="card text-center hover:bg-bg-tertiary transition-all">
              <Phone className="w-10 h-10 text-[#00d084] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-sm text-[#8b9cc8]">+91 80 1234 5678</p>
              <p className="text-xs text-[#4a5580] mt-1">Mon-Sat, 9 AM - 6 PM IST</p>
            </div>
            <div className="card text-center hover:bg-bg-tertiary transition-all">
              <MapPin className="w-10 h-10 text-[#00d084] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Visit Us</h3>
              <p className="text-sm text-[#8b9cc8]">Bangalore, Karnataka</p>
              <p className="text-xs text-[#4a5580] mt-1">By appointment only</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8b9cc8] mb-2">Full Name *</label>
                    <input type="text" className="inp w-full" placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8b9cc8] mb-2">Email Address *</label>
                    <input type="email" className="inp w-full" placeholder="john@example.com" required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8b9cc8] mb-2">Phone Number</label>
                    <input type="tel" className="inp w-full" placeholder="+91 XXXXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8b9cc8] mb-2">Subject *</label>
                    <select className="inp w-full" required>
                      <option value="">Select a subject</option>
                      <option>Account Opening</option>
                      <option>KYC Support</option>
                      <option>Trading Issues</option>
                      <option>Billing Query</option>
                      <option>Technical Support</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#8b9cc8] mb-2">Message *</label>
                  <textarea rows={5} className="inp w-full resize-none" placeholder="Describe your query..." required></textarea>
                </div>
                <button type="submit" className="btn-primary w-full">
                  <Send className="w-4 h-4 mr-2 inline" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Support Hours */}
      <section className="mx-6 lg:px-12 mb-20">
        <div className="bg-gradient-to-br from-[#00d084]/10 to-emerald-400/5 border border-[#00d084]/20 rounded-3xl p-12">
          <div className="max-w-4xl mx-auto text-center">
            <Clock className="w-12 h-12 text-[#00d084] mx-auto mb-6" />
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">Support Hours</h2>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3">Phone Support</h3>
                <p className="text-sm text-[#8b9cc8]">Monday - Saturday</p>
                <p className="text-lg text-[#00d084] font-semibold">9:00 AM - 6:00 PM IST</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Email Support</h3>
                <p className="text-sm text-[#8b9cc8]">Available 24/7</p>
                <p className="text-lg text-[#00d084] font-semibold">Response within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 lg:px-12 mb-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-4">Ready to Start Trading?</h2>
        <p className="text-[#8b9cc8] mb-8">Open your free Demat account in minutes.</p>
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
