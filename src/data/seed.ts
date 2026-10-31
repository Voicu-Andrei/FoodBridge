import type { Business, CategoryId, District, Offer, QuantityUnit, Transaction } from './types';

export const CATEGORY_IDS: CategoryId[] = ['bakery', 'meat', 'fish', 'vegetarian', 'dairy', 'prepared'];

export const DISTRICTS: District[] = [
  { name: 'Schwabing', lat: 48.1642, lng: 11.5825 },
  { name: 'Glockenbachviertel', lat: 48.13, lng: 11.572 },
  { name: 'Maxvorstadt', lat: 48.15, lng: 11.566 },
  { name: 'Haidhausen', lat: 48.13, lng: 11.605 },
  { name: 'Au', lat: 48.125, lng: 11.585 },
  { name: 'Sendling', lat: 48.115, lng: 11.54 },
  { name: 'Bogenhausen', lat: 48.155, lng: 11.615 },
  { name: 'Altstadt', lat: 48.1374, lng: 11.5755 },
  { name: 'Westend', lat: 48.135, lng: 11.53 },
  { name: 'Neuhausen', lat: 48.155, lng: 11.535 },
  { name: 'Lehel', lat: 48.14, lng: 11.59 },
  { name: 'Isarvorstadt', lat: 48.127, lng: 11.565 },
];

export const DEMO_PASSWORD = 'demo1234';

export const SEED_BUSINESSES: Business[] = [
  { id: 'r1', name: 'Panera Schwabing', district: 'Schwabing', lat: 48.1642, lng: 11.5825, email: 'owner@panera-schwabing.de', password: DEMO_PASSWORD, category: 'bakery', walletBalance: 84.2, bankConnected: true },
  { id: 'r2', name: 'Trattoria Isar', district: 'Glockenbachviertel', lat: 48.13, lng: 11.572, email: 'owner@trattoria-isar.de', password: DEMO_PASSWORD, category: 'prepared', walletBalance: 142.5, bankConnected: false },
  { id: 'r3', name: 'Metzgerei Huber', district: 'Maxvorstadt', lat: 48.15, lng: 11.566, email: 'owner@metzgerei-huber.de', password: DEMO_PASSWORD, category: 'meat', walletBalance: 36.0, bankConnected: true },
  { id: 'r4', name: 'Fischmarkt Au', district: 'Au', lat: 48.125, lng: 11.585, email: 'owner@fischmarkt-au.de', password: DEMO_PASSWORD, category: 'fish', walletBalance: 212.75, bankConnected: true },
  { id: 'r5', name: 'Veggie Lounge', district: 'Haidhausen', lat: 48.13, lng: 11.605, email: 'owner@veggie-lounge.de', password: DEMO_PASSWORD, category: 'vegetarian', walletBalance: 58.4, bankConnected: false },
  { id: 'r6', name: 'Molkerei Sendling', district: 'Sendling', lat: 48.115, lng: 11.54, email: 'owner@molkerei-sendling.de', password: DEMO_PASSWORD, category: 'dairy', walletBalance: 19.9, bankConnected: false },
  { id: 'r7', name: 'Café Altstadt', district: 'Altstadt', lat: 48.1374, lng: 11.5755, email: 'owner@cafe-altstadt.de', password: DEMO_PASSWORD, category: 'bakery', walletBalance: 97.1, bankConnected: true },
  { id: 'r8', name: 'Kantine Bogenhausen', district: 'Bogenhausen', lat: 48.155, lng: 11.615, email: 'owner@kantine-bogenhausen.de', password: DEMO_PASSWORD, category: 'prepared', walletBalance: 305.6, bankConnected: true },
  { id: 'r9', name: 'Street Food Westend', district: 'Westend', lat: 48.135, lng: 11.53, email: 'owner@streetfood-westend.de', password: DEMO_PASSWORD, category: 'prepared', walletBalance: 44.3, bankConnected: false },
  { id: 'r10', name: 'Caterer Neuhausen', district: 'Neuhausen', lat: 48.155, lng: 11.535, email: 'owner@caterer-neuhausen.de', password: DEMO_PASSWORD, category: 'prepared', walletBalance: 128.0, bankConnected: true },
  { id: 'r11', name: 'Bistro Lehel', district: 'Lehel', lat: 48.14, lng: 11.59, email: 'owner@bistro-lehel.de', password: DEMO_PASSWORD, category: 'meat', walletBalance: 63.8, bankConnected: false },
  { id: 'r12', name: 'Backstube Isarvorstadt', district: 'Isarvorstadt', lat: 48.127, lng: 11.565, email: 'owner@backstube-isarvorstadt.de', password: DEMO_PASSWORD, category: 'bakery', walletBalance: 27.5, bankConnected: false },
];

