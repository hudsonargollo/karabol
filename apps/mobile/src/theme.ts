// Same palette as the landing page and venue-panel — one brand across every
// surface. RN can't load the display webfonts as cheaply as a browser can,
// so this leans on system fonts + the color/weight/spacing system instead.
export const colors = {
  bg: '#150c13',
  surface: '#1c1219',
  surface2: '#241823',
  surface3: '#2c1e2b',
  ink: '#f8eee0',
  inkSoft: '#c2a6bb',
  inkFaint: '#8a7086',
  gold: '#f4b93c',
  goldInk: '#241505',
  fuchsia: '#ef2f7b',
  turquoise: '#23c9c0',
  bronze: '#c17a3f',
  silver: '#c7ccd3',
  danger: '#ef4a5c',
  success: '#23c98a',
  line: 'rgba(248,238,224,0.14)',
  lineStrong: 'rgba(248,238,224,0.26)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const type = {
  display: { fontWeight: '800' as const, letterSpacing: 0.2 },
  heading: { fontWeight: '700' as const },
  body: { fontWeight: '400' as const },
  mono: { fontFamily: 'monospace' },
};
