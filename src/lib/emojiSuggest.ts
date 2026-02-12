const EMOJI_MAP: Record<string, string> = {
  beer: "🍺", bier: "🍺", sör: "🍺", pivo: "🍺",
  wine: "🍷", bor: "🍷", vino: "🍷",
  cocktail: "🍹", koktél: "🍹",
  drink: "🥤", ital: "🥤", juice: "🧃", water: "💧", víz: "💧",
  soda: "🥤", cola: "🥤", coke: "🥤",
  coffee: "☕", kávé: "☕", tea: "🍵",
  pizza: "🍕", burger: "🍔", hamburger: "🍔",
  hotdog: "🌭", "hot dog": "🌭",
  taco: "🌮", burrito: "🌯",
  sushi: "🍣", ramen: "🍜", noodle: "🍜", pasta: "🍝",
  bread: "🍞", kenyér: "🍞", sandwich: "🥪", szendvics: "🥪",
  salad: "🥗", saláta: "🥗",
  fries: "🍟", chips: "🍟", sült: "🍟",
  chicken: "🍗", csirke: "🍗", meat: "🥩", hús: "🥩", steak: "🥩",
  fish: "🐟", hal: "🐟", shrimp: "🦐",
  egg: "🥚", tojás: "🥚",
  cheese: "🧀", sajt: "🧀",
  cake: "🎂", torta: "🎂", cupcake: "🧁", muffin: "🧁",
  cookie: "🍪", keksz: "🍪",
  donut: "🍩", doughnut: "🍩", fánk: "🍩",
  chocolate: "🍫", csoki: "🍫", candy: "🍬", cukor: "🍬",
  ice: "🧊", jég: "🧊", "ice cream": "🍦", fagyi: "🍦",
  popcorn: "🍿",
  fruit: "🍎", gyümölcs: "🍎", apple: "🍎", alma: "🍎",
  banana: "🍌", banán: "🍌",
  grape: "🍇", szőlő: "🍇",
  strawberry: "🍓", eper: "🍓",
  watermelon: "🍉", dinnye: "🍉", lemon: "🍋", citrom: "🍋",
  orange: "🍊", narancs: "🍊",
  peach: "🍑", barack: "🍑",
  cherry: "🍒", cseresznye: "🍒",
  corn: "🌽", kukorica: "🌽",
  pepper: "🌶️", paprika: "🌶️",
  tomato: "🍅", paradicsom: "🍅",
  carrot: "🥕", répa: "🥕",
  speaker: "🔊", hangszóró: "🔊", music: "🎵", zene: "🎵",
  guitar: "🎸", gitár: "🎸", drum: "🥁", dob: "🥁",
  microphone: "🎤", mikrofon: "🎤",
  game: "🎮", játék: "🎮", controller: "🎮",
  ball: "⚽", labda: "⚽", football: "🏈", basketball: "🏀",
  chair: "🪑", szék: "🪑", table: "🍽️", asztal: "🍽️",
  plate: "🍽️", tányér: "🍽️", cup: "🥤", pohár: "🥤",
  fork: "🍴", knife: "🔪", kés: "🔪", spoon: "🥄", kanál: "🥄",
  napkin: "🧻", szalvéta: "🧻", towel: "🧻", törülköző: "🧻",
  blanket: "🛏️", takaró: "🛏️",
  candle: "🕯️", gyertya: "🕯️",
  fire: "🔥", tűz: "🔥", grill: "🔥",
  tent: "⛺", sátor: "⛺",
  bag: "👜", táska: "👜", backpack: "🎒", hátizsák: "🎒",
  camera: "📷", kamera: "📷",
  phone: "📱", telefon: "📱",
  charger: "🔌", töltő: "🔌",
  sunscreen: "🧴", naptej: "🧴",
  umbrella: "☂️", esernyő: "☂️",
  gift: "🎁", ajándék: "🎁", present: "🎁",
  balloon: "🎈", lufi: "🎈",
  decoration: "🎊", dekoráció: "🎊",
  flag: "🚩", zászló: "🚩",
  box: "📦", doboz: "📦",
  tool: "🔧", szerszám: "🔧",
  flashlight: "🔦", zseblámpa: "🔦",
  map: "🗺️", térkép: "🗺️",
  ticket: "🎫", jegy: "🎫",
  money: "💰", pénz: "💰", cash: "💵",
  key: "🔑", kulcs: "🔑",
  medicine: "💊", gyógyszer: "💊",
  snack: "🍿", nasi: "🍿", chip: "🍟",
  sauce: "🫙", szósz: "🫙", ketchup: "🫙", mustard: "🫙",
};

export interface EmojiSuggestion {
  keyword: string;
  emoji: string;
}

export function suggestEmojis(input: string, limit = 5): EmojiSuggestion[] {
  const q = input.toLowerCase().trim();
  if (!q) return [];

  const results: EmojiSuggestion[] = [];
  const seen = new Set<string>();

  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (keyword.startsWith(q) && !seen.has(emoji)) {
      seen.add(emoji);
      results.push({ keyword, emoji });
      if (results.length >= limit) return results;
    }
  }

  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (keyword.includes(q) && !seen.has(emoji)) {
      seen.add(emoji);
      results.push({ keyword, emoji });
      if (results.length >= limit) return results;
    }
  }

  return results;
}
