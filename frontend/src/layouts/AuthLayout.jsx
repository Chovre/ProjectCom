import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';

/**
 * AuthLayout
 * Centered card layout used for Login and Register pages.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-600 via-navy-700 to-navy-900 flex flex-col items-center justify-center p-4">
      {/* Branding */}
      <Link to="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
          <Landmark className="h-8 w-8 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">LedgerLine</h1>
          <p className="text-xs text-navy-200 -mt-0.5">Secure Financial Management</p>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {children || <Outlet />}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-navy-300">
        &copy; {new Date().getFullYear()} LedgerLine. All rights reserved.
      </p>
    </div>
  );
}
