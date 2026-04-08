import * as SecureStore from 'expo-secure-store';

const ONBOARDING_DONE_KEY = 'onboarding_done_v1';

export async function getOnboardingDone(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(ONBOARDING_DONE_KEY);
  return raw === '1';
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  if (done) {
    await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, '1');
    return;
  }
  await SecureStore.deleteItemAsync(ONBOARDING_DONE_KEY);
}
