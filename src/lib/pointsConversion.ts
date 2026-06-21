import { market } from "./format";

export const POINTS_CONVERSION = {
  allAmount: 100,
  pointsAmount: 10
};

const ALL_PER_POINT = POINTS_CONVERSION.allAmount / POINTS_CONVERSION.pointsAmount;

export function pointsToAll(points: number): number {
  return Math.round(Math.max(0, points) * ALL_PER_POINT);
}

export function allToPoints(all: number): number {
  return Math.round(Math.max(0, all) / ALL_PER_POINT);
}

export function formatPointsRate(): string {
  return `${POINTS_CONVERSION.allAmount} ${market.currency} = ${POINTS_CONVERSION.pointsAmount} pts`;
}

export function formatPointsWithAllHint(points: number): string {
  const all = pointsToAll(points);
  return `${Math.round(points).toLocaleString(market.locale)} pts · ≈ ${all.toLocaleString(market.locale)} ${market.currency}`;
}
