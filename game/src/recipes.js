// recipes.js — every dish on the Sizzle & Serve menu.
// An ingredient id is a prepared item the player can hold. Raw items
// (patty, lettuce, tomato) must be processed before they count.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8a94e', dark: '#b97f2e', price: 2,  raw: false, chop: false, grill: false },
  patty:   { name: 'Patty',   color: '#c98a6b', dark: '#8a5a3b', price: 6,  raw: true,  chop: false, grill: true  },
  lettuce: { name: 'Lettuce', color: '#7dc383', dark: '#4a8f52', price: 2,  raw: true,  chop: true,  grill: false },
  tomato:  { name: 'Tomato',  color: '#e4574a', dark: '#a83228', price: 3,  raw: true,  chop: true,  grill: false },
  cheese:  { name: 'Cheese',  color: '#f7c948', dark: '#d9a41f', price: 3,  raw: false, chop: false, grill: false },
  sauce:   { name: 'Sauce',   color: '#f2e3c6', dark: '#c9a86a', price: 2,  raw: false, chop: false, grill: false },
};

// A prepared ingredient is the cooked / chopped / ready form of a raw one.
export function preparedId(id) {
  if (id === 'patty') return 'pattyCooked';
  if (id === 'lettuce') return 'lettuceChopped';
  if (id === 'tomato') return 'tomatoChopped';
  return id;
}

export function displayName(id) {
  if (id === 'pattyCooked') return 'Grilled Patty';
  if (id === 'lettuceChopped') return 'Chopped Lettuce';
  if (id === 'tomatoChopped') return 'Sliced Tomato';
  const ing = INGREDIENTS[id];
  return ing ? ing.name : id;
}

// Recipes: id, display name, list of prepared ingredient ids, base pay.
export const RECIPES = [
  { id: 'classic',  name: 'Classic Burger',  items: ['bun', 'pattyCooked', 'lettuceChopped'],            pay: 14 },
  { id: 'cheese',   name: 'Cheese Melt',     items: ['bun', 'pattyCooked', 'cheese'],                    pay: 16 },
  { id: 'garden',   name: 'Garden Stack',    items: ['bun', 'lettuceChopped', 'tomatoChopped', 'cheese'], pay: 18 },
  { id: 'saucy',    name: 'Saucy Deluxe',    items: ['bun', 'pattyCooked', 'tomatoChopped', 'sauce'],     pay: 20 },
  { id: 'double',   name: 'Double Trouble',  items: ['bun', 'pattyCooked', 'pattyCooked', 'cheese', 'sauce'], pay: 28 },
];

// Recipe pool by elapsed shift time: early shift is gentle, later is mean.
export function recipePool(elapsedSec) {
  if (elapsedSec < 30) return RECIPES.slice(0, 2);
  if (elapsedSec < 75) return RECIPES.slice(0, 4);
  return RECIPES;
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// True when the plate's items match a recipe exactly (order ignored).
export function matchRecipe(plateItems) {
  const sorted = [...plateItems].sort();
  for (const r of RECIPES) {
    const want = [...r.items].sort();
    if (want.length === sorted.length && want.every((v, i) => v === sorted[i])) return r;
  }
  return null;
}
