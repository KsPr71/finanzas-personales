import { useThemePreference } from '@/contexts/theme-context';

export function useColorScheme() {
  return useThemePreference().colorScheme;
}
