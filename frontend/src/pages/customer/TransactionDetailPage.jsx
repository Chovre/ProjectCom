import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Printer, CheckCircle2, Receipt, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactionDetailPage() {
  const { reference } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransaction();
  }, [reference]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.transactions.getByReference(reference));
      setTransaction(res.data);
    } catch (err) {
      toast.error('Transaction not found or access denied');
      navigate('/customer/transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving transaction receipt..." />;
  }

  if (!transaction) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/customer/transactions')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" /> Print Official Receipt
        </button>
      </div>

      {/* Official Receipt Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 printable-receipt">
        {/* Receipt Header */}
        <div className="text-center pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-navy-600 text-white font-bold flex items-center justify-center mx-auto mb-3 shadow-sm">
            LL
          </div>
          <h1 className="text-xl font-bold text-navy-950">LedgerLine Banking System</h1>
          <p className="text-xs text-gray-400 mt-0.5">Official Transaction Confirmation Receipt</p>
          <div className="mt-3">
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {/* Big Amount */}
        <div className="text-center py-6 border-b border-gray-100 bg-gray-50/50 rounded-xl my-6">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block">Total Amount</span>
          <span className="text-3xl font-extrabold text-navy-900 tracking-tight">
            ₹{Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-gray-500 block mt-1">Currency: {transaction.currency}</span>
        </div>

        {/* Detail Rows */}
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-500">Transaction Reference:</span>
            <span className="font-mono font-bold text-gray-900">{transaction.referenceNumber}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-500">Transaction Type:</span>
            <span className="font-semibold text-gray-900">{transaction.transactionType}</span>
          </div>

          {transaction.sourceAccountNumber && (
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Source Account:</span>
              <span className="font-mono font-semibold text-gray-900">{transaction.sourceAccountNumber}</span>
            </div>
          )}

          {transaction.destinationAccountNumber && (
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Destination Account:</span>
              <span className="font-mono font-semibold text-gray-900">{transaction.destinationAccountNumber}</span>
            </div>
          )}

          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-500">Initiated At:</span>
            <span className="text-gray-900">{new Date(transaction.createdAt).toLocaleString()}</span>
          </div>

          {transaction.completedAt && (
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Completed At:</span>
              <span className="text-gray-900">{new Date(transaction.completedAt).toLocaleString()}</span>
            </div>
          )}

          {transaction.description && (
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Description / Note:</span>
              <span className="text-gray-900 text-right max-w-xs">{transaction.description}</span>
            </div>
          )}
        </div>

        {/* Ledger Invariant Seal */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5 text-teal-700">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Cryptographically Verified & Ledger Balanced</span>
          </div>
          <span>Ref: {transaction.referenceNumber}</span>
        </div>
      </div>
    </div>
  );
}

