import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  buildOpeningTransactions,
  buildSeedOffers,
  DISTRICTS,
  LIVE_OFFER_POOL,
  SEED_BUSINESSES,
} from '@/data/seed';
import type {
  Business,
  FulfilmentMethod,
  Language,
  Offer,
  OfferInput,
  Order,
  RegisterInput,
  Transaction,
  TransactionKind,
} from '@/data/types';
import { orderTotal, quoteOffer, round2 } from '@/lib/pricing';

/**
 * All app data lives here and is persisted on the phone. Screens only talk to these actions,
 * so a real backend can replace them later without touching the UI.
 */
type AppData = {
  businesses: Business[];
  offers: Offer[];
  orders: Order[];
  transactions: Transaction[];
  /** Logged-in business. */
  sessionBusinessId: string | null;
  /** Fallback business used before anyone has logged in. */
  previewBusinessId: string;
  onboarded: boolean;
  thresholdKm: number;
  language: Language;
  seededAt: number;
  /** Presenter settings. */
  liveMarket: boolean;
  liveIntervalSec: number;
  deliverySeconds: number;
};

export type ReserveResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: 'unavailable' | 'insufficientFunds' };

type AppState = AppData & {
  hasHydrated: boolean;
  /** Most recent offer added by the live-marketplace simulation (drives the in-app banner). */
  lastLiveOffer: { offerId: string; at: number } | null;

  switchBusiness: (id: string) => void;
  login: (email: string, password: string) => boolean;
  register: (input: RegisterInput) => void;
  logout: () => void;
  completeOnboarding: () => void;

  setThresholdKm: (km: number) => void;
  setLanguage: (language: Language) => void;

  reserveOffer: (offerId: string, method: FulfilmentMethod) => ReserveResult;
  completeOrder: (orderId: string) => void;
  completeAllDeliveries: () => void;

  publishOffer: (input: OfferInput) => string;
  updateOffer: (offerId: string, input: OfferInput) => void;
  removeOffer: (offerId: string) => void;

  topUp: (amount: number) => void;
  connectBank: () => void;
  /** Moves the whole wallet balance to the (demo) bank account and returns the amount. */
  payOut: () => number;

  addLiveOffer: () => Offer | null;
  setLiveMarket: (on: boolean) => void;
  setLiveIntervalSec: (seconds: number) => void;
  setDeliverySeconds: (seconds: number) => void;

  refreshDemoIfStale: () => void;
  resetDemo: () => void;
};

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
const MAX_LIVE_OFFERS = 24;

