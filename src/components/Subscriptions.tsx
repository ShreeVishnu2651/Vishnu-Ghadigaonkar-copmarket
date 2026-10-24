/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  ArrowUpRight, 
  Milk, 
  Newspaper, 
  User, 
  Sparkles, 
  PauseCircle, 
  PlayCircle, 
  X, 
  Languages, 
  Clock, 
  DollarSign, 
  Sliders, 
  MapPin,
  Check
} from 'lucide-react';
import { MilkSubscription, NewspaperSubscription, Member } from '../types';

interface SubscriptionsProps {
  milkSubs: MilkSubscription[];
  newspaperSubs: NewspaperSubscription[];
  members: Member[];
  onAddMilk: (sub: Omit<MilkSubscription, 'id' | 'status' | 'startDate' | 'memberName' | 'flatNo'>) => void;
  onEditMilk: (id: string, sub: Partial<MilkSubscription>) => void;
  onAddNewspaper: (sub: Omit<NewspaperSubscription, 'id' | 'status' | 'memberName' | 'flatNo'>) => void;
  onEditNewspaper: (id: string, sub: Partial<NewspaperSubscription>) => void;
  defaultTab?: 'milk' | 'newspaper';
}

export default function Subscriptions({ 
  milkSubs, 
  newspaperSubs, 
  members, 
  onAddMilk, 
  onEditMilk, 
  onAddNewspaper, 
  onEditNewspaper,
  defaultTab
}: SubscriptionsProps) {

  const [activeTab, setActiveTab ] = useState<'milk' | 'newspaper'>(defaultTab || 'milk');

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  // Modals state
  const [isMilkOpen, setIsMilkOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);

  // Milk form states
  const [milkMemberId, setMilkMemberId] = useState('');
  const [milkBrand, setMilkBrand] = useState('Amul Gold');
  const [milkQty, setMilkQty] = useState(1);
  const [deliveryTime, setDeliveryTime] = useState<'Morning' | 'Evening' | 'Both'>('Morning');
  const [pricePerLiter, setPricePerLiter] = useState(68);

  // Newspaper form states
  const [newsMemberId, setNewsMemberId] = useState('');
  const [newsName, setNewsName] = useState('The Times of India');
  const [newsLanguage, setNewsLanguage] = useState('English');
  const [monthlyCharge, setMonthlyCharge] = useState(180);

  // Static options lists
  const milkBrands = ['Amul Gold', 'Mother Dairy', 'Gokul Milk', 'Nandini Milk', 'Aarey Fresh'];
  const newspaperBrands = [
    { name: 'The Times of India', charge: 180, lang: 'English' },
    { name: 'Hindustan Times', charge: 160, lang: 'English' },
    { name: 'The Hindu', charge: 220, lang: 'English' },
    { name: 'Maharashtra Times', charge: 140, lang: 'Marathi' },
    { name: 'Dainik Jagran', charge: 130, lang: 'Hindi' },
    { name: 'Navbharat Times', charge: 140, lang: 'Hindi' }
  ];

  const handleMilkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milkMemberId) {
      alert('Please select a resident member');
      return;
    }
    onAddMilk({
      memberId: milkMemberId,
      milkBrand,
      quantity: Number(milkQty),
      deliveryTime,
      pricePerLiter: Number(pricePerLiter)
    });
    setIsMilkOpen(false);
    setMilkMemberId('');
  };

  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsMemberId) {
      alert('Please select a resident member');
      return;
    }
    onAddNewspaper({
      memberId: newsMemberId,
      newspaperName: newsName,
      language: newsLanguage,
      monthlyCharge: Number(monthlyCharge)
    });
    setIsNewsOpen(false);
    setNewsMemberId('');
  };

  const handleNewsSelectChange = (val: string) => {
    setNewsName(val);
    const selected = newspaperBrands.find(n => n.name === val);
    if (selected) {
      setMonthlyCharge(selected.charge);
      setNewsLanguage(selected.lang);
    }
  };

  const activeMembersOnly = members.filter(m => m.status === 'Active');

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#3F6212] tracking-tight">Utility Subscriptions Center</h2>
          <p className="text-xs text-[#3F6212]">Manage daily milk delivery brands, delivery morning/evening slots, and monthly society newspaper logistics.</p>
        </div>

        {/* Custom triggers depending on tab */}
        {activeTab === 'milk' ? (
          <button
            id="add-milk-trigger"
            onClick={() => setIsMilkOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-100 dark:shadow-none cursor-pointer"
          >
            <Milk className="h-4 w-4" />
            <span>Setup Milk Delivery</span>
          </button>
        ) : (
          <button
            id="add-news-trigger"
            onClick={() => setIsNewsOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-sky-100 dark:shadow-none cursor-pointer"
          >
            <Newspaper className="h-4 w-4" />
            <span>Onboard Newspaper Sub</span>
          </button>
        )}
      </div>

      {/* Main Tabs controller */}
      <div className="flex border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl">
        <button
          id="tab-milk"
          onClick={() => setActiveTab('milk')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'milk' 
              ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Milk className="h-4 w-4" />
          <span>Milk Orders ({milkSubs.length})</span>
        </button>
        <button
          id="tab-newspaper"
          onClick={() => setActiveTab('newspaper')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'newspaper' 
              ? 'bg-slate-900 dark:bg-emerald-600 text-white' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Newspaper className="h-4 w-4" />
          <span>Newspaper Subs ({newspaperSubs.length})</span>
        </button>
      </div>

      {/* MILK SECTION VIEW */}
      {activeTab === 'milk' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl text-[#3F6212] text-xs">
            <span className="font-bold">Milk Billing Calculation Rule:</span> Subscriptions calculate charges as: <span className="font-semibold underline">Quantity * Deliveries (Morning = 1, Evening = 1, Both = 2) * Price/Liter * 30 Days</span>. These feed directly into our automatic end-of-month society billing engine.
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="px-6 py-4">Society Resident</th>
                    <th className="px-6 py-4">Flat No</th>
                    <th className="px-6 py-4">Ordered Brand</th>
                    <th className="px-6 py-4">Daily Volume</th>
                    <th className="px-6 py-4">Timetable Slot</th>
                    <th className="px-6 py-4 font-mono">Monthly Est</th>
                    <th className="px-6 py-4">Delivery Status</th>
                    <th className="px-6 py-4 text-center">Pause/Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {milkSubs.map((sub) => {
                    const statusIsActive = sub.status === 'Active';
                    const deliveries = sub.deliveryTime === 'Both' ? 2 : 1;
                    const monthlyValue = statusIsActive ? (sub.quantity * deliveries * sub.pricePerLiter * 30) : 0;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-150 block">{sub.memberName}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">{sub.id} • Registered</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                            {sub.flatNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-350">
                          <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2.5 py-1 rounded font-semibold text-[11px]">
                            🥛 {sub.milkBrand}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-750 dark:text-slate-300">
                          {sub.quantity} Liters/day
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center space-x-1 font-semibold text-slate-600 dark:text-slate-350">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{sub.deliveryTime}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                          ₹{monthlyValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            statusIsActive 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-amber-100 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400'
                          }`}>
                            {statusIsActive ? '🚚 Active' : '⏸️ Paused'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            id={`toggle-milk-sub-${sub.id}`}
                            onClick={() => onEditMilk(sub.id, { status: statusIsActive ? 'Paused' : 'Active' })}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              statusIsActive 
                                ? 'border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20' 
                                : 'border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                            }`}
                            title={statusIsActive ? 'Pause Delivery Sub' : 'Resume Deliveries'}
                          >
                            {statusIsActive ? <PauseCircle className="h-4.5 w-4.5" /> : <PlayCircle className="h-4.5 w-4.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {milkSubs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        No milk subscription models set up. Register a member first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEWSPAPER SECTION VIEW */}
      {activeTab === 'newspaper' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-550 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="px-6 py-4">Resident Member</th>
                    <th className="px-6 py-4">Flat No</th>
                    <th className="px-6 py-4">Newspaper publication</th>
                    <th className="px-6 py-4">Language</th>
                    <th className="px-6 py-4 font-mono">Monthly Rate</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Pause/Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {newspaperSubs.map((sub) => {
                    const statusIsActive = sub.status === 'Active';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-150 block">{sub.memberName}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-550 font-mono block">{sub.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                            {sub.flatNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-350">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            📰 {sub.newspaperName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center space-x-1 text-slate-550 dark:text-slate-400">
                            <Languages className="w-3.5 h-3.5 text-slate-400 dark:text-slate-555" />
                            <span>{sub.language}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                          ₹{sub.monthlyCharge}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            statusIsActive 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-amber-100 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400'
                          }`}>
                            {statusIsActive ? '📬 Active' : '⏸️ Paused'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            id={`toggle-news-sub-${sub.id}`}
                            onClick={() => onEditNewspaper(sub.id, { status: statusIsActive ? 'Paused' : 'Active' })}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              statusIsActive 
                                ? 'border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20' 
                                : 'border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                            }`}
                            title={statusIsActive ? 'Pause Paper Delivery' : 'Resume Sub'}
                          >
                            {statusIsActive ? <PauseCircle className="h-4.5 w-4.5" /> : <PlayCircle className="h-4.5 w-4.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {newspaperSubs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        No newspaper subscriptions pre-loaded. Click "Onboard Newspaper Sub" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Milk Sub Dialog */}
      {isMilkOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <button 
              id="close-milk-modal"
              onClick={() => setIsMilkOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
              <Milk className="h-5 w-5 text-emerald-600" />
              <span>Initiate Dairy Subscription</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Setup scheduled morning or evening home deliveries for active society apartments.</p>
            
            <form onSubmit={handleMilkSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Select Resident Apartment *</label>
                <select
                  id="milk-select-member"
                  required
                  value={milkMemberId}
                  onChange={(e) => setMilkMemberId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="" className="dark:bg-slate-900">-- Choose Flat Resident --</option>
                  {activeMembersOnly.map(m => (
                    <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.flatNo} - {m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Milk Brand</label>
                  <select
                    id="milk-select-brand"
                    value={milkBrand}
                    onChange={(e) => setMilkBrand(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    {milkBrands.map(b => (
                      <option key={b} value={b} className="dark:bg-slate-900">{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Qty per Delivery (Liters)</label>
                  <input
                    id="milk-input-qty"
                    type="number"
                    min="1"
                    max="10"
                    value={milkQty}
                    onChange={(e) => setMilkQty(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Delivery Time Slot</label>
                  <select
                    id="milk-select-time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="Morning" className="dark:bg-slate-900">Morning (06:00 AM)</option>
                    <option value="Evening" className="dark:bg-slate-900">Evening (06:00 PM)</option>
                    <option value="Both" className="dark:bg-slate-900">Both Morning + Evening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Price per Liter (₹)</label>
                  <input
                    id="milk-input-price"
                    type="number"
                    min="40"
                    max="120"
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  id="milk-cancel"
                  type="button"
                  onClick={() => setIsMilkOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-850 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="milk-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Onboard Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Newspaper Sub Dialog */}
      {isNewsOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <button 
              id="close-news-modal"
              onClick={() => setIsNewsOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
              <Newspaper className="h-5 w-5 text-sky-600" />
              <span>Newspaper Delivery Setup</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Bind periodical newspaper publications logistics for active apartments.</p>
            
            <form onSubmit={handleNewsSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Select Resident Apartment *</label>
                <select
                  id="news-select-member"
                  required
                  value={newsMemberId}
                  onChange={(e) => setNewsMemberId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="" className="dark:bg-slate-900">-- Choose Flat Resident --</option>
                  {activeMembersOnly.map(m => (
                    <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.flatNo} - {m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Publication List</label>
                <select
                  id="news-select-publication"
                  value={newsName}
                  onChange={(e) => handleNewsSelectChange(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium"
                >
                  {newspaperBrands.map(n => (
                    <option key={n.name} value={n.name} className="dark:bg-slate-900">{n.name} (₹{n.charge}/mo)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Publication Language</label>
                  <input
                    id="news-language"
                    type="text"
                    disabled
                    value={newsLanguage}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-500 dark:text-slate-450"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Monthly Cost (Fixed SKU)</label>
                  <input
                    id="news-charge"
                    type="number"
                    disabled
                    value={monthlyCharge}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-202 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-500 dark:text-slate-450"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  id="news-cancel"
                  type="button"
                  onClick={() => setIsNewsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-202 dark:border-slate-850 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="news-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Setup Delivery Sub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
