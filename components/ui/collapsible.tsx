import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../themed-text';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function Collapsible({ title, children }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button">
        <ThemedText type="defaultSemiBold">
          {open ? '▼ ' : '▶ '}
          {title}
        </ThemedText>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 6 },
  body: { marginTop: 8, paddingLeft: 4, gap: 8 },
});
