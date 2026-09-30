import { useColorScheme } from 'react-native';

/** Mesmas cores do site (globals.css), em modo claro e escuro. */
const light = {
  bg: '#E9EDF1', surface: '#FFFFFF', surface2: '#F4F6F8', line: '#D8DEE4', ink: '#15202B', muted: '#5A6773',
  primary: '#1D4F7A', primaryInk: '#FFFFFF', accent: '#D9621F', accentSoft: '#FCE8DC',
  ok: '#2A7A4B', okSoft: '#E0F1E6', warn: '#9C6A12', warnSoft: '#FAEFD6', infoSoft: '#E2EBF4', bad: '#B3261E', badSoft: '#F9E2E0',
  gold: '#A87A06', silver: '#687682', bronze: '#98582B',
};
const dark: typeof light = {
  bg: '#0C131A', surface: '#141E28', surface2: '#1A2631', line: '#293745', ink: '#E3EAF0', muted: '#92A0AD',
  primary: '#7FB2E0', primaryInk: '#0C131A', accent: '#F0874A', accentSoft: '#3A2417',
  ok: '#6CC28F', okSoft: '#15301F', warn: '#E2B35A', warnSoft: '#33280F', infoSoft: '#172838', bad: '#F2877F', badSoft: '#3A1715',
  gold: '#E0B84A', silver: '#A9B6C1', bronze: '#D38E5C',
};

export type Colors = typeof light;

export const F = {
  disp: 'BarlowCondensed_700Bold',
  dispSemi: 'BarlowCondensed_600SemiBold',
  body: 'IBMPlexSans_400Regular',
  bodyMed: 'IBMPlexSans_500Medium',
  bodySemi: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
};

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
