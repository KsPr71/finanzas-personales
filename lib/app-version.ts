import Constants from 'expo-constants';

const FALLBACK_VERSION = '1.0.0';

export function getAppVersion() {
  const version = Constants.expoConfig?.version;
  if (typeof version === 'string' && version.trim().length > 0) {
    return version.trim();
  }

  return FALLBACK_VERSION;
}
