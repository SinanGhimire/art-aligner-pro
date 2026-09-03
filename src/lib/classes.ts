/**
 * The 30 playable classes. Each class points at one cell of the transparent
 * accessories sheet (6 columns x 5 rows) plus per-class placement tuning so the
 * headgear sits correctly on the hero portrait.
 */

export const SHEET_COLS = 6;
export const SHEET_ROWS = 5;

export type HeroClass = {
  id: string;
  name: string;
  index: number;
  /** zero-based cell column / row in the accessories sheet */
  col: number;
  row: number;
  /** placement on the portrait, in % of the portrait box */
  scale: number;
  x: number;
  y: number;
  blurb: string;
};

type Tuning = Partial<Pick<HeroClass, "scale" | "x" | "y">>;

const defs: Array<[string, string, Tuning?]> = [
  ["Bandana", "Cloth over the brow, fists over the talk."],
  ["Soldier", "Standard issue helmet, non-standard courage.", { scale: 0.72, y: -3 }],
  ["Ninja", "Seen once, remembered forever.", { scale: 0.8, y: 6 }],
  ["Assassin", "Contracts settled before dawn.", { scale: 0.86, y: 2 }],
  ["Pirate", "Owns the tide and most of the harbour.", { scale: 0.88, y: -8 }],
  ["Viking", "Arrives loud, leaves louder.", { scale: 0.9, y: -6 }],
  ["Knight", "A wall of steel with a heartbeat.", { scale: 0.76, y: 1 }],
  ["Gladiator", "Sand, crowd, crest, victory.", { scale: 0.82, y: -4 }],
  ["Hunter", "Reads the forest like a map.", { scale: 0.74, y: -2 }],
  ["Ranger", "The hood is the whole personality.", { scale: 0.86, y: 3 }],
  ["Mage", "Stars stitched into felt.", { scale: 0.96, y: -12 }],
  ["Witch", "Brews first, explains never.", { scale: 0.94, y: -12 }],
  ["Druid", "Grows antlers on purpose.", { scale: 0.88, y: -12 }],
  ["Shaman", "Speaks with wind and feather.", { scale: 0.8, y: -8 }],
  ["Monk", "Calm knuckles, loud silence.", { scale: 0.68, y: 4 }],
  ["Paladin", "Oath-bound and glowing about it.", { scale: 0.68, y: 2 }],
  ["Cleric", "Mitre up, morale up.", { scale: 0.74, y: -8 }],
  ["Engineer", "Goggles down, problem solved.", { scale: 0.72, y: 10 }],
  ["Alchemist", "Turns mistakes into discoveries.", { scale: 0.74, y: 10 }],
  ["Chemist", "Breathes filtered, thinks clearly.", { scale: 0.78, y: 12 }],
  ["Doctor", "Bad news delivered gently.", { scale: 0.7, y: 4 }],
  ["Psycho", "The haircut is a warning label.", { scale: 0.78, y: -10 }],
  ["Jester", "Punchline first, blade second.", { scale: 0.88, y: -10 }],
  ["Clown", "Laughter is a crowd-control ability.", { scale: 0.96, y: 2 }],
  ["Ghost", "Technically still on the roster.", { scale: 1.05, y: 6 }],
  ["Cultist", "Chants in a key nobody enjoys.", { scale: 0.9, y: 2 }],
  ["Demon", "Horns are load-bearing.", { scale: 0.72, y: -6 }],
  ["Reaper", "Punctual, unfortunately.", { scale: 0.94, y: 4 }],
  ["Cowboy", "Rides in on the last chorus.", { scale: 0.9, y: -4 }],
  ["Punk", "Volume set to spike.", { scale: 0.8, y: -10 }],
];

export const HERO_CLASSES: HeroClass[] = defs.map(([name, blurb, tuning], i) => ({
  id: name.toLowerCase(),
  name,
  index: i + 1,
  col: i % SHEET_COLS,
  row: Math.floor(i / SHEET_COLS),
  scale: tuning?.scale ?? 0.8,
  x: tuning?.x ?? 0,
  y: tuning?.y ?? 0,
  blurb,
}));

export const BRAWLER: HeroClass = {
  id: "brawler",
  name: "Brawler",
  index: 0,
  col: -1,
  row: -1,
  scale: 0,
  x: 0,
  y: 0,
  blurb: "No gear. No excuses.",
};

export const ALL_CLASSES = [BRAWLER, ...HERO_CLASSES];
