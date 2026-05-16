import fs from 'fs';
import path from 'path';

export interface ConfigSchema {
  shop_info: {
    name: string;
    type: string;
    tax_label: string;
    logo_path: string;
  };
  theme: {
    mode: string;
    primary_color: string;
  };
  features: Record<string, boolean>;
  custom_fields: Array<{ label: string; key: string }>;
  billing_settings: {
    print_format: string;
    round_off: boolean;
    tax_breakdown: boolean;
  };
}

export class ConfigManager {
  private configPath: string;
  private defaultPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config.json');
    this.defaultPath = path.join(process.cwd(), 'default_config.json');
  }

  /**
   * Hardcoded failsafe configuration used if both config.json and default_config.json are completely missing.
   */
  private getFallbackConfig(): ConfigSchema {
    return {
      shop_info: {
        name: 'Billing Pro Fallback',
        type: 'general',
        tax_label: 'GST/VAT',
        logo_path: 'assets/logo.png'
      },
      theme: {
        mode: 'dark',
        primary_color: '#2563eb'
      },
      features: {
        user_auth: true,
        barcode_scanner: true,
        expiry_tracking: true,
        thermal_printing: true,
        inventory_management: true,
        credit_ledger: true
      },
      custom_fields: [
        { label: 'Batch No', key: 'batch' },
        { label: 'Expiry Date', key: 'expiry' }
      ],
      billing_settings: {
        print_format: 'A4',
        round_off: true,
        tax_breakdown: true
      }
    };
  }

  /**
   * Validates structural and data-type compliance of the configuration payload.
   */
  validateConfig(config: any): boolean {
    if (!config || typeof config !== 'object') return false;
    if (!config.shop_info || typeof config.shop_info !== 'object') return false;
    if (typeof config.shop_info.name !== 'string' || typeof config.shop_info.type !== 'string') return false;
    if (!config.theme || typeof config.theme !== 'object') return false;
    if (typeof config.theme.mode !== 'string' || typeof config.theme.primary_color !== 'string') return false;
    if (!config.features || typeof config.features !== 'object') return false;
    if (!config.custom_fields || !Array.isArray(config.custom_fields)) return false;
    if (!config.billing_settings || typeof config.billing_settings !== 'object') return false;
    if (typeof config.billing_settings.print_format !== 'string') return false;
    return true;
  }

  /**
   * Retrieves, parses, and validates the current active configuration.
   * If corruption is detected, automatically backs up the corrupt file and falls back.
   */
  getConfig(): ConfigSchema {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (this.validateConfig(parsed)) {
          return parsed;
        }
        console.warn('ConfigManager: active config.json is corrupt. Backing up and reverting.');
        fs.writeFileSync(path.join(process.cwd(), 'config_corrupt.json'), raw);
      }
    } catch (error) {
      console.error('ConfigManager: Failed to parse config.json. Reverting to default profile.', error);
    }

    // Recovery path: Revert to default_config.json template
    try {
      if (fs.existsSync(this.defaultPath)) {
        const rawDefault = fs.readFileSync(this.defaultPath, 'utf8');
        const parsedDefault = JSON.parse(rawDefault);
        if (this.validateConfig(parsedDefault)) {
          console.log('ConfigManager: Restored config.json from default_config.json.');
          fs.writeFileSync(this.configPath, JSON.stringify(parsedDefault, null, 2));
          return parsedDefault;
        }
      }
    } catch (err) {
      console.error('ConfigManager: Failed to parse default_config.json fallback template.', err);
    }

    // Failsafe path: Write and return default hardcoded structure
    const failsafe = this.getFallbackConfig();
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(failsafe, null, 2));
      console.log('ConfigManager: Written failsafe hardcoded settings to config.json.');
    } catch (e) {
      console.error('ConfigManager: Failed to write failsafe fallback config to disk.', e);
    }
    return failsafe;
  }

  /**
   * Validates and writes changes to the active config.json.
   */
  saveConfig(config: any): { success: boolean; error?: string } {
    try {
      if (!this.validateConfig(config)) {
        return { success: false, error: 'Validation failure: Configuration contains invalid schema properties.' };
      }
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return { success: true };
    } catch (error: any) {
      console.error('ConfigManager: Disk write error on config.json.', error);
      return { success: false, error: error.message || 'Failed to save configuration settings to disk.' };
    }
  }
}
