import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings as SettingsIcon, LogOut, Shield } from 'lucide-react';
import DynamicForm from '../components/DynamicForm';
import Inventory from './Inventory';
import Billing from './Billing';
import ExpiryAlert from '../components/ExpiryAlert';
import Settings from './Settings';

const Dashboard: React.FC = () => {
  const { config, loading: configLoading } = useConfig();
  const { user, logout } = useAuth();
  
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'new-bill' | 'inventory' | 'settings' | 'users'>('dashboard');
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});

  const isAdmin = user?.role === 'Admin';

  if (configLoading) {
    return <div className="flex h-screen items-center justify-center text-white bg-slate-950">Loading config...</div>;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'inventory':
        return <Inventory />;
      case 'new-bill':
        return <Billing />;
      case 'settings':
        return <Settings />;
      case 'users':
        return (
          <div className="theme-card-solid border rounded-xl p-8 shadow-lg transition-theme text-center max-w-2xl mx-auto mt-10">
            <Users className="text-emerald-500 mx-auto mb-4 opacity-80" size={48} />
            <h3 className="text-xl font-bold mb-2">User Authorization Panel</h3>
            <p className="theme-text-secondary text-sm">Under development. Manage cashier roles, verify offline credentials, and define operational restrictions.</p>
          </div>
        );
      case 'dashboard':
      default:
        return (
          <>
            {/* Dashboard Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Today's Sales" value="₹ 12,450" change="+12%" />
              <StatCard title="Items Sold" value="45" change="+5%" />
              <StatCard title="Active Customers" value="28" change="+2%" />
            </div>

            {/* Active Shelf Alerts */}
            <div className="mt-8">
              <ExpiryAlert />
            </div>

            {/* Dynamic Config Context Check */}
            <div className="mt-8 theme-card-solid border rounded-xl p-6 shadow-lg transition-theme">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2 transition-theme">
                 ⚙️ Dynamic Setup Check
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 theme-input rounded-lg border transition-theme">
                     <p className="text-xs theme-text-secondary opacity-80 font-semibold uppercase tracking-wider transition-theme">Tax Identifier</p>
                     <p className="font-mono mt-1 font-bold transition-theme">{config?.shop_info.tax_label}</p>
                  </div>
                  <div className="p-4 theme-input rounded-lg border transition-theme">
                     <p className="text-xs theme-text-secondary opacity-80 font-semibold uppercase tracking-wider transition-theme">Default Invoice Print Format</p>
                     <p className="font-mono mt-1 font-bold transition-theme">{config?.billing_settings.print_format}</p>
                  </div>
               </div>
            </div>

            {/* Dynamic Form Preview */}
            {config?.custom_fields && config.custom_fields.length > 0 && (
              <div className="mt-8 mb-4">
                <DynamicForm 
                  fields={config.custom_fields as any}
                  values={formValues}
                  onChange={(key, value) => setFormValues(prev => ({ ...prev, [key]: value }))}
                  title="Dynamic Config Fields (Preview)"
                  description="These fields are instantly generated strictly from your config.json custom_fields array."
                />
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden theme-bg font-sans transition-theme">
      {/* Sidebar */}
      <aside className="w-64 theme-sidebar border-r flex flex-col justify-between shrink-0 transition-theme">
        <div>
          {/* Shop Header */}
          <div className="p-6 border-b theme-border transition-theme">
            <h1 className="text-xl font-bold text-[var(--text-color)] tracking-tight truncate transition-theme">
              {config?.shop_info.name || 'Billing Pro'}
            </h1>
            <p className="text-xs theme-text-secondary mt-1 uppercase tracking-widest font-semibold transition-theme">
              {config?.shop_info.type}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentTab === 'dashboard'} 
              onClick={() => setCurrentTab('dashboard')}
            />
            {config?.features.barcode_scanner !== false && (
              <NavItem 
                icon={<ShoppingCart size={20} />} 
                label="New Bill" 
                active={currentTab === 'new-bill'} 
                onClick={() => setCurrentTab('new-bill')}
              />
            )}
            {config?.features.inventory_management && (
              <NavItem 
                icon={<Package size={20} />} 
                label="Inventory" 
                active={currentTab === 'inventory'} 
                onClick={() => setCurrentTab('inventory')}
              />
            )}
            
            {/* Admin-only Nav Items */}
            {config?.features.user_auth && isAdmin && (
              <NavItem 
                icon={<Users size={20} />} 
                label="Users" 
                active={currentTab === 'users'} 
                onClick={() => setCurrentTab('users')}
              />
            )}
          </nav>
        </div>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t theme-border space-y-1.5 bg-black/5 transition-theme">
          {isAdmin && (
            <NavItem 
              icon={<SettingsIcon size={20} />} 
              label="Settings" 
              active={currentTab === 'settings'} 
              onClick={() => setCurrentTab('settings')}
            />
          )}
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg theme-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-theme cursor-pointer font-medium text-sm"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 theme-bg p-8 overflow-y-auto transition-theme">
        <header className="mb-8 flex items-center justify-between border-b theme-header-border pb-6 transition-theme">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 transition-theme">
              Welcome back, {user?.username || 'Operator'}
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                <Shield size={12} />
                {user?.role || 'Guest'}
              </span>
            </h2>
            <p className="theme-text-secondary mt-1 transition-theme">Here's what's happening today in your {config?.shop_info.type || 'shop'}.</p>
          </div>
          <div className="text-right text-xs font-semibold theme-text-secondary uppercase tracking-wider transition-theme">
            📶 100% Offline Secured
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-theme text-sm font-medium cursor-pointer ${
      active 
        ? 'text-white shadow-lg shadow-black/10' 
        : 'theme-text-secondary hover:bg-[var(--nav-hover)] hover:text-[var(--text-color)]'
    }`}
    style={active ? { backgroundColor: 'var(--primary)' } : undefined}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, change }: { title: string, value: string, change: string }) => (
  <div className="theme-card-solid p-6 rounded-xl border shadow-md transition-theme">
    <h3 className="theme-text-secondary text-sm font-medium tracking-wide transition-theme">{title}</h3>
    <div className="flex items-end gap-3 mt-2">
      <span className="text-3xl font-bold tracking-tight transition-theme">{value}</span>
      <span className="text-emerald-500 text-sm font-bold mb-1">{change}</span>
    </div>
  </div>
);

export default Dashboard;
