import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';

const BLOG_POSTS = [
  {
    id: 1,
    title: "Stock Market Basics: A Beginner's Guide to Investing in India",
    excerpt: 'Learn the fundamentals of stock market investing. Understand NSE, BSE, demat accounts, and how to start your investment journey with confidence.',
    category: 'Beginner Guide',
    date: 'March 15, 2025',
    readTime: '8 min read',
    image: '📚'
  },
  {
    id: 2,
    title: 'Understanding Intraday Trading: Strategies for Success',
    excerpt: 'Master intraday trading with proven strategies. Learn about technical analysis, risk management, and timing the market effectively.',
    category: 'Trading Strategies',
    date: 'March 12, 2025',
    readTime: '12 min read',
    image: '📈'
  },
  {
    id: 3,
    title: 'Tax Saving Investments: Section 80C Explained',
    excerpt: 'Discover tax-saving investment options under Section 80C. ELSS, PPF, NSC compared to help you save taxes smartly.',
    category: 'Tax Planning',
    date: 'March 10, 2025',
    readTime: '10 min read',
    image: '💰'
  },
  {
    id: 4,
    title: 'Mutual Funds vs Direct Stocks: Which is Better?',
    excerpt: 'Comprehensive comparison between mutual funds and direct stock investing. Pros, cons, and which option suits your investment style.',
    category: 'Investment Options',
    date: 'March 8, 2025',
    readTime: '9 min read',
    image: '⚖️'
  },
  {
    id: 5,
    title: 'Market Volatility: How to Protect Your Portfolio',
    excerpt: 'Learn strategies to safeguard your investments during market downturns. Diversification, hedging, and long-term perspective explained.',
    category: 'Risk Management',
    date: 'March 5, 2025',
    readTime: '11 min read',
    image: '🛡️'
  },
  {
    id: 6,
    title: 'IPO Investing: Should You Apply for Every IPO?',
    excerpt: 'Understand IPO fundamentals, how to evaluate new issues, and whether IPO investing is right for your portfolio strategy.',
    category: 'IPO Guide',
    date: 'March 2, 2025',
    readTime: '7 min read',
    image: '🎯'
  },
];

export default function BlogPage() {
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
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6">Learn & Grow Your Wealth</h1>
          <p className="text-xl text-[#8b9cc8] leading-relaxed">
            Expert insights, trading strategies, and investment tips to help you make smarter financial decisions.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <article key={post.id} className="card hover:bg-bg-tertiary hover:border-border-strong transition-all cursor-pointer group">
                <div className="text-6xl mb-4">{post.image}</div>
                <div className="flex items-center gap-2 text-xs text-[#4a5580] mb-3">
                  <span className="bg-[#00d084]/10 text-[#00d084] px-2 py-1 rounded">{post.category}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-[#00d084] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-[#8b9cc8] mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#4a5580]">
                    <Calendar className="w-3 h-3" />
                    <span>{post.date}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#00d084] group-hover:translate-x-1 transition-transform" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-6 lg:px-12 mb-20">
        <div className="bg-gradient-to-br from-[#00d084]/10 to-emerald-400/5 border border-[#00d084]/20 rounded-3xl p-12 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Get Market Insights in Your Inbox</h2>
          <p className="text-[#8b9cc8] mb-8">Subscribe to our newsletter for expert analysis, trading tips, and investment ideas.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-bg-tertiary border border-border-strong rounded-lg px-4 py-3 text-sm outline-none focus:border-[#00d084]"
            />
            <button className="btn-primary px-6 py-3 rounded-lg whitespace-nowrap">
              Subscribe Free
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 lg:px-12 mb-20 text-center">
        <h2 className="text-2xl lg:text-3xl font-bold mb-4">Ready to Start Your Investment Journey?</h2>
        <p className="text-[#8b9cc8] mb-8">Open your free Demat account and join 2.4M+ investors.</p>
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
