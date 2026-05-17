import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, PackageMinus, CalendarClock } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  metadata: string; // JSON string
}

interface AlertItem {
  id: number;
  name: string;
  type: 'expired' | 'expiring_soon' | 'out_of_stock' | 'low_stock';
  message: string;
  badgeColor: string;
  icon: React.ReactNode;
}

export default function ExpiryAlert() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndAnalyzeProducts = async () => {
      try {
        const products: Product[] = await (window as any).electronAPI.getProducts();
        const analyzedAlerts: AlertItem[] = [];
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        products.forEach(p => {
          let metadataObj: any = {};
          try {
            metadataObj = p.metadata ? JSON.parse(p.metadata) : {};
          } catch (e) {
            console.error('Failed to parse metadata for product:', p.name, e);
          }

          // 1. Check Out of Stock
          if (p.stock === 0) {
            analyzedAlerts.push({
              id: p.id * 10 + 1,
              name: p.name,
              type: 'out_of_stock',
              message: 'Out of Stock! Immediately restock.',
              badgeColor: 'bg-red-500/10 text-red-500 border border-red-500/20',
              icon: <ShieldAlert size={18} className="text-red-500" />
            });
          }
          // 2. Check Low Stock (e.g. <= 5)
          else if (p.stock > 0 && p.stock <= 5) {
            analyzedAlerts.push({
              id: p.id * 10 + 2,
              name: p.name,
              type: 'low_stock',
              message: `Critically low stock (${p.stock} left).`,
              badgeColor: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
              icon: <PackageMinus size={18} className="text-amber-500" />
            });
          }

          // 3. Check Expiry Dates (if tracked in metadata)
          if (metadataObj.expiry) {
            const expiryDate = new Date(metadataObj.expiry);
            
            // Check if Expired
            if (expiryDate < today) {
              analyzedAlerts.push({
                id: p.id * 10 + 3,
                name: p.name,
                type: 'expired',
                message: `EXPIRED on ${expiryDate.toLocaleDateString()}! Remove from shelves.`,
                badgeColor: 'bg-red-500/10 text-red-400 border border-red-500/20',
                icon: <AlertTriangle size={18} className="text-red-400" />
              });
            }
            // Check if Expiring in next 30 days
            else if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
              const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              analyzedAlerts.push({
                id: p.id * 10 + 4,
                name: p.name,
                type: 'expiring_soon',
                message: `Expiring soon in ${diffDays} days (${expiryDate.toLocaleDateString()}).`,
                badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                icon: <CalendarClock size={18} className="text-amber-400" />
              });
            }
          }
        });

        setAlerts(analyzedAlerts);
      } catch (err) {
        console.error('Failed to parse alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAnalyzeProducts();
  }, []);

  if (loading) {
    return <div className="text-sm theme-text-secondary">Analyzing stock shelf health...</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="theme-card-solid rounded-xl border p-6 flex items-center justify-between shadow-md transition-theme">
        <div>
          <h4 className="font-bold text-emerald-500 text-base">🟢 Shelf Inventory Healthy</h4>
          <p className="theme-text-secondary text-xs mt-1">No expired products or critical low-stock items detected on active shelves.</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 font-bold text-sm">
          ✓
        </div>
      </div>
    );
  }

  return (
    <div className="theme-card-solid rounded-xl border p-6 shadow-md transition-theme">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[var(--text-color)] transition-theme">
        ⚠️ Active Shelf & Inventory Alerts
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/20">
          {alerts.length} Warnings
        </span>
      </h3>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className="flex items-start justify-between gap-4 p-3 rounded-lg bg-black/10 border theme-border hover:bg-black/15 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{alert.icon}</div>
              <div>
                <h4 className="font-bold text-sm text-[var(--text-color)]">{alert.name}</h4>
                <p className="theme-text-secondary text-xs mt-0.5">{alert.message}</p>
              </div>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${alert.badgeColor}`}>
              {alert.type.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
