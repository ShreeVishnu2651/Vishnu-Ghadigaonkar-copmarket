/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  CreditCard, 
  DollarSign, 
  Barcode, 
  User, 
  Building2, 
  Printer, 
  Smartphone, 
  CheckCircle2, 
  RotateCcw,
  RefreshCw,
  Tag
} from 'lucide-react';
import { Product, Member } from '../types';
import { getProductImage } from '../utils/productImages';

interface POSBillingProps {
  products: Product[];
  members: Member[];
  onRecordPayment: (data: {
    memberId: string;
    memberName?: string;
    flatNo?: string;
    amount: number;
    paymentMethod: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet';
    items: Array<{ id: string; selectQty: number }>;
  }) => Promise<any>;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSBilling({ products, members, onRecordPayment }: POSBillingProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchSKU, setSearchSKU] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Custom input for simulating a laser barcode scan gun
  // Customer selection
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    const active = members.find(m => m.status === 'Active');
    return active ? active.id : (members[0]?.id || '');
  });
  const [isVisitor, setIsVisitor] = useState(false);
  const [customGuestName, setCustomGuestName] = useState('');
  const [customGuestPhone, setCustomGuestPhone] = useState('');
  const [discountVal, setDiscountVal] = useState(50); // initial voucher

  // Synchronize selected member when members update
  useEffect(() => {
    if (members && members.length > 0) {
      const activeMembers = members.filter(m => m.status === 'Active');
      if (activeMembers.length > 0) {
        if (!selectedMemberId || !activeMembers.some(m => m.id === selectedMemberId)) {
          setSelectedMemberId(activeMembers[0].id);
        }
      } else if (!selectedMemberId || !members.some(m => m.id === selectedMemberId)) {
        setSelectedMemberId(members[0].id);
      }
    }
  }, [members, selectedMemberId]);

  // Payment states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet'>('UPI');
  const [showQRModal, setShowQRModal] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  
  // Receipts thermal printer simulation
  const [receiptLog, setReceiptLog] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('coopmart_pos_last_receipt');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isReceiptPrinting, setIsReceiptPrinting] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll thermal receipt into view on checkout
  useEffect(() => {
    if (receiptLog && receiptRef.current) {
      setTimeout(() => {
        receiptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [receiptLog]);

  const categories = ['All', 'Fresh Dairy', 'Grains & Flours', 'Oils & Spices', 'Snacks & Packed Food', 'Household Care'];

  // Click-to-add shelf item
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert(`"${product.productName}" is out of stock in supermarket inventory.`);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx !== -1) {
        const currentInCart = prev[idx].quantity;
        if (currentInCart >= product.quantity) {
          alert(`Warning: Only ${product.quantity} units are available in current stock shelves.`);
          return prev;
        }
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          // Check stock ceilings
          if (newQty > item.product.quantity) {
            alert(`Stock limit reached! Max ${item.product.quantity} items available on shelves.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Financial calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const gstAmount = Math.round(subtotal * 0.05); // 5% GST
  const netTotal = Math.max(0, subtotal + gstAmount - (subtotal > 200 ? discountVal : 0));

  // Confirm checkouts
  const handleCheckoutSubmit = async (customMethod?: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet') => {
    const chosenMethod = (customMethod && typeof customMethod === 'string') ? customMethod : paymentChoice;
    setPaymentChoice(chosenMethod);

    if (cart.length === 0) {
      if (customMethod) return;
      alert("Your supermarket billing cart is currently empty. Click products from shelves to add them to your cart.");
      return;
    }

    // If UPI is chosen and not explicitly confirmed via modal yet, show the GPay QR Code popup!
    if (chosenMethod === 'UPI' && !showQRModal) {
      setShowQRModal(true);
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    let checkoutMemberId = 'Visitor';
    let checkoutMemberName = 'Walk-in Guest';
    let checkoutFlatNo = 'N/A';

    if (isVisitor) {
      checkoutMemberId = 'Visitor';
      checkoutMemberName = customGuestName.trim() || 'Walk-in Guest';
      checkoutFlatNo = customGuestPhone.trim() || 'N/A';
    } else {
      const activeList = members.filter(m => m.status === 'Active');
      const targetMember = members.find(m => m.id === selectedMemberId) 
        || activeList[0] 
        || members[0];

      if (targetMember) {
        checkoutMemberId = targetMember.id;
        checkoutMemberName = targetMember.name;
        checkoutFlatNo = targetMember.flatNo;
      }
    }

    // Setup Receipt parameters immediately from active cart
    const newReceiptNo = "RCP" + Math.floor(100000 + Math.random() * 900000);
    const receiptData = {
      receiptNo: newReceiptNo,
      date: new Date().toLocaleString(),
      memberName: checkoutMemberName,
      flatNo: checkoutFlatNo,
      subtotal,
      gst: gstAmount,
      discount: subtotal > 200 ? discountVal : 0,
      netTotal,
      paymentMethod: chosenMethod,
      cashier: "Desk Terminal 1A",
      items: [...cart]
    };

    // Immediately display receipt and trigger printing animation
    setReceiptNumber(newReceiptNo);
    setReceiptLog(receiptData);
    try {
      localStorage.setItem('coopmart_pos_last_receipt', JSON.stringify(receiptData));
    } catch (e) {
      console.warn("Could not cache receipt to localStorage:", e);
    }
    setIsPaymentConfirmed(true);
    triggerThermalPrinter();

    // Record payment asynchronously (Firestore / Local API with robust fallback)
    try {
      await onRecordPayment({
        memberId: checkoutMemberId,
        memberName: checkoutMemberName,
        flatNo: checkoutFlatNo,
        amount: netTotal,
        paymentMethod: chosenMethod,
        items: cart.map(item => ({ id: item.product.id, selectQty: item.quantity }))
      });
    } catch (err) {
      console.warn("Payment recording note:", err);
    }

    setIsProcessing(false);
    // Clear local checkout basket
    setCart([]);
  };

  // Scroll animated Thermal Receipt simulation
  const triggerThermalPrinter = () => {
    setIsReceiptPrinting(true);
    setTimeout(() => {
      setIsReceiptPrinting(false);
    }, 2000);
  };

  // Physically trigger native print of receipt
  const handlePrintReceipt = () => {
    if (!receiptLog) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const itemsHtml = receiptLog.items.map((item: any) => `
      <tr style="border-bottom: 1px dashed #ddd;">
        <td style="padding: 6px 0; text-align: left; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.product.productName}</td>
        <td style="padding: 6px 0; text-align: right; font-weight: bold;">${item.quantity}x ₹${item.product.price} = ₹${item.quantity * item.product.price}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>CoopMart Receipt - ${receiptLog.receiptNo}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 280px;
              margin: 10px auto;
              font-size: 11px;
              line-height: 1.4;
              color: #000;
              background-color: #fff;
              padding: 10px;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .justify-between { display: flex; justify-content: space-between; }
            .border-top-dashed { border-top: 1px dashed #000; margin: 8px 0; padding-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin: 8px 0; }
            .title { font-size: 14px; font-weight: 900; letter-spacing: -0.5px; }
            .sub-title { font-size: 10px; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <span class="title">COOPMART TERM</span><br/>
            <span class="sub-title">MUNICIPAL COOP SOCIETY BILLING</span>
          </div>
          
          <div class="border-top-dashed">
            <div>RC NO: ${receiptLog.receiptNo}</div>
            <div>DATE: ${receiptLog.date}</div>
            <div>CUST: ${receiptLog.memberName}</div>
            ${receiptLog.flatNo !== 'N/A' ? `<div>FLAT: ${receiptLog.flatNo}</div>` : ''}
            <div>TERM: ${receiptLog.cashier}</div>
          </div>
          
          <div class="border-top-dashed">
            <table style="width: 100%;">
              <thead>
                <tr style="border-bottom: 1px dashed #000;">
                  <th style="text-align: left; padding-bottom: 4px;">Item Description</th>
                  <th style="text-align: right; padding-bottom: 4px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          
          <div class="border-top-dashed font-bold">
            <div class="justify-between">
              <span>GST (5.0%)</span>
              <span>₹${receiptLog.gst}</span>
            </div>
            ${receiptLog.discount > 0 ? `
            <div class="justify-between" style="color: #000;">
              <span>VCH DISCOUNT</span>
              <span>-₹${receiptLog.discount}</span>
            </div>
            ` : ''}
            <div class="justify-between" style="font-size: 13px; font-weight: bold; margin-top: 4px; border-top: 1px dashed #000; padding-top: 4px;">
              <span>NET CHARGES</span>
              <span>₹${receiptLog.netTotal}</span>
            </div>
          </div>
          
          <div class="border-top-dashed text-center font-bold" style="margin-top: 12px; font-size: 10px;">
            <div>PAID VIA ${receiptLog.paymentMethod.toUpperCase()} • SUCCESS</div>
            <div style="font-size: 8px; font-weight: normal; margin-top: 4px; color: #555;">THANK YOU FOR YOUR PATRONAGE!</div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const activeMembersOnly = members.filter(m => m.status === 'Active');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(searchSKU.toLowerCase()) || p.id.toLowerCase().includes(searchSKU.toLowerCase());
    if (categoryFilter === 'All') return matchesSearch;
    return matchesSearch && p.category === categoryFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative text-[#1F2937] dark:text-slate-100">
      
      {/* LEFT COLUMN: Shelf catalog items array */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 flex flex-col space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-slate-800 pb-2">
            <h3 className="font-extrabold text-[#1F2937] dark:text-white tracking-tight text-xs uppercase font-mono">Store Shelf Selection</h3>
            <span className="text-[10px] bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-[#C8E6C9] dark:border-emerald-800">POS mode</span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#4B5563] dark:text-slate-400" />
            <input
              id="pos-sku-search"
              type="text"
              placeholder="Filter shelves..."
              value={searchSKU}
              onChange={(e) => setSearchSKU(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#2E7D32] focus:outline-none bg-[#F8FAF8] dark:bg-slate-800 text-[#1F2937] dark:text-white"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                id={`pos-tab-${cat.replace(/\s+/g, '-')}`}
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[10px] whitespace-nowrap px-3 py-1.5 rounded-full font-bold border transition-colors cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-xs' 
                    : 'bg-[#F8FAF8] dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#4B5563] dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Small thumbnail listing scroll shelf */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 p-3 overflow-y-auto max-h-[460px] space-y-2 shadow-xs">
          {filteredProducts.map((p) => {
            const outOfStock = p.quantity <= 0;
            return (
              <div 
                key={p.id} 
                onClick={() => !outOfStock && addToCart(p)}
                className={`flex gap-3 items-center p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                  outOfStock 
                    ? 'border-[#E5E7EB] dark:border-slate-800 opacity-50 bg-[#F8FAF8] dark:bg-slate-800/40' 
                    : 'border-[#E5E7EB] dark:border-slate-800 hover:border-[#4CAF50] dark:hover:border-emerald-600 hover:bg-[#E8F5E9]/30 dark:hover:bg-slate-800 text-[#1F2937] dark:text-white bg-white dark:bg-slate-900'
                }`}
              >
                <img 
                  referrerPolicy="no-referrer"
                  src={getProductImage(p)} 
                  alt={p.productName} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80';
                  }}
                  className="w-11 h-11 rounded-lg object-cover shrink-0 border border-[#E5E7EB] dark:border-slate-700 shadow-xs" 
                />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-[#1F2937] dark:text-white text-[11px] block truncate">{p.productName}</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-black text-[#2E7D32] dark:text-emerald-400 font-mono text-xs">₹{p.price}</span>
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${p.quantity <= 10 ? 'bg-[#FFF9C4] dark:bg-amber-950/60 text-[#8D6E00] dark:text-amber-400' : 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2E7D32] dark:text-emerald-400'}`}>
                      Qty: {p.quantity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="text-center text-[#4B5563] dark:text-slate-400 py-10 font-mono text-[11px]">No grocery SKUs aligned.</div>
          )}
        </div>
      </div>

      {/* MIDDLE COLUMN: Shopping Basket items */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        
        {/* Active Cashier Guidance Panel */}
        <div className="bg-[#2E7D32] text-white p-4 rounded-2xl border border-[#1B5E20] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#FFC107] font-mono tracking-widest flex items-center">
              <ShoppingBag className="w-4 h-4 mr-1 animate-pulse" />
              <span>COOPMART ACTIVE TERMINAL</span>
            </span>
            <span className="text-[9px] font-mono bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Counter 1</span>
          </div>
          <h4 className="text-xs font-black tracking-tight text-white">Click Shelf Products to Add Instantly</h4>
          <p className="text-[11px] text-[#E8F5E9] mt-1 leading-relaxed">
            Filter products by category on the left, then click any item to add to basket.
          </p>
        </div>

        {/* Dynamic Pos Registers shopping Basket */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 p-4 shadow-xs flex-1 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#2E7D32] dark:text-emerald-400" />
                <h3 className="font-extrabold text-[#1F2937] dark:text-white text-sm tracking-tight">Supermarket Basket</h3>
              </div>
              <button 
                id="pos-clear-cart"
                onClick={clearCart} 
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 font-bold flex items-center text-[10px] uppercase font-mono cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-0.5" />
                <span>Empty Drawer</span>
              </button>
            </div>

            {/* Scrolling Basket list */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center p-2.5 rounded-xl bg-[#F8FAF8] dark:bg-slate-800/70 border border-[#E5E7EB] dark:border-slate-700 text-xs font-medium">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-bold text-[#1F2937] dark:text-white block truncate">{item.product.productName}</span>
                    <span className="text-[10px] text-[#4B5563] dark:text-slate-400 font-mono">₹{item.product.price} / unit</span>
                  </div>
                  
                  {/* Inline plus-minus counter updates */}
                  <div className="flex items-center space-x-2">
                    <button
                      id={`cart-qty-minus-${item.product.id}`}
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="p-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded border border-[#E5E7EB] dark:border-slate-600 cursor-pointer"
                    >
                      <Minus className="w-3 h-3 text-[#1F2937] dark:text-white" />
                    </button>
                    <span className="font-mono text-xs font-black text-[#1F2937] dark:text-white px-2.5 bg-white dark:bg-slate-700 border border-[#E5E7EB] dark:border-slate-600 rounded py-0.5">
                      {item.quantity}
                    </span>
                    <button
                      id={`cart-qty-plus-${item.product.id}`}
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="p-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded border border-[#E5E7EB] dark:border-slate-600 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#1F2937] dark:text-white" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[60px] pl-3">
                    <span className="font-black text-[#1F2937] dark:text-white font-mono">₹{item.product.price * item.quantity}</span>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-20 text-center text-[#4B5563] dark:text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <ShoppingBag className="w-10 h-10 text-[#4CAF50] animate-bounce" />
                  <p className="text-xs font-bold font-mono">Ready to scan. Cart empty.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sub Totals calculations box */}
          {cart.length > 0 && (
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-slate-800 font-medium text-[#4B5563] dark:text-slate-400 text-xs space-y-2 mt-4 font-mono">
              <div className="flex justify-between">
                <span>Subtotal Items Basket</span>
                <span className="font-bold text-[#1F2937] dark:text-white font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#8D6E00] dark:text-amber-400 bg-[#FFF9C4] dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-[#FFE082] dark:border-amber-800/60">
                <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> Dynamic Store Voucher</span>
                <span className="font-bold font-mono">-₹{subtotal > 200 ? discountVal : 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Supermarket GST (5% Slabs)</span>
                <span className="font-bold text-[#1F2937] dark:text-white font-mono">₹{gstAmount}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-[#E5E7EB] dark:border-slate-700 pt-2 text-base font-black text-[#1F2937] dark:text-white font-sans">
                <span>Total Bill Amount</span>
                <span className="text-lg text-[#2E7D32] dark:text-emerald-400 font-mono font-black">₹{netTotal}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: checkout parameters */}
      <div className="lg:col-span-3 flex flex-col space-y-4">
        
        {/* Customer mapping profile */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-slate-800 pb-2">
            <h4 className="font-extrabold text-[#1F2937] dark:text-white text-xs uppercase font-mono flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Customer Identification</span>
            </h4>
            <span className="text-[10px] font-mono text-[#2E7D32] bg-[#E8F5E9] dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold border border-[#C8E6C9] dark:border-emerald-800">
              {isVisitor ? 'Walk-in' : 'Resident'}
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              id="radio-visitor"
              type="checkbox"
              checked={isVisitor}
              onChange={(e) => setIsVisitor(e.target.checked)}
              className="h-4 w-4 text-[#2E7D32] focus:ring-[#2E7D32] border-[#E5E7EB] dark:border-slate-700 rounded bg-white dark:bg-slate-800 cursor-pointer"
            />
            <label htmlFor="radio-visitor" className="text-xs font-bold text-[#1F2937] dark:text-slate-200 cursor-pointer">
              General Walk-in / Guest Customer
            </label>
          </div>

          {!isVisitor ? (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 uppercase font-mono block">
                Assign Flat Resident
              </label>
              <select
                id="pos-select-customer"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full p-2.5 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2E7D32] focus:outline-none bg-[#F8FAF8] dark:bg-slate-800 text-[#1F2937] dark:text-white cursor-pointer"
              >
                {activeMembersOnly.length > 0 ? (
                  activeMembersOnly.map(m => (
                    <option key={m.id} value={m.id}>{m.flatNo} - {m.name} ({m.phone})</option>
                  ))
                ) : (
                  members.map(m => (
                    <option key={m.id} value={m.id}>{m.flatNo} - {m.name}</option>
                  ))
                )}
              </select>

              {/* Selected Resident Profile Pill */}
              {(() => {
                const target = members.find(m => m.id === selectedMemberId);
                if (!target) return null;
                return (
                  <div className="p-2.5 bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/80 rounded-xl text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center font-bold text-[#1F2937] dark:text-white">
                      <span>{target.name}</span>
                      <span className="font-mono bg-[#2E7D32] text-white px-1.5 py-0.5 rounded text-[10px]">{target.flatNo}</span>
                    </div>
                    <div className="text-[10px] text-[#4B5563] dark:text-slate-300 font-mono">
                      ID: {target.id} • {target.phone || 'No phone recorded'}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 uppercase font-mono block mb-1">
                  Customer / Guest Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma or Walk-in Guest"
                  value={customGuestName}
                  onChange={(e) => setCustomGuestName(e.target.value)}
                  className="w-full p-2 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2E7D32] focus:outline-none bg-[#F8FAF8] dark:bg-slate-800 text-[#1F2937] dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 uppercase font-mono block mb-1">
                  Phone Number / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={customGuestPhone}
                  onChange={(e) => setCustomGuestPhone(e.target.value)}
                  className="w-full p-2 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#2E7D32] focus:outline-none bg-[#F8FAF8] dark:bg-slate-800 text-[#1F2937] dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Payment instrument selector */}
          <div className="space-y-2 mt-4 pt-4 border-t border-[#E5E7EB] dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#4B5563] dark:text-slate-400 uppercase font-mono block">
                Payment Method {cart.length > 0 && <span className="text-[#2E7D32] dark:text-emerald-400 font-bold ml-1 animate-pulse">(Select)</span>}
              </label>
              <span className="text-[9px] font-mono font-bold text-[#2E7D32] dark:text-emerald-400 bg-[#E8F5E9] dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-[#C8E6C9] dark:border-emerald-800">
                {paymentChoice}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['UPI', 'Cash'] as const).map((method) => (
                <button
                  id={`payment-btn-${method.replace(/\s+/g, '')}`}
                  key={method}
                  type="button"
                  onClick={() => handleCheckoutSubmit(method)}
                  className={`text-xs py-2.5 px-2 rounded-xl font-bold border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                    paymentChoice === method 
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32] font-extrabold shadow-xs ring-2 ring-[#FFC107]/60' 
                      : 'bg-[#F8FAF8] dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#4B5563] dark:text-slate-300'
                  }`}
                >
                  {method === 'UPI' ? <Smartphone className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                  <span>{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Checkout triggers */}
          <button
            id="pos-checkout-btn"
            onClick={() => handleCheckoutSubmit()}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-3.5 rounded-xl font-bold text-xs text-white transition-all shadow-xs cursor-pointer ${
              cart.length === 0 
                ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-slate-400' 
                : 'bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-[0.99]'
            }`}
          >
            {isProcessing ? '🔄 Authorizing...' : `PAY & PRINT RECEIPT (${paymentChoice.toUpperCase()} - ₹${netTotal})`}
          </button>
        </div>

        {/* Thermal Receipt Printer machine */}
        <div className="bg-[#1F2937] p-4 rounded-2xl border border-slate-700 relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[9px] mb-3">
            <span className="font-bold text-slate-300">THERMAL REGISTER TX-80</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[8px] text-slate-400">
                {isReceiptPrinting ? 'PRINTING...' : (receiptLog ? 'READY' : 'STANDBY')}
              </span>
              <span className={`w-2 h-2 rounded-full transition-all ${
                isReceiptPrinting 
                  ? 'bg-[#FFC107] animate-ping' 
                  : (receiptLog ? 'bg-[#4CAF50]' : 'bg-slate-600')
              }`}></span>
            </div>
          </div>

          {/* Paper feed roll slot */}
          <div className="bg-slate-950 h-2 border-b-2 border-dashed border-slate-700 rounded-xs relative z-20"></div>

          {/* Scrolling thermal papers container */}
          <div className="bg-white border border-slate-200 p-3.5 font-mono text-[10px] leading-tight text-[#1F2937] relative shadow-inner overflow-hidden transition-all duration-500 max-h-[340px] overflow-y-auto mt-2 select-text rounded-b-xl">
            {receiptLog ? (
              <div ref={receiptRef} className="space-y-2 whitespace-pre-wrap">
                <div className="text-center font-bold">
                  <span className="text-xs uppercase font-black block">COOPMART SOCIETY</span>
                  <span className="text-[9px] text-[#4B5563]">RECEIPT & INVOICE</span>
                  <p className="border-t border-dashed border-slate-300 my-1"></p>
                </div>

                <div className="space-y-0.5 text-[9px] text-[#4B5563]">
                  <div>RC NO: <span className="font-bold text-[#1F2937]">{receiptLog.receiptNo}</span></div>
                  <div>DATE: {receiptLog.date}</div>
                  <div>CUST: <span className="font-semibold text-[#1F2937]">{receiptLog.memberName}</span></div>
                  {receiptLog.flatNo !== 'N/A' && <div>FLAT: {receiptLog.flatNo}</div>}
                  <div>TERM: {receiptLog.cashier}</div>
                </div>

                <div className="border-t border-dashed border-slate-300 my-1 pt-1">
                  {receiptLog.items.map((item: CartItem, index: number) => (
                    <div key={index} className="flex justify-between py-0.5 text-[9px]">
                      <span className="truncate max-w-[120px] font-medium">{item.product.productName}</span>
                      <span className="font-mono">{item.quantity}x ₹{item.product.price} = ₹{item.quantity * item.product.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-300 pt-1 space-y-0.5 font-bold text-[9px]">
                  <div className="flex justify-between text-[#4B5563]">
                    <span>GST (5.0%)</span>
                    <span>₹{receiptLog.gst}</span>
                  </div>
                  {receiptLog.discount > 0 && (
                    <div className="flex justify-between text-[#2E7D32]">
                      <span>VOUCHER DISCOUNT</span>
                      <span>-₹{receiptLog.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#2E7D32] text-xs font-black pt-0.5 border-t border-dashed border-slate-300">
                    <span>NET CHARGES</span>
                    <span>₹{receiptLog.netTotal}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 text-center pt-2 font-bold space-y-0.5">
                  <div className="text-[#2E7D32] text-[10px]">PAID VIA {receiptLog.paymentMethod.toUpperCase()} • SUCCESS</div>
                  <div className="text-[8px] text-[#4B5563]">THANK YOU FOR YOUR PATRONAGE!</div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-[#4B5563] font-sans italic text-[10px] space-y-1.5">
                <Printer className="w-8 h-8 mx-auto stroke-1 text-[#4CAF50] animate-pulse" />
                <p className="font-medium">Waiting for transaction checkout.</p>
                <p className="text-[9px] text-[#4B5563] not-italic">Add items to cart and click Pay to generate & print receipt.</p>
              </div>
            )}
          </div>

          {receiptLog && (
            <div className="space-y-1.5 mt-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="receipt-reprint"
                  onClick={triggerThermalPrinter}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-mono text-[9px] font-bold py-2 px-2 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>RE-FEED PAPER</span>
                </button>
                <button
                  id="receipt-print"
                  onClick={handlePrintReceipt}
                  className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-mono text-[9px] font-bold py-2 px-2 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PRINT RECEIPT</span>
                </button>
              </div>
              <button
                id="receipt-new-transaction"
                onClick={() => {
                  setReceiptLog(null);
                  setIsVisitor(false);
                  setCustomGuestName('');
                  setCustomGuestPhone('');
                  try {
                    localStorage.removeItem('coopmart_pos_last_receipt');
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="w-full text-slate-400 hover:text-slate-200 text-[9px] font-mono text-center py-1 hover:underline cursor-pointer"
              >
                Clear Register / New Transaction
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Google Pay UPI QR Code Scanner Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#2E7D32]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Google Pay UPI Scanner</h3>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">CoopMart Society Store Register</div>
              <div className="text-2xl font-black text-[#2E7D32] dark:text-emerald-400">₹{netTotal}</div>
              <div className="text-[10px] text-slate-500 font-mono">Scan QR using GPay, PhonePe, or Paytm</div>
            </div>

            {/* QR Code Display matching user upload */}
            <div className="relative mx-auto w-52 h-52 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src="/images/gpay.jpg.png"
                alt="Google Pay UPI QR Code"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  console.error("Failed to load user QR image");
                }}
              />
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              UPI ID: <span className="font-bold text-slate-700 dark:text-slate-200">coopmart.society@okaxis</span>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQRModal(false);
                  handleCheckoutSubmit('UPI');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                ✓ Confirm Payment & Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
