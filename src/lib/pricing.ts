import type { Business, FulfilmentMethod, Offer } from '@/data/types';
import { discountPercent } from '@/lib/format';
import { bikeMinutes, deliveryMinutes, distanceKm, logisticsPrice } from '@/lib/geo';

export type Quote = {
  distanceKm: number;
  /** True when the seller is inside the buyer's pickup radius. */
  recommendSelf: boolean;
  deliveryPrice: number;
  bikeMinutes: number;
  deliveryMinutes: number;
  discount: number;
};

/** Distance, delivery price and recommendation for one buyer looking at one offer. */
export function quoteOffer(offer: Offer, seller: Business, buyer: Business, thresholdKm: number): Quote {
  const km = distanceKm(buyer.lat, buyer.lng, seller.lat, seller.lng);
  return {
    distanceKm: km,
    recommendSelf: km <= thresholdKm,
    deliveryPrice: logisticsPrice(km),
    bikeMinutes: bikeMinutes(km),
    deliveryMinutes: deliveryMinutes(km),
    discount: discountPercent(offer.priceOriginal, offer.priceDiscount),
  };
}

export function orderTotal(offer: Offer, quote: Quote, method: FulfilmentMethod) {
  const deliveryFee = method === 'delivery' ? round2(quote.deliveryPrice) : 0;
  return { itemPrice: offer.priceDiscount, deliveryFee, total: round2(offer.priceDiscount + deliveryFee) };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
