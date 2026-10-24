/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Smartphone, 
  DollarSign, 
  CheckCircle2, 
  ArrowDownCircle, 
  BookOpen, 
  RotateCcw, 
  Sparkles, 
  Users, 
  Building2, 
  X,
  ShieldCheck
} from 'lucide-react';
import { PaymentTransaction, Member } from '../types';

interface PaymentsModuleProps {
  payments: PaymentTransaction[];
  members: Member[];
  onRefund: (id: string) => void;
  onQuickPay: (data: {
    memberId: string;
    memberName?: string;
    flatNo?: string;
    amount: number;
    paymentMethod: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet';
  }) => Promise<any>;
}

export default function PaymentsModule({ 
  payments, 
  members, 
  onRefund,
  onQuickPay
}: PaymentsModuleProps) {

  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('All');
  
  // Custom states for manual payments/dues collector form
  const [isQuickPayOpen, setIsQuickPayOpen] = useState(false);
  const [payMemberId, setPayMemberId] = useState<string>(() => {
    const active = members.find(m => m.status === 'Active');
    return active ? active.id : (members[0]?.id || '');
  });
  const [payAmount, setPayAmount] = useState(500);
  const [payMethod, setPayMethod] = useState<'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync member ID if members list changes
  React.useEffect(() => {
    if (members && members.length > 0) {
      if (!payMemberId || !members.some(m => m.id === payMemberId)) {
        const active = members.find(m => m.status === 'Active');
        setPayMemberId(active ? active.id : members[0].id);
      }
    }
  }, [members, payMemberId]);
  
  // Interactive QR generator frame modal
  const [showQRForTx, setShowQRForTx] = useState<{ name: string; amount: number } | null>(null);

  const paymentMethods = ['All', 'Cash', 'UPI'];

  const handleQuickPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMemberId || payAmount <= 0) {
      alert('Please enter valid amount and select resident');
      return;
    }

    const selectedMember = members.find(m => m.id === payMemberId);

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        await onQuickPay({
          memberId: payMemberId,
          memberName: selectedMember ? selectedMember.name : "Resident",
          flatNo: selectedMember ? selectedMember.flatNo : "N/A",
          amount: Number(payAmount),
          paymentMethod: payMethod
        });
        
        setIsSubmitting(false);
        setIsQuickPayOpen(false);
        // Show QR if UPI is selected
        if (payMethod === 'UPI') {
          setShowQRForTx({
            name: selectedMember ? selectedMember.name : "CoopMart Resident",
            amount: Number(payAmount)
          });
        }
      } catch (err) {
        setIsSubmitting(false);
        alert('Payment failed to record in transactions ledger.');
      }
    }, 1000);
  };

  const filtered = payments.map(p => {
    const member = members.find(m => m.id === p.memberId);
    const resolvedName = (!p.memberName || p.memberName === 'Unknown Member' || p.memberName.toLowerCase().startsWith('unknown'))
      ? (member ? member.name : (p.memberId === 'Visitor' ? 'Walk-in Guest' : (p.memberId ? `Resident (${p.memberId})` : 'Walk-in Guest')))
      : p.memberName;
    const resolvedFlat = (!p.flatNo || p.flatNo === 'N/A')
      ? (member ? member.flatNo : (p.memberId === 'Visitor' ? 'Walk-in' : 'N/A'))
      : p.flatNo;
    return {
      ...p,
      resolvedName,
      resolvedFlat
    };
  }).filter(p => {
    const matchesSearch = 
      p.resolvedName.toLowerCase().includes(search.toLowerCase()) ||
      p.resolvedFlat.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId.includes(search) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    if (filterMethod === 'All') return matchesSearch;
    return matchesSearch && p.paymentMethod === filterMethod;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#3F6212] tracking-tight">Society Ledger & Transactions</h2>
          <p className="text-xs text-[#3F6212]">Track and log cash box registers, credit/debit transaction authorizations, UPI audits, and refund protocols.</p>
        </div>
      </div>

      {/* Stats Quick panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex items-center space-x-3.5">
          <div className="p-2 bg-emerald-600 rounded-lg text-white font-mono font-bold text-xs">UPI</div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">UPI Mobile Inflow</span>
            <h4 className="font-mono text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              ₹{payments.filter(p => p.paymentMethod === 'UPI' && p.status === 'Success').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </h4>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex items-center space-x-3.5">
          <div className="p-2 bg-blue-600 rounded-lg text-white font-mono font-bold text-xs">CSH</div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Cash Box Inflow</span>
            <h4 className="font-mono text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              ₹{payments.filter(p => p.paymentMethod === 'Cash' && p.status === 'Success').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLLERS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-855 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative font-sans">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-550" />
          <input
            id="ledger-search-input"
            type="text"
            placeholder="Search by ID, resident name, receipt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto pb-1 max-w-full">
          {paymentMethods.map(m => (
            <button
              id={`filter-ledger-${m.replace(/\s+/g, '')}`}
              key={m}
              onClick={() => setFilterMethod(m)}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                filterMethod === m 
                  ? 'bg-slate-900 dark:bg-emerald-600 border-slate-900 dark:border-emerald-600 text-white shadow-xs' 
                  : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4 font-mono">Invoice Reference</th>
                <th className="px-6 py-4">Receipt Instrument</th>
                <th className="px-6 py-4">Transaction Reference ID</th>
                <th className="px-6 py-4 font-mono">Collected Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Reversal Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {filtered.map((tx) => {
                const isRefunded = tx.status === 'Refunded';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 dark:text-slate-150 block">{tx.resolvedName}</span>
                          {tx.resolvedFlat !== 'N/A' && (
                            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">{tx.resolvedFlat}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-1">{tx.paymentDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                        {tx.billId || 'POS Desk Shop'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-950 text-slate-850 dark:text-slate-300 px-2 py-1 rounded font-mono font-bold text-[10px]">
                        💳 {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                      {tx.transactionId}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isRefunded 
                          ? 'bg-rose-100 dark:bg-rose-955/30 text-rose-800 dark:text-rose-400' 
                          : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        id={`btn-refund-${tx.id}`}
                        onClick={() => {
                          if (confirm(`Authorize society invoice refund for ₹${tx.amount} to resident ${tx.memberName}? This reverses utility ledger collections.`)) {
                            onRefund(tx.id);
                          }
                        }}
                        disabled={isRefunded}
                        className={`text-[10px] font-bold p-1 border rounded transition-all flex items-center space-x-1 mx-auto cursor-pointer ${
                          isRefunded 
                            ? 'bg-slate-50 dark:bg-slate-950/20 text-slate-350 dark:text-slate-600 border-slate-150 dark:border-slate-850 cursor-not-allowed' 
                            : 'bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-950/35'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 py-16 font-mono text-xs">
                    No transactions documented inside system parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK PAY MANUAL ENTRY MODAL */}
      {isQuickPayOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 font-sans text-slate-800 dark:text-slate-100">
            <button 
              id="close-quickpay-modal"
              onClick={() => setIsQuickPayOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Record Society Payment Entry</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Directly log resident cash drawer dues collections, alternate bank wires, or manual drafts.</p>
            
            <form onSubmit={handleQuickPaySubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Society Resident Flat *</label>
                <select
                  id="quickpay-select-member"
                  required
                  value={payMemberId}
                  onChange={(e) => setPayMemberId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                >
                  {members.filter(m => m.status === 'Active').map(m => (
                    <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.flatNo} - {m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Enter Dues Amount (₹) *</label>
                <input
                  id="quickpay-amount"
                  type="number"
                  min="10"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Payment Channel</label>
                <select
                  id="quickpay-select-channel"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-medium"
                >
                  <option value="Cash" className="dark:bg-slate-900">💵 Hand-to-Hand Cash Cabinet</option>
                  <option value="UPI" className="dark:bg-slate-900">📱 GooglePay / PhonePe UPI Grid</option>
                  <option value="Credit Card" className="dark:bg-slate-900">💳 Swiped Debit/Credit POS terminal</option>
                  <option value="Wallet" className="dark:bg-slate-900">💼 Society Resident Wallet</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  id="quickpay-cancel"
                  type="button"
                  onClick={() => setIsQuickPayOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="quickpay-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Write Ledger Row'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC QR GENERATOR POPUP DIALOG */}
      {showQRForTx && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-xs text-white p-6 relative border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 text-center flex flex-col items-center">
            <button 
              id="close-qr-generator"
              onClick={() => setShowQRForTx(null)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <Building2 className="w-10 h-10 text-emerald-400 mb-2" />
            <h4 className="font-extrabold text-sm tracking-tight text-white">CoopMart Scan & Pay</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">AUTH FOR: {showQRForTx.name}</p>

            {/* Generated UPI Vector QR representation */}
            <div className="bg-white p-4 rounded-xl my-4 hover:scale-105 transition-transform duration-250 select-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-36 h-36 mx-auto text-slate-900" viewBox="0 0 100 100">
                {/* Simulated classic scanner pattern */}
                <rect x="5" y="5" width="20" height="20" fill="currentColor" />
                <rect x="7" y="7" width="16" height="16" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                <rect x="75" y="5" width="20" height="20" fill="currentColor" />
                <rect x="77" y="7" width="16" height="16" fill="white" />
                <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                <rect x="5" y="75" width="20" height="20" fill="currentColor" />
                <rect x="7" y="77" width="16" height="16" fill="white" />
                <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                {/* Randomly generated scanning matrices */}
                <rect x="40" y="5" width="8" height="12" fill="currentColor" />
                <rect x="52" y="12" width="14" height="6" fill="currentColor" />
                <rect x="35" y="30" width="18" height="5" fill="currentColor" />
                <rect x="12" y="45" width="25" height="8" fill="currentColor" />
                <rect x="45" y="40" width="10" height="10" fill="currentColor" />
                <rect x="68" y="35" width="15" height="15" fill="currentColor" />
                <rect x="60" y="65" width="10" height="18" fill="currentColor" />
                <rect x="78" y="60" width="8" height="10" fill="currentColor" />
                <rect x="35" y="68" width="14" height="20" fill="currentColor" />
                <rect x="10" y="60" width="6" height="10" fill="currentColor" />
                <rect x="85" y="85" width="10" height="10" fill="currentColor" />
              </svg>
            </div>

            <div className="font-mono text-xs font-black text-emerald-400">
              ₹{showQRForTx.amount.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-snug">
              Scan QR code on any bank app (BHIM, GooglePay, Paytm). Confirms instantly to cashier.
            </p>

            <button
              id="confirm-qr-completion"
              onClick={() => setShowQRForTx(null)}
              className="mt-4 w-full bg-slate-800 hover:bg-slate-750 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Verify Cash Register & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
