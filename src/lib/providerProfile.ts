import { BenefitCategory } from "../types";
import { isLocalImageUri } from "./imageUpload";

export const DEFAULT_PROVIDER_LOGO =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80";

export type ProviderProfileDraft = {
  businessName: string;
  description: string;
  category: BenefitCategory;
  logoUrl: string;
  city: string;
};

export function validateProviderProfileDraft(profile: ProviderProfileDraft): string | null {
  if (!profile.businessName.trim()) return "Enter your business name.";
  if (!profile.description.trim()) return "Add a short business description.";
  if (!profile.city.trim()) return "Enter your city.";
  if (
    !profile.logoUrl.trim() ||
    profile.logoUrl === DEFAULT_PROVIDER_LOGO ||
    isLocalImageUri(profile.logoUrl)
  ) {
    return "Upload a logo for your business.";
  }
  return null;
}

export function isProviderProfileComplete(profile: ProviderProfileDraft): boolean {
  return validateProviderProfileDraft(profile) === null;
}
