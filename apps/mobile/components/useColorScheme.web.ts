// Web version of useColorScheme - always returns 'dark' since AFTR uses a dark theme
export function useColorScheme() {
  return 'dark' as const;
}
