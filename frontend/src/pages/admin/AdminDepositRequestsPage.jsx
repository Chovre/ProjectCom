import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import {
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Building2,
  User,
  CreditCard,
  Hash,
  Calendar,
  Filter,
  RefreshCw,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDepositRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Form states for approval/rejection
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let url = `${endpoints.deposits.adminAll}?page=${page}&size=10&sort=submittedAt,desc`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      const res = await axiosInstance.get(url);
      setRequests(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load deposit requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await axiosInstance.put(endpoints.deposits.adminApprove(selectedRequest.id), {
        adminNotes: adminNotes.trim() || undefined,
      });
      toast.success(`Deposit request approved! ₹${parseFloat(selectedRequest.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} credited.`);
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.put(endpoints.deposits.adminReject(selectedRequest.id), {
        rejectionReason: rejectionReason.trim(),
      });
      toast.success('Deposit request has been rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowDownToLine className="w-7 h-7 text-indigo-600" />
            Deposit Request Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review customer deposit requests, verify bank settlement receipts, and authorize account credits.
          </p>
        </div>
        <button
          onClick={() => fetchRequests()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { key: 'ALL', label: 'All Requests' },
          { key: 'PENDING', label: 'Pending Approval', countHighlight: true },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(0);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Loading deposit requests..." />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No deposit requests found"
              description={
                statusFilter === 'PENDING'
                  ? 'All pending requests have been reviewed!'
                  : 'No deposit submissions match the current filter.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Reference & Date</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Target Account</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method & UTR</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Reference & Date */}
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-gray-900">
                        {req.requestReference}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(req.submittedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{req.customerName || 'Customer'}</div>
                      <div className="text-xs text-gray-400">{req.customerEmail}</div>
                      {req.customerPhone && (
                        <div className="text-xs text-gray-400 font-mono">📱 {req.customerPhone}</div>
                      )}
                    </td>

                    {/* Account */}
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-gray-900">
                        {req.accountNumber}
                      </div>
                      <div className="text-xs text-gray-500">{req.accountType || 'SAVINGS'}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <span className="text-base font-bold text-gray-900">
                        ₹{parseFloat(req.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-xs text-gray-800">
                        {req.paymentMethod?.replace('_', ' ')}
                      </div>
                      {req.bankName && (
                        <div className="text-xs text-gray-500">{req.bankName}</div>
                      )}
                      {req.transactionReference ? (
                        <div className="text-xs font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          Ref: {req.transactionReference}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No external ref</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(req.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setAdminNotes('');
                                setShowApproveModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setRejectionReason('');
                                setShowRejectModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Deposit Request Details</h3>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{selectedRequest.requestReference}</p>
              </div>
              <div>{getStatusBadge(selectedRequest.status)}</div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <div className="text-xs uppercase font-semibold text-gray-500">Customer & Target</div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer Name:</span>
                  <span className="font-semibold text-gray-800">{selectedRequest.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobile Number:</span>
                  <span className="font-mono text-gray-800">{selectedRequest.customerPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Credited Account:</span>
                  <span className="font-mono font-semibold text-indigo-600">{selectedRequest.accountNumber}</span>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl space-y-2 border border-indigo-100/60">
                <div className="text-xs uppercase font-semibold text-indigo-700">Financial Request</div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Requested Amount:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{parseFloat(selectedRequest.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-800">{selectedRequest.paymentMethod}</span>
                </div>
                {selectedRequest.bankName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remitter Bank:</span>
                    <span className="text-gray-800">{selectedRequest.bankName}</span>
                  </div>
                )}
                {selectedRequest.bankAccountNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Masked Account:</span>
                    <span className="font-mono text-gray-800">{selectedRequest.bankAccountNumber}</span>
                  </div>
                )}
                {selectedRequest.ifscCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IFSC Code:</span>
                    <span className="font-mono text-gray-800">{selectedRequest.ifscCode}</span>
                  </div>
                )}
                {selectedRequest.transactionReference && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">UTR / Ref Number:</span>
                    <span className="font-mono text-indigo-700 font-semibold">{selectedRequest.transactionReference}</span>
                  </div>
                )}
              </div>

              {selectedRequest.description && (
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold text-gray-700">Customer Description: </span>
                  {selectedRequest.description}
                </div>
              )}

              {/* Status Specifics */}
              {selectedRequest.status === 'APPROVED' && (
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approved by {selectedRequest.adminName || 'Admin'}
                  </div>
                  {selectedRequest.completedTransactionReference && (
                    <div className="font-mono text-emerald-700">
                      Transaction Ref: {selectedRequest.completedTransactionReference}
                    </div>
                  )}
                  {selectedRequest.adminNotes && (
                    <div className="text-emerald-700 italic">Notes: "{selectedRequest.adminNotes}"</div>
                  )}
                </div>
              )}

              {selectedRequest.status === 'REJECTED' && (
                <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-xs space-y-1">
                  <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Rejected by {selectedRequest.adminName || 'Admin'}
                  </div>
                  <div className="text-rose-700">
                    <span className="font-semibold">Reason: </span>
                    {selectedRequest.rejectionReason}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3 text-emerald-700 border-b border-gray-100 pb-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Approve Deposit Request</h3>
                <p className="text-xs text-gray-500">Authorize money credit to customer</p>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-semibold text-gray-900">{selectedRequest.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account:</span>
                <span className="font-mono text-gray-900">{selectedRequest.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-emerald-200/50">
                <span className="text-gray-700 font-medium">Credit Amount:</span>
                <span className="text-lg font-bold text-emerald-800">
                  ₹{parseFloat(selectedRequest.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verification Required:</strong> Please ensure that the remittance has actually settled in LedgerLine's corporate bank account before confirming.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Admin Remarks (Optional)</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified settlement on SBI bank statement"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm & Credit Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3 text-rose-700 border-b border-gray-100 pb-3">
              <div className="p-2 bg-rose-100 rounded-full">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reject Deposit Request</h3>
                <p className="text-xs text-gray-500">Customer account will NOT be credited</p>
              </div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-100 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-semibold text-gray-900">{selectedRequest.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-rose-700">
                  ₹{parseFloat(selectedRequest.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR reference not found in bank statement, amount mismatch..."
                className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400">This reason will be visible to the customer on their dashboard.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
