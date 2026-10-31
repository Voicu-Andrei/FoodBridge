export type LatLng = { latitude: number; longitude: number };

/**
 * A gently curved path between two points (quadratic Bézier bowed to one side), so the simulated
 * delivery reads as a route rather than a straight ruler line.
 */
export function buildRoute(from: LatLng, to: LatLng, samples = 64): LatLng[] {
  const dLat = to.latitude - from.latitude;
  const dLng = to.longitude - from.longitude;
  const control = {
    latitude: (from.latitude + to.latitude) / 2 - dLng * 0.28,
    longitude: (from.longitude + to.longitude) / 2 + dLat * 0.28,
  };
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    return {
      latitude: a * from.latitude + b * control.latitude + c * to.latitude,
      longitude: a * from.longitude + b * control.longitude + c * to.longitude,
    };
  });
}

/** Point at fraction `t` (0–1) of the route, measured along its length. */
export function pointAlong(route: LatLng[], t: number): { point: LatLng; index: number } {
  if (route.length < 2) return { point: route[0], index: 0 };
  const segments = route.slice(1).map((p, i) => Math.hypot(p.latitude - route[i].latitude, p.longitude - route[i].longitude));
  const total = segments.reduce((sum, s) => sum + s, 0);
  let remaining = Math.min(1, Math.max(0, t)) * total;
  for (let i = 0; i < segments.length; i++) {
    if (remaining <= segments[i] || i === segments.length - 1) {
      const f = segments[i] === 0 ? 0 : Math.min(1, remaining / segments[i]);
      const a = route[i];
      const b = route[i + 1];
      return {
        point: { latitude: a.latitude + (b.latitude - a.latitude) * f, longitude: a.longitude + (b.longitude - a.longitude) * f },
        index: i + 1,
      };
    }
    remaining -= segments[i];
  }
  return { point: route[route.length - 1], index: route.length - 1 };
}
