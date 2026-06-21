import { pointsToAll } from "./pointsConversion";
import { Benefit, Company, SelectionRequest, User } from "../types";

export type ProviderPaymentRow = {
  request: SelectionRequest;
  benefit: Benefit;
  companyId?: string;
  companyName: string;
  redeemedAt: string;
};

export type ProviderOfferStats = {
  offerId: string;
  title: string;
  revenue: number;
  redemptions: number;
  views: number;
  conversionRate: number;
  validUntil: string;
  daysUntilExpiry: number;
  expiringSoon: boolean;
};

export type ProviderCustomer = {
  employeeId: string;
  employeeName: string;
  companyName: string;
  redemptions: number;
  totalSpent: number;
  lastRedemptionAt: string;
};

export type ProviderCompanyUsage = {
  companyId: string;
  companyName: string;
  redemptions: number;
  revenue: number;
};

export type ProviderAnalytics = {
  paymentRows: ProviderPaymentRow[];
  revenueByOffer: ProviderOfferStats[];
  averageTransactionValue: number;
  conversionRate: number;
  totalRevenue: number;
  totalRedemptions: number;
  totalViews: number;
  bestPerforming: ProviderOfferStats[];
  expiryImpact: {
    expiringSoon: { offers: number; redemptions: number; avgConversion: number };
    stable: { offers: number; redemptions: number; avgConversion: number };
  };
  revenueByDay: Array<{ label: string; revenue: number; dateKey: string }>;
  todayActivity: ProviderPaymentRow[];
  topCompanies: ProviderCompanyUsage[];
  customers: ProviderCustomer[];
};

function dayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function isToday(value: string) {
  return dayKey(value) === dayKey(new Date());
}

