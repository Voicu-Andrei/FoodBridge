/** Great-circle distance in kilometres (haversine), same formula as the prototype. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LOGISTICS_BASE = 4.5;
const LOGISTICS_PER_KM = 0.9;

/** FoodBridge delivery fee: €4.50 base + €0.90 per km. */
export function logisticsPrice(km: number): number {
  return LOGISTICS_BASE + km * LOGISTICS_PER_KM;
}

/** Cargo-bike pickup estimate: ~15 km/h plus a couple of minutes to load. */
export function bikeMinutes(km: number): number {
  return Math.max(3, Math.round(km * 4 + 2));
}

/** Delivery estimate: dispatch time plus city driving. */
export function deliveryMinutes(km: number): number {
  return Math.round(12 + km * 3);
}
