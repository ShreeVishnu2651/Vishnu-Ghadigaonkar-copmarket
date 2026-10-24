/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  FileSpreadsheet, 
  Send, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Member, Product, MilkSubscription, NewspaperSubscription, Bill, NotificationLog } from '../types';

interface ReportsProps {
  members: Member[];
  products: Product[];
  milkSubs: MilkSubscription[];
  newspaperSubs: NewspaperSubscription[];
  bills: Bill[];
  notifications: NotificationLog[];
  onDispatchAlert: (data: { memberId: string; type: 'SMS' | 'Email'; title: string; message: string }) => void;
  onNotificationSent?: (newLog: NotificationLog) => void;
}

export default function ReportsAndNotificator({
  members,
  products,
  milkSubs,
  newspaperSubs,
  bills,
  notifications,
  onDispatchAlert,
  onNotificationSent
}: ReportsProps) {

  // Notification sender variables 
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || 'M101');
  const [alertType, setAlertType] = useState<'SMS'>('SMS');
  const [alertTemplate, setAlertTemplate] = useState('due_reminder');
  const [alertTitle, setAlertTitle] = useState('Society Dues Reminder - May 2026 Cycle');
  const [alertMessage, setAlertMessage] = useState('Hello Ramesh Sharma, this is an official CoopMart alert requesting payment for outstanding society invoices.');

  const [notifSuccessMessage, setNotifSuccessMessage] = useState('');
  const [notifErrorMessage, setNotifErrorMessage] = useState('');

  // Sync target member
  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
  };

  // Auto populate message depending on template type selection
  const handleTemplateChange = (val: string) => {
    setAlertTemplate(val);
    const targetMember = members.find(m => m.id === selectedMemberId) || members[0];
    const name = targetMember ? targetMember.name : "Resident Member";

    if (val === 'due_reminder') {
      setAlertTitle(`Outstanding Utility Due Reminder - May Cycle`);
      setAlertMessage(`Dear ${name}, this is a gentle cooperative reminder regarding your pending society invoice of ₹7790. Kindly settle at billing terminal.`);
    } else if (val === 'milk_paused') {
      setAlertTitle(`Milk Delivery Subscription Paused`);
      setAlertMessage(`CoopMart: Your morning Amul Gold milk delivery subscription has been paused per your request. No charges will incur until resumed.`);
    } else if (val === 'expiry_alert') {
      setAlertTitle(`Newspaper Periodical Expiry Warning`);
      setAlertMessage(`Hi ${name}, your newspaper subscription is Scheduled to auto-renew on 1st of next month. Contact frontdesk billing if changing publication.`);
    } else {
      setAlertTitle(`Custom Urgent Society Dispatch`);
      setAlertMessage(`Attention Flat Holder: Important general billing guidelines have been published on notice block A.`);
    }
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccessMessage('');
    setNotifErrorMessage('');

    onDispatchAlert({
      memberId: selectedMemberId,
      type: alertType,
      title: alertTitle,
      message: alertMessage
    });

    setNotifSuccessMessage('🎉 Dispatch Initiated: Member notification logged and alert queues synchronized!');
    setTimeout(() => setNotifSuccessMessage(''), 5000);
  };

  // CSV Exporters
  const downloadCSV = (title: string, dataRows: (string | number)[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + dataRows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRevenue = () => {
    const headers = ["Bill ID", "Resident Name", "Flat #", "Cycle Month", "Groceries Credit", "Dairy Charge", "Newspaper Charge", "Maintenance Stamp", "GST (5%)", "Total Settle", "Status"];
    const rows = bills.map(b => [b.id, b.memberName, b.flatNo, b.billingMonth, b.groceryAmount, b.milkAmount, b.newspaperAmount, b.maintenanceAmount, b.gst, b.totalAmount, b.paymentStatus]);
    downloadCSV("CoopMart_Revenues_FY2026", [headers, ...rows]);
  };

  const exportInventory = () => {
    const headers = ["Product ID", "Shelf Name", "Stock SKU Category", "Unit Price", "Quantity Shelf Units", "Maximum Expiry Date", "Supplier Merchant"];
    const rows = products.map(p => [p.id, p.productName, p.category, p.price, p.quantity, p.expiryDate, p.supplierName]);
    downloadCSV("CoopMart_Grocery_Shelves_Audy", [headers, ...rows]);
  };

  const exportSubscriptions = () => {
    const headers = ["Subscription ID", "Resident Name", "Flat #", "Delivery SKU", "Quantity Vol", "Monthly Charge Est", "Schedule Status"];
    const rows = milkSubs.map(m => [m.id, m.memberName, m.flatNo, `Milk Delivery (${m.milkBrand})`, m.quantity, (m.quantity * (m.deliveryTime === 'Both' ? 2 : 1) * m.pricePerLiter * 30), m.status]);
    downloadCSV("CoopMart_Daily_Milk_Subs", [headers, ...rows]);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-[#3F6212] tracking-tight">Exporters & Alerts Room</h2>
        <p className="text-xs text-[#3F6212]">Export audited tax files to spreadsheet formats and transmit instant SMS or email dues alerts to society flats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REPORT GENERATORS & SPREADSHEET DOWNLOADERS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50 dark:border-slate-800">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">Spreadsheet Export Audit Center</h3>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Generate and fetch comprehensive ledger files in standard CSV format. These files comply with local municipal guidelines, taxation slabs, and commercial audit rules.
          </div>

          <div className="space-y-3.5 pt-2">
            {/* Report 1 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-150 text-xs block">Monthly Revenue & utility Ledger</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">Includes GST records, credits, society maintainence levies</span>
              </div>
              <button
                id="btn-export-revenue"
                onClick={exportRevenue}
                className="text-[10px] bg-lime-50 dark:bg-lime-950/40 hover:bg-lime-100 dark:hover:bg-lime-900/50 border border-[#84CC16]/60 font-bold px-3.5 py-1.5 rounded-full flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                style={{ color: '#3F6212' }}
                title="Download CSV file"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: '#3F6212' }} />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Report 2 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-150 text-xs block">Supermarket Shelf SKU Audit</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">Extracts current products, prices, SKU codes, suppliers, low stock quantities</span>
              </div>
              <button
                id="btn-export-inventory"
                onClick={exportInventory}
                className="text-[10px] bg-lime-50 dark:bg-lime-950/40 hover:bg-lime-100 dark:hover:bg-lime-900/50 border border-[#84CC16]/60 font-bold px-3.5 py-1.5 rounded-full flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                style={{ color: '#3F6212' }}
                title="Download CSV file"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: '#3F6212' }} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* ALERTS CENTRE DISPATCHER (Module 10) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight">SMS Alerts Broadcaster</h3>
            </div>
          </div>

          {/* Success Banner */}
          {notifSuccessMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-2.5 text-[11px] font-mono font-bold rounded-lg border border-emerald-200 dark:border-emerald-900/30 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{notifSuccessMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {notifErrorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 p-2.5 text-[11px] font-mono font-bold rounded-lg border border-rose-200 dark:border-rose-900/30 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{notifErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSendSubmit} className="space-y-3.5 pt-1 text-xs">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Target Account</label>
                <select
                  id="notif-select-member"
                  value={selectedMemberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {members.filter(m => m.status === 'Active').map(m => (
                    <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.flatNo} - {m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Dispatch Channel (SLA)</label>
                <select
                  id="notif-select-channel"
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="SMS" className="dark:bg-slate-900">📱 GSM Shortcode SMS Gateway</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Notification Pattern</label>
                <select
                  id="notif-select-template"
                  value={alertTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="due_reminder" className="dark:bg-slate-900">Billing Due Reminder</option>
                  <option value="milk_paused" className="dark:bg-slate-900">Pause Sub confirmation</option>
                  <option value="expiry_alert" className="dark:bg-slate-900">Newspaper Expiry Alert</option>
                  <option value="custom" className="dark:bg-slate-900">Custom Urgent Message</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  In-App Alert Header
                </label>
                <input
                  id="notif-input-title"
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="Alert header"
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Message Dispatch Content
              </label>
              <textarea
                id="notif-input-message"
                required
                rows={3}
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Declare alerts text context"
                className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-none leading-relaxed bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              id="notif-submit"
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Alert Dispatch</span>
            </button>
          </form>
        </div>

      </div>

      {/* DISPATCH HISTORY LOGS JOURNAL */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-55 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-550" />
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs uppercase font-mono">Dispatched Alerts Journal Feed</h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Chronological Logs</span>
        </div>

        {/* List of general dispatch logs */}
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 text-xs">
          {notifications.map((log) => (
            <div key={log.id} className="p-3 border rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/15 hover:bg-slate-50 dark:hover:bg-slate-950/25 transition-colors flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 rounded text-[9px] font-mono font-black">{log.type}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-150 truncate">{log.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Flat {log.flatNo}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px] font-medium">{log.message}</p>
              </div>
              <div className="text-right flex-shrink-0 font-mono text-[9px] text-slate-400 dark:text-slate-500">
                <div>{log.sentDate}</div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-tight block mt-1">● Success</span>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 italic">No alerts distributed yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}
