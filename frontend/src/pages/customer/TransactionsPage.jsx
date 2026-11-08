import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { Receipt, Search, Filter, ExternalLink, RefreshCw, AlertCircle, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchRef, setSearchRef] = useState('');
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  useEffect(() => {
    isMountedRef.current = true;
    fetchTransactions(currentPage);
    return () => {
      isMountedRef.current = false;
    };
  }, [currentPage, type, status, sortDirection]);

  const fetchTransactions = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        size: 10,
        sort: `createdAt,${sortDirection}`,
      };
      if (type) params.type = type;
      if (status) params.status = status;

      const res = await axiosInstance.get(endpoints.transactions.my, { params });

      if (isMountedRef.current) {
        setTransactions(res.data?.content || []);
        setTotalPages(res.data?.totalPages || 1);
        setTotalElements(res.data?.totalElements || 0);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      let errorMsg = 'Failed to load transaction records. Please try again.';
      if (err.response) {
        const { status: httpStatus, data } = err.response;
        if (httpStatus === 401) {
          errorMsg = 'Session expired or invalid credentials. Please log in again.';
        } else if (httpStatus === 403) {
          errorMsg = 'Access denied. You do not have permission to view these transactions.';
        } else if (httpStatus === 404) {
          errorMsg = 'Transaction records service could not be located.';
        } else if (httpStatus >= 500) {
          errorMsg = data?.message || 'Internal ledger service error while fetching transactions.';
        } else if (data?.message) {
          errorMsg = data.message;
        }
      } else if (err.request) {
        errorMsg = 'Unable to reach the backend service. Check network connectivity.';
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchRef.trim()) {
      fetchTransactions(0);
      return;
    }
    navigate(`/customer/transactions/${searchRef.trim()}`);
  };

  const handleRetry = () => {
    fetchTransactions(currentPage);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setCurrentPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transaction History</h1>
          <p className="text-sm text-gray-500">
            Immutable and verified audit trail of all financial movements on your accounts
          </p>
        </div>
        <button
          onClick={handleRetry}
          disabled={loading}
          className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Records
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search by Reference */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Search by exact reference number..."
            className="input-field pl-9 text-xs"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
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

          <button
            onClick={toggleSortDirection}
            className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <LoadingSpinner text="Fetching financial records from ledger database..." />
        </div>
      ) : error ? (
        /* Error State with Retry Button */
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Failed to load transaction records</h3>
            <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleRetry}
              className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Now
            </button>
          </div>
        </div>
      ) : transactions.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={Receipt}
          title="No transaction records found"
          description={
            type || status
              ? 'No transactions match the selected filter criteria. Try clearing filters.'
              : 'You have not performed any financial transactions yet. Deposits, withdrawals, and transfers will appear here.'
          }
          actionText={type || status ? 'Clear Filters' : 'Deposit Funds'}
          onAction={
            type || status
              ? () => {
                  setType('');
                  setStatus('');
                  setCurrentPage(0);
                }
              : () => navigate('/customer/deposit')
          }
        />
      ) : (
        /* Data Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From Account</th>
                  <th className="py-3 px-4">To Account</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => navigate(`/customer/transactions/${tx.referenceNumber}`)}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
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
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {tx.transactionType === 'DEPOSIT' && (
                        <span className="text-emerald-600 mr-1">+</span>
                      )}
                      {tx.transactionType === 'WITHDRAWAL' && (
                        <span className="text-red-600 mr-1">-</span>
                      )}
                      ₹{Number(tx.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-navy-600 hover:text-navy-800 text-xs font-semibold inline-flex items-center gap-1">
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </span>
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
              onPageChange={(newPage) => setCurrentPage(newPage)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
