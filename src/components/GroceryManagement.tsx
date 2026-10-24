/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  X, 
  Archive, 
  Barcode, 
  DollarSign, 
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Warehouse
} from 'lucide-react';
import { Product } from '../types';
import { getProductImage } from '../utils/productImages';

interface GroceryManagementProps {
  products: Product[];
  onAdd: (product: Omit<Product, 'id'>) => void;
  onEdit: (id: string, product: Partial<Product>) => void;
  onDelete: (id: string) => void;
}

export default function GroceryManagement({ 
  products, 
  onAdd, 
  onEdit, 
  onDelete 
}: GroceryManagementProps) {

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Fresh Dairy');
  const [price, setPrice] = useState(50);
  const [quantity, setQuantity] = useState(100);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [supplierName, setSupplierName] = useState('CoopMart Wholesaler');

  // Categories list
  const categories = ['All', 'Fresh Dairy', 'Grains & Flours', 'Oils & Spices', 'Snacks & Packed Food', 'Household Care'];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName) {
      alert('Please enter product name');
      return;
    }
    
    // Fallback placeholder image depending on category
    let imageUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80";
    if (category === 'Fresh Dairy') {
      imageUrl = "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=80";
    } else if (category === 'Grains & Flours') {
      imageUrl = "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=150&auto=format&fit=crop&q=80";
    } else if (category === 'Oils & Spices') {
      imageUrl = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80";
    }

    // Auto-generate barcode ID under-the-hood for compatibility
    const generatedBarcode = "890" + Math.floor(1000000000 + Math.random() * 9000000000);

    onAdd({
      productName,
      category,
      price: Number(price),
      quantity: Number(quantity),
      barcode: generatedBarcode,
      expiryDate,
      supplierName,
      imageUrl
    });
    
    setIsAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onEdit(editingProduct.id, {
      productName,
      category,
      price: Number(price),
      quantity: Number(quantity),
      expiryDate,
      supplierName
    });
    setEditingProduct(null);
    resetForm();
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setProductName(p.productName);
    setCategory(p.category);
    setPrice(p.price);
    setQuantity(p.quantity);
    setExpiryDate(p.expiryDate);
    setSupplierName(p.supplierName);
  };

  const resetForm = () => {
    setProductName('');
    setCategory('Fresh Dairy');
    setPrice(50);
    setQuantity(100);
    setExpiryDate('2026-12-31');
    setSupplierName('CoopMart Wholesaler');
  };

  // Inline stock adjustment triggers
  const adjustStock = (id: string, delta: number, currentQty: number) => {
    const newQty = Math.max(0, currentQty + delta);
    onEdit(id, { quantity: newQty });
  };

  const filtered = products.filter(p => {
    const matchesSearch = 
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    if (filterCategory === 'All') return matchesSearch;
    return matchesSearch && p.category === filterCategory;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header section with add action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#3F6212] tracking-tight">Grocery Store Inventory</h2>
          <p className="text-xs text-[#3F6212]">Track and manage CoopMart supermarket inventory stock, category cataloging, and unit pricing shelves.</p>
        </div>
        <button
          id="add-item-trigger"
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-100 dark:shadow-none cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Stock SKU</span>
        </button>
      </div>

      {/* Categories Horizontal filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            id={`filter-cat-${cat.replace(/\s+/g, '-')}`}
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap border cursor-pointer ${
              filterCategory === cat 
                ? 'bg-slate-900 dark:bg-emerald-600 border-slate-900 dark:border-emerald-600 text-white' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-202 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inner control action filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="product-search-input"
            type="text"
            placeholder="Search products by brand, category, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-202 dark:border-slate-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100"
          />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filtered.length} SKUs</span> in stock
        </div>
      </div>

      {/* Main product listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((product) => {
          const isLowStock = product.quantity <= 10;
          return (
            <div 
              key={product.id} 
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                isLowStock 
                  ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/20' 
                  : 'border-slate-100 dark:border-slate-800/80 hover:shadow-md dark:hover:bg-slate-850/10'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-0.5">
                      {product.category}
                    </span>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-tight line-clamp-2">
                      {product.productName}
                    </h4>
                  </div>
                  <img 
                    referrerPolicy="no-referrer" 
                    src={getProductImage(product)} 
                    alt={product.productName} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80';
                    }}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-100 dark:border-slate-800 shadow-xs" 
                  />
                </div>

                {/* Sub features info */}
                <div className="space-y-2 mt-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="flex items-center text-slate-400 dark:text-slate-500"><Layers className="w-3 h-3 mr-1" /> SKU Stock ID</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{product.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center"><DollarSign className="w-3 h-3 mr-0.5" /> Retail Price</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">₹{product.price}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center"><Calendar className="w-3.5 h-3.5 mr-0.5" /> Max Expiry</span>
                    <span className="font-mono text-slate-650 dark:text-slate-400">{product.expiryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Supplier</span>
                    <span className="truncate max-w-[120px] text-slate-600 dark:text-slate-300">{product.supplierName}</span>
                  </div>
                </div>
              </div>

              {/* Stock controllers */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-3">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-xl">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-mono">Inventory Qty</span>
                    <span className={`font-mono text-sm font-black ${isLowStock ? 'text-amber-600 dark:text-amber-405' : 'text-slate-800 dark:text-slate-200'}`}>
                      {product.quantity} units
                    </span>
                  </div>
                  
                  {/* Stock updater increment adjustments */}
                  <div className="flex items-center space-x-1">
                    <button
                      id={`adjust-minus-${product.id}`}
                      onClick={() => adjustStock(product.id, -5, product.quantity)}
                      className="text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                      title="Deduct 5 items"
                    >
                      -5
                    </button>
                    <button
                      id={`adjust-plus-${product.id}`}
                      onClick={() => adjustStock(product.id, 10, product.quantity)}
                      className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg border border-emerald-700 cursor-pointer"
                      title="Add 10 items"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Warning and standard edit actions */}
                <div className="flex justify-between items-center gap-2">
                  {isLowStock ? (
                    <div className="flex items-center text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      <span>Low Stock Alert</span>
                    </div>
                  ) : (
                    <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center">
                      <Warehouse className="w-3.5 h-3.5 mr-1" />
                      <span>Stock Secure</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5">
                    <button
                      id={`edit-sku-${product.id}`}
                      onClick={() => startEdit(product)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Product Info"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-sku-${product.id}`}
                      onClick={() => {
                        if (confirm(`Remove product SKU ${product.productName} from supermarket shelves?`)) {
                          onDelete(product.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-100 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Remove SLA SKU"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Archive className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No products found holding criteria.</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Create custom grocery listings to build database shelves.</p>
          </div>
        )}
      </div>

      {/* Add SKU dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <button 
              id="close-add-sku-modal"
              onClick={() => setIsAddOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
              <span>Register Cooperative Stock Item</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Register new commodities to allow cashiers to query and scan items at checkout registers.</p>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Product Name *</label>
                <input
                  id="add-sku-name"
                  type="text"
                  required
                  placeholder="e.g. Britannia Cheese Slices (200g)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Product Category</label>
                  <select
                    id="add-sku-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">SKU Stock ID</label>
                  <input
                    type="text"
                    disabled
                    value="Auto-generated on save"
                    className="w-full p-2 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 rounded-lg text-xs font-mono font-medium focus:outline-none select-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Price per unit (₹) *</label>
                  <input
                    id="add-sku-price"
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Initial Stock Level *</label>
                  <input
                    id="add-sku-qty"
                    type="number"
                    required
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                  <input
                    id="add-sku-expiry"
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Merchant / Supplier Name</label>
                  <input
                    id="add-sku-supplier"
                    type="text"
                    required
                    placeholder="Amul Wholesaler Ltd"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  id="add-sku-cancel"
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="add-sku-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Save Stock SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit SKU dialog */}
      {editingProduct && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <button 
              id="close-edit-sku-modal"
              onClick={() => setEditingProduct(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
              <Edit className="h-5 w-5 text-indigo-600" />
              <span>Update Stock SKU Details</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Refine parameters, barcodes or prices for {editingProduct.productName}.</p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Product Name</label>
                <input
                  id="edit-sku-name"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Product Category</label>
                  <select
                    id="edit-sku-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">SKU Database ID</label>
                  <input
                    type="text"
                    disabled
                    value={editingProduct?.id || ''}
                    className="w-full p-2 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 rounded-lg text-xs font-mono font-medium focus:outline-none select-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Price per unit (₹)</label>
                  <input
                    id="edit-sku-price"
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Quantity in Stock</label>
                  <input
                    id="edit-sku-qty"
                    type="number"
                    required
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                  <input
                    id="edit-sku-expiry"
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Merchant / Supplier Name</label>
                  <input
                    id="edit-sku-supplier"
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  id="edit-sku-cancel"
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="edit-sku-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
