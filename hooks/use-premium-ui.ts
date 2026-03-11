import { useMemo } from 'react';

import { createPremiumUIStyles } from '@/constants/premium-ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function usePremiumUI() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const ui = useMemo(() => createPremiumUIStyles(colors), [colors]);

  return { colors, ui, colorScheme };
}
