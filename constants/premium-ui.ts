import { StyleSheet } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { AppColorPalette } from '@/constants/theme';

export const createPremiumUIStyles = (colors: AppColorPalette) =>
  StyleSheet.create({
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.2,
      fontFamily: Fonts.sans,
    },
    section: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      gap: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.2,
      fontFamily: Fonts.sans,
    },
    label: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 13,
      fontFamily: Fonts.sans,
    },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 14,
      fontFamily: Fonts.sans,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipActive: {
      borderColor: colors.tint,
      backgroundColor: `${colors.tint}1f`,
    },
    chipText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 12,
      textTransform: 'capitalize',
      fontFamily: Fonts.sans,
    },
    chipTextActive: {
      color: colors.tint,
    },
    actions: {
      gap: 8,
    },
    primaryButton: {
      backgroundColor: colors.tint,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 3,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontWeight: '700',
      letterSpacing: 0.2,
      fontFamily: Fonts.sans,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    secondaryButtonText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontFamily: Fonts.sans,
    },
    listItem: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 14,
      padding: 12,
      gap: 8,
    },
    listInfo: {
      gap: 3,
    },
    itemTitle: {
      color: colors.text,
      fontWeight: '700',
      fontFamily: Fonts.sans,
    },
    itemMeta: {
      color: colors.textSubtle,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: Fonts.sans,
    },
    itemAmount: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 13,
      fontFamily: Fonts.sans,
    },
    linkButtonText: {
      color: colors.tint,
      fontWeight: '700',
      fontSize: 13,
      fontFamily: Fonts.sans,
    },
    linkButtonDangerText: {
      color: colors.negative,
      fontWeight: '700',
      fontSize: 13,
      fontFamily: Fonts.sans,
    },
    empty: {
      color: colors.textSubtle,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: Fonts.sans,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
