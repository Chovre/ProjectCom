import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { Users, Search, Shield, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const fetchUsers = async (page = 0) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.admin.users, {
        params: { page, size: 10, sort: 'createdAt,desc' },
      });
      setUsers(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const initiateStatusChange = (user, status) => {
    setSelectedUser(user);
    setTargetStatus(status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser || !targetStatus) return;

    setUpdating(true);
    try {
      await axiosInstance.patch(endpoints.admin.updateUserStatus(selectedUser.id), {
        status: targetStatus,
      });
      toast.success(`User ${selectedUser.email} status changed to ${targetStatus}`);
      setShowStatusModal(false);
      fetchUsers(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Lifecycle Management</h1>
        <p className="text-sm text-gray-500">
          Inspect registered identities, manage access privileges, and suspend accounts
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
            placeholder="Search by full name or email..."
            className="input-field pl-9 text-xs"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Total Registered Users: <strong className="text-gray-900">{totalElements}</strong>
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading user profiles..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="No matching user accounts found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{u.fullName}</div>
                      <div className="text-xs text-gray-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status !== 'ACTIVE' && (
                          <button
                            onClick={() => initiateStatusChange(u, 'ACTIVE')}
                            className="text-xs py-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium rounded-lg transition-colors border border-emerald-200"
                          >
                            Activate
                          </button>
                        )}
                        {u.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => initiateStatusChange(u, 'SUSPENDED')}
                            className="text-xs py-1 px-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-medium rounded-lg transition-colors border border-red-200"
                          >
                            Suspend
                          </button>
                        )}
                        {u.status !== 'INACTIVE' && (
                          <button
                            onClick={() => initiateStatusChange(u, 'INACTIVE')}
                            className="text-xs py-1 px-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors border border-gray-200"
                          >
                            Deactivate
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleUpdateStatus}
        title={`Confirm User Status Change`}
        message={`Are you sure you want to change user "${selectedUser?.email}" status to "${targetStatus}"?`}
        confirmText={`Change to ${targetStatus}`}
        isDanger={targetStatus === 'SUSPENDED'}
        isLoading={updating}
      />
    </div>
  );
}

