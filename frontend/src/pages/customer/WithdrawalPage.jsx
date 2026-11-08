import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { ArrowUpFromLine, CheckCircle2, AlertCircle, RefreshCw, Wallet, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WithdrawalPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
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
        setAccountId(active[0].id);
      }
    } catch (err) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId));
  const availableBalance = selectedAccount ? Number(selectedAccount.balance) : 0;

  const validateManualAmount = (val) => {
    if (!val || val.trim() === '') {
      setAmountError('Amount is required and must be entered manually.');
      return false;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setAmountError('Withdrawal amount must be strictly greater than ₹0.00.');
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

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    if (val.trim() !== '') {
      validateManualAmount(val);
    } else {
      setAmountError('');
    }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!validateManualAmount(amount)) {
      return;
    }

    if (!selectedAccount) {
      setError('Please select an active account.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteWithdrawal = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError('');

    const parsedAmount = parseFloat(amount);
    const idempotencyKey = 'WTH-' + crypto.randomUUID();

    try {
      const res = await axiosInstance.post(
        endpoints.transactions.withdraw,
        {
          accountId: Number(accountId),
          amount: parsedAmount,
          description: description.trim() || 'Manual ATM / Cash Withdrawal',
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      setReceipt(res.data);
      toast.success('Withdrawal completed successfully!');
      fetchAccounts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Withdrawal failed. Insufficient funds or account locked.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving account balance..." />;
  }

  const numericAmount = parseFloat(amount) || 0;
  const projectedRemainingBalance = availableBalance - numericAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Withdraw Funds</h1>
        <p className="text-sm text-gray-500">
          Atomic debit operation protected by PostgreSQL row-level locks (SELECT FOR UPDATE)
        </p>
      </div>

      {receipt ? (
        /* Receipt Card */
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Withdrawal Successful</h2>
            <p className="text-xs text-gray-500 mt-1">Debit ledger entry appended to immutable journal</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction Reference:</span>
              <span className="font-bold text-gray-900">{receipt.referenceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Debited Account:</span>
              <span className="font-bold text-gray-900">{receipt.sourceAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Currency:</span>
              <span className="font-bold text-gray-900">{receipt.currency || 'INR'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Debited:</span>
              <span className="font-bold text-red-600">
                -₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ledger Entry Type:</span>
              <span className="font-bold text-gray-900">DEBIT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-bold text-emerald-600">{receipt.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setReceipt(null);
                setAmount('');
                setDescription('');
                fetchAccounts();
              }}
              className="btn-secondary text-sm py-2 px-5"
            >
              Make Another Withdrawal
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
              <p className="text-sm text-gray-600 mb-4">No active accounts found.</p>
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
                <label className="label-text">Select Source Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
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
                  <span>This account has ₹0.00 available balance. Please deposit funds before requesting a withdrawal.</span>
                </div>
              )}

              {/* Amount Input with separate Currency badge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-text mb-0">Withdrawal Amount</label>
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
                <label className="label-text">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. ATM withdrawal or cash voucher"
                  disabled={availableBalance <= 0}
                  className="input-field text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || availableBalance <= 0 || !amount || !!amountError}
                className="btn-danger w-full py-3 text-sm flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpFromLine className="w-4 h-4" /> Review & Confirm Withdrawal
              </button>
            </form>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecuteWithdrawal}
        title="Confirm Manual Withdrawal"
        message={`Please confirm your withdrawal of ₹${numericAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} from account ${selectedAccount?.accountNumber}. Remaining balance will be ₹${projectedRemainingBalance.toLocaleString(
          'en-IN',
          { minimumFractionDigits: 2 }
        )}. This operation is protected by a pessimistic database lock and is irreversible.`}
        confirmText="Confirm & Authorize Withdrawal"
        isLoading={submitting}
      />
    </div>
  );
}
