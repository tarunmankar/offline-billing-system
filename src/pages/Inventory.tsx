import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Package, Search, Plus, Edit, Trash2, Loader2, Barcode, DollarSign, Boxes, Calendar, Tag, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Product { id: number; barcode: string | null; name: string; price: number; stock: number; metadata: Record<string, any>; }

const I: Record<string, React.CSSProperties> = {
  card: { background: 'hsl(222,36%,11%)', border: '1px solid hsla(220,30%,30%,0.35)', borderRadius: 20 },
  th: { padding: '16px 22px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(215,15%,35%)', whiteSpace: 'nowrap' as const },
  td: { padding: '18px 22px', fontSize: 14, color: 'hsl(210,40%,98%)', verticalAlign: 'middle' as const },
  label: { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'hsl(215,20%,55%)', marginBottom: 8 },
  input: { width: '100%', boxSizing: 'border-box' as const, padding: '12px 14px 12px 44px', fontSize: 14, borderRadius: 12, background: 'hsla(222,47%,4%,0.9)', border: '1px solid hsla(220,30%,25%,0.6)', color: 'hsl(210,40%,98%)', outline: 'none', fontFamily: 'inherit' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
  iconWrap: { position: 'absolute' as const, left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' as const, color: 'hsl(215,15%,40%)' },
};

const Inventory: React.FC = () => {
  const { config } = useConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', barcode: '', price: '', stock: '', metadata: {} as Record<string, any> });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const api = (window as any).electronAPI;
      if (api) {
        const raw = await api.getProducts();
        setProducts(raw.map((p: any) => ({ ...p, metadata: typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata || {} })));
      } else {
        setProducts([
          { id: 1, barcode: '8901234567890', name: 'Paracetamol 650mg', price: 42.50, stock: 120, metadata: { batch: 'PAR9022', expiry: '2027-08-31' } },
          { id: 2, barcode: '8909876543210', name: 'Amoxicillin 500mg', price: 110.00, stock: 3, metadata: { batch: 'AMX4501', expiry: '2026-11-30' } },
          { id: 3, barcode: '8901112223334', name: 'Cetirizine 10mg', price: 25.00, stock: 0, metadata: { batch: 'CET1209', expiry: '2026-06-15' } },
        ]);
      }
    } catch { showAlrt('error', 'Failed to load inventory.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);

  const showAlrt = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setFormData({ name: '', barcode: '', price: '', stock: '', metadata: (config?.custom_fields || []).reduce((a, f) => ({ ...a, [f.key]: '' }), {}) });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ name: p.name, barcode: p.barcode || '', price: p.price.toString(), stock: p.stock.toString(), metadata: { ...(config?.custom_fields || []).reduce((a, f) => ({ ...a, [f.key]: '' }), {}), ...p.metadata } });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      const api = (window as any).electronAPI;
      if (api) { await api.deleteProduct(id); loadProducts(); }
      else setProducts(prev => prev.filter(p => p.id !== id));
      showAlrt('success', 'Product deleted.');
    } catch { showAlrt('error', 'Delete failed.'); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return showAlrt('error', 'Product name required.');
    const price = parseFloat(formData.price), stock = parseInt(formData.stock);
    if (isNaN(price) || price < 0) return showAlrt('error', 'Invalid price.');
    if (isNaN(stock) || stock < 0) return showAlrt('error', 'Invalid stock.');
    setSaving(true);
    try {
      const api = (window as any).electronAPI;
      const payload = { name: formData.name.trim(), barcode: formData.barcode.trim() || null, price, stock, metadata: formData.metadata };
      if (editingProduct) {
        if (api) { await api.updateProduct(editingProduct.id, payload); loadProducts(); }
        else setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
        showAlrt('success', 'Product updated.');
      } else {
        if (api) { await api.addProduct(payload); loadProducts(); }
        else setProducts(prev => [...prev, { id: Date.now(), ...payload }]);
        showAlrt('success', 'Product added.');
      }
      setShowModal(false);
    } catch (err: any) {
      showAlrt('error', err.message?.includes('UNIQUE') ? 'Barcode already exists.' : 'Save failed.');
    } finally { setSaving(false); }
  };

  const resolveType = (key: string, label: string): 'text' | 'number' | 'date' => {
    const k = key.toLowerCase(), l = label.toLowerCase();
    if (k.includes('date') || k.includes('expiry') || l.includes('date')) return 'date';
    if (k.includes('price') || k.includes('qty') || k.includes('quantity')) return 'number';
    return 'text';
  };

  const filtered = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    return !q || p.name.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q);
  });

  const stockBadge = (stock: number) => {
    if (stock === 0) return { bg: 'hsla(4,86%,58%,0.12)', border: 'hsla(4,86%,58%,0.3)', color: 'hsl(4,86%,65%)', label: 'Out of Stock' };
    if (stock < 10) return { bg: 'hsla(38,92%,50%,0.1)', border: 'hsla(38,92%,50%,0.3)', color: 'hsl(38,92%,55%)', label: 'Low Stock' };
    return { bg: 'hsla(158,64%,52%,0.1)', border: 'hsla(158,64%,52%,0.3)', color: 'hsl(158,64%,52%)', label: 'In Stock' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

      {/* Toast Alert */}
      {alert && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 200, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 14, boxShadow: '0 8px 32px -4px hsla(222,47%,2%,0.6)', background: alert.type === 'success' ? 'hsla(158,50%,8%,0.97)' : 'hsla(4,50%,10%,0.97)', border: `1px solid ${alert.type === 'success' ? 'hsla(158,64%,52%,0.4)' : 'hsla(4,86%,58%,0.4)'}` }}>
          {alert.type === 'success' ? <CheckCircle2 size={20} color="hsl(158,64%,52%)" /> : <AlertCircle size={20} color="hsl(4,86%,65%)" />}
          <span style={{ fontSize: 14, fontWeight: 600, color: 'hsl(210,40%,98%)' }}>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,15%,40%)', marginLeft: 4, display: 'flex' }}><X size={15} /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, paddingBottom: 24, borderBottom: '1px solid hsla(220,30%,30%,0.35)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'hsla(221,83%,53%,0.08)', border: '1px solid hsla(221,83%,53%,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="hsl(221,83%,53%)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(210,40%,98%)' }}>Product Catalog</h2>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(215,20%,55%)' }}>Manage catalog items, monitor stock levels, and track custom metadata.</p>
        </div>
        <button onClick={openAdd} style={{ ...I.btn, background: 'hsl(221,83%,53%)', color: '#fff', boxShadow: '0 4px 14px -2px hsla(221,83%,53%,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div style={{ ...I.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ ...I.iconWrap }} />
          <input type="text" placeholder="Search by name, barcode, batch..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ ...I.input, paddingLeft: 44, paddingRight: searchQuery ? 40 : 14 }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215,15%,40%)', display: 'flex' }}><X size={15} /></button>}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(215,20%,55%)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{filtered.length} Items</span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 }}>
          <Loader2 size={32} color="hsl(221,83%,53%)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(215,20%,55%)' }}>Loading Catalog...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...I.card, padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'hsla(220,30%,30%,0.2)', border: '1px solid hsla(220,30%,30%,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Package size={28} color="hsl(215,15%,35%)" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'hsl(215,20%,55%)', marginBottom: 8 }}>No products found</p>
          <p style={{ fontSize: 13, color: 'hsl(215,15%,40%)' }}>{searchQuery ? 'Try a different search.' : 'Add your first product to get started.'}</p>
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(221,83%,60%)', fontSize: 13, fontWeight: 600 }}>Clear Search</button>}
        </div>
      ) : (
        <div style={{ ...I.card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsla(220,30%,30%,0.35)', background: 'hsla(222,47%,5%,0.6)' }}>
                  <th style={I.th}>Product / Barcode</th>
                  <th style={{ ...I.th, textAlign: 'right' }}>Price</th>
                  <th style={{ ...I.th, textAlign: 'center' }}>Stock</th>
                  {config?.custom_fields?.map(f => <th key={f.key} style={I.th}>{f.label}</th>)}
                  <th style={{ ...I.th, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const badge = stockBadge(product.stock);
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid hsla(220,30%,30%,0.2)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'hsla(220,30%,30%,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={I.td}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{product.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(215,20%,55%)', fontSize: 12, fontFamily: 'monospace' }}>
                          <Barcode size={12} />{product.barcode || <em style={{ opacity: 0.5 }}>No barcode</em>}
                        </div>
                      </td>
                      <td style={{ ...I.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₹{product.price.toFixed(2)}</td>
                      <td style={{ ...I.td, textAlign: 'center' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{product.stock}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '3px 10px', borderRadius: 999, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>{badge.label}</span>
                      </td>
                      {config?.custom_fields?.map(f => (
                        <td key={f.key} style={I.td}>
                          {product.metadata?.[f.key] ? (
                            <span style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 10px', borderRadius: 8, background: 'hsla(220,30%,30%,0.3)', border: '1px solid hsla(220,30%,30%,0.4)', color: 'hsl(215,20%,65%)' }}>{product.metadata[f.key]}</span>
                          ) : <span style={{ color: 'hsl(215,15%,30%)' }}>—</span>}
                        </td>
                      ))}
                      <td style={{ ...I.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <button onClick={() => openEdit(product)} title="Edit" style={{ padding: '8px', borderRadius: 8, background: 'none', border: '1px solid transparent', cursor: 'pointer', color: 'hsl(215,15%,40%)', display: 'flex', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'hsla(221,83%,53%,0.1)'; e.currentTarget.style.color = 'hsl(221,83%,65%)'; e.currentTarget.style.borderColor = 'hsla(221,83%,53%,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'hsl(215,15%,40%)'; e.currentTarget.style.borderColor = 'transparent'; }}>
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(product.id)} title="Delete" style={{ padding: '8px', borderRadius: 8, background: 'none', border: '1px solid transparent', cursor: 'pointer', color: 'hsl(215,15%,40%)', display: 'flex', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'hsla(4,86%,58%,0.1)'; e.currentTarget.style.color = 'hsl(4,86%,65%)'; e.currentTarget.style.borderColor = 'hsla(4,86%,58%,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'hsl(215,15%,40%)'; e.currentTarget.style.borderColor = 'transparent'; }}>
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsla(222,47%,2%,0.75)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'hsl(222,36%,10%)', border: '1px solid hsla(220,30%,30%,0.4)', borderRadius: 24, boxShadow: '0 32px 80px -12px hsla(222,47%,2%,0.8)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '22px 28px', borderBottom: '1px solid hsla(220,30%,30%,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsla(222,47%,5%,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Package size={20} color="hsl(221,83%,53%)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(210,40%,98%)' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'hsla(220,30%,30%,0.4)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'hsl(215,20%,55%)', display: 'flex' }}><X size={18} /></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Name — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={I.label}>Product Name *</label>
                  <div style={{ position: 'relative' }}>
                    <Package size={16} style={I.iconWrap} />
                    <input type="text" required placeholder="e.g. Paracetamol 650mg" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={I.input} />
                  </div>
                </div>
                {/* Barcode */}
                <div>
                  <label style={I.label}>Barcode (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Barcode size={16} style={I.iconWrap} />
                    <input type="text" placeholder="Scan or type..." value={formData.barcode} onChange={e => setFormData(p => ({ ...p, barcode: e.target.value }))} style={{ ...I.input, fontFamily: 'monospace' }} />
                  </div>
                </div>
                {/* Price */}
                <div>
                  <label style={I.label}>Unit Price (₹) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={I.iconWrap} />
                    <input type="number" required step="0.01" min="0" placeholder="0.00" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} style={{ ...I.input, fontFamily: 'monospace' }} />
                  </div>
                </div>
                {/* Stock */}
                <div>
                  <label style={I.label}>Stock Quantity *</label>
                  <div style={{ position: 'relative' }}>
                    <Boxes size={16} style={I.iconWrap} />
                    <input type="number" required min="0" placeholder="0" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} style={{ ...I.input, fontFamily: 'monospace' }} />
                  </div>
                </div>
                {/* Custom Fields */}
                {config?.custom_fields?.map(field => {
                  const type = resolveType(field.key, field.label);
                  const Icon = type === 'date' ? Calendar : type === 'number' ? Boxes : Tag;
                  return (
                    <div key={field.key}>
                      <label style={I.label}>{field.label}</label>
                      <div style={{ position: 'relative' }}>
                        <Icon size={16} style={I.iconWrap} />
                        <input type={type} placeholder={`Enter ${field.label}...`} value={formData.metadata[field.key] || ''} onChange={e => setFormData(p => ({ ...p, metadata: { ...p.metadata, [field.key]: e.target.value } }))} style={I.input} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid hsla(220,30%,30%,0.35)' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...I.btn, background: 'hsla(220,30%,30%,0.4)', color: 'hsl(215,20%,65%)', border: '1px solid hsla(220,30%,30%,0.4)' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...I.btn, background: 'hsl(221,83%,53%)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Product'}
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
