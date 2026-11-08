import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Scale, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const fetchReconciliation = async () => {
    try {
      setRefreshing(true);
      const res = await axiosInstance.get(endpoints.auditor.reconciliation);
      setReconciliations(res.data || []);
    } catch (err) {
      toast.error('Failed to run reconciliation');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Performing real-time ledger-to-account reconciliation..." />;
  }

  const totalAccounts = reconciliations.length;
  const reconciledAccounts = reconciliations.filter((r) => r.isReconciled).length;
  const discrepancyAccounts = totalAccounts - reconciledAccounts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ledger & Balance Reconciliation</h1>
          <p className="text-sm text-gray-500">
            Real-time verification: Account Book Balance vs. Mathematical Sum of Double-Entry Journal Credits & Debits
          </p>
        </div>
        <button
          onClick={fetchReconciliation}
          disabled={refreshing}
          className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Recompute Reconciliation
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-1">
            Accounts Audited
          </span>
          <span className="text-2xl font-bold text-gray-900">{totalAccounts}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5 bg-emerald-50/20">
          <span className="text-xs uppercase tracking-wider text-emerald-700 font-semibold block mb-1">
            Fully Balanced (Zero Discrepancy)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-700">{reconciledAccounts}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div
          className={`bg-white rounded-xl shadow-sm p-5 border ${
            discrepancyAccounts > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
          }`}
        >
          <span
            className={`text-xs uppercase tracking-wider font-semibold block mb-1 ${
              discrepancyAccounts > 0 ? 'text-red-700' : 'text-gray-400'
            }`}
          >
            Discrepant Accounts
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                discrepancyAccounts > 0 ? 'text-red-700' : 'text-gray-900'
              }`}
            >
              {discrepancyAccounts}
            </span>
            {discrepancyAccounts > 0 && <AlertTriangle className="w-5 h-5 text-red-600" />}
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {reconciliations.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No accounts to reconcile"
            description="No bank accounts exist yet in the system."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Current Book Balance</th>
                  <th className="py-3 px-4">Ledger Calculated Balance</th>
                  <th className="py-3 px-4">Reconciliation Status</th>
                  <th className="py-3 px-4 text-right">Discrepancy (Δ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reconciliations.map((rec) => (
                  <tr
                    key={rec.accountId}
                    className={`transition-colors ${
                      rec.isReconciled ? 'hover:bg-gray-50/50' : 'bg-red-50/20 hover:bg-red-50/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-900">
                      {rec.accountNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-900">
                      ₹{Number(rec.bookBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-800">
                      ₹{Number(rec.ledgerBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.isReconciled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-mono font-bold text-right ${
                        rec.isReconciled ? 'text-gray-400' : 'text-red-600'
                      }`}
                    >
                      {rec.isReconciled
                        ? '₹0.00'
                        : `₹${Number(rec.discrepancy).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accounting Invariant Formula Note */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-1">
        <span className="font-semibold text-gray-700 block">Double-Entry Reconciliation Formula:</span>
        <code className="text-navy-700 font-mono block">
          Ledger Balance = Σ(Credit Entries) - Σ(Debit Entries)
        </code>
        <p>
          A balanced state requires Book Balance == Ledger Balance. Any non-zero discrepancy indicates unjournaled
          movements or unauthorized database alteration.
        </p>
      </div>
    </div>
  );
}

