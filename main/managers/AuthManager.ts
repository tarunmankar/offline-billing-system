import db, { verifyPassword } from '../db/database';

export interface AuthSession {
  id: number;
  username: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthSession;
  error?: string;
}

export class AuthManager {
  /**
   * Validates user credentials locally and returns secure session parameters.
   */
  static login(username: string, password: string): AuthResponse {
    try {
      if (!username || !password) {
        return { success: false, error: 'Username and password are required.' };
      }

      // 1. Fetch user account details by username (case-sensitive)
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

      if (!user) {
        console.warn(`AuthManager: Failed login attempt for non-existent user "${username}".`);
        return { success: false, error: 'Invalid username or password.' };
      }

      // 2. Validate cryptographic password hash
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        console.warn(`AuthManager: Password mismatch for user "${username}".`);
        return { success: false, error: 'Invalid username or password.' };
      }

      console.log(`AuthManager: User "${username}" (${user.role}) authenticated successfully.`);
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
    } catch (err: any) {
      console.error('AuthManager.login Critical Error:', err);
      return { success: false, error: 'Internal cryptographic verification failure.' };
    }
  }
}
