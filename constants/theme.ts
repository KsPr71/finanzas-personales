import { Platform } from 'react-native';

const tintColorLight = '#0f7c82';
const tintColorDark = '#59d3c7';

export const Colors = {
  light: {
    text: '#121a2b',
    textMuted: '#566381',
    textSubtle: '#72809d',
    background: '#edf2f9',
    surface: '#ffffff',
    surfaceMuted: '#f4f7fc',
    tint: tintColorLight,
    icon: '#66748f',
    border: '#d3ddea',
    borderStrong: '#b9c8df',
    positive: '#0e8b6f',
    negative: '#bf3c3c',
    warning: '#a66e12',
    shadow: '#10294f',
    tabIconDefault: '#66748f',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#e9eef8',
    textMuted: '#b0b8ca',
    textSubtle: '#909cb4',
    background: '#0f1522',
    surface: '#181f30',
    surfaceMuted: '#202a3e',
    tint: tintColorDark,
    icon: '#98a5c0',
    border: '#2e3a53',
    borderStrong: '#44577a',
    positive: '#44c59d',
    negative: '#f08f8f',
    warning: '#e2b65c',
    shadow: '#000000',
    tabIconDefault: '#98a5c0',
    tabIconSelected: tintColorDark,
  },
};

export type AppColorPalette = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'Aptos',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Aptos', 'Roboto', 'Segoe UI', Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
