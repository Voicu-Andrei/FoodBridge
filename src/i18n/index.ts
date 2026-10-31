import { useCallback } from 'react';

import type { Language } from '@/data/types';
import { useAppStore } from '@/store/app-store';

import { strings, type StringKey } from './strings';

export type { StringKey };

type Params = Record<string, string | number>;

export function translate(lang: Language, key: StringKey, params?: Params): string {
  const template: string = strings[lang][key] ?? strings.en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Returns a translator bound to the current app language, plus the language itself. */
export function useT() {
  const lang = useAppStore((s) => s.language);
  const t = useCallback((key: StringKey, params?: Params) => translate(lang, key, params), [lang]);
  return { t, lang };
}
