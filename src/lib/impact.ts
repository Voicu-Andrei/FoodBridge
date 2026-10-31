import { KG_PER_UNIT } from '@/data/seed';
import type { Business, Order } from '@/data/types';

/**
 * Placeholder assumptions for the demo's impact figures. Replace these with sourced values
 * before presenting the numbers as facts.
 */
export const IMPACT = {
  /** kg CO₂-equivalent avoided per kg of food that isn't wasted. */
  co2PerKg: 2.5,
  /** kg of food counted as one meal. */
  kgPerMeal: 0.5,
  /** Weekly city-wide target shown on the meter. */
  weeklyGoalKg: 2500,
} as const;

const DAY = 24 * 60 * 60 * 1000;

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function orderKg(order: Order): number {
  return order.offer.quantity * KG_PER_UNIT[order.offer.unit];
}

/**
 * Simulated Munich network: kg rescued per day for the last 7 days (oldest first). Past days are
 * stable per calendar date; today grows with the time of day plus every real order made in the app.
 */
export function cityWeek(now: number, orders: Order[]): { day: number; kg: number }[] {
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const day = today - (6 - i) * DAY;
    const base = 210 + rand(day / DAY) * 140;
    if (day !== today) return { day, kg: Math.round(base) };
    const dayShare = Math.max(0.15, (now - today) / DAY);
    const real = orders.filter((o) => o.createdAt >= today).reduce((sum, o) => sum + orderKg(o), 0);
    return { day, kg: Math.round(base * dayShare + real) };
  });
}

export function businessImpact(businessId: string, orders: Order[]) {
  const bought = orders.filter((o) => o.buyerId === businessId);
  const sold = orders.filter((o) => o.sellerId === businessId);
  return {
    kg: [...bought, ...sold].reduce((sum, o) => sum + orderKg(o), 0),
    saved: bought.reduce((sum, o) => sum + (o.offer.priceOriginal - o.offer.priceDiscount), 0),
    earned: sold.reduce((sum, o) => sum + o.itemPrice, 0),
    count: bought.length + sold.length,
  };
}

/** Weekly leaderboard: a stable simulated base per business plus what it actually sold in the app. */
export function leaderboard(businesses: Business[], orders: Order[], limit = 5) {
  return businesses
    .map((b) => {
      const seed = [...b.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const sold = orders.filter((o) => o.sellerId === b.id).reduce((sum, o) => sum + orderKg(o), 0);
      return { business: b, kg: Math.round(40 + rand(seed) * 140 + sold) };
    })
    .sort((a, b) => b.kg - a.kg)
    .slice(0, limit);
}
