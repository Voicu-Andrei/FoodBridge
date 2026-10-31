import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedCheck } from '@/components/animated-check';
import { CategoryArt } from '@/components/category-art';
import { Field } from '@/components/field';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Segmented } from '@/components/segmented';
import { Txt } from '@/components/text';
import { enterFade, enterUp, layoutTransition } from '@/constants/motion';
import { CategoryStyle, Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { CATEGORY_IDS } from '@/data/seed';
import type { CategoryId, Offer, QuantityUnit } from '@/data/types';
import { offerTitle } from '@/hooks/use-feed-offers';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { discountPercent, formatClock, formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

const MINUTE = 60_000;
const START_OPTIONS = [0, 30, 60, 120];
const DURATION_OPTIONS = [60, 120, 180, 240];

function parseAmount(text: string): number {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

function roundedNow(): number {
  return Math.ceil(Date.now() / (5 * MINUTE)) * 5 * MINUTE;
}

export default function PublishScreen() {
  const { offerId } = useLocalSearchParams<{ offerId?: string }>();
  const existing = useAppStore((s) => (offerId ? s.offers.find((o) => o.id === offerId) : undefined));
  return <PublishForm existing={existing} />;
}

function PublishForm({ existing }: { existing?: Offer }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useActiveBusiness();
  const publishOffer = useAppStore((s) => s.publishOffer);
  const updateOffer = useAppStore((s) => s.updateOffer);

  const [product, setProduct] = useState(existing ? offerTitle(existing, lang) : '');
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? me.category);
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity) : '');
  const [unit, setUnit] = useState<QuantityUnit>(existing?.unit ?? 'kg');
  const [original, setOriginal] = useState(existing ? String(existing.priceOriginal) : '');
  const [discounted, setDiscounted] = useState(existing ? String(existing.priceDiscount) : '');
  const [startOffset, setStartOffset] = useState<number | null>(existing ? null : 0);
  const [duration, setDuration] = useState<number | null>(existing ? null : 120);
  const [pickup, setPickup] = useState(() => {
    const start = roundedNow();
    return existing ? { start: existing.windowStart, end: existing.windowEnd } : { start, end: start + 120 * MINUTE };
  });
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photoUri);
  const [done, setDone] = useState(false);

  const qty = parseAmount(quantity);
  const priceOriginal = parseAmount(original);
  const priceDiscount = parseAmount(discounted);
  const priceError = priceOriginal > 0 && priceDiscount > 0 && priceDiscount >= priceOriginal;
  const valid = product.trim().length >= 3 && qty > 0 && priceOriginal > 0 && priceDiscount > 0 && !priceError;

  const pickStart = (offset: number) => {
    const start = roundedNow() + offset * MINUTE;
    setStartOffset(offset);
    setPickup({ start, end: start + (duration ?? 120) * MINUTE });
  };
  const pickDuration = (minutes: number) => {
    setDuration(minutes);
    setPickup((w) => ({ start: w.start, end: w.start + minutes * MINUTE }));
  };

  const pickPhoto = async (source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [16, 10], quality: 0.7 };
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('publish.cameraDenied'));
        return;
      }
    }
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      haptics.select();
    }
  };

  const submit = () => {
    if (!valid) return;
    const input = {
      product,
      category,
      quantity: qty,
      unit,
      priceOriginal,
      priceDiscount,
      windowStart: pickup.start,
      windowEnd: pickup.end,
      notes,
      photoUri,
    };
    if (existing) updateOffer(existing.id, input);
    else publishOffer(input);
    haptics.success();
    setDone(true);
  };

  if (done) {
    return (
      <View style={[styles.success, { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.xl }]}>
        <AnimatedCheck size={104} ringColor={theme.accent} checkColor={theme.positive} fill={theme.positiveSoft} />
        <Animated.View entering={enterUp(350)} style={styles.successText}>
          <Txt variant="display">{existing ? t('publish.savedTitle') : t('publish.successTitle')}</Txt>
          <Txt variant="body" color="inkMuted" style={styles.center}>
            {t('publish.successBody')}
          </Txt>
        </Animated.View>
        <Animated.View entering={enterUp(500)} style={styles.successButtons}>
          <PressableScale
            onPress={() => {
              router.dismiss();
              router.navigate({ pathname: '/orders', params: { segment: 'listings' } });
            }}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
            <Txt variant="bodyMedium" tint={theme.onPrimary} style={styles.buttonText}>
              {t('publish.viewListings')}
            </Txt>
          </PressableScale>
          <PressableScale onPress={() => router.back()} style={[styles.primaryButton, { backgroundColor: theme.surfaceAlt }]}>
            <Txt variant="bodyMedium" style={styles.buttonText}>
              {t('publish.done')}
            </Txt>
          </PressableScale>
        </Animated.View>
      </View>
    );
  }

  const discount = discountPercent(priceOriginal, priceDiscount);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.line }]}>
        <PressableScale onPress={() => router.back()} haptic="none" hitSlop={10}>
          <Txt variant="bodyMedium" color="inkMuted">
            {t('publish.cancel')}
          </Txt>
        </PressableScale>
        <Txt variant="headline" style={styles.topTitle}>
          {existing ? t('publish.editTitle') : t('publish.title')}
        </Txt>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        {/* Live preview */}
        <Animated.View entering={enterUp(40)} layout={layoutTransition}>
          <Txt variant="label" color="inkFaint" style={styles.sectionLabel}>
            {t('publish.preview')}
          </Txt>
          <View style={[styles.preview, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <CategoryArt category={category} height={112} photoUri={photoUri}>
              {discount > 0 && !priceError && (
                <View style={styles.previewDiscount}>
                  <Txt variant="headline" tint="#F6F0E4" style={styles.previewDiscountText}>
                    −{discount}%
                  </Txt>
                </View>
              )}
            </CategoryArt>
            <View style={styles.previewBody}>
              <Txt variant="headline" numberOfLines={1} color={product.trim() ? 'ink' : 'inkFaint'}>
                {product.trim() || t('publish.yourOffer')}
              </Txt>
              <Txt variant="caption" color="inkMuted">
                {me.name} · {formatClock(pickup.start)}–{formatClock(pickup.end)}
              </Txt>
              {priceDiscount > 0 && (
                <Txt variant="price" style={styles.previewPrice}>
                  {formatEUR(priceDiscount, lang)}
                </Txt>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Photo */}
        <View style={styles.photoRow}>
          <PressableScale onPress={() => pickPhoto('camera')} style={[styles.photoButton, { backgroundColor: theme.primary }]}>
            <Icon sf="camera.fill" md="photo_camera" size={16} color={theme.onPrimary} />
            <Txt variant="bodyMedium" tint={theme.onPrimary}>
              {t('publish.takePhoto')}
            </Txt>
          </PressableScale>
          <PressableScale onPress={() => pickPhoto('library')} style={[styles.photoButton, { backgroundColor: theme.surfaceAlt }]}>
            <Icon sf="photo.on.rectangle" md="photo_library" size={16} color={theme.ink} />
            <Txt variant="bodyMedium">{t('publish.choosePhoto')}</Txt>
          </PressableScale>
        </View>
        {photoUri && (
          <Animated.View entering={enterFade(0, 200)}>
            <PressableScale haptic="select" onPress={() => setPhotoUri(undefined)} style={styles.removePhoto}>
              <Icon sf="xmark.circle.fill" md="cancel" size={15} color={theme.inkMuted} />
              <Txt variant="caption" color="inkMuted">
                {t('publish.removePhoto')}
              </Txt>
            </PressableScale>
          </Animated.View>
        )}

        <Field label={t('publish.product')} placeholder={t('publish.productPlaceholder')} value={product} onChangeText={setProduct} returnKeyType="next" />

        {/* Category */}
        <View style={styles.group}>
          <Txt variant="label" color="inkFaint">
            {t('publish.category')}
          </Txt>
          <View style={styles.categoryGrid}>
            {CATEGORY_IDS.map((id) => {
              const active = id === category;
              return (
                <PressableScale
                  key={id}
                  haptic="select"
                  onPress={() => setCategory(id)}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line },
                  ]}>
                  <Icon sf={CategoryStyle[id].symbol} md={CategoryStyle[id].webSymbol} size={14} color={active ? theme.onPrimary : CategoryStyle[id].solid} />
                  <Txt variant="caption" tint={active ? theme.onPrimary : theme.ink}>
                    {t(`category.${id}`)}
                  </Txt>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.row}>
          <View style={styles.qtyField}>
            <Field label={t('publish.quantity')} placeholder="10" keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
          </View>
          <View style={styles.unitField}>
            <Segmented<QuantityUnit>
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'portions', label: t('unit.portions') },
                { value: 'units', label: t('unit.units') },
              ]}
            />
          </View>
        </View>

        {/* Prices */}
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field label={t('publish.original')} placeholder="60" keyboardType="decimal-pad" value={original} onChangeText={setOriginal} />
          </View>
          <View style={styles.flex}>
            <Field
              label={t('publish.discounted')}
              placeholder="18"
              keyboardType="decimal-pad"
              value={discounted}
              onChangeText={setDiscounted}
              error={priceError ? t('publish.priceError') : null}
            />
          </View>
        </View>

        {/* Pickup window */}
        <View style={styles.group}>
          <View style={styles.rowBetween}>
            <Txt variant="label" color="inkFaint">
              {t('publish.pickup')}
            </Txt>
            <Txt variant="bodyMedium">
              {formatClock(pickup.start)} – {formatClock(pickup.end)}
            </Txt>
          </View>
          <Txt variant="caption" color="inkMuted">
            {t('publish.starts')}
          </Txt>
          <ChipRow
            options={START_OPTIONS.map((m) => ({
              value: m,
              label: m === 0 ? t('publish.now') : m < 60 ? t('publish.inMinutes', { min: m }) : t('publish.inHours', { h: m / 60 }),
            }))}
            value={startOffset}
            onChange={pickStart}
          />
          <Txt variant="caption" color="inkMuted">
            {t('publish.duration')}
          </Txt>
          <ChipRow
            options={DURATION_OPTIONS.map((m) => ({ value: m, label: t('publish.hours', { h: m / 60 }) }))}
            value={duration}
            onChange={pickDuration}
          />
        </View>

        <Field
          label={t('publish.notes')}
          placeholder={t('publish.notesPlaceholder')}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.background, borderTopColor: theme.line }]}>
        <PressableScale
          onPress={submit}
          disabled={!valid}
          style={[styles.primaryButton, styles.submit, { backgroundColor: theme.accent }, !valid && styles.disabled]}>
          <Icon sf={existing ? 'checkmark' : 'paperplane.fill'} md={existing ? 'check' : 'send'} size={16} color="#FFFFFF" />
          <Txt variant="bodyMedium" tint="#FFFFFF" style={styles.buttonText}>
            {existing ? t('publish.save') : t('publish.submit')}
          </Txt>
        </PressableScale>
      </View>
    </View>
  );
}

