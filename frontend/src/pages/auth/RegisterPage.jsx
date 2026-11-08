import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import AuthLayout from '../../layouts/AuthLayout';
import { Lock, Mail, User, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(endpoints.auth.register, {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });

      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Customer Account</h2>
        <p className="text-sm text-gray-500 mt-1">Get started with secure double-entry financial banking</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="label-text">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Rahul Sharma"
              className="input-field pl-10 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-text">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="rahul@example.com"
              className="input-field pl-10 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-text">Phone Number (Optional)</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="input-field pl-10 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="label-text">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              className="input-field pl-10 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-text">Confirm Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
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
            'Creating Account...'
          ) : (
            <>
              Register Account <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-navy-600 font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

