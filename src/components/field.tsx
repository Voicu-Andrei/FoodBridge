import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Txt } from '@/components/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

/** Labelled text input in the app's card style. */
export function Field({ label, error, style, multiline, ...rest }: FieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Txt variant="label" color="inkFaint">
        {label}
      </Txt>
      <TextInput
        placeholderTextColor={theme.inkFaint}
        selectionColor={theme.accent}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          { color: theme.ink, backgroundColor: theme.surface, borderColor: error ? theme.accent : theme.line },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Txt variant="caption" tint={theme.accent}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top', paddingTop: 13 },
});
