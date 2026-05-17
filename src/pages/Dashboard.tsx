// Client-side HMR cache invalidation trace
import React from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, Shield } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { config, loading: configLoading } = useConfig();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'Admin';

  if (configLoading) {
    return <div className="flex h-screen items-center justify-center text-white bg-slate-950">Loading config...</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Shop Header */}
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold text-white tracking-tight truncate">
              {config?.shop_info.name || 'Billing Pro'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              {config?.shop_info.type}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
            {config?.features.barcode_scanner !== false && (
              <NavItem icon={<ShoppingCart size={20} />} label="New Bill" />
            )}
            {config?.features.inventory_management && (
              <NavItem icon={<Package size={20} />} label="Inventory" />
            )}
            
            {/* Admin-only Nav Items */}
            {config?.features.user_auth && isAdmin && (
              <NavItem icon={<Users size={20} />} label="Users" />
            )}
          </nav>
        </div>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-slate-800 space-y-1.5 bg-slate-950/40">
          {isAdmin && (
            <NavItem icon={<Settings size={20} />} label="Settings" />
          )}
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer font-medium text-sm"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 bg-slate-950 p-8 overflow-y-auto">
        <header className="mb-8 flex items-center justify-between border-b border-slate-800/60 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Welcome back, {user?.username || 'Operator'}
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Shield size={12} />
                {user?.role || 'Guest'}
              </span>
            </h2>
            <p className="text-slate-400 mt-1">Here's what's happening today in your {config?.shop_info.type || 'shop'}.</p>
          </div>
          <div className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
            📶 100% Offline Secured
          </div>
        </header>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Today's Sales" value="₹ 12,450" change="+12%" />
          <StatCard title="Items Sold" value="45" change="+5%" />
          <StatCard title="Active Customers" value="28" change="+2%" />
        </div>

        {/* Dynamic Config Context Check */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg shadow-black/25">
           <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
             ⚙️ Dynamic Setup Check
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                 <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tax Identifier</p>
                 <p className="text-white font-mono mt-1 font-bold">{config?.shop_info.tax_label}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                 <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Default Invoice Print Format</p>
                 <p className="text-white font-mono mt-1 font-bold">{config?.billing_settings.print_format}</p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
    active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`}>
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, change }: { title: string, value: string, change: string }) => (
  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-md">
    <h3 className="text-slate-400 text-sm font-medium tracking-wide">{title}</h3>
    <div className="flex items-end gap-3 mt-2">
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      <span className="text-emerald-400 text-sm font-bold mb-1">{change}</span>
    </div>
  </div>
);

export default Dashboard;
