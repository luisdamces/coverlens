import React from 'react';
import {
  completeFirstRunTour,
  enableFirstRunTour,
  getFirstRunTourStep,
  isFirstRunTourActive,
  setFirstRunTourStep,
  type FirstRunTourStep,
} from '../services/firstRunTour';

type Ctx = {
  active: boolean;
  step: FirstRunTourStep;
  refresh: () => Promise<void>;
  skipTour: () => Promise<void>;
  restartTour: () => Promise<void>;
};

const FirstRunTourContext = React.createContext<Ctx | null>(null);

export function FirstRunTourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState(false);
  const [step, setStep] = React.useState<FirstRunTourStep>(0);

  const refresh = React.useCallback(async () => {
    const [a, s] = await Promise.all([isFirstRunTourActive(), getFirstRunTourStep()]);
    setActive(a);
    setStep(s);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const skipTour = React.useCallback(async () => {
    await completeFirstRunTour();
    await refresh();
  }, [refresh]);

  const restartTour = React.useCallback(async () => {
    await enableFirstRunTour();
    await refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({ active, step, refresh, skipTour, restartTour }),
    [active, step, refresh, skipTour, restartTour]
  );

  return <FirstRunTourContext.Provider value={value}>{children}</FirstRunTourContext.Provider>;
}

export function useFirstRunTour(): Ctx {
  const ctx = React.useContext(FirstRunTourContext);
  if (!ctx) {
    throw new Error('useFirstRunTour must be used within FirstRunTourProvider');
  }
  return ctx;
}

export async function bumpTourStepIfNeeded(pathname: string): Promise<void> {
  const tourOn = await isFirstRunTourActive();
  if (!tourOn) return;
  const s = await getFirstRunTourStep();
  if (s === 0 && pathname.includes('escaner')) {
    await setFirstRunTourStep(1);
  }
}