function ChipRow({ options, value, onChange }: { options: { value: number; label: string }[]; value: number | null; onChange: (v: number) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            key={option.value}
            haptic="select"
            onPress={() => onChange(option.value)}
            style={[styles.chip, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line }]}>
            <Txt variant="caption" tint={active ? theme.onPrimary : theme.ink}>
              {option.label}
            </Txt>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: { fontSize: 18 },
  topSpacer: { width: 60 },
  content: { padding: Spacing.xl, gap: Spacing.xl },
  sectionLabel: { marginBottom: Spacing.sm },
  preview: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  previewDiscount: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: '#1A2B21',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  previewDiscountText: { fontSize: 16, lineHeight: 21 },
  previewBody: { padding: Spacing.lg, gap: 3 },
  previewPrice: { marginTop: Spacing.xs },
  photoRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: -Spacing.sm },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  removePhoto: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: -Spacing.md },
  group: { gap: Spacing.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyField: { width: 110 },
  unitField: { flex: 1, paddingTop: 25 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  primaryButton: { alignItems: 'center', paddingVertical: 16, borderRadius: Radius.pill },
  submit: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  disabled: { opacity: 0.4 },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, paddingHorizontal: Spacing.xl },
  successText: { alignItems: 'center', gap: Spacing.sm },
  successButtons: { alignSelf: 'stretch', gap: Spacing.sm },
});
