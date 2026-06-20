import { PerxLiveData } from "./perxRepository";
import { Benefit, ProviderProfile, User } from "../types";

type AppData = PerxLiveData;

export type ProviderOfferGroup = {
  key: string;
  profile?: ProviderProfile;
  offers: Benefit[];
};

export function resolveEmployerId(appData: AppData, employee: User): string | undefined {
  const company = appData.companies.find((item) => item.id === employee.companyId);
  return (
    company?.employerId ??
    appData.users.find((user) => user.role === "employer" && user.companyId === employee.companyId)?.id
  );
}

export function groupProvidersWithOffers(
  providerProfiles: ProviderProfile[],
  benefits: Benefit[]
): ProviderOfferGroup[] {
  const groups = new Map<string, ProviderOfferGroup>();

  for (const profile of providerProfiles) {
    groups.set(profile.id, { key: profile.id, profile, offers: [] });
  }

  for (const benefit of benefits) {
    const profile =
      providerProfiles.find(
        (item) =>
          item.id === benefit.providerId ||
          item.businessName === benefit.providerName ||
          item.userId === benefit.businessId
      ) ?? undefined;
    const key = profile?.id ?? benefit.providerId ?? benefit.providerName;

    if (!groups.has(key)) {
      groups.set(key, { key, profile, offers: [] });
    }

    const group = groups.get(key)!;
    if (profile && !group.profile) group.profile = profile;
    if (!group.offers.some((item) => item.id === benefit.id)) {
      group.offers.push(benefit);
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    (a.profile?.businessName ?? a.offers[0]?.providerName ?? "").localeCompare(
      b.profile?.businessName ?? b.offers[0]?.providerName ?? ""
    )
  );
}

export function filterBenefitsForEmployee(
  appData: AppData,
  employee: User,
  enabledBenefitIdsByEmployer: Record<string, string[]>
): Benefit[] {
  const employerId = resolveEmployerId(appData, employee);
  if (!employerId) return [];
  const enabled = enabledBenefitIdsByEmployer[employerId] ?? [];
  if (!enabled.length) return [];
  return appData.benefits.filter((benefit) => enabled.includes(benefit.id));
}

export function toggleBenefitId(current: string[], benefitId: string): string[] {
  const next = new Set(current);
  if (next.has(benefitId)) next.delete(benefitId);
  else next.add(benefitId);
  return [...next];
}

export function setBenefitIds(current: string[], benefitIds: string[], selected: boolean): string[] {
  const next = new Set(current);
  for (const id of benefitIds) {
    if (selected) next.add(id);
    else next.delete(id);
  }
  return [...next];
}
