import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { IndianRupee, PlusCircle, Trash2, Calendar, FileText, Sparkles } from 'lucide-react';

/* ── Inline Design System Styles ────────────────────────── */
const S = {
  container: { display: 'flex', flexDirection: 'column' as const, gap: 28, paddingBottom: 48 },
  header: { display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)' },
  headerIcon: { width: 48, height: 48, borderRadius: 14, background: 'var(--primary-subtle)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 28, alignItems: 'flex-start' },
  card: { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-secondary)' },
  input: { width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' },
  pillContainer: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 4 },
  pill: (active: boolean) => ({
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: active ? 'var(--primary)' : 'var(--bg-overlay)',
    color: active ? 'white' : 'var(--text-secondary)',
    border: active ? '1px solid transparent' : '1px solid var(--border-subtle)',
  }),
  button: { width: '100%', padding: 12, borderRadius: 10, background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: 'var(--shadow-button)', transition: 'all 0.2s' },
  tableContainer: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, textAlign: 'left' as const },
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' },
  td: { padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' },
  deleteBtn: { padding: 8, background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, transition: 'all 0.2s' }
};

const CATEGORY_PILLS = ['Chai / Snacks', 'Stationery', 'Labour', 'Petrol / Commute', 'Shop Rent', 'Electricity Bill', 'Repairs', 'Misc'];

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      if ((window as any).electronAPI?.getExpenses) {
        const data = await (window as any).electronAPI.getExpenses();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;

    setIsSubmitting(true);
    try {
      if ((window as any).electronAPI?.addExpense) {
        await (window as any).electronAPI.addExpense({
          userId: user?.id || 1,
          amount: Number(amount),
          description: description.trim()
        });
        setAmount('');
        setDescription('');
        fetchExpenses();
      }
    } catch (err) {
      console.error('Failed to record expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('confirmDeleteExp'))) return;
    try {
      if ((window as any).electronAPI?.deleteExpense) {
        await (window as any).electronAPI.deleteExpense(id);
        fetchExpenses();
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerIcon}>
          <IndianRupee size={22} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{t('expensesTracker')}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('expensesSub')}</p>
        </div>
      </div>

      <div style={S.grid}>
        {/* Left Column: Form Card */}
        <form onSubmit={handleSubmit} style={S.card}>
          <h3 style={S.sectionTitle}>
            <PlusCircle size={16} color="var(--primary)" />
            {t('recordOutflow')}
          </h3>

          <div style={S.formGroup}>
            <label style={S.label}>{t('expenseAmount')}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 150"
              style={S.input}
              min="1"
              required
            />
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>{t('outflowDescription')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              style={S.input}
              required
            />
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>{t('quickPresets')}</label>
            <div style={S.pillContainer}>
              {CATEGORY_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setDescription(pill)}
                  style={S.pill(description === pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} style={S.button}>
            <Sparkles size={14} />
            {isSubmitting ? t('recording') : t('recordBtn')}
          </button>
        </form>

        {/* Right Column: Ledger List Card */}
        <div style={S.card}>
          <h3 style={S.sectionTitle}>
            <FileText size={16} color="var(--primary)" />
            {t('recentActivity')}
          </h3>

          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading logs...</div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <IndianRupee size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>{t('noOutflows')}</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>{t('noOutflowsSub')}</p>
            </div>
          ) : (
            <div style={S.tableContainer}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>{t('timestamp')}</th>
                    <th style={S.th}>{t('description')}</th>
                    <th style={S.th}>{t('recordedBy')}</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>{t('amount')}</th>
                    {user?.role === 'Admin' && <th style={{ ...S.th, width: 50 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          <Calendar size={12} />
                          {new Date(exp.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{exp.description}</td>
                      <td style={S.td}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {exp.user || 'system'}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                        -₹{exp.amount.toFixed(2)}
                      </td>
                      {user?.role === 'Admin' && (
                        <td style={S.td}>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            style={S.deleteBtn}
                            title="Delete Expense Log"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
