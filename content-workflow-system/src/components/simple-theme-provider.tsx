/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined
);

interface SimpleThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function SimpleThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
}: SimpleThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    // 初始化时的安全检查
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = localStorage.getItem(storageKey) as Theme;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          return savedTheme;
        }
      }
    } catch (error) {
      console.warn('无法从localStorage读取主题设置:', error);
    }
    return defaultTheme;
  });

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = localStorage.getItem(storageKey) as Theme;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setTheme(savedTheme);
        }
      }
    } catch (error) {
      console.warn('无法从localStorage读取主题设置:', error);
    }
  }, [storageKey]);

  const handleSetTheme = React.useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(storageKey, newTheme);
        }
      } catch (error) {
        console.warn('无法保存主题设置到localStorage:', error);
      }
    },
    [storageKey]
  );

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme,
    }),
    [theme, handleSetTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a SimpleThemeProvider');
  }
  return context;
}
