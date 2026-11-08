import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Wallet, Plus, CreditCard, ChevronRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState('SAVINGS');
  const [currency, setCurrency] = useState('INR');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.accounts.my);
      setAccounts(res.data || []);
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosInstance.post(endpoints.accounts.apply, {
        accountType,
        currency,
      });
      toast.success('Account application submitted! Administrator review pending.');
      setShowApplyModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving bank accounts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Bank Accounts</h1>
          <p className="text-sm text-gray-500">Manage savings and current accounts registered under your profile</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="btn-primary text-sm py-2.5 px-4 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Apply for Account
        </button>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No bank accounts"
          description="You do not have any active bank accounts. Submit an application to open an account."
          actionText="Apply for Account"
          onAction={() => setShowApplyModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => navigate(`/customer/accounts/${acc.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-navy-200 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-navy-50 text-navy-600">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <StatusBadge status={acc.status} />
                </div>
                <div className="space-y-1 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {acc.accountType} ACCOUNT
                  </span>
                  <div className="font-mono text-lg font-bold text-gray-900 tracking-wide">
                    {acc.accountNumber}
                  </div>
                  <span className="text-xs text-gray-500 block">Currency: {acc.currency}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-medium">Available Balance</span>
                  <span className="text-2xl font-extrabold text-navy-950">
                    ₹{Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-navy-600 font-semibold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Details <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Apply for a New Bank Account</h2>
            <p className="text-xs text-gray-500 mb-5">
              Applications are reviewed and approved by LedgerLine platform administrators.
            </p>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="label-text">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>

              <div>
                <label className="label-text">Currency</label>
                <input
                  type="text"
                  value={currency}
                  disabled
                  className="input-field bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Default national currency is Indian Rupee (INR)</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  disabled={submitting}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm py-2 px-5"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

