import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

import {
  loadThemePreference,
  persistThemePreference,
  type AppThemePreference,
} from '@/lib/finance-db';

type ThemeContextValue = {
  preference: AppThemePreference;
  setPreference: (preference: AppThemePreference) => void;
  colorScheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [preference, setPreference] = useState<AppThemePreference>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedPreference = await loadThemePreference();
        if (!isMounted) {
          return;
        }

        setPreference(storedPreference);
      } catch (error) {
        console.error('Error al cargar la preferencia de tema:', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persist = async () => {
      try {
        await persistThemePreference(preference);
      } catch (error) {
        console.error('Error al guardar la preferencia de tema:', error);
      }
    };

    void persist();
  }, [isHydrated, preference]);

  const colorScheme = preference === 'system' ? (deviceColorScheme ?? 'light') : preference;

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      colorScheme,
    }),
    [preference, colorScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreference debe usarse dentro de ThemePreferenceProvider.');
  }
  return context;
}
