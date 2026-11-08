import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { ArrowDownToLine, CheckCircle2, AlertCircle, ShieldAlert, RefreshCw, Wallet, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DepositPage() {
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
  const currentBalance = selectedAccount ? Number(selectedAccount.balance) : 0;

  const validateManualAmount = (val) => {
    if (!val || val.trim() === '') {
      setAmountError('Amount is required and must be entered manually.');
      return false;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setAmountError('Deposit amount must be strictly greater than ₹0.00.');
      return false;
    }
    const parts = val.split('.');
    if (parts.length > 1 && parts[1].length > 2) {
      setAmountError('Amount cannot have more than 2 decimal places.');
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
      setError('Please select an active destination account.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteDeposit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError('');

    const parsedAmount = parseFloat(amount);
    const idempotencyKey = 'DEP-' + crypto.randomUUID();

    try {
      const res = await axiosInstance.post(
        endpoints.transactions.deposit,
        {
          accountId: Number(accountId),
          amount: parsedAmount,
          currency: 'INR',
          description: description.trim() || 'Manual Authorized Sandbox Funding',
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      setReceipt(res.data);
      toast.success('Funds successfully deposited!');
      fetchAccounts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Deposit failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading eligible accounts..." />;
  }

  const numericAmount = parseFloat(amount) || 0;
  const projectNewBalance = currentBalance + numericAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Deposit Funds</h1>
        <p className="text-sm text-gray-500">
          Manual simulated funding workflow with verified double-entry credit ledger recording
        </p>
      </div>

      {/* Strict Requirement Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Strict Manual Money Input Policy</span>
          <p>
            No account is automatically populated with money. All funding amounts must be manually entered and confirmed.
            This simulated deposit represents external settlement, increases the account balance atomically, and generates an immutable CREDIT ledger entry.
          </p>
        </div>
      </div>

      {/* Success Receipt Card */}
      {receipt ? (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deposit Completed Successfully</h2>
            <p className="text-xs text-gray-500 mt-1">Transaction reference recorded in immutable audit logs</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction Reference:</span>
              <span className="font-bold text-gray-900">{receipt.referenceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Destination Account:</span>
              <span className="font-bold text-gray-900">{receipt.destinationAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Currency:</span>
              <span className="font-bold text-gray-900">{receipt.currency || 'INR'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Deposited:</span>
              <span className="font-bold text-emerald-600">
                +₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ledger Entry Type:</span>
              <span className="font-bold text-gray-900">CREDIT</span>
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
              Make Another Deposit
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
              <p className="text-sm text-gray-600 mb-4">You have no active accounts eligible for deposits.</p>
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
                <label className="label-text">Select Destination Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-field text-sm"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.accountType}) — Current: ₹
                      {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Balance Display */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-gray-600">
                  <Wallet className="w-4 h-4 text-navy-600" />
                  <span>Current Available Balance:</span>
                </div>
                <span className="text-base font-bold text-navy-950 font-mono">
                  ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Amount Input with separate Currency badge */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-text mb-0">Deposit Amount</label>
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
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount manually"
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
                    Enter the exact positive monetary amount manually. Supports two decimal places (e.g. 500.00).
                  </p>
                )}
              </div>

              <div>
                <label className="label-text">Funding Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Manual salary credit or authorized capital funding"
                  className="input-field text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-success w-full py-3 text-sm flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                <ArrowDownToLine className="w-4 h-4" /> Review & Confirm Deposit
              </button>
            </form>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecuteDeposit}
        title="Confirm Manual Deposit"
        message={`Please confirm your manual deposit of ₹${numericAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} into account ${selectedAccount?.accountNumber}. Current balance will increase from ₹${currentBalance.toLocaleString(
          'en-IN',
          { minimumFractionDigits: 2 }
        )} to ₹${projectNewBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}. This operation is atomic and generates an immutable double-entry CREDIT ledger record.`}
        confirmText="Confirm & Authorize Deposit"
        isLoading={submitting}
      />
    </div>
  );
}
