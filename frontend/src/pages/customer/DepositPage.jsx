import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import endpoints from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import {
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Smartphone,
  CreditCard,
  Banknote,
  Wallet,
  Lock,
  ArrowRight,
  Info,
  RefreshCw,
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

  // Card Fields (Safe metadata only)
  const [cardNetwork, setCardNetwork] = useState('RUPAY');
  const [cardIssuingBank, setCardIssuingBank] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardLast4, setCardLast4] = useState('');

  // Cash Deposit Fields
  const [branchOrCdm, setBranchOrCdm] = useState('');
  const [depositSlipReference, setDepositSlipReference] = useState('');
  const [depositorName, setDepositorName] = useState('');

  // Deposit Details
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [externalReference, setExternalReference] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Confirmation & Receipt
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

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

      if (meRes?.data) {
        setProfile(meRes.data);
        setSourceAccountHolderName(meRes.data.fullName || authUser?.fullName || '');
        setUpiRemitterName(meRes.data.fullName || authUser?.fullName || '');
        setCardholderName(meRes.data.fullName || authUser?.fullName || '');
        setDepositorName(meRes.data.fullName || authUser?.fullName || '');
      } else if (authUser) {
        setSourceAccountHolderName(authUser.fullName || '');
        setUpiRemitterName(authUser.fullName || '');
        setCardholderName(authUser.fullName || '');
        setDepositorName(authUser.fullName || '');
      }
    } catch (err) {
      toast.error('Failed to load eligible bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId));
  const currentBalance = selectedAccount ? Number(selectedAccount.balance) : 0;
  const customerName = profile?.fullName || authUser?.fullName || 'Valued Customer';
  const customerMobile = profile?.phone || authUser?.phone || '9000000003';

  // --- Validation ---
  const validateForm = () => {
    const errs = {};

    // 1. Destination Account
    if (!accountId) {
      errs.accountId = 'Please select a destination LedgerLine account.';
    }

    // 2. Deposit Amount
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

    // 3. Payment Method Specifics
    if (paymentMethod === 'BANK_TRANSFER') {
      const effectiveBank = bankName === 'Other Bank' ? customBankName.trim() : bankName;
      if (!effectiveBank) {
        errs.bankName = 'Bank name is required.';
      }

      const accRegex = /^\d{9,18}$/;
      if (!bankAccountNumber.trim()) {
        errs.bankAccountNumber = 'Bank account number is required.';
      } else if (!accRegex.test(bankAccountNumber.trim())) {
        errs.bankAccountNumber = 'Account number must be 9 to 18 digits.';
      }

      if (!confirmBankAccountNumber.trim()) {
        errs.confirmBankAccountNumber = 'Please confirm the bank account number.';
      } else if (confirmBankAccountNumber.trim() !== bankAccountNumber.trim()) {
        errs.confirmBankAccountNumber = 'Account numbers do not match.';
      }

      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscCode.trim()) {
        errs.ifscCode = 'IFSC code is required.';
      } else if (!ifscRegex.test(ifscCode.trim().toUpperCase())) {
        errs.ifscCode = 'Invalid IFSC format. Example: SBIN0001234 or HDFC0001234.';
      }

      if (!sourceAccountHolderName.trim()) {
        errs.sourceAccountHolderName = 'Account holder name is required.';
      }
    } else if (paymentMethod === 'UPI') {
      const vpaRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,49}$/;
      if (!upiId.trim()) {
        errs.upiId = 'UPI ID (VPA) is required.';
      } else if (!vpaRegex.test(upiId.trim())) {
        errs.upiId = 'Invalid UPI ID format. Example: user@okhdfcbank or name@upi.';
      }

      if (!upiRemitterName.trim()) {
        errs.upiRemitterName = 'Remitter name is required.';
      }
    } else if (paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') {
      if (!cardholderName.trim()) {
        errs.cardholderName = 'Cardholder name is required.';
      }
      if (!cardIssuingBank.trim()) {
        errs.cardIssuingBank = 'Issuing bank name is required.';
      }
      if (!cardLast4.trim() || !/^\d{4}$/.test(cardLast4.trim())) {
        errs.cardLast4 = 'Enter exactly the last 4 digits of the card.';
      }
    } else if (paymentMethod === 'CASH_DEPOSIT') {
      if (!branchOrCdm.trim()) {
        errs.branchOrCdm = 'Branch name or CDM Machine ID is required.';
      }
      if (!depositSlipReference.trim()) {
        errs.depositSlipReference = 'Cash deposit slip / receipt number is required.';
      }
      if (!depositorName.trim()) {
        errs.depositorName = 'Depositor name is required.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleExecuteDeposit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setGeneralError('');

    const parsedAmount = parseFloat(amount);
    const idempotencyKey = 'DEP-' + crypto.randomUUID();

    const effectiveBank = bankName === 'Other Bank' ? customBankName.trim() : bankName;

    const payload = {
      accountId: Number(accountId),
      amount: parsedAmount,
      currency: 'INR',
      paymentMethod,
      description: description.trim() || 'Manual Customer Deposit',
      externalReference: externalReference.trim() || undefined,
    };

    if (paymentMethod === 'BANK_TRANSFER') {
      payload.bankName = effectiveBank;
      payload.bankAccountNumber = bankAccountNumber.trim();
      payload.ifscCode = ifscCode.trim().toUpperCase();
      payload.accountHolderName = sourceAccountHolderName.trim();
    } else if (paymentMethod === 'UPI') {
      payload.upiId = upiId.trim();
      payload.accountHolderName = upiRemitterName.trim();
    } else if (paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') {
      payload.cardNetwork = cardNetwork;
      payload.bankName = cardIssuingBank.trim();
      payload.cardLast4 = cardLast4.trim();
      payload.accountHolderName = cardholderName.trim();
    } else if (paymentMethod === 'CASH_DEPOSIT') {
      payload.branchOrCdm = branchOrCdm.trim();
      payload.depositSlipReference = depositSlipReference.trim();
      payload.accountHolderName = depositorName.trim();
    }

    try {
      const res = await axiosInstance.post(endpoints.transactions.deposit, payload, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });

      setReceipt(res.data);
      toast.success('Funds successfully deposited and credited!');
      fetchInitialData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Deposit failed. Please try again.';
      setGeneralError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading eligible accounts and customer profile..." />;
  }

  const numericAmount = parseFloat(amount) || 0;
  const projectedBalance = currentBalance + numericAmount;

  // Masked funding account string for confirmation & receipt
  const getMaskedFundingDisplay = () => {
    if (paymentMethod === 'BANK_TRANSFER') {
      const num = bankAccountNumber.trim();
      const masked = num.length >= 4 ? `XXXXXX${num.substring(num.length - 4)}` : 'XXXXXX';
      const bName = bankName === 'Other Bank' ? customBankName.trim() : bankName;
      return `${bName} (A/C: ${masked}, IFSC: ${ifscCode.trim().toUpperCase()})`;
    }
    if (paymentMethod === 'UPI') {
      return `UPI VPA: ${upiId.trim()}`;
    }
    if (paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') {
      return `${paymentMethod.replace('_', ' ')} (${cardNetwork} Ending in ${cardLast4.trim()})`;
    }
    if (paymentMethod === 'CASH_DEPOSIT') {
      return `Cash Deposit at ${branchOrCdm.trim()} (Slip #${depositSlipReference.trim()})`;
    }
    return paymentMethod;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Deposit Funds</h1>
        <p className="text-sm text-gray-500">
          Fund your LedgerLine account using verified bank transfer, UPI, card, or authorized cash deposit
        </p>
      </div>

      {/* Demonstration / Sandbox Policy Notice */}
      <div className="p-4 bg-navy-50/60 border border-navy-100 rounded-xl flex items-start gap-3 text-xs text-navy-800">
        <ShieldAlert className="w-5 h-5 text-navy-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block text-navy-950">Demonstration Mode & Strict Manual Entry Policy</span>
          <p>
            All deposit amounts must be manually entered and confirmed. In demonstration mode, verified sandbox settlement
            is simulated without real interbank clearing rails, atomically updating your balance and appending an immutable
            double-entry <strong>CREDIT</strong> ledger record.
          </p>
        </div>
      </div>

      {receipt ? (
        /* Successful Deposit Receipt */
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deposit Completed Successfully</h2>
            <p className="text-xs text-gray-500 mt-1">
              Transaction verified and appended to immutable double-entry ledger
            </p>
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
              <span className="text-gray-500">Funding Method / Source:</span>
              <span className="font-bold text-gray-900">{receipt.sourceAccountNumber || getMaskedFundingDisplay()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Deposited:</span>
              <span className="font-bold text-emerald-600">
                +₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Currency:</span>
              <span className="font-bold text-gray-900">{receipt.currency || 'INR'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ledger Entry Type:</span>
              <span className="font-bold text-gray-900">CREDIT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Settlement Status:</span>
              <span className="font-bold text-emerald-600">SETTLED / SUCCESS</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">Completed At:</span>
              <span className="text-gray-700">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setReceipt(null);
                setAmount('');
                setDescription('');
                setExternalReference('');
                setBankAccountNumber('');
                setConfirmBankAccountNumber('');
                setIfscCode('');
                setUpiId('');
                setCardLast4('');
                setBranchOrCdm('');
                setDepositSlipReference('');
              }}
              className="btn-secondary text-sm py-2 px-5"
            >
              Make Another Deposit
            </button>
            <button
              onClick={() => navigate('/customer/transactions')}
              className="btn-primary text-sm py-2 px-5"
            >
              View Transaction History
            </button>
          </div>
        </div>
      ) : (
        /* Main Deposit Form */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          {generalError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600 mb-4">You do not have any active bank accounts.</p>
              <button onClick={() => navigate('/customer/accounts')} className="btn-primary text-sm py-2 px-4">
                Open a Bank Account
              </button>
            </div>
          ) : (
            <form onSubmit={handlePreSubmit} className="space-y-6">
              {/* Section 1: Customer Details */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-navy-600" /> Customer Details
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">Verified Account Holder</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Account Holder Name</span>
                    <span className="font-semibold text-gray-900">{customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Registered Mobile Number</span>
                    <span className="font-mono font-semibold text-gray-900">+91 {customerMobile}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Available Balance</span>
                    <span className="font-mono font-bold text-navy-950">
                      ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="label-text">Select Destination LedgerLine Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="input-field text-sm"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} ({acc.accountType}) — Balance: ₹
                        {Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                  {errors.accountId && <p className="text-xs text-red-600 mt-1">{errors.accountId}</p>}
                </div>
              </div>

              {/* Section 2: Payment Method Selection */}
              <div>
                <label className="label-text mb-2 block">Choose Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('BANK_TRANSFER');
                      setErrors({});
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-navy-600 bg-navy-50/70 text-navy-900 font-semibold shadow-sm ring-1 ring-navy-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-navy-700" />
                    <span className="text-xs">Bank Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('UPI');
                      setErrors({});
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      paymentMethod === 'UPI'
                        ? 'border-navy-600 bg-navy-50/70 text-navy-900 font-semibold shadow-sm ring-1 ring-navy-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('DEBIT_CARD');
                      setErrors({});
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      paymentMethod === 'DEBIT_CARD'
                        ? 'border-navy-600 bg-navy-50/70 text-navy-900 font-semibold shadow-sm ring-1 ring-navy-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CREDIT_CARD');
                      setErrors({});
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'border-navy-600 bg-navy-50/70 text-navy-900 font-semibold shadow-sm ring-1 ring-navy-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span className="text-xs">Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CASH_DEPOSIT');
                      setErrors({});
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      paymentMethod === 'CASH_DEPOSIT'
                        ? 'border-navy-600 bg-navy-50/70 text-navy-900 font-semibold shadow-sm ring-1 ring-navy-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-amber-600" />
                    <span className="text-xs">Cash Deposit</span>
                  </button>
                </div>
              </div>

              {/* Section 3: Dynamic Funding / Bank Details */}
              <div className="p-5 border border-gray-200 rounded-xl space-y-4 bg-gray-50/40">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    {paymentMethod === 'BANK_TRANSFER' && <Building2 className="w-4 h-4 text-navy-700" />}
                    {paymentMethod === 'UPI' && <Smartphone className="w-4 h-4 text-emerald-600" />}
                    {(paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') && (
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    )}
                    {paymentMethod === 'CASH_DEPOSIT' && <Banknote className="w-4 h-4 text-amber-600" />}
                    {paymentMethod.replace('_', ' ')} Details
                  </span>
                  <span className="text-[11px] text-gray-400">Funding Source Information</span>
                </div>

                {/* Sub-form A: Bank Transfer */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-text">Bank Name</label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="input-field text-sm"
                        >
                          {POPULAR_BANKS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      {bankName === 'Other Bank' && (
                        <div>
                          <label className="label-text">Specify Bank Name</label>
                          <input
                            type="text"
                            value={customBankName}
                            onChange={(e) => setCustomBankName(e.target.value)}
                            placeholder="Enter bank name"
                            className={`input-field text-sm ${errors.bankName ? 'border-red-300' : ''}`}
                            required
                          />
                          {errors.bankName && <p className="text-xs text-red-600 mt-1">{errors.bankName}</p>}
                        </div>
                      )}

                      <div>
                        <label className="label-text">Account Holder Name (Source)</label>
                        <input
                          type="text"
                          value={sourceAccountHolderName}
                          onChange={(e) => setSourceAccountHolderName(e.target.value)}
                          placeholder="Name as registered with remitting bank"
                          className={`input-field text-sm ${errors.sourceAccountHolderName ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.sourceAccountHolderName && (
                          <p className="text-xs text-red-600 mt-1">{errors.sourceAccountHolderName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-text">Bank Account Number</label>
                        <input
                          type="password"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="Enter 9-18 digit account number"
                          maxLength={18}
                          className={`input-field font-mono text-sm ${errors.bankAccountNumber ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.bankAccountNumber && (
                          <p className="text-xs text-red-600 mt-1">{errors.bankAccountNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="label-text">Confirm Bank Account Number</label>
                        <input
                          type="text"
                          value={confirmBankAccountNumber}
                          onChange={(e) => setConfirmBankAccountNumber(e.target.value)}
                          placeholder="Re-enter bank account number"
                          maxLength={18}
                          className={`input-field font-mono text-sm ${
                            errors.confirmBankAccountNumber ? 'border-red-300' : ''
                          }`}
                          required
                        />
                        {errors.confirmBankAccountNumber && (
                          <p className="text-xs text-red-600 mt-1">{errors.confirmBankAccountNumber}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="label-text">Bank IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234 or HDFC0001234"
                        maxLength={11}
                        className={`input-field font-mono uppercase text-sm ${errors.ifscCode ? 'border-red-300' : ''}`}
                        required
                      />
                      {errors.ifscCode ? (
                        <p className="text-xs text-red-600 mt-1">{errors.ifscCode}</p>
                      ) : (
                        <span className="text-[11px] text-gray-400 mt-1 block">
                          11-character Indian Financial System Code (4 letters + '0' + 6 alphanumeric digits)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-form B: UPI */}
                {paymentMethod === 'UPI' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-text">UPI ID / Virtual Payment Address (VPA)</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. yourname@okhdfcbank or user@upi"
                          className={`input-field font-mono text-sm ${errors.upiId ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.upiId && <p className="text-xs text-red-600 mt-1">{errors.upiId}</p>}
                      </div>

                      <div>
                        <label className="label-text">UPI Remitter Name</label>
                        <input
                          type="text"
                          value={upiRemitterName}
                          onChange={(e) => setUpiRemitterName(e.target.value)}
                          placeholder="Name linked to UPI account"
                          className={`input-field text-sm ${errors.upiRemitterName ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.upiRemitterName && (
                          <p className="text-xs text-red-600 mt-1">{errors.upiRemitterName}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      A simulated UPI payment collect notification will be validated for instant settlement.
                    </p>
                  </div>
                )}

                {/* Sub-form C: Debit / Credit Card */}
                {(paymentMethod === 'DEBIT_CARD' || paymentMethod === 'CREDIT_CARD') && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                      <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        <strong>Security Standard:</strong> LedgerLine never stores or asks for your full card number, CVV,
                        ATM PIN, or OTP. Only safe card metadata is collected.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-text">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder="Name as printed on card"
                          className={`input-field text-sm ${errors.cardholderName ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.cardholderName && <p className="text-xs text-red-600 mt-1">{errors.cardholderName}</p>}
                      </div>

                      <div>
                        <label className="label-text">Card Network</label>
                        <select
                          value={cardNetwork}
                          onChange={(e) => setCardNetwork(e.target.value)}
                          className="input-field text-sm"
                        >
                          <option value="RUPAY">RuPay</option>
                          <option value="VISA">Visa</option>
                          <option value="MASTERCARD">Mastercard</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-text">Issuing Bank</label>
                        <input
                          type="text"
                          value={cardIssuingBank}
                          onChange={(e) => setCardIssuingBank(e.target.value)}
                          placeholder="e.g. HDFC Bank, ICICI Bank"
                          className={`input-field text-sm ${errors.cardIssuingBank ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.cardIssuingBank && (
                          <p className="text-xs text-red-600 mt-1">{errors.cardIssuingBank}</p>
                        )}
                      </div>

                      <div>
                        <label className="label-text">Card Last 4 Digits</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 font-mono text-gray-400 text-sm">•••• •••• ••••</span>
                          <input
                            type="text"
                            maxLength={4}
                            value={cardLast4}
                            onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                            placeholder="1234"
                            className={`input-field pl-32 font-mono text-sm ${errors.cardLast4 ? 'border-red-300' : ''}`}
                            required
                          />
                        </div>
                        {errors.cardLast4 && <p className="text-xs text-red-600 mt-1">{errors.cardLast4}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form D: Cash Deposit */}
                {paymentMethod === 'CASH_DEPOSIT' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-text">Authorized Branch / CDM Terminal ID</label>
                        <input
                          type="text"
                          value={branchOrCdm}
                          onChange={(e) => setBranchOrCdm(e.target.value)}
                          placeholder="e.g. Connaught Place Branch or CDM-04"
                          className={`input-field text-sm ${errors.branchOrCdm ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.branchOrCdm && <p className="text-xs text-red-600 mt-1">{errors.branchOrCdm}</p>}
                      </div>

                      <div>
                        <label className="label-text">Cash Deposit Slip / Receipt Reference</label>
                        <input
                          type="text"
                          value={depositSlipReference}
                          onChange={(e) => setDepositSlipReference(e.target.value)}
                          placeholder="e.g. SLIP-948201"
                          className={`input-field font-mono text-sm ${errors.depositSlipReference ? 'border-red-300' : ''}`}
                          required
                        />
                        {errors.depositSlipReference && (
                          <p className="text-xs text-red-600 mt-1">{errors.depositSlipReference}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="label-text">Depositor Full Name</label>
                      <input
                        type="text"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        placeholder="Full name of person making the cash deposit"
                        className={`input-field text-sm ${errors.depositorName ? 'border-red-300' : ''}`}
                        required
                      />
                      {errors.depositorName && <p className="text-xs text-red-600 mt-1">{errors.depositorName}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Deposit Details */}
              <div className="space-y-4">
                {/* Deposit Amount (Strict manual input - starts empty, no default value) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label-text mb-0">Deposit Amount (Manually Entered)</label>
                    <span className="text-[11px] font-semibold text-navy-800 bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
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
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount manually"
                      className={`input-field pl-8 text-sm font-semibold ${
                        errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
                      }`}
                      required
                    />
                  </div>
                  {errors.amount ? (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {errors.amount}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Manual numeric input only. No prefilled or default amounts. Accepts positive numbers with up to 2 decimal places.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Deposit Description / Remarks (Optional)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Salary settlement or personal investment"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="label-text">External Bank UTR / Reference (Optional)</label>
                    <input
                      type="text"
                      value={externalReference}
                      onChange={(e) => setExternalReference(e.target.value)}
                      placeholder="e.g. UTR-1928491823"
                      className="input-field font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Review Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-success w-full py-3.5 text-sm flex items-center justify-center gap-2 mt-4 shadow-sm"
              >
                <ArrowDownToLine className="w-4 h-4" /> Review & Confirm Bank Deposit
              </button>
            </form>
          )}
        </div>
      )}

      {/* Confirmation Modal Screen */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecuteDeposit}
        title="Confirm Bank Deposit Authorization"
        message={`Please verify the following deposit summary before authorization:
• Account Holder: ${customerName} (+91 ${customerMobile})
• Destination Account: ${selectedAccount?.accountNumber} (${selectedAccount?.accountType})
• Payment Method: ${paymentMethod.replace('_', ' ')}
• Funding Source: ${getMaskedFundingDisplay()}
• Deposit Amount: ₹${numericAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
• Balance After Deposit: ₹${projectedBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}

Notice: This executes an authorized simulated funding settlement. Your account balance will be atomically incremented and an immutable CREDIT ledger entry recorded.`}
        confirmText="Confirm & Authorize Deposit"
        isLoading={submitting}
      />
    </div>
  );
}
