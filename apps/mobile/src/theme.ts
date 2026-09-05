// KARABOL App UI v1 — dark stage, neon crew. RN can't load the display
// webfonts (Sora/Geist) as cheaply as a browser can, so this leans on the
// system font + heavy weights + letter-spacing instead, same tradeoff as
// the previous palette made.
export const colors = {
  bg: '#0c0e10',
  surface: '#121416',
  surface2: '#1c1e20',
  surface3: '#0c0e10',
  ink: '#e2e2e5',
  inkSoft: '#b7b8ba',
  inkFaint: '#898a8b',
  lime: '#c7f300',
  limeInk: '#0c0e10',
  magenta: '#ff2ea6',
  cyan: '#2ee6ff',
  purple: '#d8b9ff',
  silver: '#c7ccd3',
  bronze: '#c17a3f',
  danger: '#ef4a5c',
  success: '#23c98a',
  line: 'rgba(255,255,255,0.12)',
  lineStrong: 'rgba(255,255,255,0.25)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Sharp corners throughout — the design has no border-radius anywhere.
export const radius = { sm: 0, md: 0, lg: 0, pill: 0 };

export const type = {
  display: { fontWeight: '800' as const, letterSpacing: 0.2 },
  displayItalic: { fontWeight: '800' as const, fontStyle: 'italic' as const, letterSpacing: 0.2 },
  heading: { fontWeight: '700' as const },
  body: { fontWeight: '400' as const },
  label: { fontWeight: '600' as const, letterSpacing: 1 },
  mono: { fontFamily: 'monospace' as const },
};
