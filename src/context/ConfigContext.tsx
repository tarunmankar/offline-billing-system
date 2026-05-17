import React, { createContext, useContext, useEffect, useState } from 'react';

interface Config {
  shop_info: { name: string; type: string; tax_label: string };
  theme: { mode: string; primary_color: string };
  features: Record<string, boolean>;
  custom_fields: Array<{ label: string; key: string }>;
  billing_settings: {
    print_format: string;
    round_off: boolean;
    tax_breakdown: boolean;
  };
}

interface ConfigContextType {
  config: Config | null;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if ((window as any).electronAPI) {
          const data = await (window as any).electronAPI.getConfig();
          setConfig(data);
        } else {
          // Fallback for browser testing
          console.warn('Electron API not found, using fallback config');
          const response = await fetch('/config.json');
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Proactively bind configuration theme color and mode dynamically to document root
  useEffect(() => {
    if (config?.theme?.primary_color) {
      document.documentElement.style.setProperty('--primary', config.theme.primary_color);
    }
    
    if (config?.theme?.mode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [config]);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
};
