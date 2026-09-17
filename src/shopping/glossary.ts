import type { Locale } from "../i18n/util";
import type { ShopCategory } from "./categories";

export type GlossaryEntry = {
  key: string;
  aisle: ShopCategory;
  en: string;
  de: string;
  aliases: string[];
};

function item(
  key: string,
  aisle: ShopCategory,
  en: string,
  de: string,
  aliases: string[] = [],
): GlossaryEntry {
  return { key, aisle, en, de, aliases };
}

/** Bilingual grocery terms. Stored shopping names stay as typed; this is display-only. */
export const GROCERY_GLOSSARY: GlossaryEntry[] = [
  item("milk", "fridge", "Milk", "Milch"),
  item("oatMilk", "fridge", "Oat milk", "Hafermilch", ["oat drink", "haferdrink", "hafer drink"]),
  item("almondMilk", "fridge", "Almond milk", "Mandelmilch"),
  item("soyMilk", "fridge", "Soy milk", "Sojamilch", ["soya milk"]),
  item("yogurt", "fridge", "Yogurt", "Joghurt", ["yoghurt"]),
  item("butter", "fridge", "Butter", "Butter"),
  item("cheese", "fridge", "Cheese", "Käse", ["kaese"]),
  item("cream", "fridge", "Cream", "Sahne"),
  item("whippingCream", "fridge", "Whipping cream", "Schlagsahne"),
  item("sourCream", "fridge", "Sour cream", "Schmand"),
  item("quark", "fridge", "Quark", "Quark"),
  item("eggs", "fridge", "Eggs", "Eier", ["egg", "eier"]),
  item("cremeFraiche", "fridge", "Crème fraîche", "Crème fraîche", ["creme fraiche"]),
  item("mozzarella", "fridge", "Mozzarella", "Mozzarella"),
  item("feta", "fridge", "Feta", "Feta"),
  item("cottageCheese", "fridge", "Cottage cheese", "Hüttenkäse", ["huttenkase", "hüttenkaese"]),

  item("tomato", "produce", "Tomatoes", "Tomaten", ["tomato", "tomate"]),
  item("cherryTomato", "produce", "Cherry tomatoes", "Kirschtomaten", ["cherry tomato", "kirschtomate"]),
  item("banana", "produce", "Bananas", "Bananen", ["banana", "banane"]),
  item("apple", "produce", "Apples", "Äpfel", ["apple", "apfel", "aepfel"]),
  item("salad", "produce", "Salad", "Salat"),
  item("lettuce", "produce", "Lettuce", "Kopfsalat", ["lettuce"]),
  item("onion", "produce", "Onions", "Zwiebeln", ["onion", "zwiebel"]),
  item("garlic", "produce", "Garlic", "Knoblauch"),
  item("bellPepper", "produce", "Bell pepper", "Paprika", ["pepper", "peppers", "paprika"]),
  item("cucumber", "produce", "Cucumber", "Gurke", ["cucumbers", "gurken"]),
  item("carrot", "produce", "Carrots", "Möhren", ["carrot", "moehre", "möhre", "mohren", "karotte", "karotten"]),
  item("potato", "produce", "Potatoes", "Kartoffeln", ["potato", "kartoffel"]),
  item("avocado", "produce", "Avocado", "Avocado", ["avocados"]),
  item("lemon", "produce", "Lemons", "Zitronen", ["lemon", "zitrone"]),
  item("lime", "produce", "Limes", "Limetten", ["limette"]),
  item("orange", "produce", "Oranges", "Orangen", ["orange"]),
  item("grape", "produce", "Grapes", "Trauben", ["grape", "traube", "weintrauben"]),
  item("strawberry", "produce", "Strawberries", "Erdbeeren", ["strawberry", "erdbeere"]),
  item("blueberry", "produce", "Blueberries", "Heidelbeeren", ["blueberry", "heidelbeere", "blaubeeren", "blaubeere"]),
  item("spinach", "produce", "Spinach", "Spinat"),
  item("broccoli", "produce", "Broccoli", "Brokkoli", ["brokkoli"]),
  item("zucchini", "produce", "Zucchini", "Zucchini", ["courgette"]),
  item("mushroom", "produce", "Mushrooms", "Champignons", ["mushroom", "pilze", "pilz", "champignon"]),
  item("ginger", "produce", "Ginger", "Ingwer"),
  item("herb", "produce", "Herbs", "Kräuter", ["herb", "kraeuter", "kräuter"]),
  item("fruit", "produce", "Fruit", "Obst"),
  item("vegetables", "produce", "Vegetables", "Gemüse", ["veg", "veggie", "veggies", "gemuese", "gemüse"]),

  item("bread", "bakery", "Bread", "Brot"),
  item("buns", "bakery", "Buns", "Brötchen", ["bun", "broetchen", "brötchen", "rolls"]),
  item("croissant", "bakery", "Croissant", "Croissant", ["croissants"]),
  item("toast", "bakery", "Toast", "Toast", ["toast bread", "toastbrot"]),
  item("baguette", "bakery", "Baguette", "Baguette"),
  item("pita", "bakery", "Pita", "Pita", ["pitabrot"]),

  item("chicken", "meat", "Chicken", "Hähnchen", ["huhn", "haehnchen", "hähnchen", "chicken breast", "haehnchenbrust", "hähnchenbrust"]),
  item("beef", "meat", "Beef", "Rind", ["rindfleisch"]),
  item("pork", "meat", "Pork", "Schwein", ["schweinefleisch"]),
  item("mince", "meat", "Mince", "Hackfleisch", ["hack", "ground beef", "hackfleisch", "minced meat"]),
  item("fish", "meat", "Fish", "Fisch"),
  item("salmon", "meat", "Salmon", "Lachs"),
  item("tuna", "meat", "Tuna", "Thunfisch"),
  item("shrimp", "meat", "Shrimp", "Garnelen", ["prawns", "prawn", "garnele", "shrimps"]),
  item("sausage", "meat", "Sausages", "Wurst", ["sausage", "wuerstchen", "würstchen", "bratwurst"]),
  item("ham", "meat", "Ham", "Schinken"),
  item("tofu", "meat", "Tofu", "Tofu"),

  item("oats", "pantry", "Oats", "Haferflocken", [
    "oat",
    "oatmeal",
    "oat flakes",
    "rolled oats",
    "hafer",
    "haferflocke",
    "porridge",
    "haferbrei",
  ]),
  item("rice", "pantry", "Rice", "Reis"),
  item("pasta", "pantry", "Pasta", "Nudeln", ["spaghetti", "penne"]),
  item("oil", "pantry", "Oil", "Öl", ["oel", "olive oil", "olivenoel", "olivenöl"]),
  item("flour", "pantry", "Flour", "Mehl"),
  item("sugar", "pantry", "Sugar", "Zucker"),
  item("salt", "pantry", "Salt", "Salz"),
  item("pepperSpice", "pantry", "Black pepper", "Pfeffer", ["black pepper", "pfeffer"]),
  item("vinegar", "pantry", "Vinegar", "Essig"),
  item("honey", "pantry", "Honey", "Honig"),
  item("jam", "pantry", "Jam", "Marmelade", ["jelly", "konfituere", "konfitüre"]),
  item("peanutButter", "pantry", "Peanut butter", "Erdnussbutter"),
  item("tomatoPaste", "pantry", "Tomato paste", "Tomatenmark"),
  item("cannedTomato", "pantry", "Canned tomatoes", "Dosentomaten", ["chopped tomatoes", "passata"]),
  item("beans", "pantry", "Beans", "Bohnen", ["bean", "bohne"]),
  item("chickpeas", "pantry", "Chickpeas", "Kichererbsen", ["chickpea", "kichererbse"]),
  item("lentils", "pantry", "Lentils", "Linsen", ["lentil", "linse"]),
  item("couscous", "pantry", "Couscous", "Couscous"),
  item("cereal", "pantry", "Cereal", "Müsli", ["muesli", "musli", "granola"]),
  item("cornflakes", "pantry", "Cornflakes", "Cornflakes"),
  item("nuts", "pantry", "Nuts", "Nüsse", ["nut", "nuesse", "nüsse"]),
  item("almonds", "pantry", "Almonds", "Mandeln", ["almond", "mandel"]),
  item("chocolate", "pantry", "Chocolate", "Schokolade", ["schoko"]),
  item("crispbread", "pantry", "Crispbread", "Knäckebrot", ["knaeckebrot", "knäckebrot"]),
  item("wraps", "pantry", "Wraps", "Wraps", ["tortilla", "tortillas"]),
  item("stock", "pantry", "Stock", "Brühe", ["broth", "bruehe", "brühe", "bouillon"]),
  item("soySauce", "pantry", "Soy sauce", "Sojasoße", ["soya sauce", "sojasosse", "sojasauce"]),
  item("ketchup", "pantry", "Ketchup", "Ketchup"),
  item("mustard", "pantry", "Mustard", "Senf"),
  item("mayo", "pantry", "Mayonnaise", "Mayonnaise", ["mayo"]),

  item("iceCream", "frozen", "Ice cream", "Eis", ["icecream", "speiseeis"]),
  item("frozen", "frozen", "Frozen food", "Tiefkühlware", ["tiefkuehl", "tiefkühl", "tk"]),
  item("frozenPizza", "frozen", "Frozen pizza", "Tiefkühlpizza", ["pizza", "tk pizza"]),
  item("frozenVeg", "frozen", "Frozen vegetables", "Tiefkühlgemüse", ["frozen vegetables", "tk gemuese", "tk gemüse"]),
  item("fries", "frozen", "Fries", "Pommes", ["french fries", "pommes frites"]),
  item("peas", "frozen", "Peas", "Erbsen", ["pea", "erbse"]),

  item("water", "beverages", "Water", "Wasser"),
  item("sparklingWater", "beverages", "Sparkling water", "Sprudel", ["sparkling", "sparkling water", "mineral water", "mineralwasser"]),
  item("juice", "beverages", "Juice", "Saft"),
  item("orangeJuice", "beverages", "Orange juice", "Orangensaft"),
  item("appleJuice", "beverages", "Apple juice", "Apfelsaft"),
  item("cola", "beverages", "Cola", "Cola"),
  item("beer", "beverages", "Beer", "Bier"),
  item("wine", "beverages", "Wine", "Wein"),
  item("coffee", "beverages", "Coffee", "Kaffee"),
  item("tea", "beverages", "Tea", "Tee"),

  item("trashBags", "household", "Trash bags", "Müllbeutel", ["trash", "muell", "müll", "garbage bags", "muellbeutel", "müllbeutel", "beutel"]),
  item("dishwasherTabs", "household", "Dishwasher tabs", "Spülmaschinentabs", [
    "dishwasher",
    "spuel",
    "spül",
    "spuelmaschine",
    "spülmaschine",
    "spuelmaschinentabs",
  ]),
  item("detergent", "household", "Laundry detergent", "Waschmittel", ["detergent", "laundry"]),
  item("soap", "household", "Soap", "Seife"),
  item("toiletPaper", "household", "Toilet paper", "Toilettenpapier", ["paper", "toilet", "klot", "klo", "klopapier", "wc paper"]),
  item("kitchenRoll", "household", "Kitchen roll", "Küchenrolle", ["paper towels", "kuechenrolle", "kitchen paper"]),
  item("sponge", "household", "Sponge", "Schwamm", ["sponges", "schwaemme", "schwämme"]),
  item("foil", "household", "Foil", "Alufolie", ["aluminum foil", "aluminium foil", "alufolie"]),
  item("clingFilm", "household", "Cling film", "Frischhaltefolie", ["saran wrap", "plastic wrap"]),
  item("binLiners", "household", "Bin liners", "Mülleimerbeutel"),

  item("shampoo", "care", "Shampoo", "Shampoo"),
  item("toothpaste", "care", "Toothpaste", "Zahnpasta"),
  item("toothbrush", "care", "Toothbrush", "Zahnbürste", ["zahnbuerste"]),
  item("showerGel", "care", "Shower gel", "Duschgel", ["dusch", "body wash"]),
  item("lotion", "care", "Lotion", "Lotion", ["body lotion", "koerperlotion", "körperlotion"]),
  item("deodorant", "care", "Deodorant", "Deo", ["deo"]),
  item("tampons", "care", "Tampons", "Tampons"),
  item("pads", "care", "Pads", "Binden", ["sanitary pads", "damenbinden"]),
  item("soapBar", "care", "Hand soap", "Handseife"),

  item("catFood", "pets", "Cat food", "Katzenfutter", ["cat", "katze", "katzen", "kibble"]),
  item("dogFood", "pets", "Dog food", "Hundefutter", ["dog", "hund"]),
  item("litter", "pets", "Cat litter", "Katzenstreu", ["streu", "katzenstreu"]),
  item("petFood", "pets", "Pet food", "Futter", ["futter"]),
];

