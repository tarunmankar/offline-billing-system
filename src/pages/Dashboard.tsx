import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  Settings as SettingsIcon, LogOut, Shield, BookOpen,
  TrendingUp, IndianRupee, ShoppingBag, WifiOff, ChevronRight, Zap, Bell,
  Receipt
} from 'lucide-react';
import Inventory from './Inventory';
import Billing from './Billing';
import SalesLedger from './SalesLedger';
import ExpiryAlert from '../components/ExpiryAlert';
import Settings from './Settings';
import Expenses from './Expenses';
import DayBook from './DayBook';

type TabType = 'dashboard' | 'new-bill' | 'inventory' | 'settings' | 'users' | 'ledger' | 'expenses' | 'daybook';

/* ── Inline Style Constants ─────────────────────────────── */
const S = {
  sidebar: {
    width: 256, background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column' as const,
    flexShrink: 0, height: '100vh',
  },
  sidebarBrand: {
    padding: '28px 24px 24px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex', alignItems: 'center', gap: 14,
  },
  sidebarBrandIcon: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--primary-subtle)', border: '1px solid var(--border-glow)',
  },
  nav: { flex: 1, padding: '20px 16px', overflowY: 'auto' as const },
  navGroup: { marginBottom: 24 },
  navGroupLabel: {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.1em', color: 'var(--text-muted)',
    padding: '0 12px', marginBottom: 8, display: 'block',
  },
  navItem: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '13px 16px', borderRadius: 12, fontSize: 14,
    fontWeight: active ? 600 : 500, width: '100%', textAlign: 'left',
    cursor: 'pointer', border: '1px solid transparent',
    marginBottom: 4, transition: 'all 0.18s ease',
    background: active ? 'var(--nav-active-bg)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-secondary)',
    borderColor: active ? 'var(--nav-active-border)' : 'transparent',
    boxShadow: active ? 'inset 3px 0 0 var(--primary)' : 'none',
  }),
  userChip: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 14, marginBottom: 8,
    background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
  },
  userAvatar: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--primary)', color: '#fff',
    fontWeight: 700, fontSize: 16,
  },
  header: {
    padding: '20px 40px', borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  content: { flex: 1, overflowY: 'auto' as const, padding: '36px 40px' },
  statCard: {
    position: 'relative' as const, overflow: 'hidden',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 20, padding: '28px 28px 24px',
    cursor: 'default', transition: 'all 0.3s ease',
  },
  card: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 20, overflow: 'hidden',
  },
};

