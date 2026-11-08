import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { ShieldCheck, Search, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  const fetchLogs = async (page = 0) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.admin.audit, {
        params: { page, size: 10, sort: 'createdAt,desc' },
      });
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load audit trail logs');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Audit Trail</h1>
          <p className="text-sm text-gray-500">
            Immutable, append-only security logs recording all authentication, transaction, and admin events
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
          <Lock className="w-3.5 h-3.5 text-gray-600" /> Tamper-Proof Audit Store
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, actor, or description..."
            className="input-field pl-9 text-xs"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Logged Events: <strong className="text-gray-900">{totalElements}</strong>
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Reading immutable audit store..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No audit logs found" description="No audit log entries recorded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">#{log.id}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono bg-navy-50 text-navy-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-900">{log.actorName}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 font-mono">
                      {log.entityType} {log.entityId ? `[${log.entityId}]` : ''}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700 max-w-sm truncate">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
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

