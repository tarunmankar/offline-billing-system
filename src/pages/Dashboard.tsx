// Client-side HMR cache invalidation trace
import React from 'react';
import { useConfig } from '../context/ConfigContext';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { config, loading } = useConfig();

  if (loading) return <div className="flex h-screen items-center justify-center text-white bg-slate-950">Loading...</div>;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {config?.shop_info.name || 'Billing Pro'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
            {config?.shop_info.type}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          {config?.features.barcode_scanner !== false && (
            <NavItem icon={<ShoppingCart size={20} />} label="New Bill" />
          )}
          {config?.features.inventory_management && (
            <NavItem icon={<Package size={20} />} label="Inventory" />
          )}
          {config?.features.user_auth && (
            <NavItem icon={<Users size={20} />} label="Users" />
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-950 p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-white">Welcome back, Admin</h2>
          <p className="text-slate-400">Here's what's happening today in your {config?.shop_info.type || 'shop'}.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Today's Sales" value="₹ 12,450" change="+12%" />
          <StatCard title="Items Sold" value="45" change="+5%" />
          <StatCard title="Active Customers" value="28" change="+2%" />
        </div>

        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-bold text-white mb-4">Quick Config Check</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                 <p className="text-xs text-slate-500">Tax Label</p>
                 <p className="text-white font-mono">{config?.shop_info.tax_label}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                 <p className="text-xs text-slate-500">Print Format</p>
                 <p className="text-white font-mono">{config?.billing_settings.print_format}</p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
    active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`}>
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, change }: { title: string, value: string, change: string }) => (
  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <div className="flex items-end gap-3 mt-2">
      <span className="text-3xl font-bold text-white">{value}</span>
      <span className="text-emerald-400 text-sm font-bold mb-1">{change}</span>
    </div>
  </div>
);

export default Dashboard;
