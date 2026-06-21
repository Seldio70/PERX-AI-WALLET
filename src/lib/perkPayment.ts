import { pointsToAll } from "./pointsConversion";
import { Benefit, SelectionRequest, User } from "../types";

export function perkPointsCost(benefit: Benefit): number {
  return Math.max(0, benefit.pointsPrice);
}

export function canAffordPerk(pointsBalance: number, benefit: Benefit): boolean {
  return pointsBalance >= perkPointsCost(benefit);
}

export function employerPayoutAmount(benefit: Benefit): number {
  return pointsToAll(benefit.pointsPrice);
}

export type PointsHealth = {
  balance: number;
  spentThisMonth: number;
  redemptions: number;
  daysLeft: number;
  cycleDays: number;
};

export function computePointsHealth(input: {
  user: User;
  pointsBalance: number;
  selectionRequests: SelectionRequest[];
  now?: Date;
}): PointsHealth {
  const now = input.now ?? new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mine = input.selectionRequests.filter(
    (request) =>
      request.employeeId === input.user.id &&
      request.status === "approved" &&
      new Date(request.createdAt) >= monthStart
  );
  const spentThisMonth = mine.reduce((sum, request) => sum + request.totalPoints, 0);
  const cycleDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, cycleDays - now.getDate() + 1);

  return {
    balance: input.pointsBalance,
    spentThisMonth,
    redemptions: mine.length,
    daysLeft,
    cycleDays
  };
}

export function employerSettlementStats(
  employerId: string,
  selectionRequests: SelectionRequest[]
): { redemptionCount: number; pointsRedeemed: number; paidToProviders: number } {
  const approved = selectionRequests.filter(
    (request) => request.employerId === employerId && request.status === "approved"
  );
  return {
    redemptionCount: approved.length,
    pointsRedeemed: approved.reduce((sum, request) => sum + request.totalPoints, 0),
    paidToProviders: approved.reduce((sum, request) => sum + pointsToAll(request.totalPoints), 0)
  };
}

export function providerSettlementStats(
  providerUserId: string,
  providerProfileId: string | undefined,
  providerName: string,
  selectionRequests: SelectionRequest[],
  benefits: Benefit[]
): { redemptionCount: number; pointsRedeemed: number; revenue: number } {
  const providerBenefitIds = new Set(
    benefits
      .filter(
        (benefit) =>
          benefit.businessId === providerUserId ||
          benefit.providerId === providerProfileId ||
          benefit.providerName === providerName
      )
      .map((benefit) => benefit.id)
  );

  let redemptionCount = 0;
  let pointsRedeemed = 0;
  let revenue = 0;

  for (const request of selectionRequests) {
    if (request.status !== "approved") continue;
    const matched = request.benefitIds.filter((id) => providerBenefitIds.has(id));
    if (!matched.length) continue;
    redemptionCount += matched.length;
    for (const benefitId of matched) {
      const benefit = benefits.find((item) => item.id === benefitId);
      if (!benefit) continue;
      pointsRedeemed += perkPointsCost(benefit);
      revenue += employerPayoutAmount(benefit);
    }
  }

  return { redemptionCount, pointsRedeemed, revenue };
}

/** One wallet card per unique redeemed perk (most recent redemption wins). */
export function redeemedWalletBenefits(
  userId: string,
  selectionRequests: SelectionRequest[],
  benefits: Benefit[]
): Benefit[] {
  const benefitById = new Map(benefits.map((benefit) => [benefit.id, benefit]));
  const orderedIds: string[] = [];
  const seen = new Set<string>();

  const mine = selectionRequests
    .filter((request) => request.employeeId === userId && request.status === "approved")
    .sort((a, b) =>
      (b.approvedAt ?? b.createdAt ?? "").localeCompare(a.approvedAt ?? a.createdAt ?? "")
    );

  for (const request of mine) {
    const uniqueIds = Array.from(new Set(request.benefitIds));
    for (const benefitId of uniqueIds) {
      if (seen.has(benefitId) || !benefitById.has(benefitId)) continue;
      seen.add(benefitId);
      orderedIds.push(benefitId);
    }
  }

  return orderedIds
    .map((id) => benefitById.get(id))
    .filter((benefit): benefit is Benefit => Boolean(benefit));
}
