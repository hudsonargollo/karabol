import { karabol } from '../assets/karabol';
import { colors } from '../theme';

export type CrewMember = {
  id: string;
  name: string;
  img: number;
  accent: string;
  line: string;
};

// The mockup's crew grid has 10 mascots; only these 7 have art bundled in
// the app today (see assets/karabol.ts) — the rest need art exported from
// the design project before they can join the picker.
export const CREW: CrewMember[] = [
  { id: 'karaboy', name: 'KARABOY', img: karabol.karaboyHero, accent: colors.lime, line: '¡El show empieza contigo!' },
  { id: 'cambita', name: 'CAMBITA', img: karabol.cambitaHero, accent: colors.magenta, line: 'Tu voz, tu poder.' },
  { id: 'alpacho', name: 'ALPACHO', img: karabol.alpachoHero, accent: colors.lime, line: 'Campeón desde el día uno.' },
  { id: 'diablada', name: 'DIABLADA', img: karabol.diabladaHero, accent: colors.magenta, line: '¡Vamos a prender el bar!' },
  { id: 'jucumari', name: 'JUCUMARI', img: karabol.bearHero, accent: colors.cyan, line: 'Tranqui. Puro flow.' },
  { id: 'paraba', name: 'PARABA', img: karabol.parabaHero, accent: colors.cyan, line: '¡Yo te anuncio bien fuerte!' },
  { id: 'capybara', name: 'CAPYBARA', img: karabol.capybaraHero, accent: colors.purple, line: 'Sin drama, solo buena onda.' },
];

export function crewById(id: string | null): CrewMember {
  return CREW.find((c) => c.id === id) ?? CREW[0];
}
