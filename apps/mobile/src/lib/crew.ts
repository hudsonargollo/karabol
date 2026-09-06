import { karabol } from '../assets/karabol';
import { colors } from '../theme';

export type CrewMember = {
  id: string;
  name: string;
  img: number;
  /** Tighter face crop for small avatars — falls back to `img` when absent. */
  head?: number;
  accent: string;
  line: string;
};

// Matches the mockup's 10-mascot crew grid. Capi/Sombrero/Perechola/Taitetú
// come from a different (photoreal) art pass than the other six, so they
// look visually distinct in this grid — see the "NEW CREW" art review.
export const CREW: CrewMember[] = [
  { id: 'karaboy', name: 'KARABOY', img: karabol.karaboyHero, head: karabol.karaboyFace, accent: colors.lime, line: '¡El show empieza contigo!' },
  { id: 'sombrero', name: 'SOMBRERO', img: karabol.elsombreroHero, head: karabol.elsombreroHead, accent: colors.magenta, line: '¡Bienvenidos al show, mi gente!' },
  { id: 'cambita', name: 'CAMBITA', img: karabol.cambitaHero, accent: colors.magenta, line: 'Tu voz, tu poder.' },
  { id: 'alpacho', name: 'ALPACHO', img: karabol.alpachoHero, accent: colors.lime, line: 'Campeón desde el día uno.' },
  { id: 'supay', name: 'SUPAY', img: karabol.diabladaHero, accent: colors.magenta, line: '¡Vamos a prender el bar!' },
  { id: 'jucumari', name: 'JUCUMARI', img: karabol.bearHero, accent: colors.cyan, line: 'Tranqui. Puro flow.' },
  { id: 'paraba', name: 'PARABA', img: karabol.parabaHero, accent: colors.cyan, line: '¡Yo te anuncio bien fuerte!' },
  { id: 'taitetu', name: 'TAITETÚ', img: karabol.taitetuHero, head: karabol.taitetuHead, accent: colors.cyan, line: 'Tres, dos, uno… ¡dale!' },
  { id: 'perechola', name: 'PERECHOLA', img: karabol.laperecholaHero, head: karabol.laperecholaHead, accent: colors.lime, line: 'Sin apuro, reina.' },
  { id: 'capi', name: 'CAPI', img: karabol.capiHero, head: karabol.capiHead, accent: colors.purple, line: 'Karaoke es vida, bro.' },
];

export function crewById(id: string | null): CrewMember {
  return CREW.find((c) => c.id === id) ?? CREW[0];
}

export function crewAvatar(id: string | null): number {
  const c = crewById(id);
  return c.head ?? c.img;
}
