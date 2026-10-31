export type CategoryId = 'bakery' | 'meat' | 'fish' | 'vegetarian' | 'dairy' | 'prepared';

export type QuantityUnit = 'kg' | 'portions' | 'units';

export type Language = 'en' | 'de';

export type District = {
  name: string;
  lat: number;
  lng: number;
};

export type Business = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  email: string;
  password: string;
  category: CategoryId;
  walletBalance: number;
  bankConnected: boolean;
};

export type Offer = {
  id: string;
  businessId: string;
  product: string;
  /** German title for seeded offers; offers people post themselves only have `product`. */
  productDe?: string;
  category: CategoryId;
  quantity: number;
  unit: QuantityUnit;
  priceOriginal: number;
  priceDiscount: number;
  /** Pickup window as epoch milliseconds. */
  windowStart: number;
  windowEnd: number;
  notes: string;
  notesDe?: string;
  createdAt: number;
  /** True for the demo offers that get regenerated; false for offers posted in the app. */
  seeded: boolean;
  /** Local photo taken when posting the offer; illustrated artwork is used otherwise. */
  photoUri?: string;
};

export type OfferInput = {
  product: string;
  category: CategoryId;
  quantity: number;
  unit: QuantityUnit;
  priceOriginal: number;
  priceDiscount: number;
  windowStart: number;
  windowEnd: number;
  notes: string;
  photoUri?: string;
};

export type RegisterInput = {
  name: string;
  district: string;
  category: CategoryId;
  email: string;
  password: string;
};

export type SortMode = 'nearest' | 'endingSoon' | 'bestDeal';

export type FulfilmentMethod = 'pickup' | 'delivery';

export type OrderStatus = 'reserved' | 'onTheWay' | 'completed';

export type Order = {
  id: string;
  /** Short code the seller checks at pickup, e.g. "FB-4821". */
  code: string;
  buyerId: string;
  sellerId: string;
  /** Snapshot of the offer at the moment it was reserved. */
  offer: Offer;
  method: FulfilmentMethod;
  distanceKm: number;
  itemPrice: number;
  deliveryFee: number;
  total: number;
  etaMinutes: number;
  /** How long the simulated delivery takes on screen (presenter mode can shorten it). */
  deliverySeconds: number;
  createdAt: number;
  status: OrderStatus;
};

export type TransactionKind = 'opening' | 'purchase' | 'sale' | 'topUp' | 'payout';

export type Transaction = {
  id: string;
  businessId: string;
  kind: TransactionKind;
  /** Signed: positive adds to the wallet, negative leaves it. */
  amount: number;
  /** Product or counterparty shown under the title. */
  detail: string;
  detailDe?: string;
  createdAt: number;
};
