import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getOnboardingDone } from '../services/onboardingState';

export default function IndexRoute() {
  const [target, setTarget] = React.useState<'/onboarding' | '/(tabs)' | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      const done = await getOnboardingDone();
      if (!mounted) return;
      setTarget(done ? '/(tabs)' : '/onboarding');
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!target) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0b74de" />
      </View>
    );
  }

  return <Redirect href={target} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
