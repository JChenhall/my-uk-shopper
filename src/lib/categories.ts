// src/lib/categories.ts

export const CATEGORIES = [
  { name: "Dairy & Eggs", icon: "🥛", color: "bg-blue-100" },
  { name: "Fruit & Veg", icon: "🥕", color: "bg-green-100" },
  { name: "Meat & Fish", icon: "🥩", color: "bg-red-100" },
  { name: "Bakery", icon: "🍞", color: "bg-yellow-100" },
  { name: "Pantry", icon: "🥫", color: "bg-orange-100" },
  { name: "Frozen", icon: "❄️", color: "bg-cyan-100" },
  { name: "Drinks", icon: "🥤", color: "bg-purple-100" },
  { name: "Snacks", icon: "🍿", color: "bg-pink-100" },
  { name: "Household", icon: "🧹", color: "bg-gray-100" },
  { name: "Other", icon: "📦", color: "bg-slate-100" },
] as const;

export type CategoryName = typeof CATEGORIES[number]["name"];

export function getCategoryForProduct(productName: string, categories?: string): CategoryName {
  const name = productName.toLowerCase();
  const cats = categories?.toLowerCase() || "";

  // Dairy & Eggs
  if (
    name.includes("milk") ||
    name.includes("cheese") ||
    name.includes("yogurt") ||
    name.includes("butter") ||
    name.includes("cream") ||
    name.includes("egg") ||
    cats.includes("dairy") ||
    cats.includes("milk")
  ) {
    return "Dairy & Eggs";
  }

  // Fruit & Veg
  if (
    name.includes("fruit") ||
    name.includes("vegetable") ||
    name.includes("apple") ||
    name.includes("banana") ||
    name.includes("carrot") ||
    name.includes("lettuce") ||
    name.includes("tomato") ||
    name.includes("potato") ||
    name.includes("onion") ||
    cats.includes("fruit") ||
    cats.includes("vegetable")
  ) {
    return "Fruit & Veg";
  }

  // Meat & Fish
  if (
    name.includes("meat") ||
    name.includes("chicken") ||
    name.includes("beef") ||
    name.includes("pork") ||
    name.includes("fish") ||
    name.includes("salmon") ||
    name.includes("tuna") ||
    cats.includes("meat") ||
    cats.includes("fish")
  ) {
    return "Meat & Fish";
  }

  // Bakery
  if (
    name.includes("bread") ||
    name.includes("cake") ||
    name.includes("biscuit") ||
    name.includes("pastry") ||
    name.includes("roll") ||
    cats.includes("bakery") ||
    cats.includes("bread")
  ) {
    return "Bakery";
  }

  // Frozen
  if (name.includes("frozen") || cats.includes("frozen")) {
    return "Frozen";
  }

  // Drinks
  if (
    name.includes("juice") ||
    name.includes("water") ||
    name.includes("tea") ||
    name.includes("coffee") ||
    name.includes("drink") ||
    name.includes("cola") ||
    name.includes("beer") ||
    name.includes("wine") ||
    cats.includes("beverage")
  ) {
    return "Drinks";
  }

  // Snacks
  if (
    name.includes("crisp") ||
    name.includes("chip") ||
    name.includes("chocolate") ||
    name.includes("sweet") ||
    name.includes("candy") ||
    name.includes("snack") ||
    cats.includes("snack")
  ) {
    return "Snacks";
  }

  // Household
  if (
    name.includes("clean") ||
    name.includes("detergent") ||
    name.includes("soap") ||
    name.includes("tissue") ||
    name.includes("toilet") ||
    name.includes("paper") ||
    cats.includes("household") ||
    cats.includes("cleaning")
  ) {
    return "Household";
  }

  // Pantry (catch-all for food items)
  if (
    name.includes("pasta") ||
    name.includes("rice") ||
    name.includes("sauce") ||
    name.includes("oil") ||
    name.includes("tin") ||
    name.includes("can") ||
    cats.includes("groceries")
  ) {
    return "Pantry";
  }

  return "Other";
}
