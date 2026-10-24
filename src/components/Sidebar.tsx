/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Milk, 
  Newspaper, 
  FileText, 
  MonitorPlay, 
  CreditCard, 
  Bell, 
  LogOut,
  UserCheck,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { UserSession } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  session: UserSession;
  setSession: (session: UserSession) => void;
  membersList: Array<{ id: string; name: string }>;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, session, setSession, membersList, darkMode, onToggleDarkMode, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'pos', label: 'POS Billing Counter', icon: MonitorPlay, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'members', label: 'Members Directory', icon: Users, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'groceries', label: 'Grocery Inventory', icon: ShoppingBag, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'milk', label: 'Milk Subscriptions', icon: Milk, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'newspaper', label: 'Newspaper Deliveries', icon: Newspaper, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'billing', label: 'Utility Billing Room', icon: FileText, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'payments', label: 'Transaction Logs', icon: CreditCard, roles: ['Admin', 'Cashier', 'Society Member'] },
    { id: 'reports', label: 'Exporters & Alerts', icon: Bell, roles: ['Admin', 'Cashier', 'Society Member'] }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(session.role));

  const toggleMobile = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#2E7D32] text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-[#4CAF50] rounded-lg text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">CoopMart</span>
        </div>
        <div className="flex items-center space-x-2">
          {onToggleDarkMode && (
            <button
              id="mobile-theme-toggle"
              onClick={onToggleDarkMode}
              className="p-1.5 text-white/90 hover:text-white bg-black/20 rounded-lg"
              title={darkMode ? "Switch to Day Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="h-5 w-5 text-[#FFC107]" /> : <Moon className="h-5 w-5 text-white" />}
            </button>
          )}
          <button id="mobile-menu-toggle" onClick={toggleMobile} className="p-1.5 text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#FFC107] rounded-lg">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          onClick={toggleMobile} 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Sidebar Component */}
      <aside className={`
         fixed inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex flex-col w-64 bg-white dark:bg-[#1F2937] border-r border-[#E5E7EB] dark:border-slate-700/60 text-[#1F2937] dark:text-white min-h-screen transition-transform duration-200 ease-in-out shadow-sm
      `}>
        {/* Logo Header */}
        <div className="flex items-center space-x-3 p-5 border-b border-[#E5E7EB] dark:border-slate-700/80 bg-[#F8FAF8] dark:bg-[#111827]">
          <div className="p-2.5 bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] rounded-xl text-white shadow-xs">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold tracking-tight text-lg text-[#1F2937] dark:text-white">CoopMart</h1>
              <span className="text-[10px] font-bold bg-[#FFC107] text-[#1F2937] px-1.5 py-0.5 rounded-sm uppercase tracking-wide">HUB</span>
            </div>
            <p className="text-xs text-[#4B5563] dark:text-slate-400 font-medium">Society Management</p>
          </div>
        </div>

        {/* Authenticated Resident Profile Card & Demo Gate Indicator */}
        <div className="p-3.5 mx-3 my-4 bg-[#F8FAF8] dark:bg-slate-800/80 rounded-xl border border-[#E5E7EB] dark:border-slate-700/70 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#1F2937] dark:text-slate-300">
              <UserCheck className="h-4 w-4 text-[#2E7D32] dark:text-[#4CAF50]" />
              <span>Resident Account</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" title="Active Verified Session"></span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-[#1F2937] dark:text-white truncate">
              {session.name}
            </div>
            {session.flatNo && (
              <div className="text-[11px] font-mono font-semibold text-[#2E7D32] dark:text-emerald-400">
                Flat No: {session.flatNo}
              </div>
            )}
            <div className="text-[10px] text-[#4B5563] dark:text-slate-400">
              Role: <span className="font-semibold text-[#1F2937] dark:text-slate-300">{session.role}</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] dark:border-slate-700/60">
            <div className="text-[9.5px] leading-tight text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded border border-amber-200 dark:border-amber-900/50 mb-2">
              <strong>College Demo Gate:</strong> Open registration enabled (NOT secure for real data).
            </div>

            {onLogout && (
              <button
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                id={`sidebar-link-${item.id}`}
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                  ${isActive 
                    ? 'bg-[#2E7D32] text-white font-bold shadow-xs border-l-4 border-[#FFC107]' 
                    : 'text-[#4B5563] dark:text-slate-300 hover:bg-[#E8F5E9] dark:hover:bg-slate-800 hover:text-[#1F2937] dark:hover:text-white'
                  }
                `}
              >
                <IconComponent className={`h-4.5 w-4.5 ${isActive ? 'text-[#FFC107]' : 'text-[#4B5563] dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Mode Toggle in Sidebar */}
        {onToggleDarkMode && (
          <div className="px-3 pb-2">
            <button
              id="sidebar-theme-toggle"
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[#F8FAF8] dark:bg-slate-800/80 hover:bg-[#E8F5E9] dark:hover:bg-slate-700/80 text-[#1F2937] dark:text-slate-200 border border-[#E5E7EB] dark:border-slate-700 transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                {darkMode ? <Sun className="w-4 h-4 text-[#FFC107]" /> : <Moon className="w-4 h-4 text-[#1F2937]" />}
                <span>{darkMode ? 'Day Mode' : 'Night Mode'}</span>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[#2E7D32] dark:text-emerald-400 border border-[#E5E7EB] dark:border-slate-800">
                {darkMode ? 'DARK' : 'LIGHT'}
              </span>
            </button>
          </div>
        )}

        {/* Footer info panel */}
        <div className="p-4 border-t border-[#E5E7EB] dark:border-slate-800 bg-[#F8FAF8] dark:bg-[#111827] font-mono text-[10px] text-[#4B5563] dark:text-slate-400 flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <span>PORT 3000</span>
            <span className="text-[#2E7D32] dark:text-[#4CAF50] font-bold">ONLINE</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[#1F2937] dark:text-slate-300 font-bold mt-1">
            <span className="w-2 h-2 bg-[#4CAF50] rounded-full"></span>
            <span>CoopMart System Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
