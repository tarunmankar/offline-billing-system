import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthSession {
  id: number;
  username: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  user?: AuthSession;
  error?: string;
}

interface AuthContextType {
  user: AuthSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to restore session from localStorage (100% offline persistence)
    const restoreSession = () => {
      try {
        const storedUser = localStorage.getItem('billing_auth_session');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to restore offline auth session:', err);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI) {
        // Mock fallback for browser-only sandboxed validation testing
        console.warn('Electron API not found, using browser mock login.');
        if (username === 'admin' && password === 'admin123') {
          const mockUser = { id: 1, username: 'admin', role: 'Admin' };
          localStorage.setItem('billing_auth_session', JSON.stringify(mockUser));
          setUser(mockUser);
          return { success: true, user: mockUser };
        }
        return { success: false, error: 'Invalid mock credentials. Try admin / admin123.' };
      }

      // Secure local login over preload context bridge
      const response = await electronAPI.login({ username, password });
      
      if (response.success && response.user) {
        localStorage.setItem('billing_auth_session', JSON.stringify(response.user));
        setUser(response.user);
      }
      return response;
    } catch (err: any) {
      console.error('AuthContext: Login transaction failed.', err);
      return { success: false, error: 'System connection error.' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('billing_auth_session');
      setUser(null);
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
