export const market = {
  country: "Albania",
  city: "Tirana",
  currency: "ALL",
  locale: "sq-AL"
};

export function currency(value: number): string {
  return `${Math.round(value).toLocaleString(market.locale)} ${market.currency}`;
}
