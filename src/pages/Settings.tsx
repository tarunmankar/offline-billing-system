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
    return <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>Loading system settings...</div>;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-subtle)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SettingsIcon size={22} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>System Control Panel</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Configure shop profile, printer presets, themes, and database operations.</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Shop Profile */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏪 Shop Profile Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Shop Name</label>
                <input 
                  type="text" 
                  value={formData.shop_info.name} 
                  onChange={(e) => handleInputChange('shop_info', 'name', e.target.value)}
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Shop Type / Sector</label>
                <select 
                  value={formData.shop_info.type}
                  onChange={(e) => handleInputChange('shop_info', 'type', e.target.value)}
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                >
                  <option value="pharmacy">Pharmacy / Healthcare</option>
                  <option value="grocery">Grocery / Supermarket</option>
                  <option value="electronics">Electronics Shop</option>
                  <option value="retail">General Retail</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Contact Number</label>
                <input 
                  type="text" 
                  value={formData.shop_info.phone || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'phone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Tax / VAT Label</label>
                <input 
                  type="text" 
                  value={formData.shop_info.tax_label} 
                  onChange={(e) => handleInputChange('shop_info', 'tax_label', e.target.value)}
                  placeholder="e.g. GST, CGST/SGST, VAT"
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>GSTIN Number</label>
                <input 
                  type="text" 
                  value={formData.shop_info.gstin || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'gstin', e.target.value)}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Drug License (D.L.) Number</label>
                <input 
                  type="text" 
                  value={formData.shop_info.dl_number || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'dl_number', e.target.value)}
                  placeholder="e.g. DL-20B-12345, DL-21B-12345"
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Detailed Address (Prints in Header)</label>
                <textarea 
                  value={formData.shop_info.address || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'address', e.target.value)}
                  placeholder="Enter complete physical store location"
                  rows={2}
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s', resize: 'vertical' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Bill Footer Terms / Disclaimer / Return Policy</label>
                <input 
                  type="text" 
                  value={formData.shop_info.return_policy || ''} 
                  onChange={(e) => handleInputChange('shop_info', 'return_policy', e.target.value)}
                  placeholder="e.g. Medicines once sold cannot be returned."
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                />
              </div>
            </div>
          </div>

          {/* Billing Preferences */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🧾 Billing & Invoice Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Default Print Format</label>
                <select 
                  value={formData.billing_settings.print_format}
                  onChange={(e) => handleInputChange('billing_settings', 'print_format', e.target.value)}
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                >
                  <option value="A4">Standard A4 Sheet</option>
                  <option value="thermal">Thermal Roll (80mm / ESC/POS)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Default Tax Percent (%)</label>
                <input 
                  type="number" 
                  value={formData.billing_settings.default_tax_percent || 18} 
                  onChange={(e) => handleInputChange('billing_settings', 'default_tax_percent', Number(e.target.value))}
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <input 
                  type="checkbox" 
                  id="roundOff"
                  checked={formData.billing_settings.round_off} 
                  onChange={(e) => handleInputChange('billing_settings', 'round_off', e.target.checked)}
                  style={{ height: 16, width: 16, borderRadius: 4, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="roundOff" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Round-off final amount to nearest rupee</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <input 
                  type="checkbox" 
                  id="taxBreakdown"
                  checked={formData.billing_settings.tax_breakdown} 
                  onChange={(e) => handleInputChange('billing_settings', 'tax_breakdown', e.target.checked)}
                  style={{ height: 16, width: 16, borderRadius: 4, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="taxBreakdown" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Show complete CGST / SGST breakdowns</label>
              </div>
            </div>
          </div>

          {/* Theme Preferences */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🎨 Dynamic Custom Branding & Theme
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>App Core Mode</label>
                <select 
                  value={formData.theme.mode}
                  onChange={(e) => handleInputChange('theme', 'mode', e.target.value)}
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                >
                  <option value="dark">Vibrant Dark Mode</option>
                  <option value="light">Premium Light Mode</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 6 }}>Primary Branding Color</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={formData.theme.primary_color} 
                    onChange={(e) => handleInputChange('theme', 'primary_color', e.target.value)}
                    style={{ height: 40, width: 64, borderRadius: 10, border: '1px solid var(--border-subtle)', cursor: 'pointer', padding: 0, background: 'transparent' }}
                  />
                  <input 
                    type="text"
                    value={formData.theme.primary_color}
                    onChange={(e) => handleInputChange('theme', 'primary_color', e.target.value)}
                    style={{ flex: 1, fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Settings Trigger */}
          <button 
            type="submit"
            disabled={isSaving}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-button)',
              backgroundColor: saveSuccess ? 'var(--accent-emerald)' : 'var(--primary)',
              color: 'white'
            }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Active Features Checklist */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙️ Dynamic System Modules
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.keys(formData.features).map((featureKey) => (
                <div key={featureKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
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
                    style={{ height: 16, width: 16, borderRadius: 4, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Safe Database Operations */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database style={{ color: 'var(--accent-amber)' }} size={18} />
              Database Operations
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Ensure data integrity. Wrote dynamic WAL journaling that backs up complete SQLite transactions locally to a secondary path.
            </p>
            
            <button
              type="button"
              onClick={handleBackupDB}
              disabled={isBackingUp}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: '1px solid var(--accent-amber)',
                background: 'transparent',
                color: 'var(--accent-amber)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={14} className={isBackingUp ? 'animate-pulse' : ''} />
              {isBackingUp ? 'Creating Stamped Copy...' : 'Backup SQLite Database'}
            </button>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>Restore Backup (.json)</label>
              <input 
                type="file" 
                accept=".json"
                onChange={handleRestoreDB}
                style={{ display: 'none' }}
                id="restore-db-upload"
              />
              <label
                htmlFor="restore-db-upload"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  background: 'var(--primary-subtle)',
                  border: '1px solid var(--primary-glow)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Upload size={14} />
                Upload & Restore Backup File
              </label>
            </div>
          </div>

          {/* Wiping & Factory Resets */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-red)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-red)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert style={{ color: 'var(--accent-red)' }} size={18} />
              Danger Zone
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Factory reset completely destroys all local database states, inventory lists, sales logs, and wrings configuration files back to system defaults.
            </p>
            
            <button
              type="button"
              onClick={handleFactoryReset}
              disabled={isResetting}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
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
