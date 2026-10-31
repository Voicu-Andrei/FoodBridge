import type { Language, QuantityUnit } from '@/data/types';

const currencyFormatters: Record<Language, Intl.NumberFormat> = {
  en: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }),
  de: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
};

export function formatEUR(value: number, lang: Language): string {
  return currencyFormatters[lang].format(value);
}

export function formatNumber(value: number, lang: Language, maxFractionDigits = 0): string {
  return value.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { maximumFractionDigits: maxFractionDigits });
}

export function formatDistance(km: number, lang: Language): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${formatNumber(km, lang, 1)} km`;
}

export function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "1h 40m" / "25m" — compact duration used in countdown chips. */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "1:42:18" / "42:18" — ticking countdown with seconds. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "Today 16:42", "Yesterday 09:10" or "28 Oct 09:10" for activity lists. */
export function formatActivityTime(epochMs: number, now: number, lang: Language, today: string, yesterday: string): string {
  const day = (ms: number) => new Date(ms).toDateString();
  const clock = formatClock(epochMs);
  if (day(epochMs) === day(now)) return `${today} ${clock}`;
  if (day(epochMs) === day(now - 86_400_000)) return `${yesterday} ${clock}`;
  const date = new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' }).format(epochMs);
  return `${date} ${clock}`;
}

export function formatQuantity(quantity: number, unit: QuantityUnit, unitLabel: string): string {
  return unit === 'kg' ? `${quantity} kg` : `${quantity} ${unitLabel}`;
}

export function discountPercent(original: number, discounted: number): number {
  if (original <= 0) return 0;
  return Math.round((1 - discounted / original) * 100);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
