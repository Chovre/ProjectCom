import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { ArrowLeftRight, CheckCircle2, AlertCircle, RefreshCw, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransferPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [destError, setDestError] = useState('');
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(endpoints.accounts.my);
      const active = (res.data || []).filter((a) => a.status === 'ACTIVE');
      setAccounts(active);
      if (active.length > 0) {
        setSourceAccountId(active[0].id);
      }
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => String(a.id) === String(sourceAccountId));
  const availableBalance = selectedAccount ? Number(selectedAccount.balance) : 0;

  const validateManualAmount = (val) => {
    if (!val || val.trim() === '') {
      setAmountError('Amount is required and must be entered manually.');
      return false;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setAmountError('Transfer amount must be strictly greater than ₹0.00.');
      return false;
    }
    const parts = val.split('.');
    if (parts.length > 1 && parts[1].length > 2) {
      setAmountError('Amount cannot have more than 2 decimal places.');
      return false;
    }
    if (num > availableBalance) {
      setAmountError(
        `Insufficient balance. Available balance is ₹${availableBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      );
      return false;
    }
    setAmountError('');
    return true;
  };

  const validateDestination = (dest) => {
    const trimmed = dest.trim().toUpperCase();
    if (!trimmed) {
      setDestError('Destination account number is required.');
      return false;
    }
    if (selectedAccount && trimmed === selectedAccount.accountNumber.toUpperCase()) {
      setDestError('Sender and recipient accounts must be different.');
      return false;
    }
    setDestError('');
    return true;
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    if (val.trim() !== '') {
      validateManualAmount(val);
    } else {
      setAmountError('');
    }
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    setDestinationAccountNumber(val);
    if (val.trim() !== '') {
      validateDestination(val);
    } else {
      setDestError('');
    }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setError('');

    const isAmountValid = validateManualAmount(amount);
    const isDestValid = validateDestination(destinationAccountNumber);

    if (!isAmountValid || !isDestValid) {
      return;
    }

    if (!selectedAccount) {
      setError('Please select an active sender account.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteTransfer = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError('');

    const idempotencyKey = 'TRF-' + crypto.randomUUID();
    const parsedAmount = parseFloat(amount);

    try {
      const res = await axiosInstance.post(
        endpoints.transactions.transfer,
        {
          sourceAccountId: Number(sourceAccountId),
          destinationAccountNumber: destinationAccountNumber.trim().toUpperCase(),
          amount: parsedAmount,
          description: description.trim() || 'P2P Fund Transfer',
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      setReceipt(res.data);
      toast.success('Money transferred successfully!');
      fetchAccounts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Transfer failed. Please verify recipient account number and balance.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading source accounts..." />;
  }

  const numericAmount = parseFloat(amount) || 0;
  const projectedRemainingBalance = availableBalance - numericAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transfer Funds</h1>
        <p className="text-sm text-gray-500">
          Deterministic two-phase locking & balanced double-entry ledger settlement
        </p>
      </div>

      {receipt ? (
        /* Success Receipt */
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transfer Completed Successfully</h2>
            <p className="text-xs text-gray-500 mt-1">
              Atomic commit: matching debit and credit ledger entries created
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction Reference:</span>
              <span className="font-bold text-gray-900">{receipt.referenceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sender Account:</span>
              <span className="font-bold text-gray-900">{receipt.sourceAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Recipient Account:</span>
              <span className="font-bold text-gray-900">{receipt.destinationAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Currency:</span>
              <span className="font-bold text-gray-900">{receipt.currency || 'INR'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Transferred:</span>
              <span className="font-bold text-emerald-600">
                ₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ledger Status:</span>
              <span className="font-bold text-emerald-600">BALANCED (DEBIT = CREDIT)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction Status:</span>
              <span className="font-bold text-emerald-600">{receipt.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setReceipt(null);
                setAmount('');
                setDestinationAccountNumber('');
                setDescription('');
                fetchAccounts();
              }}
              className="btn-secondary text-sm py-2 px-5"
            >
              Make Another Transfer
            </button>
            <button
              onClick={() => navigate('/customer/transactions')}
              className="btn-primary text-sm py-2 px-5"
            >
              View Transactions
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600 mb-4">You have no active accounts with available funds.</p>
              <button
                onClick={() => navigate('/customer/accounts')}
                className="btn-primary text-sm py-2 px-4"
              >
                Open an Account
              </button>
            </div>
          ) : (
            <form onSubmit={handlePreSubmit} className="space-y-5">
              <div>
                <label className="label-text">From Account (Sender)</label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="input-field text-sm"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.accountType}) — Available: ₹
                      {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance Callout */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-gray-600">
                  <Wallet className="w-4 h-4 text-navy-600" />
                  <span>Available Balance:</span>
                </div>
                <span className="text-base font-bold text-navy-950 font-mono">
                  ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {availableBalance <= 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Sender account has ₹0.00 available balance. Please deposit funds before initiating a transfer.</span>
                </div>
              )}

              <div>
                <label className="label-text">Destination Account Number</label>
                <input
                  type="text"
                  value={destinationAccountNumber}
                  onChange={handleDestChange}
                  placeholder="e.g. ACC1000000003"
                  className={`input-field font-mono text-sm uppercase ${
                    destError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                  }`}
                  required
                />
                {destError ? (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {destError}
                  </p>
                ) : (
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Enter the recipient's exact 13-character bank account number
                  </span>
                )}
              </div>

              {/* Amount Input with separate Currency badge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-text mb-0">Transfer Amount</label>
                  <span className="text-[11px] font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                    Currency: INR (₹)
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableBalance > 0 ? availableBalance : undefined}
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount manually"
                    disabled={availableBalance <= 0}
                    className={`input-field pl-8 text-sm font-semibold ${
                      amountError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                    required
                  />
                </div>
                {amountError ? (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {amountError}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Enter the exact positive amount manually. Must not exceed available balance of ₹
                    {availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.
                  </p>
                )}
              </div>

              <div>
                <label className="label-text">Transfer Note / Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Project payment, rent, or bill sharing"
                  disabled={availableBalance <= 0}
                  className="input-field text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || availableBalance <= 0 || !amount || !!amountError || !destinationAccountNumber || !!destError}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review Transfer Summary <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecuteTransfer}
        title="Confirm Transfer Details"
        message={`Please confirm your transfer of ₹${numericAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} from account ${selectedAccount?.accountNumber} to ${destinationAccountNumber.trim().toUpperCase()}. Remaining balance will be ₹${projectedRemainingBalance.toLocaleString(
          'en-IN',
          { minimumFractionDigits: 2 }
        )}. This operation is atomic, protected by deterministic two-phase row locks, and irreversible.`}
        confirmText="Confirm & Authorize Transfer"
        isLoading={submitting}
      />
    </div>
  );
}
