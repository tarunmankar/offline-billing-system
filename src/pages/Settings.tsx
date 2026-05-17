import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Settings as SettingsIcon, Save, Database, Trash2, ShieldAlert, Sparkles, Check, Upload } from 'lucide-react';

export default function Settings() {
  const { config } = useConfig();
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(JSON.parse(JSON.stringify(config))); // Deep copy
    }
  }, [config]);

  if (!formData) {
    return <div className="text-center py-12 theme-text-secondary">Loading system settings...</div>;
  }

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await (window as any).electronAPI.updateConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        window.location.reload(); // Reload to fully re-hydrate all state and contexts
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings configurations.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupDB = async () => {
    setIsBackingUp(true);
    try {
      const backupPath = await (window as any).electronAPI.backupDatabase();
      alert(`Database successfully backed up!\n\nLocation:\n${backupPath}`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to complete database backup: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm('⚠️ WARNING: You are restoring a database backup.\n\nThis will completely overwrite your current inventory catalog, active settings, and sales transactions history with the backup file data. This action cannot be undone.\n\nAre you sure you want to proceed?');
    if (!confirmRestore) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);

        if (!backupData.products || !Array.isArray(backupData.products)) {
          throw new Error('Invalid backup schema: Missing products list.');
        }

        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.restoreDatabase) {
          // Native Electron Restore
          await electronAPI.restoreDatabase(backupData);
        } else {
          // Web Browser fallback restore
          if (backupData.products) {
            localStorage.setItem('mock_products', JSON.stringify(backupData.products));
          }
          if (backupData.config) {
            localStorage.setItem('mock_config', JSON.stringify(backupData.config));
          }
          if (backupData.sales) {
            localStorage.setItem('mock_sales', JSON.stringify(backupData.sales));
          }
        }

        alert('🎉 Database successfully restored from backup! Application reloading...');
        window.location.reload();
      } catch (err: any) {
        console.error(err);
        alert(`Failed to restore backup: ${err.message || 'Invalid JSON syntax.'}`);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = async () => {
    const confirm1 = window.confirm('⚠️ WARNING: You are initiating a Factory Reset.\n\nThis will completely wipe your local database, sales logs, inventory, and dynamic configurations. This action CANNOT be undone.\n\nAre you sure you want to proceed?');
    if (!confirm1) return;

    const confirm2 = window.prompt('Type "RESET" to confirm permanent wiping of this billing terminal:');
    if (!confirm2 || confirm2.trim().toUpperCase() !== 'RESET') {
      alert('Factory reset cancelled.');
      return;
    }

    setIsResetting(true);
    try {
      await (window as any).electronAPI.resetDatabase();
    } catch (err: any) {
      console.error(err);
      alert(`Factory reset failed: ${err.message}`);
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b pb-4 theme-border transition-theme">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--text-color)] transition-theme">
            <SettingsIcon className="text-primary animate-spin-slow" size={26} />
            System Control Panel
          </h2>
          <p className="theme-text-secondary text-sm mt-1">Configure shop profile, printer presets, dynamic brand themes, and manage database operations.</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Form configurations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shop Profile */}
          <div className="theme-card-solid border rounded-xl p-6 shadow-md transition-theme space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-color)] border-b pb-2 theme-border transition-theme">
              🏪 Shop Profile Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Shop Name</label>
                <input 
                  type="text" 
                  value={formData.shop_info.name} 
                  onChange={(e) => handleInputChange('shop_info', 'name', e.target.value)}
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Shop Type / Sector</label>
                <select 
                  value={formData.shop_info.type}
                  onChange={(e) => handleInputChange('shop_info', 'type', e.target.value)}
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="pharmacy">Pharmacy / Healthcare</option>
                  <option value="grocery">Grocery / Supermarket</option>
                  <option value="electronics">Electronics Shop</option>
                  <option value="retail">General Retail</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Contact Number</label>
                <input 
                  type="text" 
                  value={formData.shop_info.phone || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'phone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Tax / VAT Label</label>
                <input 
                  type="text" 
                  value={formData.shop_info.tax_label} 
                  onChange={(e) => handleInputChange('shop_info', 'tax_label', e.target.value)}
                  placeholder="e.g. GST, CGST/SGST, VAT"
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">GSTIN Number</label>
                <input 
                  type="text" 
                  value={formData.shop_info.gstin || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'gstin', e.target.value)}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Drug License (D.L.) Number</label>
                <input 
                  type="text" 
                  value={formData.shop_info.dl_number || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'dl_number', e.target.value)}
                  placeholder="e.g. DL-20B-12345, DL-21B-12345"
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Detailed Address (Prints in Header)</label>
                <textarea 
                  value={formData.shop_info.address || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'address', e.target.value)}
                  placeholder="Enter complete physical store location"
                  rows={2}
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Bill Footer Terms / Disclaimer / Return Policy</label>
                <input 
                  type="text" 
                  value={formData.shop_info.return_policy || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'return_policy', e.target.value)}
                  placeholder="e.g. Medicines once sold cannot be returned."
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Billing Preferences */}
          <div className="theme-card-solid border rounded-xl p-6 shadow-md transition-theme space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-color)] border-b pb-2 theme-border transition-theme">
              🧾 Billing & Invoice Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Default Print Format</label>
                <select 
                  value={formData.billing_settings.print_format}
                  onChange={(e) => handleInputChange('billing_settings', 'print_format', e.target.value)}
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="A4">Standard A4 Sheet</option>
                  <option value="thermal">Thermal Roll (80mm / ESC/POS)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Default Tax Percent (%)</label>
                <input 
                  type="number" 
                  value={formData.billing_settings.default_tax_percent || 18} 
                  onChange={(e) => handleInputChange('billing_settings', 'default_tax_percent', Number(e.target.value))}
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="roundOff"
                  checked={formData.billing_settings.round_off} 
                  onChange={(e) => handleInputChange('billing_settings', 'round_off', e.target.checked)}
                  className="h-4 w-4 rounded border theme-border text-primary focus:ring-primary"
                />
                <label htmlFor="roundOff" className="text-sm font-medium theme-text-secondary cursor-pointer">Round-off final amount to nearest rupee</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="taxBreakdown"
                  checked={formData.billing_settings.tax_breakdown} 
                  onChange={(e) => handleInputChange('billing_settings', 'tax_breakdown', e.target.checked)}
                  className="h-4 w-4 rounded border theme-border text-primary focus:ring-primary"
                />
                <label htmlFor="taxBreakdown" className="text-sm font-medium theme-text-secondary cursor-pointer">Show complete CGST / SGST breakdowns</label>
              </div>
            </div>
          </div>

          {/* Theme Preferences */}
          <div className="theme-card-solid border rounded-xl p-6 shadow-md transition-theme space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-color)] border-b pb-2 theme-border transition-theme">
              🎨 Dynamic Custom Branding & Theme
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">App Core Mode</label>
                <select 
                  value={formData.theme.mode}
                  onChange={(e) => handleInputChange('theme', 'mode', e.target.value)}
                  className="w-full text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="dark">Vibrant Dark Mode</option>
                  <option value="light">Premium Light Mode</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 theme-text-secondary">Primary Branding Color</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={formData.theme.primary_color} 
                    onChange={(e) => handleInputChange('theme', 'primary_color', e.target.value)}
                    className="h-10 w-16 border rounded cursor-pointer p-0 bg-transparent transition-theme theme-border"
                  />
                  <input 
                    type="text"
                    value={formData.theme.primary_color}
                    onChange={(e) => handleInputChange('theme', 'primary_color', e.target.value)}
                    className="flex-1 text-sm p-2 rounded border theme-border theme-card-solid transition-theme focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Settings Trigger */}
          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full py-3 rounded-lg font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                : 'bg-primary hover:bg-primary/95 text-white active:scale-[0.99]'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check size={18} /> Configuration Saved! Updating System...
              </>
            ) : (
              <>
                <Save size={18} />
                {isSaving ? 'Saving Configurations...' : 'Save & Reload Terminal'}
              </>
            )}
          </button>
        </div>

        {/* Right Column - Database Operations & Resets */}
        <div className="space-y-6">
          
          {/* Active Features Checklist */}
          <div className="theme-card-solid border rounded-xl p-6 shadow-md transition-theme space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-color)] border-b pb-2 theme-border transition-theme">
              ⚙️ Dynamic System Modules
            </h3>
            <div className="space-y-3">
              {Object.keys(formData.features).map((featureKey) => (
                <div key={featureKey} className="flex items-center justify-between p-2 rounded bg-black/10">
                  <span className="text-xs font-bold capitalize tracking-wider theme-text-secondary">
                    {featureKey.replace('_', ' ')}
                  </span>
                  <input 
                    type="checkbox"
                    checked={formData.features[featureKey]}
                    onChange={(e) => {
                      setFormData((prev: any) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          [featureKey]: e.target.checked
                        }
                      }));
                    }}
                    className="h-4 w-4 rounded border theme-border text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Safe Database Operations */}
          <div className="theme-card-solid border rounded-xl p-6 shadow-md transition-theme border-yellow-500/10 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-color)] border-b pb-2 theme-border transition-theme">
              <Database className="text-yellow-500" size={18} />
              Database Operations
            </h3>
            <p className="theme-text-secondary text-xs leading-relaxed">
              Ensure data integrity. Wrote dynamic WAL journaling that backs up complete SQLite transactions locally to a secondary path.
            </p>
            
            <button
              type="button"
              onClick={handleBackupDB}
              disabled={isBackingUp}
              className="w-full py-2.5 rounded border border-yellow-500/35 hover:bg-yellow-500/10 text-yellow-500 font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} className={isBackingUp ? 'animate-pulse' : ''} />
              {isBackingUp ? 'Creating Stamped Copy...' : 'Backup SQLite Database'}
            </button>

            <div className="border-t theme-border pt-4 mt-2">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 theme-text-secondary">Restore Backup (.json)</label>
              <input 
                type="file" 
                accept=".json"
                onChange={handleRestoreDB}
                className="hidden"
                id="restore-db-upload"
              />
              <label
                htmlFor="restore-db-upload"
                className="w-full py-2.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Upload size={14} />
                Upload & Restore Backup File
              </label>
            </div>
          </div>

          {/* Wiping & Factory Resets */}
          <div className="theme-card-solid border rounded-xl p-6 shadow-md transition-theme border-red-500/20 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-red-500 border-b pb-2 border-red-500/10 transition-theme">
              <ShieldAlert className="text-red-500" size={18} />
              Danger Zone
            </h3>
            <p className="theme-text-secondary text-xs leading-relaxed">
              Factory reset completely destroys all local database states, inventory lists, sales logs, and wrings configuration files back to system defaults.
            </p>
            
            <button
              type="button"
              onClick={handleFactoryReset}
              disabled={isResetting}
              className="w-full py-2.5 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-transparent font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} className={isResetting ? 'animate-bounce' : ''} />
              {isResetting ? 'Wiping System...' : 'Perform Factory Reset'}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
