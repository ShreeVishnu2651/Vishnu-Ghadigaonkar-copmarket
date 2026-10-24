/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Sparkles, 
  Printer, 
  Mail, 
  CheckCircle, 
  X, 
  Calculator, 
  Building2, 
  IndianRupee, 
  Clock, 
  Download,
  Send,
  Check,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Bill, Member } from '../types';

interface BillingSystemProps {
  bills: Bill[];
  members: Member[];
  onGenerateCycle: (month: string) => Promise<any>;
  onUpdateStatus: (id: string, status: 'Paid' | 'Unpaid') => void;
  onSendAlert: (data: { memberId: string; type: 'SMS' | 'Email'; title: string; message: string }) => void;
  onRecordPayment?: (data: {
    memberId: string;
    amount: number;
    paymentMethod: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet';
  }) => Promise<any>;
}

export default function BillingSystem({ 
  bills, 
  members, 
  onGenerateCycle, 
  onUpdateStatus,
  onSendAlert,
  onRecordPayment
}: BillingSystemProps) {

  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('June 2026');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [currentInvoice, setCurrentInvoice] = useState<Bill | null>(null);

  // Automation room triggers
  const [targetCycleMonth, setTargetCycleMonth] = useState('June 2026');
  const [isAutomating, setIsAutomating] = useState(false);
  const [automationMessage, setAutomationMessage] = useState('');

  // Email trigger states
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [sentAlertSuccess, setSentAlertSuccess] = useState('');

  // Auto-Pay states
  const [autoPayMessage, setAutoPayMessage] = useState('');
  const [autoPayLoadingId, setAutoPayLoadingId] = useState<string | null>(null);

  const monthsList = ['May 2026', 'June 2026', 'July 2026'];

  const triggerAutoBilling = async () => {
    setIsAutomating(true);
    setAutomationMessage('Calculating dairy sub volumes and periodical rates...');
    
    setTimeout(async () => {
      try {
        const res = await onGenerateCycle(targetCycleMonth);
        setIsAutomating(false);
        setAutomationMessage(`✅ Automatic Billing Complete: Successfully generated society utilities for billing month of ${targetCycleMonth}!`);
        setTimeout(() => setAutomationMessage(''), 8000);
      } catch (err) {
        setIsAutomating(false);
        setAutomationMessage('⚠️ Automation Error: Cycle contains locked variables.');
      }
    }, 2000);
  };

  const simulateDispatch = (bill: Bill, type: 'SMS' | 'Email') => {
    setIsEmailSending(true);
    setSentAlertSuccess('');

    setTimeout(() => {
      onSendAlert({
        memberId: bill.memberId,
        type,
        title: `Pending Billing Reminder: ${bill.billingMonth}`,
        message: `Dear ${bill.memberName}, this is an automated CoopMart society reminder to clear your pending utility invoice for ${bill.billingMonth} amounting to ₹${bill.totalAmount}.`
      });

      setIsEmailSending(false);
      setSentAlertSuccess(`✅ Alert Dispatched: Successfully delivered ${type} reminder to resident ${bill.memberName}!`);
      setTimeout(() => setSentAlertSuccess(''), 5000);
    }, 1200);
  };

  const executeAutoPay = async (bill: Bill) => {
    setAutoPayLoadingId(bill.id);
    setAutoPayMessage('');
    setTimeout(async () => {
      try {
        onUpdateStatus(bill.id, 'Paid');
        if (onRecordPayment) {
          await onRecordPayment({
            memberId: bill.memberId,
            amount: bill.totalAmount,
            paymentMethod: 'UPI'
          });
        }
        setAutoPayLoadingId(null);
        setAutoPayMessage(`⚡ Auto-Pay Success: ₹${bill.totalAmount} debited securely via automated NACH/UPI mandate for ${bill.memberName} (Flat ${bill.flatNo}) and credited to CoopMart Society ledger!`);
        if (currentInvoice && currentInvoice.id === bill.id) {
          setCurrentInvoice({ ...currentInvoice, paymentStatus: 'Paid' });
        }
        setTimeout(() => setAutoPayMessage(''), 8000);
      } catch (err) {
        setAutoPayLoadingId(null);
        setAutoPayMessage('⚠️ Auto-Pay Error: Bank gateway timeout.');
      }
    }, 1200);
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = 
      b.memberName.toLowerCase().includes(search.toLowerCase()) ||
      b.flatNo.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());

    const matchesMonth = !filterMonth || b.billingMonth === filterMonth || b.billingMonth.toLowerCase().includes('june');
    
    if (filterStatus === 'All') return matchesSearch && matchesMonth;
    return matchesSearch && matchesMonth && b.paymentStatus === filterStatus;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Title with Invoicing Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#F7FEE7] dark:bg-lime-950/30 border border-[#D9F99D] dark:border-lime-900/50 shadow-xs transition-colors">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 bg-[#84CC16] rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold font-mono tracking-widest uppercase" style={{ color: '#3F6212' }}>AUTOMATED INVOICE ENGINE</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: '#3F6212' }}>Utility Invoice Room</h2>
          <p className="text-xs mt-0.5 font-semibold" style={{ color: '#3F6212' }}>Generate, audit, and distribute monthly bills combining grocery credits, dairy subscriptions, newspaper rates, and general maintenance tolls.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="generate-bills-btn"
            onClick={triggerAutoBilling}
            disabled={isAutomating}
            className="bg-[#65A30D] hover:bg-[#4D7C0F] text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-xs whitespace-nowrap flex items-center space-x-2 cursor-pointer border border-[#84CC16]"
          >
            <Calculator className="w-4 h-4 text-[#ECFCCB]" />
            <span>{isAutomating ? 'Calculating Cycle...' : 'Run Billing Cycle'}</span>
          </button>
        </div>
      </div>

      {automationMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-3 text-xs font-mono font-bold rounded-xl border border-emerald-250 dark:border-emerald-900/30 flex items-center space-x-2">
          <span>{automationMessage}</span>
        </div>
      )}

      {sentAlertSuccess && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-400 p-3 text-xs font-semibold rounded-xl flex items-center">
          <span>{sentAlertSuccess}</span>
        </div>
      )}

      {autoPayMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 p-3 text-xs font-mono font-bold rounded-xl flex items-center space-x-2">
          <span>{autoPayMessage}</span>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative font-sans">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            id="bills-search-input"
            type="text"
            placeholder="Search invoice by resident flat, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Month selector calendar tab */}
          <div className="relative flex items-center">
            <input
              id="filter-bills-month"
              type="date"
              defaultValue="2026-06-09"
              onChange={(e) => setFilterMonth(e.target.value)}
              className="text-xs bg-lime-50/50 dark:bg-slate-950 border border-[#84CC16]/60 px-3.5 py-1.5 rounded-lg font-bold font-mono focus:outline-none cursor-pointer"
              style={{ color: '#3F6212' }}
              placeholder="dd-mm-yyyy"
            />
          </div>

          {/* Status filter button toggles */}
          <div className="flex space-x-1 border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950 rounded-lg">
            {(['All', 'Paid', 'Unpaid'] as const).map((stat) => (
              <button
                id={`filter-bills-status-${stat}`}
                key={stat}
                onClick={() => setFilterStatus(stat)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                  filterStatus === stat 
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {stat} Accounts
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INDIVIDUAL ACCOUNTS LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-6 py-4">Resident details</th>
                <th className="px-6 py-4 font-mono">Invoice ID</th>
                <th className="px-6 py-4">Subscriptions charge breakdown</th>
                <th className="px-6 py-4 font-mono">Total amount (INR)</th>
                <th className="px-6 py-4">Invoice status</th>
                <th className="px-6 py-4 text-center">Interactive actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {filteredBills.map((bill) => {
                const isPaid = bill.paymentStatus === 'Paid';
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-150 block">{bill.memberName}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded inline-block mt-1 font-bold">
                          Flat {bill.flatNo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-450">
                      {bill.id}
                    </td>
                    <td className="px-6 py-4 space-y-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 max-w-[260px]">
                      <div className="flex justify-between">
                        <span>🥛 Milk Supply:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">₹{bill.milkAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📰 Newspapers:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">₹{bill.newspaperAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🏷️ Groceries Card:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">₹{bill.groceryAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🏘️ Maintenance Levy:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">₹{bill.maintenanceAmount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-black text-slate-800 dark:text-slate-100">
                      ₹{bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        id={`btn-bills-status-${bill.id}`}
                        onClick={() => onUpdateStatus(bill.id, isPaid ? 'Unpaid' : 'Paid')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                          isPaid 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' 
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-200 dark:border-rose-900/30 animate-pulse'
                        }`}
                        title="Click to toggle Payment collection flag"
                      >
                        {isPaid ? '● PAID' : '● UNPAID'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          id={`btn-invoice-preview-${bill.id}`}
                          onClick={() => setCurrentInvoice(bill)}
                          className="px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded bg-white dark:bg-slate-950 flex items-center space-x-1 cursor-pointer"
                          title="Open Invoice PDF Preview"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>View PDF Invoice</span>
                        </button>

                        <button
                          id={`btn-unpaid-reminder-${bill.id}`}
                          onClick={() => simulateDispatch(bill, 'Email')}
                          disabled={isPaid || isEmailSending}
                          className={`p-1.5 rounded border transition-colors cursor-pointer ${
                            isPaid 
                              ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed border-transparent' 
                              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border-slate-100 dark:border-slate-800'
                          }`}
                          title="Dispatch Instant EMail Outstanding Alert"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-550 py-20 font-mono text-xs">
                    No utility bills generated for month parameters. Pick a cycle and run our Central Billing Engine.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF A4 INVOICE DETAIL VIEW MODAL */}
      {currentInvoice && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <button 
              id="close-invoice-modal"
              onClick={() => setCurrentInvoice(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Simulated printable paper sheet */}
            <div className="border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-5 font-sans" id="invoice-printable-sheet">
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start pb-5 border-b border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h4 className="font-extrabold tracking-tight text-slate-800 dark:text-slate-100 text-sm">CoopMart Cooperative Society</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">INVOICING REGISTER OFFICE • TAX ID: 4921X</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase py-0.5 px-2.5 rounded-full bg-slate-200 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300">
                    {currentInvoice.paymentStatus} Invoice
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">NO: {currentInvoice.id}</div>
                </div>
              </div>

              {/* Invoice Coordinates */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">Bill To Resident:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block mt-0.5">{currentInvoice.memberName}</span>
                  <span>Flat No: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{currentInvoice.flatNo}</span></span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">Cycle Month Details:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono block mt-0.5">{currentInvoice.billingMonth}</span>
                  <span>Issued Date: <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{currentInvoice.dateGenerated}</span></span>
                </div>
              </div>

              {/* Utility Charges Table */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850 overflow-hidden">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-850 text-[11px]">
                      <th className="px-4 py-2.5">Society Amenity Component</th>
                      <th className="px-4 py-2.5 text-right font-mono">Tax rate</th>
                      <th className="px-4 py-2.5 text-right font-mono">Pre-Tax Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    <tr>
                      <td className="px-4 py-2.5">🥛 Daily Fresh Milk Subscription Home Deliveries</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400 dark:text-slate-500">0% Ex</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">₹{currentInvoice.milkAmount}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">📰 Periodical Newspapers and Daily Magazines</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400 dark:text-slate-500">0% Ex</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">₹{currentInvoice.newspaperAmount}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">🛒 Supermarket Monthly Grocery Bar credit line</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400 dark:text-slate-500">5% Slab</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">₹{currentInvoice.groceryAmount}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">🏘️ Society Maintenance Levy & Facilities Tolls</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400 dark:text-slate-500">18% Maintenance</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">₹{currentInvoice.maintenanceAmount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculations Totals */}
              <div className="flex justify-end pt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="w-64 space-y-1.5 font-mono">
                  <div className="flex justify-between border-b pb-1 border-dashed border-slate-200 dark:border-slate-800">
                    <span>Aggregate Pre-Tax Net</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{currentInvoice.milkAmount + currentInvoice.newspaperAmount + currentInvoice.groceryAmount + currentInvoice.maintenanceAmount}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-dashed border-slate-200 dark:border-slate-800">
                    <span>Integrated Slabs GST</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">₹{currentInvoice.gst}</span>
                  </div>
                  {currentInvoice.discount > 0 && (
                    <div className="flex justify-between text-indigo-700 dark:text-indigo-400 border-b pb-1 border-dashed border-slate-200 dark:border-slate-800">
                      <span>Resident Voucher Discount</span>
                      <span className="font-bold">-₹{currentInvoice.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 dark:text-white font-sans pt-1">
                    <span>Consolidated Net Due</span>
                    <span className="text-emerald-750 dark:text-emerald-400 font-mono font-black">₹{currentInvoice.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Footnotes */}
              <div className="text-center font-mono text-[9px] text-slate-400 dark:text-slate-500 pt-5 border-t border-dashed border-slate-200 dark:border-slate-800">
                <span>The CoopMart system automatically dispatched this digital copy to {currentInvoice.memberName}. Authorized seal signature not required.</span>
              </div>

            </div>

            {/* Print trigger and download sim actions */}
            <div className="pt-5 flex justify-between gap-3 font-sans">
              <button
                id="btn-print-invoice"
                onClick={() => window.print()}
                className="px-4.5 py-2.5 text-xs font-semibold text-white rounded-xl hover:opacity-90 transition-colors flex items-center space-x-1.5 cursor-pointer"
                style={{ backgroundColor: '#3F6212' }}
              >
                <Printer className="w-4 h-4" />
                <span>Print Utility Statement</span>
              </button>

              <div className="flex space-x-2">
                {currentInvoice.paymentStatus === 'Unpaid' && (
                  <button
                    id="btn-modal-autopay"
                    onClick={() => executeAutoPay(currentInvoice)}
                    disabled={autoPayLoadingId === currentInvoice.id}
                    className="px-4.5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer transition-all hover:opacity-90"
                    style={{ backgroundColor: '#3F6212' }}
                  >
                    <IndianRupee className="w-4 h-4" />
                    <span>{autoPayLoadingId === currentInvoice.id ? 'Processing Auto-Pay...' : '⚡ Execute Auto-Pay Now'}</span>
                  </button>
                )}
                <button
                  id="btn-close-pdf-preview"
                  type="button"
                  onClick={() => setCurrentInvoice(null)}
                  className="px-4.5 py-2.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
