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
          <span key={index} style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'underline', textDecorationColor: 'rgba(59, 130, 246, 0.4)', background: 'var(--primary-subtle)', padding: '0 4px', borderRadius: 4 }}>
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
      else if (nameLower.split(/\s+/).some((word: string) => word.startsWith(query))) {
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
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 24 }}>
      {/* Left Pane: Cart & Search suggestions */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)', transition: 'all 0.2s' }}>
        {/* Search / Barcode Input Bar with floating drop-down */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', transition: 'all 0.2s', zIndex: 30 }} ref={containerRef}>
          <form onSubmit={handleBarcodeSubmit} style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
            <input 
              ref={barcodeRef}
              type="text" 
              value={barcodeInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search by Product Name or Scan Barcode... (Auto-focused)" 
              style={{ width: '100%', paddingLeft: 48, paddingRight: 16, paddingTop: 14, paddingBottom: 14, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 12, fontSize: 16, outline: 'none', transition: 'all 0.2s', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
              disabled={isProcessing}
            />

            {/* Smart Suggestions Floating Dropdown */}
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', zIndex: 50, left: 0, right: 0, marginTop: 8, background: 'var(--bg-overlay)', border: '1px solid var(--border-strong)', borderRadius: 14, boxShadow: 'var(--shadow-card)', overflow: 'hidden', maxHeight: 256, overflowY: 'auto', backdropFilter: 'blur(12px)', transition: 'all 0.2s' }}>
                {suggestions.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      addToCart(p);
                      setBarcodeInput('');
                      setSuggestions([]);
                    }}
                    style={{
                      padding: 14,
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      background: idx === activeSuggestionIndex ? 'var(--primary-subtle)' : 'transparent',
                      borderLeft: idx === activeSuggestionIndex ? '4px solid var(--primary)' : '4px solid transparent'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {renderHighlightedText(p.name, barcodeInput)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        Code: {renderHighlightedText(p.barcode, barcodeInput)} | Stock: <span style={{ color: p.stock <= 5 ? 'var(--accent-amber)' : 'var(--text-secondary)', fontWeight: p.stock <= 5 ? 700 : 'normal' }}>{p.stock}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>₹{Number(p.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ShoppingCart size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)' }}>Terminal Ready</p>
              <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)' }}>Search product or scan barcode to begin checkout</p>
            </div>
          ) : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ paddingBottom: 12, fontWeight: 600 }}>Product</th>
                  <th style={{ paddingBottom: 12, fontWeight: 600, textAlign: 'center' }}>Qty</th>
                  <th style={{ paddingBottom: 12, fontWeight: 600, textAlign: 'right' }}>Rate</th>
                  <th style={{ paddingBottom: 12, fontWeight: 600, textAlign: 'right' }}>Total</th>
                  <th style={{ paddingBottom: 12 }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ paddingTop: 16, paddingBottom: 16 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Code: {item.barcode || item.id} | Tax: {item.taxPercent}%</div>
                    </td>
                    <td style={{ paddingTop: 16, paddingBottom: 16, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: 6, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ width: 32, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: 6, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ paddingTop: 16, paddingBottom: 16, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>₹{item.rate.toFixed(2)}</td>
                    <td style={{ paddingTop: 16, paddingBottom: 16, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>₹{(item.quantity * item.rate).toFixed(2)}</td>
                    <td style={{ paddingTop: 16, paddingBottom: 16, textAlign: 'right' }}>
                      <button onClick={() => removeItem(item.id)} style={{ padding: 8, background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }} title="Remove Item">
                        <Trash2 size={16} />
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
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.2s' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, color: 'var(--text-secondary)' }}>Payment Summary</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              <span>Taxable Amount</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>₹{totals.taxableAmount.toFixed(2)}</span>
            </div>
            
            {Object.entries(totals.taxDetails).map(([key, val]: any) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                <span>{key}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>₹{val.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Grand Total</span>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0 || isProcessing}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            color: 'white',
            border: 'none',
            backgroundColor: cart.length === 0 ? 'var(--bg-overlay)' : 'var(--primary)',
            opacity: cart.length === 0 ? 0.5 : 1,
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: cart.length === 0 ? 'none' : 'var(--shadow-button)'
          }}
        >
          {isProcessing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg style={{ animation: 'spin 1s linear infinite', height: 20, width: 20, color: 'white' }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
