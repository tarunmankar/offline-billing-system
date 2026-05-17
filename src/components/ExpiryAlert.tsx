import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, PackageMinus, CalendarClock, CheckCircle, Bell } from 'lucide-react';

interface Product {
  id: number; name: string; price: number; stock: number;
  barcode: string; metadata: string;
}
interface AlertItem {
  id: number; name: string;
  type: 'expired' | 'expiring_soon' | 'out_of_stock' | 'low_stock';
  message: string;
  color: string; bgColor: string; borderColor: string;
  icon: React.ReactNode;
}

export default function ExpiryAlert() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndAnalyzeProducts = async () => {
      try {
        const products: Product[] = await (window as any).electronAPI.getProducts();
        const result: AlertItem[] = [];
        const today = new Date();
        const thirtyDays = new Date();
        thirtyDays.setDate(today.getDate() + 30);

        products.forEach(p => {
          let meta: any = {};
          try { meta = p.metadata ? JSON.parse(p.metadata) : {}; } catch {}

          if (p.stock === 0) {
            result.push({
              id: p.id * 10 + 1, name: p.name, type: 'out_of_stock',
              message: 'Out of Stock — Restock immediately',
              color: 'hsl(4,86%,65%)',
              bgColor: 'hsla(4,86%,58%,0.08)',
              borderColor: 'hsla(4,86%,58%,0.22)',
              icon: <ShieldAlert size={18} />,
            });
          } else if (p.stock <= 5) {
            result.push({
              id: p.id * 10 + 2, name: p.name, type: 'low_stock',
              message: `Only ${p.stock} units remaining`,
              color: 'hsl(38,92%,60%)',
              bgColor: 'hsla(38,92%,50%,0.08)',
              borderColor: 'hsla(38,92%,50%,0.22)',
              icon: <PackageMinus size={18} />,
            });
          }

          if (meta.expiry) {
            const exp = new Date(meta.expiry);
            if (exp < today) {
              result.push({
                id: p.id * 10 + 3, name: p.name, type: 'expired',
                message: `Expired on ${exp.toLocaleDateString('en-IN')} — Remove from shelf`,
                color: 'hsl(4,86%,65%)',
                bgColor: 'hsla(4,86%,58%,0.08)',
                borderColor: 'hsla(4,86%,58%,0.22)',
                icon: <AlertTriangle size={18} />,
              });
            } else if (exp <= thirtyDays) {
              const diff = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
              result.push({
                id: p.id * 10 + 4, name: p.name, type: 'expiring_soon',
                message: `Expiring in ${diff} day${diff !== 1 ? 's' : ''} — ${exp.toLocaleDateString('en-IN')}`,
                color: 'hsl(38,92%,60%)',
                bgColor: 'hsla(38,92%,50%,0.08)',
                borderColor: 'hsla(38,92%,50%,0.22)',
                icon: <CalendarClock size={18} />,
              });
            }
          }
        });
        setAlerts(result);
      } catch (err) {
        console.error('Alert analysis failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndAnalyzeProducts();
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 20,
        padding: '28px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skeleton" style={{ height: 12, width: '35%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 6 }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── All Clear State ── */
  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20,
          padding: '24px 28px',
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'hsla(158,64%,52%,0.1)',
          border: '1px solid hsla(158,64%,52%,0.25)',
          color: 'var(--accent-emerald)',
        }}>
          <CheckCircle size={24} />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-emerald)', marginBottom: 4 }}>
            All Shelves Healthy
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            No expired products or critical low-stock items detected on active shelves.
          </p>
        </div>
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <span className="badge badge-success">✓ All Clear</span>
        </div>
      </motion.div>
    );
  }

  /* ── Alerts List ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'hsla(4,86%,58%,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'hsla(4,86%,58%,0.12)',
            border: '1px solid hsla(4,86%,58%,0.3)',
            color: 'hsl(4,86%,65%)',
          }}>
            <Bell size={18} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
              Active Inventory Alerts
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Requires immediate attention
            </p>
          </div>
        </div>
        <span className="badge badge-danger">{alerts.length} Warning{alerts.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Items */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
        <AnimatePresence>
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 18px',
                borderRadius: 14,
                background: alert.bgColor,
                border: `1px solid ${alert.borderColor}`,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: alert.bgColor,
                border: `1px solid ${alert.borderColor}`,
                color: alert.color,
              }}>
                {alert.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>
                  {alert.name}
                </p>
                <p style={{ fontSize: 12.5, color: alert.color, lineHeight: 1.4 }}>
                  {alert.message}
                </p>
              </div>

              {/* Badge */}
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', padding: '4px 10px', borderRadius: 999,
                background: alert.bgColor, border: `1px solid ${alert.borderColor}`,
                color: alert.color, flexShrink: 0,
              }}>
                {alert.type.replace('_', ' ')}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
