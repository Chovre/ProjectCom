import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { BookOpen, Search, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditorLedgerPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLedger(currentPage);
  }, [currentPage]);

  const fetchLedger = async (page = 0) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.auditor.ledger, {
        params: { page, size: 10, sort: 'createdAt,desc' },
      });
      setEntries(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load ledger records');
    } finally {
      setLoading(false);
    }
  };

  const filtered = entries.filter(
    (e) =>
      e.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Double-Entry Ledger Audit</h1>
          <p className="text-sm text-gray-500">
            Immutable, append-only journal entries. Zero UPDATE/DELETE operations permitted by database triggers.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
          <Lock className="w-3.5 h-3.5 text-gray-600" /> PostgreSQL Immutability Trigger Active
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by transaction reference or account..."
            className="input-field pl-9 text-xs"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Total Journal Records: <strong className="text-gray-900">{totalElements}</strong>
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Reading immutable ledger journals..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No ledger entries" description="No ledger records found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Entry ID</th>
                  <th className="py-3 px-4">Transaction Reference</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Entry Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500">#{entry.id}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-900">
                      {entry.transactionReference}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-navy-700 font-semibold">
                      {entry.accountNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={entry.entryType} />
                    </td>
                    <td
                      className={`py-3.5 px-4 font-bold font-mono ${
                        entry.entryType === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {entry.entryType === 'CREDIT' ? '+' : '-'}₹
                      {Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{entry.currency}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
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
    </div>
  );
}

