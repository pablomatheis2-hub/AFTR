// Web storage implementation using localStorage
// Safe for SSR - returns null when window is not available

const isServer = typeof window === 'undefined';

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (e.g., quota exceeded, private browsing)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isServer) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};