const Dashboard: React.FC = () => {
  const { config, loading: configLoading } = useConfig();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState({ salesToday: 0, itemsSold: 0, transactions: 0 });
  const isAdmin = user?.role === 'Admin';

  React.useEffect(() => {
    const fetchStats = async () => {
      if ((window as any).electronAPI?.getSales) {
        const sales = await (window as any).electronAPI.getSales();
        const today = new Date().toDateString();
        const todaysSales = sales.filter((s: any) => new Date(s.date).toDateString() === today);
        setStats({
          salesToday: todaysSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0),
          itemsSold:  todaysSales.reduce((sum: number, s: any) => sum + Number(s.items_count), 0),
          transactions: todaysSales.length,
        });
      }
    };
    fetchStats();
  }, [currentTab]);

  if (configLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>Initializing...</span>
        </div>
      </div>
    );
  }

  const navGroups = [
    {
      label: language === 'hi' ? 'मुख्य' : 'Main',
      items: [
        { id: 'dashboard' as TabType, icon: <LayoutDashboard size={18} />, label: t('dashboard') },
        { id: 'ledger'    as TabType, icon: <BookOpen size={18} />,        label: t('ledger') },
        ...(config?.features.barcode_scanner !== false
          ? [{ id: 'new-bill'  as TabType, icon: <ShoppingCart size={18} />, label: t('newBill') }] : []),
        ...(config?.features.inventory_management
          ? [{ id: 'inventory' as TabType, icon: <Package size={18} />, label: t('inventory') }] : []),
        { id: 'expenses'  as TabType, icon: <IndianRupee size={18} />,     label: t('expenses') },
        { id: 'daybook'   as TabType, icon: <Receipt size={18} />,         label: t('daybook') },
      ],
    },
    ...(isAdmin ? [{
      label: language === 'hi' ? 'प्रशासन' : 'Admin',
      items: [
        ...(config?.features.user_auth ? [{ id: 'users' as TabType, icon: <Users size={18} />, label: t('users') }] : []),
        { id: 'settings' as TabType, icon: <SettingsIcon size={18} />, label: t('settings') },
      ],
    }] : []),
  ];

  const renderContent = () => {
    switch (currentTab) {
      case 'inventory': return <Inventory />;
      case 'new-bill':  return <Billing />;
      case 'settings':  return <Settings />;
      case 'ledger':    return <SalesLedger />;
      case 'expenses':  return <Expenses />;
      case 'daybook':   return <DayBook />;
      case 'users':
        return (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...S.card, padding: '64px 48px', textAlign: 'center', maxWidth: 480, margin: '48px auto' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'hsla(158,64%,52%,0.1)', border: '1px solid hsla(158,64%,52%,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Users size={36} color="var(--accent-emerald)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>User Authorization Panel</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Manage cashier roles and offline credentials. Coming in Phase 6.</p>
          </motion.div>
        );
      default:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
 
            {/* Greeting Banner */}
            <div style={{
              borderRadius: 20, padding: '32px 36px', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, var(--primary-subtle) 0%, hsla(262,80%,65%,0.06) 100%)',
              border: '1px solid var(--border-glow)',
            }}>
              <div style={{ position: 'absolute', top: -48, right: -48, width: 220, height: 220, borderRadius: '50%', background: 'var(--primary-glow)', filter: 'blur(60px)', opacity: 0.6, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={12} color="var(--primary)" />
                    {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 10 }}>
                    {t('welcomeBack')}, <span style={{ color: 'var(--primary)' }}>{user?.username || 'Operator'}</span> 👋
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {config?.shop_info?.type ? config.shop_info.type.charAt(0).toUpperCase() + config.shop_info.type.slice(1) : 'Shop'} Terminal — {t('allSystemsOperational')}.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, padding: '10px 18px', borderRadius: 12, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  <WifiOff size={14} color="var(--accent-emerald)" />
                  {t('offlineStatus')}
                </div>
              </div>
            </div>
 
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <StatCard label={t('revenueToday')} value={`₹${stats.salesToday.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                icon={<IndianRupee size={22} />} color="var(--primary)" glow="var(--primary-glow)" subtle="var(--primary-subtle)" badge={t('live')} />
              <StatCard label={t('itemsSoldToday')} value={stats.itemsSold.toString()}
                icon={<ShoppingBag size={22} />} color="var(--accent-emerald)" glow="hsla(158,64%,52%,0.3)" subtle="hsla(158,64%,52%,0.1)" badge={t('today')} />
              <StatCard label={t('transactionsToday')} value={stats.transactions.toString()}
                icon={<TrendingUp size={22} />} color="var(--accent-purple)" glow="hsla(262,80%,65%,0.3)" subtle="hsla(262,80%,65%,0.1)" badge={t('bills')} />
            </div>
 
            {/* Alerts */}
            <ExpiryAlert />
 
            {/* Config */}
            <div style={S.card}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <SettingsIcon size={15} color="var(--primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>{t('activeConfig')}</span>
              </div>
              <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: t('taxIdentifier'),  value: config?.shop_info.tax_label },
                  { label: t('printFormat'),    value: config?.billing_settings.print_format },
                  { label: t('shopType'),       value: config?.shop_info.type },
                  { label: t('themeMode'),      value: config?.theme.mode },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px 20px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{item.label}</p>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        {/* Brand */}
        <div style={S.sidebarBrand}>
          <div style={S.sidebarBrandIcon}>
            <Zap size={20} color="var(--primary)" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h1 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
              {config?.shop_info.name || 'Billing Pro'}
            </h1>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
              {config?.shop_info.type}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav style={S.nav}>
          {navGroups.map(group => (
            <div key={group.label} style={S.navGroup}>
              <span style={S.navGroupLabel}>{group.label}</span>
              {group.items.map(item => (
                <button key={item.id} onClick={() => setCurrentTab(item.id)} style={S.navItem(currentTab === item.id)}>
                  <span style={{ display: 'flex', alignItems: 'center', width: 20, height: 20, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {currentTab === item.id && <ChevronRight size={14} color="var(--primary)" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div style={{ padding: '16px 16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={S.userChip}>
            <div style={S.userAvatar}>{user?.username?.charAt(0).toUpperCase()}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</p>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'var(--primary-subtle)', color: 'var(--primary)', border: '1px solid hsla(221,83%,53%,0.3)' }}>{user?.role === 'Admin' ? t('admin') : t('cashier')}</span>
            </div>
          </div>
          <button
            onClick={logout}
            style={{ ...S.navItem(false), marginBottom: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsla(4,86%,58%,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(4,86%,65%)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            <LogOut size={18} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={S.header}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize', marginBottom: 4 }}>
              {currentTab === 'new-bill' ? t('newBill') : currentTab === 'ledger' ? t('ledger') : currentTab === 'inventory' ? t('inventory') : currentTab === 'expenses' ? t('expenses') : currentTab === 'daybook' ? t('daybook') : currentTab === 'settings' ? t('settings') : currentTab}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {config?.shop_info.name} — {new Date().toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Language Switcher Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 3, gap: 2 }}>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: language === 'en' ? 'var(--primary)' : 'transparent',
                  color: language === 'en' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: language === 'hi' ? 'var(--primary)' : 'transparent',
                  color: language === 'hi' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                हिन्दी
              </button>
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
            <button style={{ position: 'relative', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)' }} />
            </button>
            <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <Shield size={13} color="var(--accent-emerald)" />
              {user?.role === 'Admin' ? t('admin') : t('cashier')}
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={S.content}>
          <AnimatePresence mode="wait">
            <motion.div key={currentTab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

/* ── STAT CARD ── */
const StatCard = ({ label, value, icon, color, glow, subtle, badge }: { label: string; value: string; icon: React.ReactNode; color: string; glow: string; subtle: string; badge: string }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        ...S.statCard,
        borderColor: hovered ? 'var(--border-glow)' : 'var(--border-subtle)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 32px -8px ${glow}` : 'var(--shadow-card)',
      }}
    >
      {/* BG accent */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, transparent 50%, ${subtle})`, pointerEvents: 'none' }} />
      {/* Icon */}
      <div style={{ position: 'absolute', top: 24, right: 24, width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: subtle, border: `1px solid ${glow}`, color }}>
        {icon}
      </div>
      {/* Label */}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 12, position: 'relative' }}>{label}</p>
      {/* Value */}
      <p style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1, position: 'relative', marginBottom: 16 }}>{value}</p>
      {/* Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{badge}</span>
      </div>
    </motion.div>
  );
};

export default Dashboard;
