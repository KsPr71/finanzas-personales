import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const {
    keyboardShouldPersistTaps = 'handled',
    keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
    automaticallyAdjustKeyboardInsets = Platform.OS === 'ios',
    ...restScrollProps
  } = scrollProps;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={styles.decorativeLayer}>
        <View style={[styles.orb, styles.orbTop, { backgroundColor: `${colors.tint}2e` }]} />
        <View style={[styles.orb, styles.orbBottom, { backgroundColor: `${colors.warning}1f` }]} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={[styles.scroll, style]}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 88 },
            styles.contentGrow,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
          automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
          {...restScrollProps}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardContainer: {
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
    gap: 14,
  },
  contentGrow: {
    flexGrow: 1,
  },
});
