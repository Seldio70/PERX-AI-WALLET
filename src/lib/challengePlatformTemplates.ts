import { ChallengeCriterion, ChallengeDefinition } from "../types";

export type PlatformTemplateKey = "use_perks" | "login_streak" | "wellness_steps" | "wellness_sleep";

export const PLATFORM_TEMPLATE_KEYS: PlatformTemplateKey[] = [
  "use_perks",
  "login_streak",
  "wellness_steps",
  "wellness_sleep"
];

/** Retired platform template — deactivated on seed so employers migrate cleanly. */
export const RETIRED_PLATFORM_TEMPLATE_KEYS = ["explore_category"] as const;

type PlatformTemplateSeed = {
  templateKey: PlatformTemplateKey;
  title: string;
  description: string;
  rewardPoints: number;
  criterion: ChallengeCriterion;
  pointCap?: number;
};

export const PLATFORM_CHALLENGE_SEEDS: PlatformTemplateSeed[] = [
  {
    templateKey: "use_perks",
    title: "Use your perks",
    description: "Redeem two perks this month to earn bonus points.",
    rewardPoints: 500,
    criterion: { kind: "redeem_count", count: 2, period: "month" },
    pointCap: 500
  },
  {
    templateKey: "login_streak",
    title: "Daily login streak",
    description: "Open PerX seven days in a row.",
    rewardPoints: 400,
    criterion: { kind: "login_streak", days: 7 },
    pointCap: 400
  },
  {
    templateKey: "wellness_steps",
    title: "Walk 10,000 steps",
    description: "Hit 10,000 steps in a day. Syncs from Apple Health on iPhone.",
    rewardPoints: 300,
    criterion: { kind: "health_steps", count: 10000, period: "day" },
    pointCap: 300
  },
  {
    templateKey: "wellness_sleep",
    title: "Sleep 8 hours",
    description: "Get at least 8 hours of sleep. Syncs from Apple Health on iPhone.",
    rewardPoints: 250,
    criterion: { kind: "health_sleep", hours: 8, period: "day" },
    pointCap: 250
  }
];

export function buildPlatformDefinition(
  seed: PlatformTemplateSeed,
  employerId: string,
  id?: string
): ChallengeDefinition {
  return {
    id: id ?? `platform_${seed.templateKey}_${employerId}`,
    source: "platform",
    employerId,
    templateKey: seed.templateKey,
    title: seed.title,
    description: seed.description,
    rewardPoints: seed.rewardPoints,
    criterion: seed.criterion,
    target: "everyone",
    pointCap: seed.pointCap,
    active: true,
    createdAt: new Date().toISOString()
  };
}

export function defaultPlatformDefinitions(employerId: string): ChallengeDefinition[] {
  return PLATFORM_CHALLENGE_SEEDS.map((seed) => buildPlatformDefinition(seed, employerId));
}

export function criterionLabel(criterion: ChallengeCriterion): string {
  switch (criterion.kind) {
    case "redeem_count":
      return `Redeem ${criterion.count} perk${criterion.count === 1 ? "" : "s"} (${criterion.period})`;
    case "redeem_category":
      return `Redeem ${criterion.count} ${criterion.category} perk (${criterion.period})`;
    case "redeem_new_category":
      return `Try ${criterion.count} new perk categor${criterion.count === 1 ? "y" : "ies"} (${criterion.period})`;
    case "login_streak":
      return `${criterion.days}-day login streak`;
    case "health_steps":
      return `Walk ${criterion.count.toLocaleString()} steps (${criterion.period})`;
    case "health_sleep":
      return `Sleep ${criterion.hours} hours (${criterion.period})`;
    case "manual":
      return "Employer approval";
    default:
      return "Custom goal";
  }
}
