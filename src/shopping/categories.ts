import { CATEGORY_ALIAS_MATCHERS, fold } from "./glossary";

export const SHOP_CATEGORIES = [
  "fridge",
  "produce",
  "bakery",
  "meat",
  "pantry",
  "frozen",
  "beverages",
  "household",
  "care",
  "pets",
  "other",
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

export const SHOP_CATEGORY_LABEL: Record<ShopCategory, string> = {
  fridge: "Fridge & dairy",
  produce: "Produce",
  bakery: "Bakery",
  meat: "Meat & fish",
  pantry: "Pantry",
  frozen: "Frozen",
  beverages: "Beverages",
  household: "Household",
  care: "Personal care",
  pets: "Pets",
  other: "Other",
};

export const SHOP_CATEGORY_ICON: Record<ShopCategory, string> = {
  fridge: "cat-milk",
  produce: "cat-leaf",
  bakery: "cat-bread",
  meat: "cat-fish",
  pantry: "cat-jar",
  frozen: "cat-snow",
  beverages: "cat-bottle",
  household: "cat-spray",
  care: "cat-drop",
  pets: "cat-paw",
  other: "cat-basket",
};

export function isShopCategory(value: string | null | undefined): value is ShopCategory {
  return SHOP_CATEGORIES.includes(value as ShopCategory);
}

function hasTerm(haystack: string, term: string): boolean {
  if (term.includes(" ")) return haystack.includes(term);
  const pattern =
    term.length < 4
      ? `(?:^|[^a-z0-9])${term}(?:$|[^a-z0-9])`
      : `(?:^|[^a-z0-9])${term}`;
  return new RegExp(pattern).test(haystack);
}

export function resolveCategory(name: string, stored?: string | null): ShopCategory {
  if (isShopCategory(stored) && stored !== "other") return stored;
  const haystack = fold(name);
  const hit = CATEGORY_ALIAS_MATCHERS.find(({ word }) => hasTerm(haystack, word));
  return hit?.category ?? "other";
}

export function groupByCategory<T extends { name: string; category?: string | null }>(
  items: T[],
): { id: ShopCategory; label: string; icon: string; items: T[] }[] {
  const buckets = new Map<ShopCategory, T[]>();
  for (const item of items) {
    const id = resolveCategory(item.name, item.category);
    const list = buckets.get(id) ?? [];
    list.push(item);
    buckets.set(id, list);
  }
  return SHOP_CATEGORIES.filter((id) => buckets.has(id)).map((id) => ({
    id,
    label: SHOP_CATEGORY_LABEL[id],
    icon: SHOP_CATEGORY_ICON[id],
    items: buckets.get(id) ?? [],
  }));
}
