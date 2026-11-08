import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { ClipboardList, CheckCircle2, XCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications(currentPage);
  }, [currentPage, statusFilter]);

  const fetchApplications = async (page = 0) => {
    try {
      setLoading(true);
      const params = { page, size: 10, sort: 'createdAt,desc' };
      if (statusFilter) params.status = statusFilter;

      const res = await axiosInstance.get(endpoints.admin.applications, { params });
      setApplications(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load account applications');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (app, type) => {
    setSelectedApp(app);
    setActionType(type);
    setAdminNotes('');
    setShowModal(true);
  };

  const handleAction = async () => {
    if (!selectedApp || !actionType) return;

    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await axiosInstance.post(endpoints.admin.approveApplication(selectedApp.id), {
          adminNotes: adminNotes || 'Approved by system administrator',
        });
        toast.success(`Application #${selectedApp.id} approved! New bank account generated.`);
      } else {
        await axiosInstance.post(endpoints.admin.rejectApplication(selectedApp.id), {
          adminNotes: adminNotes || 'Rejected during review',
        });
        toast.success(`Application #${selectedApp.id} rejected.`);
      }
      setShowModal(false);
      fetchApplications(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process application');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Applications Approval</h1>
          <p className="text-sm text-gray-500">
            Review customer account requests and authorize new bank account issuance
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="input-field text-xs py-2 w-40"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading applications..." />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications found"
            description="There are no account applications matching the filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Notes</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-900">
                      APP-{app.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">{app.accountType}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{app.currency}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs truncate">
                      {app.adminNotes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(app.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {app.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openActionModal(app, 'approve')}
                            className="text-xs py-1.5 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg transition-colors border border-emerald-200 inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => openActionModal(app, 'reject')}
                            className="text-xs py-1.5 px-3 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded-lg transition-colors border border-red-200 inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Decided</span>
                      )}
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
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {actionType === 'approve' ? 'Approve Account Application' : 'Reject Account Application'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {actionType === 'approve'
                ? `Authorizing Application #${selectedApp?.id} will create a verified bank account with zero balance.`
                : `Rejecting Application #${selectedApp?.id} will close this request.`}
            </p>

            <div className="space-y-4">
              <div>
                <label className="label-text">Administrative Notes / Comments</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    actionType === 'approve'
                      ? 'e.g. Identity verified via national KYC database'
                      : 'e.g. Incomplete verification documents'
                  }
                  className="input-field text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={processing}
                  className={`text-sm py-2 px-5 rounded-lg font-medium text-white transition-colors ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? 'Processing...' : actionType === 'approve' ? 'Authorize & Issue Account' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

