import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, Printer } from 'lucide-react';
import { generateReceiptHtml } from '../utils/printTemplates';

export default function Billing() {
  const { config } = useConfig();
  const { user } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);



  // Focus barcode input on mount and after actions
  useEffect(() => {
    barcodeRef.current?.focus();
  }, [cart, isProcessing]);

  // Global hotkeys
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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
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
      // Assuming a default tax if none provided, ideally we would load from product metadata or config
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

  // Calculations
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
      
      // Trigger Printing if in Electron
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
      {/* Left Pane: Cart & Input */}
      <div className="flex-1 flex flex-col bg-black/5 rounded-xl border theme-border overflow-hidden shadow-inner transition-theme">
        {/* Barcode Input Bar */}
        <div className="p-4 border-b theme-border bg-black/10 transition-theme">
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              ref={barcodeRef}
              type="text" 
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode or Enter Code... (Auto-focused)" 
              className="w-full pl-12 pr-4 py-4 bg-black/20 border theme-border rounded-lg text-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-white font-mono shadow-inner"
              disabled={isProcessing}
            />
          </form>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
              <ShoppingCart size={64} className="mb-4 opacity-50" />
              <p className="text-xl font-medium">Terminal Ready</p>
              <p className="text-sm mt-1">Scan a barcode to begin checkout</p>
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
