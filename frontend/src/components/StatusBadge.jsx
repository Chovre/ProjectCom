import React from 'react';

export default function StatusBadge({ status, type }) {
  if (!status) return null;

  const getStyle = () => {
    const s = String(status).toUpperCase();

    // Financial transaction statuses
    if (s === 'SUCCESS' || s === 'ACTIVE' || s === 'APPROVED' || s === 'COMPLETED') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'FAILED' || s === 'REJECTED' || s === 'SUSPENDED' || s === 'CLOSED' || s === 'INACTIVE') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (s === 'PENDING' || s === 'PROCESSING' || s === 'FROZEN') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    // Transaction types
    if (s === 'DEPOSIT') {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (s === 'WITHDRAWAL') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s === 'TRANSFER') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s === 'CREDIT') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'DEBIT') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }

    // Roles
    if (s === 'ADMIN') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s === 'AUDITOR') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s === 'ACCOUNT_HOLDER') {
      return 'bg-slate-50 text-slate-700 border-slate-200';
    }

    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()}`}
    >
      {status}
    </span>
  );
}

