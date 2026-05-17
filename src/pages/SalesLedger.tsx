import React, { useState, useEffect } from 'react';
import { FileText, Calendar, DollarSign, Search } from 'lucide-react';

export default function SalesLedger() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        if ((window as any).electronAPI && (window as any).electronAPI.getSales) {
          const data = await (window as any).electronAPI.getSales();
          // Sort by newest first
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b theme-border pb-4 transition-theme">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--text-color)] transition-theme">
            <FileText className="text-primary" size={26} />
            Sales Ledger & History
          </h2>
          <p className="theme-text-secondary text-sm mt-1">Review past transactions, verify accounting, and audit store sales.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by Bill ID or Cashier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-lg border theme-border theme-card-solid transition-theme focus:ring-2 focus:ring-primary focus:outline-none w-64"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="theme-card-solid border rounded-xl overflow-hidden shadow-md transition-theme">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b theme-border bg-black/5 text-xs text-gray-500 uppercase tracking-wider transition-theme">
                <th className="p-4 font-bold">Receipt No.</th>
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold text-center">Items Qty</th>
                <th className="p-4 font-bold">Cashier</th>
                <th className="p-4 font-bold text-right">Tax Applied</th>
                <th className="p-4 font-bold text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 theme-text-secondary">Loading ledger records...</td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-gray-500 opacity-70">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm">Bills generated at checkout will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const dateObj = new Date(sale.date);
                  return (
                    <tr key={sale.id} className="border-b theme-border/50 hover:bg-black/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-[var(--primary)]">
                        #{sale.id.toString().padStart(5, '0')}
                      </td>
                      <td className="p-4 text-sm theme-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="opacity-70" />
                          {dateObj.toLocaleDateString('en-IN')} <span className="opacity-50 mx-1">•</span> {dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold">
                        <span className="bg-gray-500/10 px-2.5 py-1 rounded-md text-xs">{sale.items_count} units</span>
                      </td>
                      <td className="p-4 text-sm font-medium capitalize">
                        {sale.user}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-gray-400">
                        ₹{Number(sale.tax_total).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-[var(--text-color)] text-base">
                        ₹{Number(sale.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
