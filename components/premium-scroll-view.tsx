import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { usePremiumUI } from '@/hooks/use-premium-ui';

type PremiumScrollViewProps = Omit<ScrollViewProps, 'contentContainerStyle'> & {
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function PremiumScrollView({
  children,
  contentContainerStyle,
  style,
  ...scrollProps
}: PremiumScrollViewProps) {
  const { colors } = usePremiumUI();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={styles.decorativeLayer}>
        <View style={[styles.orb, styles.orbTop, { backgroundColor: `${colors.tint}2e` }]} />
        <View style={[styles.orb, styles.orbBottom, { backgroundColor: `${colors.warning}1f` }]} />
      </View>
      <ScrollView
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        {...scrollProps}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  decorativeLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 999,
  },
  orbTop: {
    top: -120,
    right: -70,
  },
  orbBottom: {
    bottom: -150,
    left: -90,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
});
