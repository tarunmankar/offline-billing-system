import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { IndianRupee, TrendingUp, TrendingDown, ClipboardList, Printer, Calendar } from 'lucide-react';

/* ── Inline Design System Styles ────────────────────────── */
const S = {
  container: { display: 'flex', flexDirection: 'column' as const, gap: 28, paddingBottom: 48 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' as const, gap: 16 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, background: 'var(--primary-subtle)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  datepicker: { padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' },
  printBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  statCard: (glowColor: string) => ({
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 20,
    padding: '24px 28px',
    boxShadow: 'var(--shadow-card)',
    position: 'relative' as const,
    overflow: 'hidden',
  }),
  cardGlow: (subtleColor: string) => ({
    position: 'absolute' as const,
    inset: 0,
    background: `linear-gradient(135deg, transparent 60%, ${subtleColor})`,
    pointerEvents: 'none' as const,
  }),
  statIcon: (subtleColor: string, color: string) => ({
    position: 'absolute' as const,
    top: 24,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: subtleColor,
    border: `1px solid ${color}35`,
    color,
  }),
  statLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 },
  mainCard: { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  tableContainer: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, textAlign: 'left' as const },
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' },
  td: { padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }
};

const DayBook: React.FC = () => {
  const { config } = useConfig();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    // Return standard YYYY-MM-DD
    return d.toISOString().split('T')[0];
  });
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      let salesData = [];
      let expensesData = [];
      if ((window as any).electronAPI?.getSales) {
        salesData = await (window as any).electronAPI.getSales();
      }
      if ((window as any).electronAPI?.getExpenses) {
        expensesData = await (window as any).electronAPI.getExpenses();
      }

      // Filter based on selected date
      const dateStr = new Date(selectedDate).toDateString();
      const filteredSales = salesData.filter((s: any) => new Date(s.date || s.timestamp).toDateString() === dateStr);
      const filteredExpenses = expensesData.filter((e: any) => new Date(e.timestamp).toDateString() === dateStr);

      setSales(filteredSales);
      setExpenses(filteredExpenses);
    } catch (err) {
      console.error('Failed to load Day Book registers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Calculations
  const totalInflows = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalOutflows = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netGalla = totalInflows - totalOutflows;

  // Build unified chronological activity logs
  const unifiedLogs = [
    ...sales.map((s) => ({
      id: `sale-${s.id}`,
      type: 'sale',
      time: s.date || s.timestamp,
      description: `Sales Bill ID: #${s.id} (${s.items_count} items)`,
      user: s.user || 'system',
      amount: Number(s.total_amount)
    })),
    ...expenses.map((e) => ({
      id: `exp-${e.id}`,
      type: 'expense',
      time: e.timestamp,
      description: e.description,
      user: e.user || 'system',
      amount: -Number(e.amount)
    }))
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Print End of Day Reconciliation Thermal Presets
  const handlePrintDayBook = async () => {
    if (unifiedLogs.length === 0) {
      alert('Cannot print an empty Day Book register.');
      return;
    }

    const printHTML = `
      <div style="font-family: 'Courier New', Courier, monospace; width: 300px; font-size: 12px; color: black;">
        <div style="text-align: center; font-weight: bold; font-size: 14px;">${config?.shop_info?.name || 'BILLING PRO'}</div>
        <div style="text-align: center;">${config?.shop_info?.type?.toUpperCase()} TERMINAL</div>
        <div style="border-bottom: 1px dashed black; margin: 10px 0;"></div>
        <div style="font-weight: bold; text-align: center; font-size: 13px;">DAILY GALLA RECONCILIATION</div>
        <div style="text-align: center; margin-top: 4px;">DATE: ${new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div style="border-bottom: 1px dashed black; margin: 10px 0;"></div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>Total Inflows (Sales)</td>
            <td style="text-align: right; font-weight: bold;">+INR ${totalInflows.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Outflows (Exp)</td>
            <td style="text-align: right; font-weight: bold; color: red;">-INR ${totalOutflows.toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 13px;">
            <td>NET COUNTER GALLA</td>
            <td style="text-align: right;">INR ${netGalla.toFixed(2)}</td>
          </tr>
        </table>
        
        <div style="border-bottom: 1px dashed black; margin: 10px 0;"></div>
        <div style="font-weight: bold; margin-bottom: 6px;">CHRONOLOGICAL AUDIT LOG:</div>
        <table style="width: 100%; font-size: 11px;">
          ${unifiedLogs.map(log => `
            <tr>
              <td>${new Date(log.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
              <td>${log.description.substring(0, 16)}</td>
              <td style="text-align: right; font-weight: bold; color: ${log.type === 'sale' ? 'green' : 'red'};">
                ${log.type === 'sale' ? '+' : '-'}${Math.abs(log.amount).toFixed(0)}
              </td>
            </tr>
          `).join('')}
        </table>
        
        <div style="border-bottom: 1px dashed black; margin: 10px 0;"></div>
        <div style="text-align: center; font-size: 10px; margin-top: 15px;">Day Book reconciliated successfully.<br/>Thank you for auditing.</div>
      </div>
    `;

    try {
      if ((window as any).electronAPI?.printReceipt) {
        await (window as any).electronAPI.printReceipt({
          htmlContent: printHTML,
          format: 'thermal'
        });
      }
    } catch (err) {
      console.error('Failed to print Day Book register:', err);
    }
  };

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerIcon}>
            <ClipboardList size={22} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{t('daybookTitle')}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('daybookSub')}</p>
          </div>
        </div>

        <div style={S.headerRight}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={S.datepicker}
          />
          <button onClick={handlePrintDayBook} style={S.printBtn}>
            <Printer size={15} />
            {t('printLedger')}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={S.statsGrid}>
        {/* Total Inflows */}
        <div style={S.statCard('var(--primary-glow)')}>
          <div style={S.cardGlow('var(--primary-subtle)')} />
          <div style={S.statIcon('var(--primary-subtle)', 'var(--primary)')}>
            <TrendingUp size={20} />
          </div>
          <p style={S.statLabel}>{t('totalInflow')}</p>
          <p style={S.statValue}>₹{totalInflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Total Outflows */}
        <div style={S.statCard('rgba(239, 68, 68, 0.3)')}>
          <div style={S.cardGlow('rgba(239, 68, 68, 0.08)')} />
          <div style={S.statIcon('rgba(239, 68, 68, 0.1)', 'var(--accent-red)')}>
            <TrendingDown size={20} />
          </div>
          <p style={S.statLabel}>{t('totalOutflow')}</p>
          <p style={S.statValue}>₹{totalOutflows.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Net Counter Galla */}
        <div style={S.statCard(netGalla >= 0 ? 'hsla(158,64%,52%,0.3)' : 'rgba(239, 68, 68, 0.3)')}>
          <div style={S.cardGlow(netGalla >= 0 ? 'hsla(158,64%,52%,0.08)' : 'rgba(239, 68, 68, 0.08)')} />
          <div style={S.statIcon(netGalla >= 0 ? 'hsla(158,64%,52%,0.1)' : 'rgba(239, 68, 68, 0.1)', netGalla >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)')}>
            <IndianRupee size={20} />
          </div>
          <p style={S.statLabel}>{t('netGalla')}</p>
          <p style={{ ...S.statValue, color: netGalla >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
            ₹{netGalla.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Day Reconciliation Ratio Graphic Card */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          📊 Counter Ratio & Outflow Analytics
        </h3>
        
        {totalInflows === 0 && totalOutflows === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No sales or expenses recorded today to calculate ratios.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Progress Track */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                <span style={{ color: 'var(--accent-emerald)' }}>Profit / Keep Ratio ({totalInflows > 0 ? Math.max(0, Math.round(((totalInflows - totalOutflows) / totalInflows) * 100)) : 0}%)</span>
                <span style={{ color: 'var(--accent-red)' }}>Expense / Outflow Ratio ({totalInflows > 0 ? Math.min(100, Math.round((totalOutflows / totalInflows) * 100)) : 100}%)</span>
              </div>
              
              {/* Dual HSL Progress track bar */}
              <div style={{ height: 12, borderRadius: 999, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${totalInflows > 0 ? Math.max(0, Math.round(((totalInflows - totalOutflows) / totalInflows) * 100)) : 0}%`, 
                    background: 'linear-gradient(90deg, hsl(158,64%,40%), hsl(158,64%,52%))',
                    transition: 'width 0.5s ease-in-out'
                  }} 
                />
                <div 
                  style={{ 
                    width: `${totalInflows > 0 ? Math.min(100, Math.round((totalOutflows / totalInflows) * 100)) : 100}%`, 
                    background: 'linear-gradient(90deg, hsl(4,86%,55%), hsl(4,86%,65%))',
                    transition: 'width 0.5s ease-in-out'
                  }} 
                />
              </div>
            </div>

            {/* Subtext info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-overlay)', padding: 14, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ lineHeight: 1.5 }}>
                <strong>Inflow Retention:</strong> For every ₹100 taken in from sales, you kept ₹{totalInflows > 0 ? Math.max(0, ((totalInflows - totalOutflows) / totalInflows) * 100).toFixed(0) : '0'} as net cash profit today.
              </div>
              <div style={{ lineHeight: 1.5 }}>
                <strong>Expense Burn:</strong> Outflows and operational cash expenses consumed {totalInflows > 0 ? ((totalOutflows / totalInflows) * 100).toFixed(0) : '100'}% of today's incoming gross revenue.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Audit Logs */}
      <div style={S.mainCard}>
        <h3 style={S.sectionTitle}>
          <ClipboardList size={16} color="var(--primary)" />
          {t('auditLogs')} — {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </h3>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Compiling reconciliation logs...</div>
        ) : unifiedLogs.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>{t('noDaybookLogs')}</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>{t('noDaybookLogsSub')}</p>
          </div>
        ) : (
          <div style={S.tableContainer}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>{t('timestamp')}</th>
                  <th style={S.th}>{t('type')}</th>
                  <th style={S.th}>{t('event')}</th>
                  <th style={S.th}>{t('recordedBy')}</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>{t('outflowInflow')}</th>
                </tr>
              </thead>
              <tbody>
                {unifiedLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={S.td}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {new Date(log.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: log.type === 'sale' ? 'hsla(158,64%,52%,0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: log.type === 'sale' ? 'var(--accent-emerald)' : 'var(--accent-red)',
                        border: log.type === 'sale' ? '1px solid hsla(158,64%,52%,0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        {log.type === 'sale' ? t('live') : 'Kharcha'}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{log.description}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {log.user}
                      </span>
                    </td>
                    <td style={{
                      ...S.td,
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: log.type === 'sale' ? 'var(--accent-emerald)' : 'var(--accent-red)'
                    }}>
                      {log.type === 'sale' ? '+' : ''}₹{log.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayBook;
