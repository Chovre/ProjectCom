import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Scale,
  BookOpen,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function AuditorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.auditor.dashboard);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load auditor stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Computing reconciliation balances..." />;
  }

  const unreconciled = Number(stats?.unreconciledAccounts || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Independent Auditor Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Read-Only Authority
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Cryptographic ledger integrity verification, transaction sampling, and double-entry reconciliation
          </p>
        </div>
        <Link
          to="/auditor/reconciliation"
          className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5 shadow-sm"
        >
          <Scale className="w-4 h-4" /> Run Reconciliation Report
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ledger Entries"
          value={stats?.totalLedgerEntries || 0}
          icon={BookOpen}
          color="navy"
          subtitle="Immutable journal records"
        />
        <StatCard
          title="Reconciled Accounts"
          value={stats?.reconciledAccounts || 0}
          icon={CheckCircle2}
          color="green"
          subtitle="Zero-discrepancy accounts"
        />
        <StatCard
          title="Unreconciled Accounts"
          value={unreconciled}
          icon={AlertTriangle}
          color={unreconciled > 0 ? 'red' : 'green'}
          changeType={unreconciled > 0 ? 'negative' : 'positive'}
          subtitle={unreconciled > 0 ? 'Discrepancy detected!' : 'All accounts balanced'}
        />
        <StatCard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          icon={Receipt}
          color="purple"
          subtitle={`${stats?.successfulTransactions || 0} succeeded, ${stats?.failedTransactions || 0} failed`}
        />
      </div>

      {/* Audit Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Balance Reconciliation</h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Verify that account book balances match the net sum of credits and debits from double-entry journal records.
            </p>
          </div>
          <Link
            to="/auditor/reconciliation"
            className="text-xs font-semibold text-navy-600 hover:underline inline-flex items-center gap-1"
          >
            Open Reconciliation <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-navy-50 text-navy-600 rounded-xl w-fit mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Double-Entry Ledger</h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Examine atomic journal movements. Every transfer is verified for mathematical credit-debit balance equality.
            </p>
          </div>
          <Link
            to="/auditor/ledger"
            className="text-xs font-semibold text-navy-600 hover:underline inline-flex items-center gap-1"
          >
            Inspect Ledger Entries <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">System Event Audit Trail</h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Review tamper-evident security event logs covering all actor logins, status transitions, and operations.
            </p>
          </div>
          <Link
            to="/auditor/audit"
            className="text-xs font-semibold text-navy-600 hover:underline inline-flex items-center gap-1"
          >
            View Event Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

