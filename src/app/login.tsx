import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/category-art';
import { Field } from '@/components/field';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { PressableScale } from '@/components/pressable-scale';
import { Segmented } from '@/components/segmented';
import { Txt } from '@/components/text';
import { enterFade, enterUp } from '@/constants/motion';
import { CategoryStyle, Fonts, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_IDS, DISTRICTS, SEED_BUSINESSES } from '@/data/seed';
import type { CategoryId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl }]}>
      <Animated.View entering={enterUp(0)} style={styles.header}>
        <Logo size={44} background={theme.primary} foreground={theme.onPrimary} accent={theme.accent} />
        <Txt variant="display" style={styles.title}>
          {t('login.title')}
        </Txt>
        <Txt variant="body" color="inkMuted">
          {t('login.subtitle')}
        </Txt>
      </Animated.View>

      <Segmented<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'login', label: t('login.tabLogin') },
          { value: 'register', label: t('login.tabRegister') },
        ]}
      />

      {mode === 'login' ? <LoginForm /> : <RegisterForm />}
    </ScrollView>
  );
}

function LoginForm() {
  const theme = useTheme();
  const { t } = useT();
  const login = useAppStore((s) => s.login);
  const businesses = useAppStore((s) => s.businesses);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (login(email, password)) haptics.success();
    else setError(true);
  };

  // Seeded businesses first, then anyone registered on this phone.
  const quick = [...SEED_BUSINESSES.map((s) => businesses.find((b) => b.id === s.id) ?? s), ...businesses.filter((b) => !SEED_BUSINESSES.some((s) => s.id === b.id))];

  return (
    <Animated.View entering={enterFade(0, 260)} style={styles.form}>
      <View style={styles.group}>
        <Txt variant="label" color="inkFaint">
          {t('login.quick')}
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow} style={styles.quickScroll}>
          {quick.map((b) => {
            const active = b.email === email;
            return (
              <PressableScale
                key={b.id}
                haptic="select"
                onPress={() => {
                  setEmail(b.email);
                  setPassword(b.password);
                  setError(false);
                }}
                style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: active ? theme.primary : theme.line }]}>
                <CategoryBadge category={b.category} size={30} />
                <View>
                  <Txt variant="caption" style={styles.bold}>
                    {b.name}
                  </Txt>
                  <Txt variant="caption" color="inkFaint">
                    {b.district}
                  </Txt>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <Field
        label={t('login.email')}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError(false);
        }}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Field
        label={t('login.password')}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError(false);
        }}
        secureTextEntry
        error={error ? t('login.error') : null}
      />

      <PressableScale onPress={submit} style={[styles.submit, { backgroundColor: theme.primary }]}>
        <Txt variant="bodyMedium" tint={theme.onPrimary} style={styles.submitText}>
          {t('login.submit')}
        </Txt>
        <Icon sf="arrow.right" md="arrow_forward" size={16} color={theme.onPrimary} weight="bold" />
      </PressableScale>
      <Txt variant="caption" color="inkFaint" style={styles.center}>
        {t('login.hint')}
      </Txt>
    </Animated.View>
  );
}

function RegisterForm() {
  const theme = useTheme();
  const { t } = useT();
  const register = useAppStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState(DISTRICTS[0].name);
  const [category, setCategory] = useState<CategoryId>('prepared');

  const valid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && password.length >= 4;

  return (
    <Animated.View entering={enterFade(0, 260)} style={styles.form}>
      <Field label={t('register.name')} placeholder={t('register.namePlaceholder')} value={name} onChangeText={setName} />
      <Field
        label={t('login.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Field label={t('login.password')} value={password} onChangeText={setPassword} secureTextEntry />

      <View style={styles.group}>
        <Txt variant="label" color="inkFaint">
          {t('register.district')}
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow} style={styles.quickScroll}>
          {DISTRICTS.map((d) => {
            const active = d.name === district;
            return (
              <PressableScale
                key={d.name}
                haptic="select"
                onPress={() => setDistrict(d.name)}
                style={[styles.chip, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line }]}>
                <Txt variant="caption" tint={active ? theme.onPrimary : theme.ink}>
                  {d.name}
                </Txt>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.group}>
        <Txt variant="label" color="inkFaint">
          {t('register.category')}
        </Txt>
        <View style={styles.wrap}>
          {CATEGORY_IDS.map((id) => {
            const active = id === category;
            return (
              <PressableScale
                key={id}
                haptic="select"
                onPress={() => setCategory(id)}
                style={[styles.chip, styles.categoryChip, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line }]}>
                <Icon sf={CategoryStyle[id].symbol} md={CategoryStyle[id].webSymbol} size={13} color={active ? theme.onPrimary : CategoryStyle[id].solid} />
                <Txt variant="caption" tint={active ? theme.onPrimary : theme.ink}>
                  {t(`category.${id}`)}
                </Txt>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <PressableScale
        disabled={!valid}
        onPress={() => {
          register({ name, district, category, email, password });
          haptics.success();
        }}
        style={[styles.submit, { backgroundColor: theme.accent }, !valid && styles.disabled]}>
        <Txt variant="bodyMedium" tint="#FFFFFF" style={styles.submitText}>
          {t('register.submit')}
        </Txt>
      </PressableScale>
      <Txt variant="caption" color="inkFaint" style={styles.center}>
        {t('register.note')}
      </Txt>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  header: { gap: Spacing.sm },
  title: { marginTop: Spacing.md },
  form: { gap: Spacing.lg },
  group: { gap: Spacing.sm },
  quickScroll: { marginHorizontal: -Spacing.xl },
  quickRow: { gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  bold: { fontFamily: Fonts.sansSemiBold },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  submitText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  disabled: { opacity: 0.4 },
  center: { textAlign: 'center' },
});
