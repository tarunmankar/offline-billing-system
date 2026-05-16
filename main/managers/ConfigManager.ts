import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export class ConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config.json');
  }

  getConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading config:', error);
    }
    return null;
  }

  saveConfig(config: any) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }
}
