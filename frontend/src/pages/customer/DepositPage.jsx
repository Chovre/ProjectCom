import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import {
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Smartphone,
  Banknote,
  Wallet,
  Lock,
  ArrowRight,
  Info,
  RefreshCw,
  FileText,
  Eye,
  History,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const POPULAR_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Kotak Mahindra Bank',
  'Canara Bank',
  'Union Bank of India',
  'Other Bank',
];

export default function DepositPage() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'NEW_REQUEST' or 'HISTORY'
  const [activeTab, setActiveTab] = useState('NEW_REQUEST');

  // Initial Data
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  // Bank Transfer Fields
  const [bankName, setBankName] = useState('State Bank of India');
  const [customBankName, setCustomBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [confirmBankAccountNumber, setConfirmBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [sourceAccountHolderName, setSourceAccountHolderName] = useState('');

  // UPI Fields
  const [upiId, setUpiId] = useState('');
  const [upiRemitterName, setUpiRemitterName] = useState('');

  // Cash Deposit Fields
  const [branchOrCdm, setBranchOrCdm] = useState('');
  const [depositSlipReference, setDepositSlipReference] = useState('');
  const [depositorName, setDepositorName] = useState('');

  // Deposit Details
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionReference, setTransactionReference] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Submission Result & Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState(null);

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab, historyPage]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [accRes, meRes] = await Promise.all([
        axiosInstance.get(endpoints.accounts.my),
        axiosInstance.get(endpoints.auth.me).catch(() => ({ data: null })),
      ]);

      const active = (accRes.data || []).filter((a) => a.status === 'ACTIVE');
      setAccounts(active);
      if (active.length > 0) {
        setAccountId(active[0].id);
      }

      const userName = meRes?.data?.fullName || authUser?.fullName || '';
      if (meRes?.data) {
        setProfile(meRes.data);
      }
      setSourceAccountHolderName(userName);
      setUpiRemitterName(userName);
      setDepositorName(userName);
    } catch (err) {
      toast.error('Failed to load eligible bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await axiosInstance.get(`${endpoints.deposits.myRequests}?page=${historyPage}&size=8&sort=submittedAt,desc`);
      setHistoryList(res.data.content || []);
      setHistoryTotalPages(res.data.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load deposit request history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId));
  const currentBalance = selectedAccount ? Number(selectedAccount.balance) : 0;
  const customerName = profile?.fullName || authUser?.fullName || 'Valued Customer';
  const customerMobile = profile?.phone || authUser?.phone || '9000000003';

  // --- Form Validation ---
  const validateForm = () => {
    const errs = {};

    if (!accountId) {
      errs.accountId = 'Please select a destination LedgerLine account.';
    }

    if (!amount || amount.trim() === '') {
      errs.amount = 'Deposit amount is required and must be entered manually.';
    } else {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) {
        errs.amount = 'Deposit amount must be strictly greater than ₹0.00.';
      } else {
        const parts = amount.split('.');
        if (parts.length > 1 && parts[1].length > 2) {
          errs.amount = 'Amount cannot have more than 2 decimal places.';
        }
      }
    }

    if (paymentMethod === 'BANK_TRANSFER') {
      const effectiveBank = bankName === 'Other Bank' ? customBankName.trim() : bankName;
      if (!effectiveBank) {
        errs.bankName = 'Bank name is required.';
      }

      const accRegex = /^\d{9,18}$/;
      if (!bankAccountNumber || !bankAccountNumber.trim()) {
        errs.bankAccountNumber = 'Bank account number is required.';
      } else if (!accRegex.test(bankAccountNumber.trim())) {
        errs.bankAccountNumber = 'Please enter a valid bank account number (9 to 18 digits).';
      }

      if (confirmBankAccountNumber.trim() !== bankAccountNumber.trim()) {
        errs.confirmBankAccountNumber = 'Account numbers do not match. Please verify.';
      }

      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      const upperIfsc = ifscCode.trim().toUpperCase();
      if (!upperIfsc) {
        errs.ifscCode = 'IFSC code is required.';
      } else if (!ifscRegex.test(upperIfsc)) {
        errs.ifscCode = 'Invalid IFSC code format (e.g. SBIN0001234: 4 letters, 0, 6 characters).';
      }

      if (!sourceAccountHolderName || !sourceAccountHolderName.trim()) {
        errs.sourceAccountHolderName = 'Account holder name is required.';
      }
    } else if (paymentMethod === 'UPI') {
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!upiId || !upiId.trim()) {
        errs.upiId = 'UPI ID (VPA) is required.';
      } else if (!upiRegex.test(upiId.trim())) {
        errs.upiId = 'Invalid UPI ID format (e.g. username@oksbi, mobile@upi).';
      }
    } else if (paymentMethod === 'CASH_DEPOSIT') {
      if (!branchOrCdm || !branchOrCdm.trim()) {
        errs.branchOrCdm = 'Bank Branch or CDM Location name is required.';
      }
      if (!depositSlipReference || !depositSlipReference.trim()) {
        errs.depositSlipReference = 'Deposit Counterfoil or Slip reference number is required.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenConfirmModal = (e) => {
    e.preventDefault();
    setGeneralError('');
    if (validateForm()) {
      setShowConfirmModal(true);
    } else {
      toast.error('Please resolve the highlighted validation errors before submitting.');
    }
  };

  const handleExecuteDepositRequest = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setGeneralError('');

    const parsedAmount = parseFloat(amount);
    const effectiveBank = bankName === 'Other Bank' ? customBankName.trim() : bankName;

    const payload = {
      accountId: Number(accountId),
      amount: parsedAmount,
      currency: 'INR',
      paymentMethod,
      description: description.trim() || undefined,
      transactionReference: transactionReference.trim() || undefined,
    };

    if (paymentMethod === 'BANK_TRANSFER') {
      payload.bankName = effectiveBank;
      payload.bankAccountNumber = bankAccountNumber.trim();
      payload.ifscCode = ifscCode.trim().toUpperCase();
      payload.sourceAccountHolder = sourceAccountHolderName.trim();
    } else if (paymentMethod === 'UPI') {
      payload.bankName = 'UPI Transfer';
      payload.sourceAccountHolder = upiRemitterName.trim();
      payload.transactionReference = transactionReference.trim() || upiId.trim();
    } else if (paymentMethod === 'CASH_DEPOSIT') {
      payload.bankName = 'Cash CDM - ' + branchOrCdm.trim();
      payload.sourceAccountHolder = depositorName.trim();
      payload.transactionReference = depositSlipReference.trim();
    }

    try {
      const res = await axiosInstance.post(endpoints.deposits.createRequest, payload);
      setSubmittedReceipt(res.data);
      toast.success('Deposit request submitted! Awaiting administrator approval.');
      fetchInitialData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Deposit request submission failed.';
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setTransactionReference('');
    setBankAccountNumber('');
    setConfirmBankAccountNumber('');
    setIfscCode('');
    setUpiId('');
    setBranchOrCdm('');
    setDepositSlipReference('');
    setSubmittedReceipt(null);
    setErrors({});
    setGeneralError('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved & Credited
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading eligible accounts and customer profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowDownToLine className="w-7 h-7 text-indigo-600" />
            Deposit Money
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit an authorised deposit request. Funds are credited immediately once verified and approved by the bank administrator.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('NEW_REQUEST');
              setSubmittedReceipt(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'NEW_REQUEST'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            New Deposit Request
          </button>
          <button
            onClick={() => {
              setActiveTab('HISTORY');
              setSubmittedReceipt(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Request History
          </button>
        </div>
      </div>

      {/* TAB 1: NEW DEPOSIT REQUEST FORM OR RECEIPT */}
      {activeTab === 'NEW_REQUEST' && (
        <>
          {/* SUCCESSFUL SUBMISSION RECEIPT */}
          {submittedReceipt ? (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Deposit Request Submitted</h2>
                <p className="text-sm text-emerald-700 font-medium">
                  Your deposit request has been submitted successfully and is waiting for administrator approval.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-3 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-500">Request Reference:</span>
                  <span className="font-mono font-bold text-gray-900">{submittedReceipt.requestReference}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Requested Amount:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{parseFloat(submittedReceipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Credited Account:</span>
                  <span className="font-mono text-gray-800">{submittedReceipt.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment Channel:</span>
                  <span className="font-medium text-gray-800">{submittedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Current Status:</span>
                  <div>{getStatusBadge(submittedReceipt.status)}</div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Submission Timestamp:</span>
                  <span className="text-gray-600">
                    {new Date(submittedReceipt.submittedAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Accounting Rule:</strong> In accordance with strict double-entry banking standards, your account balance will not change until the bank administrator verifies the settlement receipt. You can track review progress under the <strong>Request History</strong> tab.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('HISTORY');
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  View Request in History
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Submit Another Deposit
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOpenConfirmModal} className="space-y-6">
              {/* Security Banner */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-0.5">
                  <p className="font-semibold">Authorised Funding & Verification Workflow</p>
                  <p className="text-indigo-700">
                    LedgerLine does not automatically credit arbitrary money. All deposits require verified settlement proof and administrator sign-off before funds are credited.
                  </p>
                </div>
              </div>

              {generalError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* SECTION 1: CUSTOMER DETAILS */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                  1. Customer & Destination Account Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Account Holder Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={customerName}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 cursor-not-allowed font-medium"
                    />
                  </div>

                  {/* Registered Mobile */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Registered Mobile Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={customerMobile}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Destination Account Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex justify-between">
                      <span>LedgerLine Account *</span>
                      <span className="text-gray-400 font-normal">Bal: ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className={`w-full bg-white border ${
                        errors.accountId ? 'border-rose-300 ring-rose-200' : 'border-gray-300'
                      } text-gray-800 text-sm rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} ({acc.accountType} - ₹{Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                        </option>
                      ))}
                    </select>
                    {errors.accountId && <p className="text-xs text-rose-600">{errors.accountId}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 2: PAYMENT METHOD SELECTION */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                  2. Select Payment Remittance Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS/IMPS)', icon: Building2 },
                    { id: 'UPI', label: 'UPI / VPA Payment', icon: Smartphone },
                    { id: 'CASH_DEPOSIT', label: 'Cash CDM Deposit', icon: Banknote },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id);
                          setErrors({});
                        }}
                        className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-lg w-fit ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-fields for BANK TRANSFER */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-4 pt-4 border-t border-gray-100 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bank Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Bank Name *</label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          {POPULAR_BANKS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                        {bankName === 'Other Bank' && (
                          <input
                            type="text"
                            placeholder="Enter bank name"
                            value={customBankName}
                            onChange={(e) => setCustomBankName(e.target.value)}
                            className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        )}
                        {errors.bankName && <p className="text-xs text-rose-600">{errors.bankName}</p>}
                      </div>

                      {/* IFSC Code */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">IFSC Code *</label>
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="e.g. SBIN0001234"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                          className={`w-full border ${errors.ifscCode ? 'border-rose-300' : 'border-gray-300'} font-mono uppercase rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                        />
                        {errors.ifscCode && <p className="text-xs text-rose-600">{errors.ifscCode}</p>}
                      </div>

                      {/* Bank Account Number */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Remitter Bank Account Number *</label>
                        <input
                          type="password"
                          placeholder="Enter remitter account number"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          className={`w-full border ${errors.bankAccountNumber ? 'border-rose-300' : 'border-gray-300'} font-mono rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                        />
                        {errors.bankAccountNumber && <p className="text-xs text-rose-600">{errors.bankAccountNumber}</p>}
                      </div>

                      {/* Confirm Bank Account Number */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Confirm Bank Account Number *</label>
                        <input
                          type="text"
                          placeholder="Re-enter bank account number"
                          value={confirmBankAccountNumber}
                          onChange={(e) => setConfirmBankAccountNumber(e.target.value)}
                          className={`w-full border ${errors.confirmBankAccountNumber ? 'border-rose-300' : 'border-gray-300'} font-mono rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                        />
                        {errors.confirmBankAccountNumber && <p className="text-xs text-rose-600">{errors.confirmBankAccountNumber}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-fields for UPI */}
                {paymentMethod === 'UPI' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">UPI ID / VPA *</label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@oksbi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className={`w-full border ${errors.upiId ? 'border-rose-300' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                      />
                      {errors.upiId && <p className="text-xs text-rose-600">{errors.upiId}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">UPI Remitter Name</label>
                      <input
                        type="text"
                        value={upiRemitterName}
                        onChange={(e) => setUpiRemitterName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-fields for CASH DEPOSIT */}
                {paymentMethod === 'CASH_DEPOSIT' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Branch Name or CDM Machine Location *</label>
                      <input
                        type="text"
                        placeholder="e.g. SBI Main Branch CDM, Pune"
                        value={branchOrCdm}
                        onChange={(e) => setBranchOrCdm(e.target.value)}
                        className={`w-full border ${errors.branchOrCdm ? 'border-rose-300' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                      />
                      {errors.branchOrCdm && <p className="text-xs text-rose-600">{errors.branchOrCdm}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Deposit Slip or Counterfoil Ref # *</label>
                      <input
                        type="text"
                        placeholder="e.g. SLIP-984214"
                        value={depositSlipReference}
                        onChange={(e) => setDepositSlipReference(e.target.value)}
                        className={`w-full border ${errors.depositSlipReference ? 'border-rose-300' : 'border-gray-300'} font-mono rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                      />
                      {errors.depositSlipReference && <p className="text-xs text-rose-600">{errors.depositSlipReference}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: DEPOSIT AMOUNT & TRANSACTION REFERENCE */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                  3. Deposit Amount & Remarks
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amount Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 flex justify-between">
                      <span>Deposit Amount (INR) *</span>
                      <span className="text-indigo-600 font-normal">Strict Manual Entry</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter amount manually (e.g. 5000.00)"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
                        }}
                        className={`w-full pl-8 pr-3 py-2.5 text-base font-bold border ${
                          errors.amount ? 'border-rose-300' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                      />
                    </div>
                    {errors.amount && <p className="text-xs text-rose-600">{errors.amount}</p>}
                  </div>

                  {/* Transaction Reference / UTR */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Bank UTR / Transaction Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR / Ref Number from banking receipt"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400">Providing the bank UTR accelerates admin verification.</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Remarks / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly savings contribution, business settlement..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Review & Submit Deposit Request
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: DEPOSIT REQUEST HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Deposit Requests</h2>
              <p className="text-xs text-gray-500">Track real-time administrative review and settlement status</p>
            </div>
            <button
              onClick={fetchHistory}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner message="Loading request history..." />
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Clock className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 text-sm">You haven't submitted any deposit requests yet.</p>
              <button
                onClick={() => setActiveTab('NEW_REQUEST')}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Submit First Request
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {historyList.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900">{item.requestReference}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                      <span>A/C: <strong className="font-mono text-gray-700">{item.accountNumber}</strong></span>
                      <span>Channel: <strong>{item.paymentMethod}</strong></span>
                      {item.transactionReference && <span>Ref: <strong className="font-mono">{item.transactionReference}</strong></span>}
                      <span>Date: {new Date(item.submittedAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    {item.status === 'REJECTED' && item.rejectionReason && (
                      <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 inline-block mt-1">
                        <strong>Rejection Reason: </strong> {item.rejectionReason}
                      </div>
                    )}

                    {item.status === 'APPROVED' && item.completedTransactionReference && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block mt-1 font-mono">
                        Credited via Txn: {item.completedTransactionReference}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-base font-bold text-gray-900">
                      ₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => setSelectedHistoryItem(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {historyTotalPages > 1 && (
                <div className="pt-4">
                  <Pagination
                    currentPage={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={(p) => setHistoryPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3 text-indigo-700 border-b border-gray-100 pb-3">
              <div className="p-2 bg-indigo-100 rounded-full">
                <ArrowDownToLine className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Deposit Request</h3>
                <p className="text-xs text-gray-500">Requires bank administrator verification</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Credited Account:</span>
                <span className="font-mono font-semibold text-gray-900">{selectedAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Channel:</span>
                <span className="font-semibold text-gray-800">{paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Requested Amount:</span>
                <span className="text-xl font-bold text-indigo-700">
                  ₹{parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> Your account balance will remain unchanged until an administrator confirms the settlement receipt.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleExecuteDepositRequest}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL FOR HISTORY */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Deposit Request Summary</h3>
                <p className="text-xs font-mono text-gray-400">{selectedHistoryItem.requestReference}</p>
              </div>
              <div>{getStatusBadge(selectedHistoryItem.status)}</div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500">Requested Amount:</span>
                <span className="text-lg font-bold text-gray-900">
                  ₹{parseFloat(selectedHistoryItem.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Target Account:</span>
                <span className="font-mono text-gray-800">{selectedHistoryItem.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Channel:</span>
                <span className="font-medium text-gray-800">{selectedHistoryItem.paymentMethod}</span>
              </div>
              {selectedHistoryItem.bankName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Remitter Bank:</span>
                  <span className="text-gray-800">{selectedHistoryItem.bankName}</span>
                </div>
              )}
              {selectedHistoryItem.bankAccountNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Masked Account:</span>
                  <span className="font-mono text-gray-800">{selectedHistoryItem.bankAccountNumber}</span>
                </div>
              )}
              {selectedHistoryItem.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-gray-500">UTR / Ref:</span>
                  <span className="font-mono text-indigo-700 font-semibold">{selectedHistoryItem.transactionReference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted On:</span>
                <span className="text-gray-700">{new Date(selectedHistoryItem.submittedAt).toLocaleString('en-IN')}</span>
              </div>

              {selectedHistoryItem.status === 'APPROVED' && (
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs space-y-1">
                  <div className="font-semibold text-emerald-800">Approved by Bank Administrator</div>
                  {selectedHistoryItem.completedTransactionReference && (
                    <div className="font-mono text-emerald-700">Ref: {selectedHistoryItem.completedTransactionReference}</div>
                  )}
                  {selectedHistoryItem.reviewedAt && (
                    <div className="text-emerald-600">On: {new Date(selectedHistoryItem.reviewedAt).toLocaleString('en-IN')}</div>
                  )}
                </div>
              )}

              {selectedHistoryItem.status === 'REJECTED' && (
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs space-y-1">
                  <div className="font-semibold text-rose-800">Request Rejected</div>
                  <div className="text-rose-700">Reason: {selectedHistoryItem.rejectionReason}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