function freshData(now: number): Omit<AppData, 'language' | 'liveMarket' | 'liveIntervalSec' | 'deliverySeconds'> {
  const businesses = SEED_BUSINESSES.map((b) => ({ ...b }));
  return {
    businesses,
    offers: buildSeedOffers(now),
    orders: [],
    transactions: buildOpeningTransactions(businesses, now),
    sessionBusinessId: null,
    previewBusinessId: SEED_BUSINESSES[0].id,
    onboarded: false,
    thresholdKm: 3,
    seededAt: now,
  };
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function pickupCode(): string {
  return `FB-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function activeId(s: AppData): string {
  return s.sessionBusinessId ?? s.previewBusinessId;
}

function transaction(
  businessId: string,
  kind: TransactionKind,
  amount: number,
  now: number,
  offer?: Offer,
): Transaction {
  return {
    id: newId('t'),
    businessId,
    kind,
    amount: round2(amount),
    detail: offer?.product ?? '',
    detailDe: offer?.productDe,
    createdAt: now,
  };
}

function adjustBalance(businesses: Business[], id: string, delta: number, patch?: Partial<Business>): Business[] {
  return businesses.map((b) => (b.id === id ? { ...b, ...patch, walletBalance: round2(b.walletBalance + delta) } : b));
}

function offerFromInput(input: OfferInput): Omit<Offer, 'id' | 'businessId' | 'createdAt' | 'seeded'> {
  return {
    product: input.product.trim(),
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    priceOriginal: round2(input.priceOriginal),
    priceDiscount: round2(input.priceDiscount),
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    notes: input.notes.trim(),
    photoUri: input.photoUri,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...freshData(Date.now()),
      language: 'en',
      liveMarket: true,
      liveIntervalSec: 40,
      deliverySeconds: 75,
      hasHydrated: false,
      lastLiveOffer: null,

      switchBusiness: (id) => set({ sessionBusinessId: id, previewBusinessId: id }),

      login: (email, password) => {
        const match = get().businesses.find(
          (b) => b.email.toLowerCase() === email.trim().toLowerCase() && b.password === password,
        );
        if (!match) return false;
        set({ sessionBusinessId: match.id, previewBusinessId: match.id, onboarded: true });
        return true;
      },

      register: ({ name, district, category, email, password }) => {
        const place = DISTRICTS.find((d) => d.name === district) ?? DISTRICTS[0];
        const jitter = () => (Math.random() - 0.5) * 0.008;
        const business: Business = {
          id: newId('biz'),
          name: name.trim(),
          district: place.name,
          lat: place.lat + jitter(),
          lng: place.lng + jitter(),
          email: email.trim(),
          password,
          category,
          walletBalance: 0,
          bankConnected: false,
        };
        set((s) => ({
          businesses: [...s.businesses, business],
          sessionBusinessId: business.id,
          previewBusinessId: business.id,
          onboarded: true,
        }));
      },

      logout: () => set({ sessionBusinessId: null, onboarded: false }),
      completeOnboarding: () => set({ onboarded: true }),

      setThresholdKm: (km) => set({ thresholdKm: km }),
      setLanguage: (language) => set({ language }),

      reserveOffer: (offerId, method) => {
        const state = get();
        const now = Date.now();
        const offer = state.offers.find((o) => o.id === offerId);
        const buyer = state.businesses.find((b) => b.id === activeId(state));
        const seller = offer && state.businesses.find((b) => b.id === offer.businessId);
        if (!offer || !buyer || !seller || seller.id === buyer.id || offer.windowEnd <= now) {
          return { ok: false, reason: 'unavailable' };
        }

        const quote = quoteOffer(offer, seller, buyer, state.thresholdKm);
        const { itemPrice, deliveryFee, total } = orderTotal(offer, quote, method);
        if (buyer.walletBalance + 1e-9 < total) return { ok: false, reason: 'insufficientFunds' };

        const order: Order = {
          id: newId('ord'),
          code: pickupCode(),
          buyerId: buyer.id,
          sellerId: seller.id,
          offer,
          method,
          distanceKm: quote.distanceKm,
          itemPrice,
          deliveryFee,
          total,
          etaMinutes: method === 'delivery' ? quote.deliveryMinutes : quote.bikeMinutes,
          deliverySeconds: state.deliverySeconds,
          createdAt: now,
          status: method === 'delivery' ? 'onTheWay' : 'reserved',
        };

        // The seller earns the item price; the delivery fee is FoodBridge's revenue.
        let businesses = adjustBalance(state.businesses, buyer.id, -total);
        businesses = adjustBalance(businesses, seller.id, itemPrice);

        set({
          businesses,
          offers: state.offers.filter((o) => o.id !== offerId),
          orders: [order, ...state.orders],
          transactions: [
            transaction(buyer.id, 'purchase', -total, now, offer),
            transaction(seller.id, 'sale', itemPrice, now, offer),
            ...state.transactions,
          ],
        });
        return { ok: true, orderId: order.id };
      },

      completeOrder: (orderId) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o)) })),

      completeAllDeliveries: () =>
        set((s) => ({ orders: s.orders.map((o) => (o.status === 'onTheWay' ? { ...o, status: 'completed' } : o)) })),

      publishOffer: (input) => {
        const state = get();
        const now = Date.now();
        const offer: Offer = {
          ...offerFromInput(input),
          id: newId('off'),
          businessId: activeId(state),
          createdAt: now,
          seeded: false,
        };
        set({ offers: [offer, ...state.offers] });
        return offer.id;
      },

      updateOffer: (offerId, input) =>
        set((s) => ({
          offers: s.offers.map((o) =>
            // Editing a seeded offer turns it into a regular one so the demo refresh keeps it.
            o.id === offerId ? { ...o, ...offerFromInput(input), productDe: undefined, notesDe: undefined, seeded: false } : o,
          ),
        })),

      removeOffer: (offerId) => set((s) => ({ offers: s.offers.filter((o) => o.id !== offerId) })),

      topUp: (amount) => {
        const state = get();
        const id = activeId(state);
        set({
          businesses: adjustBalance(state.businesses, id, amount),
          transactions: [transaction(id, 'topUp', amount, Date.now()), ...state.transactions],
        });
      },

      connectBank: () => {
        const state = get();
        set({ businesses: adjustBalance(state.businesses, activeId(state), 0, { bankConnected: true }) });
      },

      payOut: () => {
        const state = get();
        const id = activeId(state);
        const amount = state.businesses.find((b) => b.id === id)?.walletBalance ?? 0;
        if (amount <= 0) return 0;
        set({
          businesses: adjustBalance(state.businesses, id, -amount),
          transactions: [transaction(id, 'payout', -amount, Date.now()), ...state.transactions],
        });
        return amount;
      },

      // Simulates another Munich business posting surplus right now.
      addLiveOffer: () => {
        const state = get();
        const sellers = state.businesses.filter((b) => b.id !== activeId(state));
        if (sellers.length === 0) return null;
        const seller = sellers[Math.floor(Math.random() * sellers.length)];
        const template = LIVE_OFFER_POOL[Math.floor(Math.random() * LIVE_OFFER_POOL.length)];
        const now = Date.now();
        const priceOriginal = Math.round(between(...template.priceOriginal));
        const discount = between(0.55, 0.72);
        const offer: Offer = {
          id: newId('live'),
          businessId: seller.id,
          product: template.product,
          productDe: template.productDe,
          category: template.category,
          quantity: Math.round(between(...template.quantity)),
          unit: template.unit,
          priceOriginal,
          priceDiscount: Math.max(1, Math.round(priceOriginal * (1 - discount))),
          windowStart: now - 5 * 60_000,
          windowEnd: now + Math.round(between(60, 150)) * 60_000,
          notes: '',
          createdAt: now,
          seeded: true,
        };
        const liveOffers = state.offers.filter((o) => o.id.startsWith('live_'));
        const dropIds = new Set(
          liveOffers
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, Math.max(0, liveOffers.length + 1 - MAX_LIVE_OFFERS))
            .map((o) => o.id),
        );
        set({
          offers: [offer, ...state.offers.filter((o) => !dropIds.has(o.id) && o.windowEnd > now)],
          lastLiveOffer: { offerId: offer.id, at: now },
        });
        return offer;
      },

      setLiveMarket: (on) => set({ liveMarket: on }),
      setLiveIntervalSec: (seconds) => set({ liveIntervalSec: seconds }),
      setDeliverySeconds: (seconds) => set({ deliverySeconds: seconds }),

      // Demo offers carry pickup windows relative to when they were generated. After a few
      // hours (or once they've all ended) we regenerate them so the feed never looks expired.
      refreshDemoIfStale: () => {
        const now = Date.now();
        const { seededAt, offers } = get();
        const hasLiveSeeded = offers.some((o) => o.seeded && o.windowEnd > now);
        if (now - seededAt < STALE_AFTER_MS && hasLiveSeeded) return;
        set({
          offers: [...offers.filter((o) => !o.seeded && o.windowEnd > now), ...buildSeedOffers(now)],
          seededAt: now,
        });
      },

      resetDemo: () => set({ ...freshData(Date.now()), lastLiveOffer: null }),
    }),
    {
      name: 'foodbridge-demo',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): AppData => ({
        businesses: s.businesses,
        offers: s.offers,
        orders: s.orders,
        transactions: s.transactions,
        sessionBusinessId: s.sessionBusinessId,
        previewBusinessId: s.previewBusinessId,
        onboarded: s.onboarded,
        thresholdKm: s.thresholdKm,
        language: s.language,
        seededAt: s.seededAt,
        liveMarket: s.liveMarket,
        liveIntervalSec: s.liveIntervalSec,
        deliverySeconds: s.deliverySeconds,
      }),
      migrate: (persisted, version) => {
        let data = persisted as AppData;
        if (version < 2) {
          data = { ...data, orders: [], transactions: buildOpeningTransactions(data.businesses, Date.now()) };
        }
        if (version < 3) {
          data = {
            ...data,
            orders: data.orders.map((o) => ({ ...o, deliverySeconds: o.deliverySeconds ?? 75 })),
            onboarded: false,
            liveMarket: true,
            liveIntervalSec: 40,
            deliverySeconds: 75,
          };
        }
        return data;
      },
      onRehydrateStorage: () => (state) => {
        state?.refreshDemoIfStale();
        useAppStore.setState({ hasHydrated: true });
      },
    },
  ),
);

/** The business the app is "acting as": the logged-in one, otherwise the preview pick. */
export function useActiveBusiness(): Business {
  const businesses = useAppStore((s) => s.businesses);
  const id = useAppStore((s) => s.sessionBusinessId ?? s.previewBusinessId);
  return businesses.find((b) => b.id === id) ?? businesses[0];
}
