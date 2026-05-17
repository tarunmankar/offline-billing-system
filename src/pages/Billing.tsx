import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';
import { generateReceiptHtml } from '../utils/printTemplates';

// Helper function to dynamically highlight matching search query substrings case-insensitively
const renderHighlightedText = (text: string, query: string) => {
  if (!query.trim()) return <span>{text}</span>;
  
  // Escape special regex characters to prevent runtime pattern compile crashes
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <span key={index} className="text-[#3b82f6] font-extrabold underline decoration-[#3b82f6]/40 bg-blue-500/10 px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default function Billing() {
  const { config } = useConfig();
  const { user } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dynamic type-ahead suggestions states
  const [productsList, setProductsList] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus barcode input on mount and after actions
  useEffect(() => {
    barcodeRef.current?.focus();
  }, [cart, isProcessing]);

  // Load all products on mount to enable ultra-fast client-side dynamic search
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const list = await (window as any).electronAPI.getProducts();
        setProductsList(list || []);
      } catch (err) {
        console.error('Failed to pre-fetch products list:', err);
      }
    };
    loadProducts();
  }, [cart]); // Reload inventory list whenever cart changes or checkouts occur to get fresh stocks

  // Global hotkeys (F12 for checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Click outside suggestions list to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products list based on query with high-accuracy search relevance sorting
  const handleInputChange = (val: string) => {
    setBarcodeInput(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    const query = val.toLowerCase().trim();
    
    // 1. Filter items that contain the search query
    const matched = productsList.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.barcode.toLowerCase().includes(query)
    );

    // 2. Score and Sort by relevance (Exact prefixes first, then word starts, then middle substrings)
    const sorted = matched.map(p => {
      const nameLower = p.name.toLowerCase();
      const barcodeLower = p.barcode.toLowerCase();
      
      let score = 0;
      
      // Exact starts-with match (Highest priority)
      if (nameLower.startsWith(query) || barcodeLower.startsWith(query)) {
        score = 3;
      } 
      // Match starts at the beginning of any individual word (e.g. "Chew" in "Vitamin C Chewables")
      else if (nameLower.split(/\s+/).some(word => word.startsWith(query))) {
        score = 2;
      } 
      // Substring matches in the middle of a word (e.g. "amo" in "Paracetamol") - Lowest priority
      else {
        score = 1;
      }

      return { ...p, score };
    }).sort((a, b) => {
      // Sort by score descending (highest priority matches at the top)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Secondary sort alphabetically if scores are identical
      return a.name.localeCompare(b.name);
    });

    // Limit to top 5 matching items for crisp, clean UI dropdown styling
    setSuggestions(sorted.slice(0, 5));
    setActiveSuggestionIndex(0);
  };

  // Keyboard navigation for suggestions dropdown list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = suggestions[activeSuggestionIndex];
      if (selected) {
        addToCart(selected);
        setBarcodeInput('');
        setSuggestions([]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  // Standard barcode submit for rapid direct scanner trigger
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // If there is an active suggestion selected, add that first!
    if (suggestions.length > 0) {
      const selected = suggestions[activeSuggestionIndex];
      if (selected) {
        addToCart(selected);
        setBarcodeInput('');
        setSuggestions([]);
        return;
      }
    }
    
    try {
      const product = await (window as any).electronAPI.getProductByBarcode(barcodeInput.trim());
      if (product) {
        addToCart(product);
      } else {
        alert('Product not found!');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching product. Is the database connected?');
    }
    setBarcodeInput('');
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      const taxPercent = config?.billing_settings?.default_tax_percent || 18;
      return [...prev, { ...product, quantity: 1, rate: product.price, taxPercent }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    let taxableAmount = 0;
    let taxTotal = 0;

    cart.forEach(item => {
      const lineTotal = item.quantity * item.rate;
      const lineTax = (lineTotal * item.taxPercent) / 100;
      taxableAmount += lineTotal;
      taxTotal += lineTax;
    });

    const grandTotal = taxableAmount + taxTotal;
    const taxLabel = config?.shop_info?.tax_label || 'GST';
    let taxDetails: any = {};
    if (taxLabel === 'GST') {
       taxDetails = {
         'CGST': taxTotal / 2,
         'SGST': taxTotal / 2
       };
    } else {
       taxDetails = { [taxLabel]: taxTotal };
    }

    return { taxableAmount, taxTotal, grandTotal, taxDetails };
  };

  const totals = calculateTotals();

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      const payload = {
        userId: user?.id || 1,
        totalAmount: totals.grandTotal,
        taxTotal: totals.taxTotal,
        taxDetails: totals.taxDetails,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          rate: item.rate,
          taxPercent: item.taxPercent
        }))
      };

      await (window as any).electronAPI.saveSale(payload);
      
      if ((window as any).electronAPI.printReceipt) {
        const format = config?.billing_settings?.print_format || 'A4';
        const htmlContent = generateReceiptHtml(config?.shop_info, cart, totals, user, format as 'thermal' | 'A4');
        try {
          await (window as any).electronAPI.printReceipt({ htmlContent, format });
        } catch (printErr) {
          console.error('Printing failed:', printErr);
          alert('Sale saved, but printing failed. Check printer connection.');
        }
      }

      setCart([]);
      alert('Sale completed and printed successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to process checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left Pane: Cart & Search suggestions */}
      <div className="flex-1 flex flex-col bg-black/5 rounded-xl border theme-border overflow-hidden shadow-inner transition-theme">
        {/* Search / Barcode Input Bar with floating drop-down */}
        <div className="p-4 border-b theme-border bg-black/10 transition-theme z-30" ref={containerRef}>
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              ref={barcodeRef}
              type="text" 
              value={barcodeInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search by Product Name or Scan Barcode... (Auto-focused)" 
              className="w-full pl-12 pr-4 py-4 bg-black/20 border theme-border rounded-lg text-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-white font-mono shadow-inner"
              disabled={isProcessing}
            />

            {/* Smart Suggestions Floating Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-[#1e293b] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto backdrop-blur-md transition-all">
                {suggestions.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      addToCart(p);
                      setBarcodeInput('');
                      setSuggestions([]);
                    }}
                    className={`p-3.5 border-b border-slate-800/40 cursor-pointer flex justify-between items-center transition-all ${
                      idx === activeSuggestionIndex 
                        ? 'bg-blue-500/20 text-blue-400 font-bold border-l-4 border-blue-500' 
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">
                        {renderHighlightedText(p.name, barcodeInput)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        Code: {renderHighlightedText(p.barcode, barcodeInput)} | Stock: <span className={p.stock <= 5 ? 'text-amber-400 font-bold' : ''}>{p.stock}</span>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm text-[var(--primary)]">₹{Number(p.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
              <ShoppingCart size={64} className="mb-4 opacity-50" />
              <p className="text-xl font-medium">Terminal Ready</p>
              <p className="text-sm mt-1">Search product or scan barcode to begin checkout</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b theme-border text-xs text-gray-400 uppercase tracking-wider transition-theme">
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold text-center">Qty</th>
                  <th className="pb-3 font-semibold text-right">Rate</th>
                  <th className="pb-3 font-semibold text-right">Total</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="border-b theme-border/50 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="font-bold text-[var(--text-color)]">{item.name}</div>
                      <div className="text-xs theme-text-secondary mt-1">Code: {item.barcode || item.id} | Tax: {item.taxPercent}%</div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 text-right font-mono theme-text-secondary">₹{item.rate.toFixed(2)}</td>
                    <td className="py-4 text-right font-mono font-bold text-[var(--text-color)]">₹{(item.quantity * item.rate).toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Remove Item">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Pane: Totalizer */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <div className="theme-card-solid rounded-xl border p-6 shadow-xl flex flex-col gap-4 transition-theme">
          <h3 className="font-bold text-sm border-b theme-border pb-3 uppercase tracking-widest theme-text-secondary">Payment Summary</h3>
          
          <div className="space-y-3 mt-2">
            <div className="flex justify-between items-center theme-text-secondary text-sm">
              <span>Taxable Amount</span>
              <span className="font-mono font-medium">₹{totals.taxableAmount.toFixed(2)}</span>
            </div>
            
            {Object.entries(totals.taxDetails).map(([key, val]: any) => (
              <div key={key} className="flex justify-between items-center theme-text-secondary text-sm">
                <span>{key}</span>
                <span className="font-mono font-medium">₹{val.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t theme-border pt-4 mt-2 transition-theme">
            <div className="flex justify-between items-end">
              <span className="theme-text-secondary uppercase tracking-widest text-[10px] font-bold mb-1">Grand Total</span>
              <span className="text-3xl font-bold font-mono text-[var(--primary)] drop-shadow-md">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg text-white mt-auto hover:brightness-110 active:scale-95 disabled:active:scale-100 disabled:hover:brightness-100"
          style={{ 
            backgroundColor: cart.length === 0 ? 'var(--bg-card)' : 'var(--primary)',
            opacity: cart.length === 0 ? 0.5 : 1,
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? (
            <span className="animate-pulse flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <>
              <CheckCircle size={22} />
              Checkout (F12)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
