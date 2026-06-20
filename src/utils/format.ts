export const market = {
  country: "Albania",
  city: "Tirana",
  currency: "ALL",
  locale: "sq-AL"
};

export function currency(value: number) {
  return `${Math.round(value).toLocaleString(market.locale)} ${market.currency}`;
}

export const benefitCategoryOptions = [
  "Health",
  "Food",
  "Fitness",
  "Family",
  "Learning",
  "Mobility",
  "Wellness"
] as const;

export const allocationCategories = ["Food", "Fitness", "Family", "Learning"] as const;
