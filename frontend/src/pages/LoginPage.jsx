import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.fullName?.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin') setForm({ email: 'admin@tradex.in', password: 'Admin@123456' });
    else setForm({ email: 'user@tradex.in', password: 'Demo@123456' });
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#00d084] mb-1">TradeX</div>
          <div className="text-[10px] text-[#4a5580] tracking-widest uppercase">India</div>
        </div>
        <div className="card">
          <h1 className="text-xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-[#8b9cc8] mb-6">Sign in to your trading account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="inp-label">Email</label>
              <input className="inp" type="email" placeholder="user@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="inp-label">Password</label>
              <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 flex gap-2">
            <button onClick={() => fillDemo('user')} className="flex-1 btn-ghost text-xs py-2">Fill Demo User</button>
            <button onClick={() => fillDemo('admin')} className="flex-1 btn-ghost text-xs py-2">Fill Admin</button>
          </div>

          <p className="text-center text-xs text-[#8b9cc8] mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00d084] hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', mobile: '', password: '', referralCode: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(form.password)) { toast.error('Password must contain uppercase and number'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Complete KYC to start trading.');
      navigate('/kyc');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#00d084] mb-1">TradeX</div>
          <div className="text-[10px] text-[#4a5580] tracking-widest uppercase">India</div>
        </div>
        <div className="card">
          <h1 className="text-xl font-bold mb-1">Create account</h1>
          <p className="text-sm text-[#8b9cc8] mb-6">Open your free Demat account</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="inp-label">Full Name</label>
              <input className="inp" placeholder="Rahul Sharma" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} required />
            </div>
            <div>
              <label className="inp-label">Email</label>
              <input className="inp" type="email" placeholder="user@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="inp-label">Mobile Number</label>
              <input className="inp" type="tel" placeholder="9876543210" maxLength={10} value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} required />
            </div>
            <div>
              <label className="inp-label">Password</label>
              <input className="inp" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <div>
              <label className="inp-label">Referral Code (optional)</label>
              <input className="inp" placeholder="TRXRAHU1234" value={form.referralCode} onChange={e => setForm(p => ({ ...p, referralCode: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm !mt-5">
              {loading ? 'Creating account...' : 'Create Free Account →'}
            </button>
          </form>

          <p className="text-center text-[10px] text-[#4a5580] mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-center text-xs text-[#8b9cc8] mt-3">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00d084] hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
