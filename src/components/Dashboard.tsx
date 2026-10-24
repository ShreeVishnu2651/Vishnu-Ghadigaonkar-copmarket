/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Milk, 
  Newspaper, 
  AlertCircle, 
  TrendingUp,
  Clock,
  ArrowRight,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Activity,
  Package,
  TrendingDown,
  ChevronRight,
  Info,
  Sparkles,
  Award,
  DollarSign,
  Briefcase,
  HelpCircle,
  X,
  CreditCard,
  Building2
} from 'lucide-react';
import { Member, Product, MilkSubscription, NewspaperSubscription, Bill, PaymentTransaction } from '../types';

interface DashboardProps {
  members: Member[];
  products: Product[];
  milkSubs: MilkSubscription[];
  newspaperSubs: NewspaperSubscription[];
  bills: Bill[];
  payments: PaymentTransaction[];
  onNavigate: (tab: string) => void;
  residentName?: string;
}

export default function Dashboard({ 
  members, 
  products, 
  milkSubs, 
  newspaperSubs, 
  bills, 
  payments,
  onNavigate,
  residentName
}: DashboardProps) {

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMetricStream, setSelectedMetricStream] = useState<'total' | 'grocery' | 'subscriptions'>('total');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);
  const [showQuickHelp, setShowQuickHelp] = useState(true);

  // Keep simulated time updated for dynamic aesthetic feel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculations
  // Total grocery cashier sales from payments logged without utility bills
  const groceryPosSales = payments
    .filter(p => !p.billId && p.status === 'Success')
    .reduce((sum, p) => sum + p.amount, 0);

  // Total cash collected
  const totalRevenueCollected = payments
    .filter(p => p.status === 'Success')
    .reduce((sum, p) => sum + p.amount, 0);

  // Active subscriptions count
  const activeMilkCount = milkSubs.filter(m => m.status === 'Active').length;
  const activeNewsCount = newspaperSubs.filter(n => n.status === 'Active').length;

  // Approximate Monthly Milk Sales 
  const monthlyMilkValue = milkSubs
    .filter(m => m.status === 'Active')
    .reduce((sum, m) => {
      const deliveries = m.deliveryTime === 'Both' ? 2 : 1;
      return sum + (m.quantity * deliveries * m.pricePerLiter * 30);
    }, 0);

  const monthlyNewsValue = newspaperSubs
    .filter(n => n.status === 'Active')
    .reduce((sum, n) => sum + n.monthlyCharge, 0);

  const combinedSubsValue = monthlyMilkValue + monthlyNewsValue;

  // Unpaid bills counting
  const unpaidBills = bills.filter(b => b.paymentStatus === 'Unpaid');
  const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0);

  // Low stock products alert quantity <= 15
  const lowStockProducts = products.filter(p => p.quantity <= 15);
  const lowStockCount = lowStockProducts.length;

  // Generates greeting based on hours
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Multiple metric streams for graph lines plotting
  const streamData = {
    total: [
      { month: 'Jan', value: 45000, desc: 'Regular winter start' },
      { month: 'Feb', value: 52000, desc: 'Milk adjustments' },
      { month: 'Mar', value: 61500, desc: 'Spring festival checkout rise' },
      { month: 'Apr', value: 58000, desc: 'Flat migration cycle' },
      { month: 'May', value: 69000, desc: 'Bulk oils replenishment' },
      { month: 'Jun (Est)', value: Math.max(76000, totalRevenueCollected), desc: 'Active month collections' },
    ],
    grocery: [
      { month: 'Jan', value: 18000, desc: 'Grocery desk opened' },
      { month: 'Feb', value: 21000, desc: 'New dairy options added' },
      { month: 'Mar', value: 26500, desc: 'Bulk grains purchase' },
      { month: 'Apr', value: 22000, desc: 'Intermediate discount weekend' },
      { month: 'May', value: 29000, desc: 'Snack inventory push' },
      { month: 'Jun (Est)', value: Math.max(34000, groceryPosSales), desc: 'Express register checkout' },
    ],
    subscriptions: [
      { month: 'Jan', value: 27000, desc: 'Initial flats delivery roll' },
      { month: 'Feb', value: 31000, desc: 'Extra dairy deliveries' },
      { month: 'Mar', value: 35000, desc: 'Morning newspaper opt-ins' },
      { month: 'Apr', value: 36000, desc: 'Steady recurring delivery' },
      { month: 'May', value: 40000, desc: 'Summer milk scheduling' },
      { month: 'Jun (Est)', value: Math.max(42000, combinedSubsValue), desc: 'Combined active rosters' },
    ]
  };

  // Compile coordinates against a shared maximum value so they scale correctly in parallel
  const allValues = [
    ...streamData.total.map(d => d.value),
    ...streamData.grocery.map(d => d.value),
    ...streamData.subscriptions.map(d => d.value),
  ];
  const maxVal = Math.max(...allValues) * 1.1; // pad 10%
  const minVal = 0;

  // SVG dimensions for coordinates
  const svgWidth = 720;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 25;

  // Calculators for multi-line plotting
  const totalPoints = streamData.total.map((d, index) => {
    const x = paddingX + (index * (svgWidth - paddingX * 2)) / (streamData.total.length - 1);
    const y = svgHeight - paddingY - ((d.value - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const groceryPoints = streamData.grocery.map((d, index) => {
    const x = paddingX + (index * (svgWidth - paddingX * 2)) / (streamData.grocery.length - 1);
    const y = svgHeight - paddingY - ((d.value - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const subsPoints = streamData.subscriptions.map((d, index) => {
    const x = paddingX + (index * (svgWidth - paddingX * 2)) / (streamData.subscriptions.length - 1);
    const y = svgHeight - paddingY - ((d.value - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
    return { x, y, ...d };
  });

  // Helper curve generator using Bezier segments
  const getPathDefinition = (pts: typeof totalPoints) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p = pts[i];
      const cpX1 = p0.x + (p.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p.x - p0.x)) / 3;
      const cpY2 = p.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }
    return d;
  };

  const pathDTotal = getPathDefinition(totalPoints);
  const pathDGocery = getPathDefinition(groceryPoints);
  const pathDSubs = getPathDefinition(subsPoints);

  // Gradient area polygon for highlighted/active selected metric stream
  const getFilledDefinition = (pts: typeof totalPoints, activePath: string) => {
    if (pts.length === 0) return '';
    return `${activePath} L ${pts[pts.length - 1].x} ${svgHeight - paddingY} L ${pts[0].x} ${svgHeight - paddingY} Z`;
  };

  const activePoints = selectedMetricStream === 'total' 
    ? totalPoints 
    : selectedMetricStream === 'grocery' 
      ? groceryPoints 
      : subsPoints;

  const activePathD = selectedMetricStream === 'total' 
    ? pathDTotal 
    : selectedMetricStream === 'grocery' 
      ? pathDGocery 
      : pathDSubs;

  const filledD = getFilledDefinition(activePoints, activePathD);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP GREETING HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#ECFCCB] dark:bg-lime-950/40 p-5 rounded-2xl border border-[#BEF264] dark:border-lime-800/60 shadow-xs transition-colors">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 bg-[#65A30D] rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#3f6212] dark:text-lime-300 font-mono tracking-widest uppercase">COOPERATIVE SOCIETY ADMIN MONITOR</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#3f6212] dark:text-[#fef08a] tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-xs text-[#4d7c0f] dark:text-lime-200 mt-0.5 font-semibold">
            Real-time society overview: daily milk & newspaper subscriptions, POS register, and utility billing.
          </p>
        </div>
        
        {/* Time Widget */}
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 border border-[#D9F99D] dark:border-lime-900/50 px-3.5 py-2.5 rounded-xl font-mono shadow-xs">
          <Clock className="w-4 h-4 text-[#65A30D] dark:text-lime-400" />
          <div className="text-[11px]">
            <span className="font-extrabold text-[#1F2937] dark:text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[#4B5563] dark:text-slate-400 ml-1.5 font-bold">
              {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC WALKTHROUGH DRAWER: "EASY TO UNDERSTAND" WORKFLOW GUIDE */}
      {showQuickHelp ? (
        <div id="quick-help-panel" className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-2xl p-6 relative shadow-xs overflow-hidden transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2E7D32] via-[#4CAF50] to-[#FFC107]"></div>
          <button 
            id="close-help-btn"
            onClick={() => setShowQuickHelp(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Dismiss guide"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start space-x-3.5 max-w-4xl">
            <div className="p-3 bg-[#2E7D32] text-white rounded-xl shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-[#FFC107]" />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-extrabold text-[#1F2937] dark:text-white text-sm tracking-tight flex items-center space-x-2">
                  <span>Seamless Operations Workflow</span>
                  <span className="bg-[#FFF9C4] text-[#8D6E00] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FFE082]">3 STEPS</span>
                </h3>
                <p className="text-xs text-[#4B5563] dark:text-slate-400 mt-0.5">Quick guide on how CoopMart synchronizes residents, daily subscriptions, and billing.</p>
              </div>

              {/* Simple Flow Diagrams */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                <div 
                  onClick={() => onNavigate('members')}
                  className="bg-[#F8FAF8] dark:bg-slate-800/60 hover:bg-[#E8F5E9] dark:hover:bg-emerald-950/30 p-3.5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 hover:border-[#4CAF50] transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono bg-[#2E7D32] text-white w-5 h-5 rounded-full flex items-center justify-center">1</span>
                    <span className="font-bold text-[#1F2937] dark:text-slate-100 text-xs">Resident Directory</span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                    Add resident flats, assign contact details, and manage active status.
                  </p>
                </div>

                <div 
                  onClick={() => onNavigate('milk')}
                  className="bg-[#F8FAF8] dark:bg-slate-800/60 hover:bg-[#E8F5E9] dark:hover:bg-emerald-950/30 p-3.5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 hover:border-[#4CAF50] transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono bg-[#4CAF50] text-white w-5 h-5 rounded-full flex items-center justify-center">2</span>
                    <span className="font-bold text-[#1F2937] dark:text-slate-100 text-xs">Daily Subscriptions</span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                    Set up milk brands & newspapers with morning/evening schedule tracking.
                  </p>
                </div>

                <div 
                  onClick={() => onNavigate('billing')}
                  className="bg-[#F8FAF8] dark:bg-slate-800/60 hover:bg-[#FFF9C4] dark:hover:bg-amber-950/30 p-3.5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 hover:border-[#FFC107] transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono bg-[#FFC107] text-[#1F2937] w-5 h-5 rounded-full flex items-center justify-center">3</span>
                    <span className="font-bold text-[#1F2937] dark:text-slate-100 text-xs">Auto Billing Room</span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                    Generate monthly consolidated bills with grocery, milk, and maintenance in 1 click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setShowQuickHelp(true)}
            className="text-xs text-[#2E7D32] dark:text-emerald-400 hover:text-[#1B5E20] font-bold flex items-center space-x-1.5 py-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Show Operations Guide</span>
          </button>
        </div>
      )}

      {/* 3. BENTO GRID STATISTICS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Metric B: Cashier POS Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-xs hover:border-[#4CAF50] transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-[#4B5563] dark:text-slate-400 uppercase font-mono">GROCERY POS SALES</span>
              <h3 className="text-3xl font-black text-[#1F2937] dark:text-white leading-none">₹{groceryPosSales.toLocaleString()}</h3>
              <div className="flex items-center space-x-1 text-[11px] text-[#2E7D32] dark:text-emerald-400 pt-1 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Express Counter</span>
              </div>
            </div>
            <div className="p-3 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#4CAF50] rounded-xl group-hover:bg-[#4CAF50] group-hover:text-white transition-colors duration-200">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric C: Milk & News Subscriptions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-xs hover:border-[#FFC107] transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-[#4B5563] dark:text-slate-400 uppercase font-mono">SUBSCRIPTIONS VALUE</span>
              <h3 className="text-3xl font-black text-[#1F2937] dark:text-white leading-none">₹{combinedSubsValue.toLocaleString()}</h3>
              <div className="flex items-center space-x-1.5 text-[11px] text-[#4B5563] dark:text-slate-400 pt-1">
                <span className="font-bold text-[#2E7D32] dark:text-emerald-400 font-mono">{activeMilkCount} milk</span>
                <span>•</span>
                <span className="font-bold text-[#4B5563] dark:text-slate-300 font-mono">{activeNewsCount} papers</span>
              </div>
            </div>
            <div className="p-3 bg-[#FFF9C4] dark:bg-amber-950/50 text-[#8D6E00] dark:text-amber-400 rounded-xl group-hover:bg-[#FFC107] group-hover:text-[#1F2937] transition-colors duration-200">
              <Milk className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metric D: Active Total Inflow */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-xs hover:border-[#2E7D32] transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-[#4B5563] dark:text-slate-400 uppercase font-mono">TOTAL REVENUE COLLECTED</span>
              <h3 className="text-3xl font-black text-[#2E7D32] dark:text-emerald-400 leading-none">₹{totalRevenueCollected.toLocaleString()}</h3>
              <div className="flex items-center space-x-1 text-[11px] text-[#4B5563] dark:text-slate-400 pt-1">
                <span className="font-bold font-mono text-[#8D6E00] dark:text-[#FFC107]">₹{totalUnpaidAmount.toLocaleString()}</span>
                <span>unpaid bills</span>
              </div>
            </div>
            <div className="p-3 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 rounded-xl group-hover:bg-[#2E7D32] group-hover:text-white transition-colors duration-200">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

      </div>

      {/* 4. REVENUE CHARTS & RECENT JOURNAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Col-span-8: Interactive Graph Lines */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-slate-800 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E5E7EB] dark:border-slate-800">
              <div>
                <h4 className="font-extrabold text-[#1F2937] dark:text-white tracking-tight flex items-center space-x-2 text-base">
                  <Activity className="w-4.5 h-4.5 text-[#2E7D32] dark:text-emerald-400" />
                  <span>Financial Inflow Trends</span>
                </h4>
                <p className="text-xs text-[#4B5563] dark:text-slate-400">Monthly trajectory across utility bills, POS counter, and delivery rosters.</p>
              </div>

              {/* Toggle controls */}
              <div className="flex bg-[#F8FAF8] dark:bg-slate-800 p-1 rounded-xl border border-[#E5E7EB] dark:border-slate-700 text-xs">
                <button
                  id="tab-graph-total"
                  onClick={() => setSelectedMetricStream('total')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedMetricStream === 'total' 
                      ? 'bg-[#2E7D32] text-white shadow-xs' 
                      : 'text-[#4B5563] dark:text-slate-300 hover:text-[#1F2937] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Combined Inflows
                </button>
                <button
                  id="tab-graph-grocery"
                  onClick={() => setSelectedMetricStream('grocery')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedMetricStream === 'grocery' 
                      ? 'bg-[#2E7D32] text-white shadow-xs' 
                      : 'text-[#4B5563] dark:text-slate-300 hover:text-[#1F2937] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  POS Checkouts
                </button>
                <button
                  id="tab-graph-subs"
                  onClick={() => setSelectedMetricStream('subscriptions')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedMetricStream === 'subscriptions' 
                      ? 'bg-[#2E7D32] text-white shadow-xs' 
                      : 'text-[#4B5563] dark:text-slate-300 hover:text-[#1F2937] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Deliveries Roster
                </button>
              </div>
            </div>

            {/* LIVE SVG PLOTTED GRAPH */}
            <div className="relative pt-2">
              
              {/* Tooltip */}
              {hoveredDataPoint !== null && (
                <div 
                  className="absolute z-20 bg-[#1F2937] text-white p-3 rounded-xl shadow-xl border border-slate-700 text-[11px] font-mono pointer-events-none transition-all duration-150"
                  style={{
                    left: `${activePoints[hoveredDataPoint].x - 85}px`,
                    top: `${activePoints[hoveredDataPoint].y - 85}px`
                  }}
                >
                  <p className="font-bold text-[#FFC107] uppercase tracking-wider text-[9px]">
                    {selectedMetricStream === 'total' ? 'NET COMBINED' : selectedMetricStream === 'grocery' ? 'EXPRESS POS' : 'DELIVERIES RAMP'}
                  </p>
                  <p className="text-sm font-black text-[#4CAF50] mt-0.5">₹{activePoints[hoveredDataPoint].value.toLocaleString()}</p>
                  <p className="text-slate-300 text-[9px] mt-1 italic">{activePoints[hoveredDataPoint].desc}</p>
                </div>
              )}

              <div className="w-full overflow-x-auto select-none">
                <svg 
                  className="w-full h-auto min-w-[500px]" 
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Grid Y-Threshold Lines */}
                  {[0.25, 0.5, 0.75, 1.0].map((t, idx) => {
                    const yVal = svgHeight - paddingY - t * (svgHeight - paddingY * 2);
                    const labelVal = Math.round(minVal + t * (maxVal - minVal));
                    return (
                      <g key={idx}>
                        <line 
                          x1={paddingX} 
                          y1={yVal} 
                          x2={svgWidth - paddingX} 
                          y2={yVal} 
                          stroke="#E5E7EB" 
                          strokeWidth="1.2"
                          strokeDasharray="4,4" 
                        />
                        <text 
                          x={paddingX - 10} 
                          y={yVal + 3} 
                          fill="#9CA3AF" 
                          fontSize="9" 
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          ₹{(labelVal / 1000).toFixed(0)}k
                        </text>
                      </g>
                    );
                  })}

                  <defs>
                    <linearGradient id="themeChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.22" />
                      <stop offset="90%" stopColor="#4CAF50" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area */}
                  {filledD && (
                    <path 
                      d={filledD} 
                      fill="url(#themeChartGradient)" 
                    />
                  )}

                  {/* LINE 1 (POS Grocery) */}
                  <path 
                    d={pathDGocery} 
                    fill="none" 
                    stroke="#4CAF50" 
                    strokeOpacity={selectedMetricStream === 'grocery' ? "1.0" : "0.25"}
                    strokeWidth={selectedMetricStream === 'grocery' ? "3.5" : "1.8"} 
                    strokeLinecap="round"
                  />

                  {/* LINE 2 (Subscriptions) */}
                  <path 
                    d={pathDSubs} 
                    fill="none" 
                    stroke="#FFC107" 
                    strokeOpacity={selectedMetricStream === 'subscriptions' ? "1.0" : "0.3"}
                    strokeWidth={selectedMetricStream === 'subscriptions' ? "3.5" : "1.8"} 
                    strokeLinecap="round"
                  />

                  {/* LINE 3 (Total Combined) */}
                  <path 
                    d={pathDTotal} 
                    fill="none" 
                    stroke="#2E7D32" 
                    strokeOpacity={selectedMetricStream === 'total' ? "1.0" : "0.25"}
                    strokeWidth={selectedMetricStream === 'total' ? "3.8" : "1.8"} 
                    strokeLinecap="round"
                  />

                  {/* Points */}
                  {activePoints.map((p, idx) => {
                    return (
                      <g key={idx} className="cursor-pointer">
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="18" 
                          fill="transparent" 
                          onMouseEnter={() => setHoveredDataPoint(idx)}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        />
                        
                        {hoveredDataPoint === idx && (
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="10" 
                            fill="#E8F5E9"
                            stroke="#2E7D32"
                            strokeWidth="1.5"
                            className="animate-ping"
                          />
                        )}

                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r={hoveredDataPoint === idx ? "7" : "5.5"} 
                          fill={
                            selectedMetricStream === 'total' ? '#2E7D32' : selectedMetricStream === 'grocery' ? '#4CAF50' : '#FFC107'
                          } 
                          stroke="#FFFFFF" 
                          strokeWidth="2" 
                          onMouseEnter={() => setHoveredDataPoint(idx)}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        />

                        <text 
                          x={p.x} 
                          y={svgHeight - 8} 
                          fill={hoveredDataPoint === idx ? "#2E7D32" : "#9CA3AF"} 
                          fontSize="9.5" 
                          fontFamily="sans-serif"
                          fontWeight={hoveredDataPoint === idx ? "900" : "700"}
                          textAnchor="middle"
                        >
                          {p.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

            </div>

            {/* Custom Legend */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-[#F8FAF8] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-xs text-[#4B5563] dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center space-x-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] block"></span>
                  <span className="text-[#1F2937] dark:text-slate-200">Combined Inflow</span>
                </span>
                <span className="flex items-center space-x-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50] block"></span>
                  <span className="text-[#1F2937] dark:text-slate-200">POS Checkouts</span>
                </span>
                <span className="flex items-center space-x-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFC107] block"></span>
                  <span className="text-[#1F2937] dark:text-slate-200">Deliveries Roster</span>
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-[#4B5563] dark:text-slate-400">LIVE VECTOR METRICS</span>
            </div>

          </div>

          {/* Supermarket Shelf Health */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-[#E5E7EB] dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[#1F2937] dark:text-white tracking-tight flex items-center space-x-2 text-sm">
                  <Package className="w-4.5 h-4.5 text-[#2E7D32] dark:text-emerald-400" />
                  <span>Grocery Inventory Health</span>
                </h4>
                <p className="text-xs text-[#4B5563] dark:text-slate-400">Category distribution and low-stock indicators</p>
              </div>
              <button
                onClick={() => onNavigate('groceries')}
                className="text-xs font-bold text-[#2E7D32] dark:text-emerald-400 hover:text-[#1B5E20] flex items-center space-x-1 cursor-pointer"
              >
                <span>View Inventory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#F8FAF8] dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 block">Fresh Dairy</span>
                <span className="text-sm font-black text-[#1F2937] dark:text-white font-mono">
                  {products.filter(p => p.category === 'Fresh Dairy').length} SKUs
                </span>
              </div>
              <div className="p-3 bg-[#F8FAF8] dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 block">Grains & Flours</span>
                <span className="text-sm font-black text-[#1F2937] dark:text-white font-mono">
                  {products.filter(p => p.category === 'Grains & Flours').length} SKUs
                </span>
              </div>
              <div className="p-3 bg-[#F8FAF8] dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 block">Oils & Spices</span>
                <span className="text-sm font-black text-[#1F2937] dark:text-white font-mono">
                  {products.filter(p => p.category === 'Oils & Spices').length} SKUs
                </span>
              </div>
              <div className="p-3 bg-[#F8FAF8] dark:bg-slate-800/80 border border-[#E5E7EB] dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 block">Household Care</span>
                <span className="text-sm font-black text-[#1F2937] dark:text-white font-mono">
                  {products.filter(p => p.category === 'Household Care').length} SKUs
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Col-span-4: Recent Transactions List / Cashier Journal */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[460px]">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
              <div>
                <h4 className="font-extrabold text-[#1F2937] dark:text-white tracking-tight">Recent Receipts</h4>
                <p className="text-[11px] text-[#4B5563] dark:text-slate-400">Latest settlement transactions</p>
              </div>
              <div className="text-[10px] font-mono font-bold bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center space-x-1.5 border border-[#C8E6C9] dark:border-emerald-800">
                <span className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full inline-block animate-pulse"></span>
                <span>SYNC LIVE</span>
              </div>
            </div>

            {/* Scrolling receipts logs list */}
            <div className="space-y-2.5 max-h-[365px] overflow-y-auto pr-1">
              {payments.slice(0, 6).map((pay) => {
                const member = members.find(m => m.id === pay.memberId);
                const displayName = (!pay.memberName || pay.memberName === 'Unknown Member' || pay.memberName.toLowerCase().startsWith('unknown')) 
                  ? (member ? member.name : (pay.memberId === 'Visitor' ? 'Walk-in Guest' : (pay.memberId ? `Resident (${pay.memberId})` : 'Walk-in Guest')))
                  : pay.memberName;
                const displayFlat = (!pay.flatNo || pay.flatNo === 'N/A')
                  ? (member ? member.flatNo : (pay.memberId === 'Visitor' ? 'Walk-in' : 'N/A'))
                  : pay.flatNo;

                return (
                  <div key={pay.id} className="flex justify-between items-center p-3 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#F8FAF8] dark:bg-slate-800/60 hover:bg-[#E8F5E9]/50 dark:hover:bg-slate-800 transition-colors">
                    <div className="min-w-0 pr-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-[#1F2937] dark:text-white truncate block">{displayName}</span>
                        {displayFlat !== 'N/A' && (
                          <span className="text-[9px] font-mono bg-[#E5E7EB] dark:bg-slate-700 text-[#1F2937] dark:text-slate-200 px-1.5 py-0.5 rounded font-bold truncate">{displayFlat}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-[#4B5563] dark:text-slate-400 font-mono mt-0.5">
                        <span className="font-bold text-[#2E7D32] dark:text-emerald-400">{pay.paymentMethod}</span>
                        <span>•</span>
                        <span className="text-[9px] truncate text-[#4B5563] dark:text-slate-400">{pay.id}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-[#1F2937] dark:text-white font-mono block">₹{pay.amount}</span>
                      <span className="text-[9px] text-[#4B5563] dark:text-slate-400 font-mono">{pay.paymentDate.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
              {payments.length === 0 && (
                <div className="py-20 text-center text-[#4B5563] dark:text-slate-400 text-xs italic space-y-1">
                  <p>No transactions logged yet.</p>
                  <p className="text-[10px] font-mono text-[#2E7D32] dark:text-emerald-400">Use POS counter to record checkouts</p>
                </div>
              )}
            </div>
          </div>

          <button 
            id="view-transactions-btn"
            onClick={() => onNavigate('payments')}
            className="w-full text-center py-2.5 text-xs font-bold text-[#2E7D32] dark:text-emerald-400 hover:text-[#1B5E20] hover:bg-[#E8F5E9] dark:hover:bg-slate-800 rounded-xl transition-all border border-[#C8E6C9] dark:border-emerald-900/60 flex items-center justify-center space-x-1 mt-4 cursor-pointer"
          >
            <span>View All Transactions</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 5. QUICK DASHBOARD FAST ACTION TILES */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-[#4B5563] dark:text-slate-400 uppercase tracking-wider font-mono">Fast Access Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Tile 1: POS Billing */}
          <div 
            onClick={() => onNavigate('pos')}
            className="bg-white dark:bg-slate-900 hover:border-[#2E7D32] dark:hover:border-emerald-600 border border-[#E5E7EB] dark:border-slate-800 p-5 rounded-2xl flex items-start space-x-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 rounded-xl group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h5 className="font-extrabold text-sm text-[#1F2937] dark:text-white">POS Express Checkout</h5>
              <p className="text-xs text-[#4B5563] dark:text-slate-400 leading-snug">Quick product scanner, member account debit, UPI & Cash settle.</p>
              <span className="text-[11px] font-bold text-[#2E7D32] dark:text-emerald-400 flex items-center pt-1">
                Open Counter &rarr;
              </span>
            </div>
          </div>

          {/* Tile 2: Subscriptions Deliveries */}
          <div 
            onClick={() => onNavigate('milk')}
            className="bg-white dark:bg-slate-900 hover:border-[#4CAF50] dark:hover:border-green-600 border border-[#E5E7EB] dark:border-slate-800 p-5 rounded-2xl flex items-start space-x-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#4CAF50] rounded-xl group-hover:bg-[#4CAF50] group-hover:text-white transition-colors">
              <Milk className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h5 className="font-extrabold text-sm text-[#1F2937] dark:text-white">Milk & Newspaper Hub</h5>
              <p className="text-xs text-[#4B5563] dark:text-slate-400 leading-snug">Manage morning/evening milk quantities and newspaper deliveries.</p>
              <span className="text-[11px] font-bold text-[#2E7D32] dark:text-emerald-400 flex items-center pt-1">
                Manage Deliveries &rarr;
              </span>
            </div>
          </div>

          {/* Tile 3: Automate Utility Billing */}
          <div 
            onClick={() => onNavigate('billing')}
            className="bg-white dark:bg-slate-900 hover:border-[#FFC107] dark:hover:border-amber-500 border border-[#E5E7EB] dark:border-slate-800 p-5 rounded-2xl flex items-start space-x-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
          >
            <div className="p-3 bg-[#FFF9C4] dark:bg-amber-950/60 text-[#8D6E00] dark:text-amber-400 rounded-xl group-hover:bg-[#FFC107] group-hover:text-[#1F2937] transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h5 className="font-extrabold text-sm text-[#1F2937] dark:text-white">Utility Billing Terminal</h5>
              <p className="text-xs text-[#4B5563] dark:text-slate-400 leading-snug">Generate aggregated monthly invoices with GST & automated breakdowns.</p>
              <span className="text-[11px] font-bold text-[#2E7D32] dark:text-emerald-400 flex items-center pt-1">
                Generate Invoices &rarr;
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
