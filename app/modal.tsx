import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PremiumScrollView } from '@/components/premium-scroll-view';
import { type AppColorPalette } from '@/constants/theme';
import { usePremiumUI } from '@/hooks/use-premium-ui';

export default function ModalScreen() {
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PremiumScrollView contentContainerStyle={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>ACERCA DE LA APP</Text>
      </View>
      <Text style={ui.title}>Finanzas Personales</Text>
      <View style={ui.section}>
        <Text style={styles.text}>
          Esta aplicacion te permite gestionar cuentas, categorias, transacciones y transferencias
          internas con respaldo de datos en formato JSON.
        </Text>
      </View>
      <Link href='/' dismissTo style={[styles.link, { color: colors.tint }]}>Volver al resumen</Link>
    </PremiumScrollView>
  );
}

const createStyles = (colors: AppColorPalette) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: 16,
    },
    badge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
      backgroundColor: colors.surfaceMuted,
    },
    badgeText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.9,
    },
    text: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
    },
    link: {
      fontSize: 14,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
