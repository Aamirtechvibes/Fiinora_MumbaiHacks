import React from 'react';
import { View } from 'react-native';

// Onboarding animations removed — provide a no-op placeholder component
export const OnboardingSlide = ({ children }: { children?: React.ReactNode }) => {
  return <View>{children}</View>;
};

export default OnboardingSlide;
