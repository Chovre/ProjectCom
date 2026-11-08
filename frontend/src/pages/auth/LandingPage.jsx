import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BookOpen, Activity, ArrowRight, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-600 flex items-center justify-center text-white font-bold shadow-md shadow-navy-600/20">
              LL
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy-900">LedgerLine</span>
              <span className="block text-[10px] text-gray-500 font-medium uppercase tracking-wider">Financial Core</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">
              Open Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-gray-50/60 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 text-navy-700 text-xs font-semibold uppercase tracking-wider mb-6 border border-navy-100">
            <ShieldCheck className="w-4 h-4 text-navy-600" />
            Double-Entry Accounting & Concurrency Protection
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-[1.15] mb-6">
            Secure Financial Transaction & <br />
            <span className="text-navy-600">Ledger Management System</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate race conditions, double-spending, and inconsistent financial records.
            LedgerLine guarantees atomic transactions, immutable double-entry ledgering,
            and cryptographic idempotency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base py-3 px-8 flex items-center gap-2 shadow-lg shadow-navy-600/20">
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary text-base py-3 px-8">
              Access Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Enterprise Financial Architecture</h2>
            <p className="text-gray-500 text-sm">
              Engineered to meet stringent banking invariants with zero tolerance for state discrepancies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card border border-gray-100 hover:border-navy-200 transition-all p-6">
              <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-600 flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Double-Entry Ledger</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Every financial transfer creates matching balanced debit and credit entries.
                Money is strictly conserved; ledger records are mathematically immutable.
              </p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Balanced credits and debits</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Database-level immutability triggers</li>
              </ul>
            </div>

            <div className="card border border-gray-100 hover:border-navy-200 transition-all p-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pessimistic Concurrency</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                PostgreSQL row-level locking (SELECT FOR UPDATE) and deterministic lock ordering prevent race conditions,
                deadlocks, and simultaneous overdraft attempts.
              </p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Deterministic lock ordering (min ID first)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Strict non-negative balance check</li>
              </ul>
            </div>

            <div className="card border border-gray-100 hover:border-navy-200 transition-all p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Persistent Idempotency</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Network retries and duplicate submissions are safely absorbed through persistent idempotency
                records and payload SHA-256 fingerprinting.
              </p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Idempotency-Key header support</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Cached deterministic response replay</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Box */}
      <section className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Development Demo Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-purple-700 block mb-1">Administrator</span>
                <span className="text-gray-600 block">admin@ledgerline.com</span>
                <span className="text-gray-400 font-mono">Admin@123</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-indigo-700 block mb-1">Financial Auditor</span>
                <span className="text-gray-600 block">auditor@ledgerline.com</span>
                <span className="text-gray-400 font-mono">Auditor@123</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-teal-700 block mb-1">Customer</span>
                <span className="text-gray-600 block">rahul@example.com</span>
                <span className="text-gray-400 font-mono">Customer1@123</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LedgerLine Financial Technologies. All rights reserved. Built with Java 21, Spring Boot & React.
        </div>
      </footer>
    </div>
  );
}

