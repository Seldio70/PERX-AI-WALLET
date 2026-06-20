export type Role = "employee" | "employer" | "business";

export type User = {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
  yearsEmployed?: number;
  businessId?: string;
  invitedByUserId?: string;
};

export type Company = {
  id: string;
  name: string;
  employerId: string;
  monthlyBudgetPerEmployee: number;
};

export type BenefitCategory =
  | "Health"
  | "Food"
  | "Fitness"
  | "Family"
  | "Learning"
  | "Mobility"
  | "Wellness";

export type Benefit = {
  id: string;
  businessId: string;
  providerId?: string;
  providerName: string;
  title: string;
  description: string;
  discount: string;
  price: number;
  pointsPrice: number;
  imageUrl: string;
  redemptionType: "QR" | "NFC";
  category: BenefitCategory;
  validUntil: string;
  city: string;
};

export type ProviderProfile = {
  id: string;
  userId: string;
  businessName: string;
  logoUrl: string;
  description: string;
  category: BenefitCategory;
  city: string;
  isApproved: boolean;
};

export type OfferDraft = {
  title: string;
  description: string;
  discount: string;
  price: string;
  pointsPrice: string;
  imageUrl: string;
  redemptionType: "QR" | "NFC";
  validUntil: string;
};

export type SelectionRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employerId?: string;
  benefitIds: string[];
  total: number;
  totalPoints: number;
  status: "pending" | "approved";
  createdAt: string;
  approvedAt?: string;
};

export type EmployerInvite = {
  id: string;
  employeeId: string;
  employerEmail: string;
  companyName: string;
  status: "sent" | "accepted";
  inviteCode: string;
};

export type EmployerWalletCard = {
  id: string;
  title: string;
  points: number;
  description: string;
  accent: string;
};

export type Challenge = {
  id: string;
  employeeId: string;
  employeeName: string;
  employerId: string;
  title: string;
  description: string;
  rewardPoints: number;
  status: "open" | "completed";
};
