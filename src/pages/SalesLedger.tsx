import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Search, TrendingUp, X } from 'lucide-react';

export default function SalesLedger() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        if ((window as any).electronAPI?.getSales) {
          const data = await (window as any).electronAPI.getSales();
          setSales(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      } catch (err) {
        console.error('Failed to fetch sales ledger', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const filteredSales = sales.filter(s =>
    s.id.toString().includes(searchTerm) ||
    (s.user || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-subtle)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Sales Ledger</h2>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Review past transactions, verify accounting, and audit store sales.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Bill ID or Cashier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: 42, paddingRight: searchTerm ? 36 : 16, paddingTop: 12, paddingBottom: 12,
              fontSize: 13, borderRadius: 12, width: 280,
              background: 'var(--input-bg)', border: '1px solid var(--input-border)',
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Bills', value: filteredSales.length.toString(), color: 'var(--primary)' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, color: 'var(--accent-emerald)' },
          { label: 'Showing', value: `${filteredSales.length} of ${sales.length}`, color: 'var(--accent-purple)' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '18px 22px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{item.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: item.color, letterSpacing: '-0.02em', fontFamily: 'monospace' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'hsla(222,40%,6%,0.6)' }}>
                {['Receipt No.', 'Date & Time', 'Items', 'Cashier', 'Tax', 'Grand Total'].map((h, i) => (
                  <th key={h} style={{
                    padding: '16px 22px', fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--text-muted)', whiteSpace: 'nowrap',
                    textAlign: i >= 4 ? 'right' : i === 2 ? 'center' : 'left',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '18px 22px' }}>
                        <div className="skeleton" style={{ height: 14, borderRadius: 6, width: j === 0 ? 80 : j === 1 ? 140 : 60 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={28} color="var(--text-muted)" />
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No records found</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bills generated at checkout will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, i) => {
                  const dateObj = new Date(sale.date);
                  return (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-overlay)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '18px 22px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
                          #{sale.id.toString().padStart(5, '0')}
                        </span>
                      </td>
                      <td style={{ padding: '18px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {dateObj.toLocaleDateString('en-IN')}
                          </span>
                          <span style={{ color: 'var(--border-strong)' }}>•</span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '18px 22px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {sale.items_count} units
                        </span>
                      </td>
                      <td style={{ padding: '18px 22px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {sale.user}
                      </td>
                      <td style={{ padding: '18px 22px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-muted)' }}>
                        ₹{Number(sale.tax_total).toFixed(2)}
                      </td>
                      <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                          ₹{Number(sale.total_amount).toFixed(2)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