export function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIAS_MAP = new Map<string, GlossaryEntry>();
for (const entry of GROCERY_GLOSSARY) {
  for (const word of [entry.en, entry.de, ...entry.aliases]) {
    const folded = fold(word);
    if (!folded) continue;
    if (!ALIAS_MAP.has(folded)) ALIAS_MAP.set(folded, entry);
  }
}

export const CATEGORY_ALIAS_MATCHERS: { category: ShopCategory; word: string }[] = [...ALIAS_MAP.entries()]
  .map(([word, entry]) => ({ category: entry.aisle, word }))
  .sort((a, b) => b.word.length - a.word.length);

function stems(folded: string): string[] {
  const out: string[] = [];
  if (folded.endsWith("ies") && folded.length > 4) out.push(`${folded.slice(0, -3)}y`);
  if (folded.endsWith("es") && folded.length > 3) out.push(folded.slice(0, -2));
  if (folded.endsWith("s") && folded.length > 3) out.push(folded.slice(0, -1));
  if (folded.endsWith("en") && folded.length > 4) out.push(folded.slice(0, -2));
  if (folded.endsWith("n") && folded.length > 3) out.push(folded.slice(0, -1));
  if (folded.endsWith("er") && folded.length > 4) out.push(folded.slice(0, -2));
  if (folded.endsWith("e") && folded.length > 3) out.push(folded.slice(0, -1));
  return out;
}

