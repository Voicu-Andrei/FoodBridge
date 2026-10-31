import { useMemo } from 'react';

import { KG_PER_UNIT } from '@/data/seed';
import type { Business, CategoryId, Language, Offer, SortMode } from '@/data/types';
import { quoteOffer, type Quote } from '@/lib/pricing';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

export type FeedOffer = Quote & {
  offer: Offer;
  business: Business;
  title: string;
};

export function offerTitle(offer: Offer, lang: Language): string {
  return lang === 'de' && offer.productDe ? offer.productDe : offer.product;
}

export function offerNotes(offer: Offer, lang: Language): string {
  return lang === 'de' && offer.notesDe ? offer.notesDe : offer.notes;
}

/** Offers from other businesses that haven't ended yet, enriched with distance and pricing. */
export function useLiveOffers(now: number): FeedOffer[] {
  const offers = useAppStore((s) => s.offers);
  const businesses = useAppStore((s) => s.businesses);
  const thresholdKm = useAppStore((s) => s.thresholdKm);
  const lang = useAppStore((s) => s.language);
  const me = useActiveBusiness();

  return useMemo(() => {
    const byId = new Map(businesses.map((b) => [b.id, b]));
    const result: FeedOffer[] = [];
    for (const offer of offers) {
      const business = byId.get(offer.businessId);
      if (!business || business.id === me.id || offer.windowEnd <= now) continue;
      result.push({
        offer,
        business,
        title: offerTitle(offer, lang),
        ...quoteOffer(offer, business, me, thresholdKm),
      });
    }
    return result;
  }, [offers, businesses, thresholdKm, lang, me, now]);
}

export function filterAndSort(
  items: FeedOffer[],
  { category, query, sort }: { category: CategoryId | 'all'; query: string; sort: SortMode },
): FeedOffer[] {
  const q = query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (category !== 'all' && item.offer.category !== category) return false;
    if (!q) return true;
    return [item.title, item.offer.product, item.business.name, item.business.district].some((s) =>
      s.toLowerCase().includes(q),
    );
  });
  const comparators: Record<SortMode, (a: FeedOffer, b: FeedOffer) => number> = {
    nearest: (a, b) => a.distanceKm - b.distanceKm,
    endingSoon: (a, b) => a.offer.windowEnd - b.offer.windowEnd,
    bestDeal: (a, b) => b.discount - a.discount,
  };
  return filtered.sort(comparators[sort]);
}

export function offerKg(offer: Offer): number {
  return offer.quantity * KG_PER_UNIT[offer.unit];
}
