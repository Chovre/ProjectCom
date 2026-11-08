import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-navy-50 text-navy-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">404 Page Not Found</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          The page or financial resource you requested does not exist or has been relocated.
        </p>
        <Link
          to="/"
          className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    </div>
  );
}

