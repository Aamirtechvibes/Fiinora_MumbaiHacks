// Onboarding feature has been removed. Export a lightweight stub to
// avoid runtime import errors from any remaining references.

export type OnboardingState = {
  hasOnboarded: boolean;
  interests: string[];
  setHasOnboarded: (value: boolean) => Promise<void>;
  setInterests: (interests: string[]) => Promise<void>;
  bootstrap: () => Promise<void>;
};

const noopAsync = async () => {};

const useOnboardingStore = {
  getState: () => ({ hasOnboarded: true, interests: [] as string[] }),
  setHasOnboarded: async (_value: boolean) => noopAsync(),
  setInterests: async (_interests: string[]) => noopAsync(),
  bootstrap: async () => noopAsync(),
} as unknown as {
  getState: () => { hasOnboarded: boolean; interests: string[] };
  setHasOnboarded: (v: boolean) => Promise<void>;
  setInterests: (i: string[]) => Promise<void>;
  bootstrap: () => Promise<void>;
};

export default useOnboardingStore;
