import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Receipt,
  PlusCircle,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.transactions.dashboard);
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load customer dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading customer accounts and balances..." />;
  }

  const accounts = dashboardData?.accounts || [];
  const primaryAccount = accounts[0] || null;
  const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  const recentTransactions = dashboardData?.recentTransactions || [];

  // Prepare chart data from recent transactions or balance
  const chartData = [
    { name: 'Deposits', amount: Number(dashboardData?.totalDeposits) || 0 },
    { name: 'Withdrawals', amount: Number(dashboardData?.totalWithdrawals) || 0 },
    { name: 'Balance', amount: totalBalance },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-navy-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-navy-200 font-semibold">Customer Portfolio</span>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">
            Welcome back, {dashboardData?.fullName || user?.fullName || 'Valued Customer'}
          </h1>
          <p className="text-xs text-navy-200 mt-1">
            Accounts protected by PostgreSQL row-level locks and double-entry ledgering.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/customer/deposit"
            className="btn-success text-sm py-2 px-4 inline-flex items-center gap-1.5 shadow-sm"
          >
            <ArrowDownToLine className="w-4 h-4" /> Deposit
          </Link>
          <Link
            to="/customer/transfer"
            className="bg-white text-navy-700 hover:bg-navy-50 text-sm font-medium py-2 px-4 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Balance"
          value={`₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          color="navy"
          subtitle={`${accounts.length} linked account(s)`}
        />
        <StatCard
          title="Total Lifetime Deposits"
          value={`₹${Number(dashboardData?.totalDeposits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={ArrowDownToLine}
          color="teal"
          changeType="positive"
        />
        <StatCard
          title="Total Withdrawals"
          value={`₹${Number(dashboardData?.totalWithdrawals || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={ArrowUpFromLine}
          color="red"
          changeType="negative"
        />
        <StatCard
          title="Primary Account Status"
          value={primaryAccount?.status || 'N/A'}
          icon={CreditCard}
          color="green"
          subtitle={primaryAccount ? primaryAccount.accountNumber : 'No accounts active'}
        />
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/customer/deposit"
          className="bg-white p-4 rounded-xl border border-gray-100 hover:border-teal-300 hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-800 block">Deposit</span>
            <span className="text-[11px] text-gray-400">Add sandbox funds</span>
          </div>
        </Link>

        <Link
          to="/customer/withdraw"
          className="bg-white p-4 rounded-xl border border-gray-100 hover:border-red-300 hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-800 block">Withdraw</span>
            <span className="text-[11px] text-gray-400">Debit account</span>
          </div>
        </Link>

        <Link
          to="/customer/transfer"
          className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-800 block">Transfer</span>
            <span className="text-[11px] text-gray-400">Atomic money transfer</span>
          </div>
        </Link>

        <Link
          to="/customer/transactions"
          className="bg-white p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-lg bg-navy-50 text-navy-600 group-hover:bg-navy-600 group-hover:text-white transition-colors">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-800 block">History</span>
            <span className="text-[11px] text-gray-400">All transactions</span>
          </div>
        </Link>
      </div>

      {/* Main Content Grid: Accounts + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Bank Accounts */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Your Bank Accounts</h2>
            <Link
              to="/customer/accounts"
              className="text-xs font-semibold text-navy-600 hover:underline flex items-center gap-1"
            >
              Manage Accounts <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No accounts linked"
              description="Apply for a new savings or current bank account to begin financial transactions."
              actionText="Apply for Account"
              onAction={() => window.location.assign('/customer/accounts')}
            />
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-navy-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900">{acc.accountNumber}</span>
                        <StatusBadge status={acc.status} />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{acc.accountType} Account • {acc.currency}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-medium">Available Balance</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Volume Breakdown Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <h2 className="text-base font-bold text-gray-900 mb-4">Cash Movement Breakdown</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Aggregated real-time metrics derived from verified database ledger entries.
          </p>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-xs text-gray-500">Latest immutable financial activity on your accounts</p>
          </div>
          <Link
            to="/customer/transactions"
            className="text-xs font-semibold text-navy-600 hover:underline flex items-center gap-1"
          >
            View All <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Your recent transaction receipts will appear here once you deposit, withdraw, or transfer funds."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-900">
                      {tx.referenceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.transactionType} />
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {tx.transactionType === 'DEPOSIT' && '+'}
                      {tx.transactionType === 'WITHDRAWAL' && '-'}
                      ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.status} />
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