function daysUntil(dateValue: string, now = new Date()) {
  const end = new Date(dateValue);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildProviderPaymentRows(input: {
  selectionRequests: SelectionRequest[];
  offers: Benefit[];
  companies: Company[];
  users: User[];
  providerBusinessId: string;
}): ProviderPaymentRow[] {
  const offerIds = new Set(input.offers.map((offer) => offer.id));
  const businessId = input.providerBusinessId;

  return input.selectionRequests.flatMap((request) => {
    if (request.status !== "approved") return [];

    return request.benefitIds
      .map((benefitId) => input.offers.find((offer) => offer.id === benefitId))
      .filter((benefit): benefit is Benefit => Boolean(benefit))
      .filter((benefit) => benefit.businessId === businessId || offerIds.has(benefit.id))
      .map((benefit) => {
        const employee = input.users.find((user) => user.id === request.employeeId);
        const company =
          input.companies.find((item) => item.id === employee?.companyId) ??
          input.companies.find((item) => item.employerId === request.employerId);

        return {
          request,
          benefit,
          companyId: company?.id,
          companyName: company?.name ?? "Unknown company",
          redeemedAt: request.approvedAt ?? request.createdAt
        };
      });
  });
}

function countViewsForOffer(offerId: string, selectionRequests: SelectionRequest[], offerIds: Set<string>) {
  return selectionRequests.filter(
    (request) =>
      request.status !== "rejected" &&
      request.benefitIds.some((id) => id === offerId && offerIds.has(id))
  ).length;
}

export function computeProviderAnalytics(input: {
  paymentRows: ProviderPaymentRow[];
  offers: Benefit[];
  selectionRequests: SelectionRequest[];
}): ProviderAnalytics {
  const now = new Date();
  const offerIds = new Set(input.offers.map((offer) => offer.id));
  const totalRevenue = input.paymentRows.reduce(
    (sum, row) => sum + pointsToAll(row.benefit.pointsPrice),
    0
  );
  const totalRedemptions = input.paymentRows.length;
  const averageTransactionValue = totalRedemptions > 0 ? Math.round(totalRevenue / totalRedemptions) : 0;

  const relevantRequests = input.selectionRequests.filter((request) =>
    request.benefitIds.some((id) => offerIds.has(id))
  );
  const approvedRequests = relevantRequests.filter((request) => request.status === "approved").length;
  const totalViews = relevantRequests.filter((request) => request.status !== "rejected").length;
  const conversionRate =
    totalViews > 0 ? Math.round((approvedRequests / totalViews) * 100) : 0;

  const revenueByOffer: ProviderOfferStats[] = input.offers.map((offer) => {
    const rows = input.paymentRows.filter((row) => row.benefit.id === offer.id);
    const revenue = rows.reduce((sum, row) => sum + pointsToAll(row.benefit.pointsPrice), 0);
    const redemptions = rows.length;
    const views = countViewsForOffer(offer.id, input.selectionRequests, offerIds);
    const daysLeft = daysUntil(offer.validUntil, now);
    return {
      offerId: offer.id,
      title: offer.title,
      revenue,
      redemptions,
      views,
      conversionRate: views > 0 ? Math.round((redemptions / views) * 100) : 0,
      validUntil: offer.validUntil,
      daysUntilExpiry: daysLeft,
      expiringSoon: daysLeft >= 0 && daysLeft <= 14
    };
  });

  const bestPerforming = [...revenueByOffer]
    .sort((a, b) => b.redemptions - a.redemptions || b.revenue - a.revenue)
    .slice(0, 5);

  const expiringOffers = revenueByOffer.filter((item) => item.expiringSoon);
  const stableOffers = revenueByOffer.filter((item) => !item.expiringSoon);
  const avgConversion = (items: ProviderOfferStats[]) => {
    if (!items.length) return 0;
    return Math.round(items.reduce((sum, item) => sum + item.conversionRate, 0) / items.length);
  };

  const revenueMap = new Map<string, number>();
  for (const row of input.paymentRows) {
    const key = dayKey(row.redeemedAt);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + pointsToAll(row.benefit.pointsPrice));
  }

  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = dayKey(date);
    const label = date.toLocaleDateString(undefined, { weekday: "short" });
    return { label, revenue: revenueMap.get(key) ?? 0, dateKey: key };
  });

  const companyMap = new Map<string, ProviderCompanyUsage>();
  for (const row of input.paymentRows) {
    const id = row.companyId ?? row.companyName;
    const existing = companyMap.get(id) ?? {
      companyId: id,
      companyName: row.companyName,
      redemptions: 0,
      revenue: 0
    };
    existing.redemptions += 1;
    existing.revenue += pointsToAll(row.benefit.pointsPrice);
    companyMap.set(id, existing);
  }
  const topCompanies = [...companyMap.values()]
    .sort((a, b) => b.revenue - a.revenue || b.redemptions - a.redemptions)
    .slice(0, 5);

  const customerMap = new Map<string, ProviderCustomer>();
  for (const row of input.paymentRows) {
    const existing = customerMap.get(row.request.employeeId) ?? {
      employeeId: row.request.employeeId,
      employeeName: row.request.employeeName,
      companyName: row.companyName,
      redemptions: 0,
      totalSpent: 0,
      lastRedemptionAt: row.redeemedAt
    };
    existing.redemptions += 1;
    existing.totalSpent += pointsToAll(row.benefit.pointsPrice);
    if (new Date(row.redeemedAt) > new Date(existing.lastRedemptionAt)) {
      existing.lastRedemptionAt = row.redeemedAt;
    }
    customerMap.set(row.request.employeeId, existing);
  }
  const customers = [...customerMap.values()].sort(
    (a, b) => new Date(b.lastRedemptionAt).getTime() - new Date(a.lastRedemptionAt).getTime()
  );

  const todayActivity = input.paymentRows
    .filter((row) => isToday(row.redeemedAt))
    .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());

  return {
    paymentRows: input.paymentRows,
    revenueByOffer,
    averageTransactionValue,
    conversionRate,
    totalRevenue,
    totalRedemptions,
    totalViews,
    bestPerforming,
    expiryImpact: {
      expiringSoon: {
        offers: expiringOffers.length,
        redemptions: expiringOffers.reduce((sum, item) => sum + item.redemptions, 0),
        avgConversion: avgConversion(expiringOffers)
      },
      stable: {
        offers: stableOffers.length,
        redemptions: stableOffers.reduce((sum, item) => sum + item.redemptions, 0),
        avgConversion: avgConversion(stableOffers)
      }
    },
    revenueByDay,
    todayActivity,
    topCompanies,
    customers
  };
}
