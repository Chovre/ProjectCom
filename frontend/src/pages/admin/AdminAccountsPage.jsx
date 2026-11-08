import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { CreditCard, Search, Snowflake, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAccounts(currentPage);
  }, [currentPage]);

  const fetchAccounts = async (page = 0) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.admin.accounts, {
        params: { page, size: 10, sort: 'createdAt,desc' },
      });
      setAccounts(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const initiateStatusChange = (account, status) => {
    setSelectedAccount(account);
    setTargetStatus(status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedAccount || !targetStatus) return;

    setUpdating(true);
    try {
      await axiosInstance.patch(endpoints.admin.updateAccountStatus(selectedAccount.id), {
        status: targetStatus,
      });
      toast.success(`Account ${selectedAccount.accountNumber} status updated to ${targetStatus}`);
      setShowStatusModal(false);
      fetchAccounts(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account status');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = accounts.filter(
    (a) =>
      a.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Registry & Governance</h1>
        <p className="text-sm text-gray-500">
          Monitor all issued bank accounts, balance records, and status controls
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by account number or owner..."
            className="input-field pl-9 text-xs"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Total Accounts: <strong className="text-gray-900">{totalElements}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Retrieving accounts registry..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No accounts found" description="No accounts match your query." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Book Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-gray-900">
                      {acc.accountNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{acc.ownerName || '—'}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{acc.accountType}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{acc.currency}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                      ₹{Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={acc.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {acc.status !== 'ACTIVE' && (
                          <button
                            onClick={() => initiateStatusChange(acc, 'ACTIVE')}
                            className="text-xs py-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium rounded-lg transition-colors border border-emerald-200"
                          >
                            Activate
                          </button>
                        )}
                        {acc.status !== 'FROZEN' && (
                          <button
                            onClick={() => initiateStatusChange(acc, 'FROZEN')}
                            className="text-xs py-1 px-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium rounded-lg transition-colors border border-amber-200"
                          >
                            Freeze
                          </button>
                        )}
                        {acc.status !== 'CLOSED' && (
                          <button
                            onClick={() => initiateStatusChange(acc, 'CLOSED')}
                            className="text-xs py-1 px-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-medium rounded-lg transition-colors border border-red-200"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={10}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleUpdateStatus}
        title={`Confirm Account Status Change`}
        message={`Are you sure you want to change account "${selectedAccount?.accountNumber}" status to "${targetStatus}"?`}
        confirmText={`Update to ${targetStatus}`}
        isDanger={targetStatus === 'CLOSED' || targetStatus === 'FROZEN'}
        isLoading={updating}
      />
    </div>
  );
}

