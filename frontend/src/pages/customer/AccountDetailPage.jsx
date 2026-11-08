import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  ArrowLeft,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountData();
  }, [id]);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const [accRes, ledgerRes] = await Promise.all([
        axiosInstance.get(endpoints.accounts.getById(id)),
        axiosInstance.get(endpoints.ledger.byAccount(id)),
      ]);
      setAccount(accRes.data);
      setLedgerEntries(ledgerRes.data || []);
    } catch (err) {
      toast.error('Failed to load account details');
      navigate('/customer/accounts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Fetching account and ledger records..." />;
  }

  if (!account) return null;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/customer/accounts')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-600 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Accounts
      </button>

      {/* Account Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-navy-50 text-navy-600 rounded-xl">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="font-mono text-xl font-extrabold text-gray-900 tracking-wide">
                {account.accountNumber}
              </span>
              <StatusBadge status={account.status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>{account.accountType} Account</span>
              <span>•</span>
              <span>Currency: {account.currency}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Opened: {new Date(account.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Current Book Balance</span>
          <span className="text-3xl font-extrabold text-navy-900 tracking-tight">
            ₹{Number(account.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-2 mt-3">
            <Link
              to="/customer/deposit"
              className="btn-success text-xs py-1.5 px-3 inline-flex items-center gap-1"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" /> Deposit
            </Link>
            <Link
              to="/customer/withdraw"
              className="btn-danger text-xs py-1.5 px-3 inline-flex items-center gap-1"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" /> Withdraw
            </Link>
            <Link
              to="/customer/transfer"
              className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
            </Link>
          </div>
        </div>
      </div>

      {/* Immutable Ledger Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Account Double-Entry Ledger</h2>
              <p className="text-xs text-gray-500">
                Immutable, append-only journal entries for balance verification and audit reconciliation
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" /> Append-Only
          </span>
        </div>

        {ledgerEntries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No ledger entries"
            description="Every financial debit or credit operation performed on this account will automatically generate an immutable ledger entry."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Entry ID</th>
                  <th className="py-3 px-4">Transaction Reference</th>
                  <th className="py-3 px-4">Entry Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">#{entry.id}</td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-900">
                      {entry.transactionReference}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={entry.entryType} />
                    </td>
                    <td
                      className={`py-3 px-4 font-bold ${
                        entry.entryType === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {entry.entryType === 'CREDIT' ? '+' : '-'}₹
                      {Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{entry.currency}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