type SeedOffer = {
  id: string;
  businessId: string;
  product: string;
  productDe: string;
  category: CategoryId;
  quantity: number;
  unit: QuantityUnit;
  priceOriginal: number;
  priceDiscount: number;
  /** Minutes from "now" when pickup opens (negative = already open). */
  startOffsetMin: number;
  durationMin: number;
  notes: string;
  notesDe: string;
};

const SEED_OFFERS: SeedOffer[] = [
  { id: 'o1', businessId: 'r1', product: 'Sourdough bread & rolls', productDe: 'Sauerteigbrot & Semmeln', category: 'bakery', quantity: 15, unit: 'kg', priceOriginal: 60, priceDiscount: 18, startOffsetMin: -20, durationMin: 140, notes: 'Pickup at the bakery, boxes included.', notesDe: 'Abholung in der Bäckerei, Kisten inklusive.' },
  { id: 'o2', businessId: 'r2', product: 'Fresh pasta & tomato sauce', productDe: 'Frische Pasta & Tomatensauce', category: 'prepared', quantity: 8, unit: 'kg', priceOriginal: 70, priceDiscount: 25, startOffsetMin: 60, durationMin: 90, notes: 'Vacuum-packed, freezer-safe.', notesDe: 'Vakuumiert, gefriergeeignet.' },
  { id: 'o3', businessId: 'r3', product: "Minced beef, today's surplus", productDe: 'Rinderhack, heutiger Überschuss', category: 'meat', quantity: 12, unit: 'kg', priceOriginal: 96, priceDiscount: 40, startOffsetMin: -10, durationMin: 120, notes: 'Best before tomorrow, cold chain required.', notesDe: 'Mindestens haltbar bis morgen, Kühlkette erforderlich.' },
  { id: 'o4', businessId: 'r4', product: 'Fresh-cut salmon fillets', productDe: 'Frisch geschnittener Lachs', category: 'fish', quantity: 6, unit: 'kg', priceOriginal: 90, priceDiscount: 35, startOffsetMin: -40, durationMin: 75, notes: 'Leftover from a cancelled order.', notesDe: 'Rest einer stornierten Bestellung.' },
  { id: 'o5', businessId: 'r5', product: 'Cut vegetables & hummus', productDe: 'Geschnittenes Gemüse & Hummus', category: 'vegetarian', quantity: 10, unit: 'kg', priceOriginal: 40, priceDiscount: 12, startOffsetMin: 30, durationMin: 120, notes: '100% vegan.', notesDe: '100 % vegan.' },
  { id: 'o6', businessId: 'r6', product: 'Cheese & yoghurt near best-before', productDe: 'Käse & Joghurt kurz vor MHD', category: 'dairy', quantity: 20, unit: 'units', priceOriginal: 55, priceDiscount: 20, startOffsetMin: -60, durationMin: 180, notes: '', notesDe: '' },
  { id: 'o7', businessId: 'r7', product: 'Cakes & pastries of the day', productDe: 'Kuchen & Gebäck des Tages', category: 'bakery', quantity: 5, unit: 'kg', priceOriginal: 45, priceDiscount: 15, startOffsetMin: 90, durationMin: 90, notes: 'Great for school canteens.', notesDe: 'Ideal für Schulkantinen.' },
  { id: 'o8', businessId: 'r8', product: 'Rice & chicken stew (catering)', productDe: 'Reis & Hähnchen-Eintopf (Catering)', category: 'prepared', quantity: 25, unit: 'portions', priceOriginal: 100, priceDiscount: 30, startOffsetMin: -30, durationMin: 120, notes: 'Event cancelled today.', notesDe: 'Veranstaltung heute abgesagt.' },
  { id: 'o9', businessId: 'r9', product: 'Mixed seasonal vegetables', productDe: 'Gemischtes Saisongemüse', category: 'vegetarian', quantity: 18, unit: 'kg', priceOriginal: 50, priceDiscount: 16, startOffsetMin: 120, durationMin: 120, notes: '', notesDe: '' },
  { id: 'o10', businessId: 'r10', product: 'Cold catering platters (starters)', productDe: 'Kalte Catering-Platten (Vorspeisen)', category: 'prepared', quantity: 30, unit: 'portions', priceOriginal: 150, priceDiscount: 45, startOffsetMin: 15, durationMin: 120, notes: 'Leftover from a corporate event.', notesDe: 'Rest einer Firmenveranstaltung.' },
  { id: 'o11', businessId: 'r11', product: 'Marinated chicken fillets', productDe: 'Marinierte Hähnchenfilets', category: 'meat', quantity: 9, unit: 'kg', priceOriginal: 72, priceDiscount: 28, startOffsetMin: -15, durationMin: 105, notes: '', notesDe: '' },
  { id: 'o12', businessId: 'r12', product: 'Croissants & Danish pastries', productDe: 'Croissants & Plundergebäck', category: 'bakery', quantity: 7, unit: 'kg', priceOriginal: 35, priceDiscount: 10, startOffsetMin: -50, durationMin: 70, notes: "This morning's batch, unsold.", notesDe: 'Heutige Morgencharge, unverkauft.' },
];

