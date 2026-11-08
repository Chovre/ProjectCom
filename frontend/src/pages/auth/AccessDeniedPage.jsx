import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">403 Access Forbidden</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          You do not have the required role or authorization to access this resource.
          Permissions are strictly enforced at the financial core.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary text-sm py-2 px-4 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link
            to="/login"
            className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" /> Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

