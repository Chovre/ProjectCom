import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import { Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back, ' + (user.fullName || user.username || 'User') + '!');

      // Redirect by role
      const role = String(user.role || '').replace('ROLE_', '');
      if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'AUDITOR') {
        navigate('/auditor/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In to LedgerLine</h2>
        <p className="text-sm text-gray-500 mt-1">Access your secure financial transactions and ledger</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-text">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="input-field pl-10 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-text">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pl-10 text-sm"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            'Authenticating...'
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Logins */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-2 text-center">
          Demo Quick Sign-In
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('admin@ledgerline.com', 'Admin@123')}
            className="text-[11px] py-1.5 px-2 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemo('auditor@ledgerline.com', 'Auditor@123')}
            className="text-[11px] py-1.5 px-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            Auditor
          </button>
          <button
            type="button"
            onClick={() => fillDemo('rahul@example.com', 'Customer1@123')}
            className="text-[11px] py-1.5 px-2 bg-teal-50 text-teal-700 font-medium rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
          >
            Customer
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-navy-600 font-semibold hover:underline">
          Register now
        </Link>
      </div>
    </AuthLayout>
  );
}

