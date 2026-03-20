import { MD3Theme, useTheme as usePaperTheme } from "react-native-paper";

export type AppTheme = MD3Theme & {
  custom: {
    gradient: readonly [string, string, ...string[]]; // ✅ FIXED
  };
};

export const useTheme = () => {
  return usePaperTheme() as AppTheme;
};