function lookupFolded(folded: string): GlossaryEntry | undefined {
  const direct = ALIAS_MAP.get(folded);
  if (direct) return direct;
  for (const stem of stems(folded)) {
    const hit = ALIAS_MAP.get(stem);
    if (hit) return hit;
  }
  return undefined;
}

function label(entry: GlossaryEntry, locale: Locale): string {
  return locale === "de" ? entry.de : entry.en;
}

const SPLIT = /(\s+)/;

export function displayItemName(name: string, locale: Locale): string {
  const trimmed = name.trim();
  if (!trimmed) return name;

  const full = lookupFolded(fold(trimmed));
  if (full) return label(full, locale);

  const parts = trimmed.split(SPLIT);
  const words: { index: number; text: string }[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const text = parts[i];
    if (!text || SPLIT.test(text)) continue;
    words.push({ index: i, text });
  }

  const used = new Set<number>();
  for (let start = 0; start < words.length; start += 1) {
    if (used.has(start)) continue;
    let hit: GlossaryEntry | undefined;
    let span = 0;
    for (let n = words.length - start; n >= 1; n -= 1) {
      const phrase = words
        .slice(start, start + n)
        .map((word) => word.text)
        .join(" ");
      const match = lookupFolded(fold(phrase));
      if (match) {
        hit = match;
        span = n;
        break;
      }
    }
    const first = words[start];
    if (!hit || !first) continue;
    parts[first.index] = label(hit, locale);
    for (let extra = 1; extra < span; extra += 1) {
      const word = words[start + extra];
      if (!word) continue;
      parts[word.index] = "";
      const sep = word.index - 1;
      const sepText = parts[sep];
      if (sep >= 0 && sepText && SPLIT.test(sepText)) parts[sep] = "";
      used.add(start + extra);
    }
    used.add(start);
  }

  return parts.join("").replace(/\s+/g, " ").trim();
}
