import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  CreditCard,
  ClipboardList,
  Receipt,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  Scale,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.admin.dashboard);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Computing real-time administrative metrics..." />;
  }

  const successCount = Number(stats?.successfulTransactions || 0);
  const failedCount = Number(stats?.failedTransactions || 0);

  const pieData = [
    { name: 'Successful', value: successCount, color: '#14b8a6' },
    { name: 'Failed', value: failedCount, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Administration</h1>
          <p className="text-sm text-gray-500">Live platform metrics, user access controls, and settlement monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/applications"
            className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5 shadow-sm"
          >
            <ClipboardList className="w-4 h-4" /> Review Applications ({stats?.pendingApplications || 0})
          </Link>
          <Link
            to="/admin/users"
            className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Manage Users
          </Link>
        </div>
      </div>

      {/* Top 4 Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="navy"
          subtitle="Registered customer accounts"
        />
        <StatCard
          title="Active Bank Accounts"
          value={`${stats?.activeAccounts || 0} / ${stats?.totalAccounts || 0}`}
          icon={CreditCard}
          color="teal"
          subtitle="Total accounts active"
        />
        <StatCard
          title="Pending Applications"
          value={stats?.pendingApplications || 0}
          icon={ClipboardList}
          color="amber"
          subtitle="Awaiting administrative review"
        />
        <StatCard
          title="Total Transaction Volume"
          value={`₹${Number(stats?.totalVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="green"
          subtitle="Cumulative settlement volume"
        />
      </div>

      {/* Secondary Row: Transaction Execution Integrity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          icon={Receipt}
          color="navy"
        />
        <StatCard
          title="Successful Settled"
          value={successCount}
          icon={CheckCircle2}
          color="teal"
          changeType="positive"
        />
        <StatCard
          title="Failed / Rejected"
          value={failedCount}
          icon={XCircle}
          color="red"
          changeType={failedCount > 0 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Success vs Failure Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <h2 className="text-base font-bold text-gray-900 w-full mb-2">Execution Success Rate</h2>
          <div className="h-56 w-full flex items-center justify-center">
            {stats?.totalTransactions === 0 ? (
              <p className="text-xs text-gray-400">No transactions recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center gap-6 text-xs mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" />
              <span>Success ({successCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span>Failed ({failedCount})</span>
            </div>
          </div>
        </div>

        {/* Quick Admin Modules */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Administrative Navigation</h2>
            <p className="text-xs text-gray-500 mb-4">Direct access to security, user lifecycle, and auditing controls</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/admin/applications"
                className="p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-gray-50/50 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Account Applications</span>
                  <span className="text-xs text-gray-500">Approve or reject KYC requests</span>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-600" />
              </Link>

              <Link
                to="/admin/users"
                className="p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-gray-50/50 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">User Management</span>
                  <span className="text-xs text-gray-500">Suspend, activate, and review roles</span>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-600" />
              </Link>

              <Link
                to="/admin/accounts"
                className="p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-gray-50/50 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Account Registry</span>
                  <span className="text-xs text-gray-500">Inspect and freeze bank accounts</span>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-600" />
              </Link>

              <Link
                to="/admin/audit"
                className="p-4 rounded-xl border border-gray-100 hover:border-navy-300 hover:bg-gray-50/50 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">System Audit Trail</span>
                  <span className="text-xs text-gray-500">Review immutable event logs</span>
                </div>
                <ArrowRight className="w-4 h-4 text-navy-600" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Security: Historical ledger records cannot be modified through normal application APIs</span>
            <Link to="/admin/transactions" className="text-navy-600 font-semibold hover:underline">
              All Transactions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

