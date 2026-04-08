import * as SecureStore from 'expo-secure-store';

const ACTIVE_KEY = 'first_run_tour_active_v1';
const STEP_KEY = 'first_run_tour_step_v1';

/** 0 = ir a Escaner · 1 = escanear · 2 = abrir juego en catálogo · 3 = actualizar portadas */
export type FirstRunTourStep = 0 | 1 | 2 | 3;

export async function isFirstRunTourActive(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(ACTIVE_KEY);
  return raw === '1';
}

export async function getFirstRunTourStep(): Promise<FirstRunTourStep> {
  const raw = await SecureStore.getItemAsync(STEP_KEY);
  const n = raw != null ? Number(raw) : 0;
  if (n >= 0 && n <= 3) return n as FirstRunTourStep;
  return 0;
}

export async function enableFirstRunTour(): Promise<void> {
  await SecureStore.setItemAsync(ACTIVE_KEY, '1');
  await SecureStore.setItemAsync(STEP_KEY, '0');
}

export async function setFirstRunTourStep(step: FirstRunTourStep): Promise<void> {
  await SecureStore.setItemAsync(STEP_KEY, String(step));
}

export async function advanceTourAfterBarcodeScan(): Promise<void> {
  if (!(await isFirstRunTourActive())) return;
  const step = await getFirstRunTourStep();
  if (step === 1) await setFirstRunTourStep(2);
}

export async function advanceTourOnOpenGameDetail(): Promise<void> {
  if (!(await isFirstRunTourActive())) return;
  const step = await getFirstRunTourStep();
  if (step === 2) await setFirstRunTourStep(3);
}

export async function completeFirstRunTour(): Promise<void> {
  await SecureStore.deleteItemAsync(ACTIVE_KEY);
  await SecureStore.deleteItemAsync(STEP_KEY);
}
