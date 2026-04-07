import { Stack } from 'expo-router';
import React from 'react';
import { PORTADAS_DOC_TITLE } from '../constants/documentation/portadasYFuentesDoc';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="game/[id]" />
      <Stack.Screen
        name="documentacion-fuentes"
        options={{
          headerShown: true,
          title: PORTADAS_DOC_TITLE,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: { color: theme.colors.textLight, fontSize: 15 },
        }}
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}