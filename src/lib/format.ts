export const market = {
  country: "Albania",
  city: "Tirana",
  currency: "ALL",
  locale: "sq-AL"
};

export function currency(value: number): string {
  return `${Math.round(value).toLocaleString(market.locale)} ${market.currency}`;
}

export function formatActivityTimestamp(iso: string): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffHours < 48) {
    return "Yesterday";
  }
  return date.toLocaleDateString(market.locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function escapeCsvField(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
