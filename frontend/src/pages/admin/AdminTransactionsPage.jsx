import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { Receipt, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTransactions(currentPage);
    return () => {
      isMountedRef.current = false;
    };
  }, [currentPage, type, status]);

  const fetchTransactions = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, size: 10, sort: 'createdAt,desc' };
      if (type) params.type = type;
      if (status) params.status = status;

      const res = await axiosInstance.get(endpoints.admin.transactions, { params });
      if (isMountedRef.current) {
        setTransactions(res.data?.content || []);
        setTotalPages(res.data?.totalPages || 1);
        setTotalElements(res.data?.totalElements || 0);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err.response?.data?.message || err.message || 'Failed to load transaction records';
      setError(msg);
      toast.error(msg);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRetry = () => {
    fetchTransactions(currentPage);
  };

  const filtered = transactions.filter(
    (t) =>
      t.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sourceAccountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destinationAccountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System-Wide Transaction Monitoring</h1>
          <p className="text-sm text-gray-500">
            Supervise and monitor all settled and in-flight financial transactions across all accounts
          </p>
        </div>
        <button
          onClick={handleRetry}
          disabled={loading}
          className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by reference or account..."
            className="input-field pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCurrentPage(0);
              }}
              className="input-field text-xs py-2 w-36"
            >
              <option value="">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="input-field text-xs py-2 w-32"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <LoadingSpinner text="Fetching system-wide transaction logs..." />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Failed to load transaction records</h3>
            <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button onClick={handleRetry} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions found" description="No transactions match the criteria." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From Account</th>
                  <th className="py-3 px-4">To Account</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-900">
                      {tx.referenceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={tx.transactionType} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                      {tx.sourceAccountNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                      {tx.destinationAccountNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 font-mono">
                      ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={tx.status} />
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
        </div>
      )}
    </div>
  );
}
