import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { 
  Package, Search, Plus, Edit, Trash2, Loader2, Barcode, 
  DollarSign, Boxes, Calendar, Tag, AlertCircle, CheckCircle2, X 
} from 'lucide-react';

interface Product {
  id: number;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
  metadata: Record<string, any>;
}

const Inventory: React.FC = () => {
  const { config } = useConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Edit State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    stock: '',
    metadata: {} as Record<string, any>
  });
  
  // Alerts State
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Load products from DB
  const loadProducts = async () => {
    setLoading(true);
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI) {
        const rawProducts = await electronAPI.getProducts();
        const parsed = rawProducts.map((p: any) => ({
          ...p,
          metadata: typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata || {}
        }));
        setProducts(parsed);
      } else {
        // Fallback mockup for local web/browser testing
        console.warn('Electron API not found, using mockup products.');
        const mockData = [
          { id: 1, barcode: '8901234567890', name: 'Paracetamol 650mg', price: 42.50, stock: 120, metadata: { batch: 'PAR9022', expiry: '2027-08-31' } },
          { id: 2, barcode: '8909876543210', name: 'Amoxicillin 500mg', price: 110.00, stock: 8, metadata: { batch: 'AMX4501', expiry: '2026-11-30' } },
          { id: 3, barcode: '8901112223334', name: 'Cetirizine 10mg', price: 25.00, stock: 0, metadata: { batch: 'CET1209', expiry: '2026-06-15' } }
        ];
        setProducts(mockData);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      showAlert('error', 'Failed to retrieve inventory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '',
      price: '',
      stock: '',
      metadata: (config?.custom_fields || []).reduce((acc, field) => {
        acc[field.key] = '';
        return acc;
      }, {} as Record<string, any>)
    });
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      metadata: {
        ...(config?.custom_fields || []).reduce((acc, field) => {
          acc[field.key] = '';
          return acc;
        }, {} as Record<string, any>),
        ...product.metadata
      }
    });
    setShowModal(true);
  };

  // Delete Product
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product? This action is irreversible.')) return;
    
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI) {
        await electronAPI.deleteProduct(id);
        loadProducts();
      } else {
        // Browser mockup delete
        setProducts(prev => prev.filter(p => p.id !== id));
      }
      showAlert('success', 'Product deleted successfully.');
    } catch (err) {
      console.error('Failed to delete product:', err);
      showAlert('error', 'Failed to delete product record.');
    }
  };

  // Save/Submit Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim()) return showAlert('error', 'Product name is required.');
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) return showAlert('error', 'Please enter a valid price (>= 0).');
    const stockNum = parseInt(formData.stock);
    if (isNaN(stockNum) || stockNum < 0) return showAlert('error', 'Please enter a valid stock level (>= 0).');
    
    setSaving(true);
    try {
      const electronAPI = (window as any).electronAPI;
      const productPayload = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || null,
        price: priceNum,
        stock: stockNum,
        metadata: formData.metadata
      };

      if (editingProduct) {
        // Edit Mode
        if (electronAPI) {
          await electronAPI.updateProduct(editingProduct.id, productPayload);
          loadProducts();
        } else {
          // Browser mockup update
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productPayload, price: priceNum, stock: stockNum } : p));
        }
        showAlert('success', 'Product updated successfully.');
      } else {
        // Add Mode
        if (electronAPI) {
          await electronAPI.addProduct(productPayload);
          loadProducts();
        } else {
          // Browser mockup insert
          const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
          setProducts(prev => [...prev, { id: newId, ...productPayload, price: priceNum, stock: stockNum, metadata: productPayload.metadata }]);
        }
        showAlert('success', 'Product catalog record saved successfully.');
      }
      
      setShowModal(false);
    } catch (err: any) {
      console.error('Failed to save product:', err);
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        showAlert('error', 'Barcode validation error: A product with this barcode already exists.');
      } else {
        showAlert('error', 'Database write failure. Verify all inputs.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper to dynamically resolve input type for custom fields
  const resolveFieldType = (key: string, label: string): 'text' | 'number' | 'date' => {
    const lowerKey = key.toLowerCase();
    const lowerLabel = label.toLowerCase();
    
    if (lowerKey.includes('date') || lowerKey.includes('expiry') || lowerLabel.includes('date')) return 'date';
    if (lowerKey.includes('price') || lowerKey.includes('qty') || lowerKey.includes('quantity') || lowerKey.includes('amount')) return 'number';
    
    return 'text';
  };

  // Helper to get custom field dynamic icons
  const getFieldIcon = (type: string, key: string) => {
    if (type === 'date') return <Calendar size={18} className="text-blue-400" />;
    if (type === 'number') return <Boxes size={18} className="text-emerald-400" />;
    if (key.toLowerCase().includes('batch') || key.toLowerCase().includes('code')) return <Tag size={18} className="text-purple-400" />;
    return <Package size={18} className="text-slate-400" />;
  };

  // Filtered Products list
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.metadata && Object.values(p.metadata).some(val => 
        val && val.toString().toLowerCase().includes(query)
      ))
    );
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alert && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all duration-300 animate-slide-in ${
            alert.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' 
              : 'bg-red-950/90 border-red-800 text-red-200'
          }`}
        >
          {alert.type === 'success' ? <CheckCircle2 className="text-emerald-400 shrink-0" size={22} /> : <AlertCircle className="text-red-400 shrink-0" size={22} />}
          <span className="text-sm font-semibold tracking-wide">{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header section with Action Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b theme-header-border pb-6 transition-theme">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 transition-theme">
            <Package className="text-[var(--primary)]" size={26} />
            <span>Product Catalog</span>
          </h2>
          <p className="theme-text-secondary mt-1 transition-theme">Manage catalog items, monitor offline inventory stock, and track dynamic custom metadata.</p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white font-semibold rounded-xl hover:brightness-110 hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-98 transition-all duration-200 cursor-pointer shadow-md text-sm"
        >
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="theme-card-solid border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center transition-theme">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search by product name, barcode scan, batch no, or custom values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-color)] text-sm rounded-lg focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] block pl-11 pr-4 py-3 transition-theme"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="text-xs font-semibold theme-text-secondary whitespace-nowrap tracking-wider uppercase bg-black/5 dark:bg-white/5 py-2 px-3 rounded-lg border theme-border">
          Total: {filteredProducts.length} Item{filteredProducts.length !== 1 ? 's' : ''} Listed
        </div>
      </div>

      {/* Product List/Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-[var(--primary)]" size={36} />
          <span className="text-sm font-semibold tracking-wider theme-text-secondary uppercase">Hydrating Catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="theme-card-solid border rounded-2xl p-16 text-center shadow-lg transition-theme">
          <div className="inline-flex p-4 rounded-full bg-slate-500/10 text-slate-400 mb-4 border border-slate-500/20">
            <Package size={36} />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-color)] transition-theme">No products matched search query</h3>
          <p className="theme-text-secondary text-sm mt-2 max-w-md mx-auto transition-theme">
            {searchQuery ? 'Adjust your keyword search or scanning barcode identifier.' : 'Your offline product catalog database is empty. Get started by adding your first product.'}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-5 text-sm font-semibold text-[var(--primary)] hover:underline cursor-pointer"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="theme-card-solid border rounded-xl overflow-hidden shadow-xl transition-theme">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b theme-border bg-black/10 dark:bg-white/3 font-semibold text-xs theme-text-secondary uppercase tracking-wider">
                  <th className="py-4 px-6">Barcode / Name</th>
                  <th className="py-4 px-6 text-right">Unit Price</th>
                  <th className="py-4 px-6 text-center">Stock Level</th>
                  {config?.custom_fields?.map((field) => (
                    <th key={field.key} className="py-4 px-6">{field.label}</th>
                  ))}
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border text-sm">
                {filteredProducts.map((product) => {
                  // Stock badges
                  let stockBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  let stockText = 'In Stock';
                  if (product.stock === 0) {
                    stockBadgeClass = 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
                    stockText = 'Out of Stock';
                  } else if (product.stock < 10) {
                    stockBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    stockText = 'Low Stock';
                  }

                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-slate-500/5 dark:hover:bg-white/2 transition-colors duration-150"
                    >
                      {/* Barcode & Name */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 max-w-[280px] sm:max-w-xs md:max-w-md">
                          <span className="font-bold text-[var(--text-color)] tracking-tight text-base truncate transition-theme">
                            {product.name}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs theme-text-secondary truncate transition-theme">
                            <Barcode size={13} className="opacity-70" />
                            {product.barcode ? product.barcode : <span className="opacity-40 italic">No Barcode</span>}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 text-right">
                        <span className="font-mono font-bold text-[var(--text-color)] text-base transition-theme">
                          ₹{product.price.toFixed(2)}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-[var(--text-color)] text-base transition-theme">
                            {product.stock}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ${stockBadgeClass}`}>
                            {stockText}
                          </span>
                        </div>
                      </td>

                      {/* Custom Fields */}
                      {config?.custom_fields?.map((field) => {
                        const val = product.metadata?.[field.key];
                        return (
                          <td key={field.key} className="py-4 px-6 whitespace-nowrap font-medium">
                            {val ? (
                              <span className="font-mono theme-text-secondary bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded border theme-border text-xs">
                                {val}
                              </span>
                            ) : (
                              <span className="text-slate-500 opacity-40">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenEdit(product)}
                            title="Edit Product"
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-150 cursor-pointer border border-transparent hover:border-blue-500/20"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            title="Delete Product"
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150 cursor-pointer border border-transparent hover:border-red-500/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Glassmorphic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-black/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Package className="text-[var(--primary)]" size={22} />
                <span>{editingProduct ? 'Edit Product Details' : 'Add New Product Record'}</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800/40 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Product Name */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Product Name *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--primary)] transition-colors">
                      <Package size={18} />
                    </div>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 650mg"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] block pl-11 p-3 transition-all"
                    />
                  </div>
                </div>

                {/* Barcode */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Barcode Identifier (Optional)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--primary)] transition-colors">
                      <Barcode size={18} />
                    </div>
                    <input 
                      type="text"
                      placeholder="Scan or enter barcode barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] block pl-11 p-3 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Unit Price */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Unit Sale Price (₹) *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--primary)] transition-colors">
                      <DollarSign size={18} />
                    </div>
                    <input 
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] block pl-11 p-3 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Initial Stock */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Stock Quantity *
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--primary)] transition-colors">
                      <Boxes size={18} />
                    </div>
                    <input 
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] block pl-11 p-3 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Metadata Fields from Config Schema */}
              {config?.custom_fields && config.custom_fields.length > 0 && (
                <div className="border-t border-slate-800/80 pt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span>✨ Dynamic Custom Fields</span>
                    <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">Config Driven</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {config.custom_fields.map((field) => {
                      const type = resolveFieldType(field.key, field.label);
                      return (
                        <div key={field.key} className="flex flex-col gap-2">
                          <label htmlFor={`modal-field-${field.key}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {field.label}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none group-focus-within:text-[var(--primary)] transition-colors">
                              {getFieldIcon(type, field.key)}
                            </div>
                            <input 
                              id={`modal-field-${field.key}`}
                              type={type}
                              placeholder={`Enter ${field.label}...`}
                              value={formData.metadata[field.key] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    [field.key]: val
                                  }
                                }));
                              }}
                              className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-lg focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] block pl-11 p-3 transition-all"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="border-t border-slate-800/80 pt-6 flex items-center justify-end gap-3 bg-slate-900 sticky bottom-0">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 text-slate-400 hover:text-white hover:bg-slate-800 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:brightness-110 hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-98 transition-all disabled:opacity-50 text-sm cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Writing Record...</span>
                    </>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