const MINUTE = 60_000;

/** Builds the demo offers with pickup windows relative to `now`, so the demo always looks live. */
export function buildSeedOffers(now: number): Offer[] {
  const base = Math.floor(now / (5 * MINUTE)) * 5 * MINUTE;
  return SEED_OFFERS.map(({ startOffsetMin, durationMin, ...offer }, index) => ({
    ...offer,
    windowStart: base + startOffsetMin * MINUTE,
    windowEnd: base + (startOffsetMin + durationMin) * MINUTE,
    createdAt: base - (index + 1) * 7 * MINUTE,
    seeded: true,
  }));
}

/** One "carried over" entry per business so every wallet starts with a history that explains its balance. */
export function buildOpeningTransactions(businesses: Business[], now: number): Transaction[] {
  return businesses.map((b) => ({
    id: `t_open_${b.id}`,
    businessId: b.id,
    kind: 'opening',
    amount: b.walletBalance,
    detail: '',
    createdAt: now - 2 * 24 * 60 * MINUTE,
  }));
}

type LiveTemplate = {
  product: string;
  productDe: string;
  category: CategoryId;
  unit: QuantityUnit;
  quantity: [number, number];
  priceOriginal: [number, number];
};

/** Products the "live marketplace" simulation draws from when new offers appear. */
export const LIVE_OFFER_POOL: LiveTemplate[] = [
  { product: 'Pretzels & bread rolls', productDe: 'Brezen & Semmeln', category: 'bakery', unit: 'kg', quantity: [4, 10], priceOriginal: [25, 45] },
  { product: 'Apple strudel', productDe: 'Apfelstrudel', category: 'bakery', unit: 'portions', quantity: [10, 24], priceOriginal: [30, 60] },
  { product: 'Weisswurst, today’s batch', productDe: 'Weißwürste, heutige Charge', category: 'meat', unit: 'units', quantity: [20, 40], priceOriginal: [35, 60] },
  { product: 'Chicken schnitzel', productDe: 'Hähnchenschnitzel', category: 'meat', unit: 'portions', quantity: [8, 16], priceOriginal: [40, 80] },
  { product: 'Smoked trout fillets', productDe: 'Geräucherte Forellenfilets', category: 'fish', unit: 'kg', quantity: [3, 6], priceOriginal: [45, 90] },
  { product: 'Roasted vegetable trays', productDe: 'Ofengemüse-Bleche', category: 'vegetarian', unit: 'kg', quantity: [5, 12], priceOriginal: [25, 45] },
  { product: 'Lentil curry', productDe: 'Linsencurry', category: 'vegetarian', unit: 'portions', quantity: [12, 30], priceOriginal: [40, 75] },
  { product: 'Obatzda & cheese platter', productDe: 'Obatzda & Käseplatte', category: 'dairy', unit: 'portions', quantity: [6, 14], priceOriginal: [30, 55] },
  { product: 'Fresh milk & cream', productDe: 'Frische Milch & Sahne', category: 'dairy', unit: 'units', quantity: [15, 30], priceOriginal: [25, 40] },
  { product: 'Käsespätzle (catering)', productDe: 'Käsespätzle (Catering)', category: 'prepared', unit: 'portions', quantity: [15, 35], priceOriginal: [60, 120] },
];

/** Rough weight per unit, used for "food saved" figures. Placeholder assumptions. */
export const KG_PER_UNIT: Record<QuantityUnit, number> = { kg: 1, portions: 0.4, units: 0.25 };
