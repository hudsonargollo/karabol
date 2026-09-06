// KARABOL character art. RN's bundler needs static `require()` calls (no
// dynamic paths), so every asset is listed here once and imported by name.
export const karabol = {
  logo: require('../../assets/karabol/logo.webp'),
  crew: require('../../assets/karabol/crew.webp'),
  houseparty: require('../../assets/karabol/houseparty.webp'),
  karaboyHero: require('../../assets/karabol/karaboy-hero.webp'),
  karaboyFace: require('../../assets/karabol/karaboy-face.webp'),
  alpachoHero: require('../../assets/karabol/alpacho-hero.webp'),
  bearHero: require('../../assets/karabol/bear-hero.webp'),
  cambitaHero: require('../../assets/karabol/cambita-hero.webp'),
  capybaraHero: require('../../assets/karabol/capybara-hero.webp'),
  diabladaHero: require('../../assets/karabol/diablada-hero.webp'),
  parabaHero: require('../../assets/karabol/paraba-hero.webp'),
  standoff: require('../../assets/karabol/standoff.webp'),
  reiDeLaNoche: require('../../assets/karabol/rei-de-la-noche.webp'),
  reinaDeLaNoche: require('../../assets/karabol/reina-de-la-noche.webp'),

  // Newer crew art — a different (photoreal) render pass than the crew
  // above, so these look visually distinct where they appear together
  // (e.g. the crew picker grid).
  capiHero: require('../../assets/karabol/capi-hero.webp'),
  capiHead: require('../../assets/karabol/capi-head.webp'),
  elsombreroHero: require('../../assets/karabol/elsombrero-hero.webp'),
  elsombreroHead: require('../../assets/karabol/elsombrero-head.webp'),
  laperecholaHero: require('../../assets/karabol/laperechola-hero.webp'),
  laperecholaHead: require('../../assets/karabol/laperechola-head.webp'),
  taitetuHero: require('../../assets/karabol/taitetu-hero.webp'),
  taitetuHead: require('../../assets/karabol/taitetu-head.webp'),
};
