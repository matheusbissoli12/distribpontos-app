import { Platform } from 'react-native';

/** true dentro do app de desktop (Electron). */
export const isDesktop = Platform.OS === 'web' && typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);
