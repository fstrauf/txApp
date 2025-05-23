import { create } from 'zustand';
import { UserData, initialUserData, ScreenId, TOTAL_SCREENS_MAIN_FLOW } from '@/types/personalFinance';

interface PersonalFinanceState {
  currentScreen: ScreenId;
  userData: UserData;
  progress: number;
  setCurrentScreen: (screen: ScreenId) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  updateUserData: (data: Partial<UserData>) => void;
  updateIncome: (income: number) => void;
  updateSpending: (spending: number) => void;
  updateSavings: (savings: number) => void;
  updateGoal: (goal: string) => void;
  resetUserData: () => void;
  // TODO: Add more specific actions for CSV data, savings breakdown, etc.
}

const screenOrder: ScreenId[] = [
  'welcome',
  'income',
  'spending',
  'savings',
  'initialInsights',
  'goalPlanning',
  'finalSummary',
  'spendingAnalysisUpload',
  'spendingAnalysisResults',
  'savingsAnalysisInput',
  'savingsAnalysisResults',
  'complete'
];

const calculateProgress = (currentScreen: ScreenId): number => {
  const currentIndex = screenOrder.indexOf(currentScreen);
  // Using TOTAL_SCREENS_MAIN_FLOW for the primary onboarding progress
  // This might need adjustment depending on how deep dives are handled in progress bar
  if (currentIndex < 0) return 0;
  if (currentIndex < TOTAL_SCREENS_MAIN_FLOW) {
    return ((currentIndex + 1) / TOTAL_SCREENS_MAIN_FLOW) * 100;
  }
  // For screens beyond the main flow, we can decide how to show progress
  // For now, let's cap it or use a different total
  return 100; 
};

export const usePersonalFinanceStore = create<PersonalFinanceState>((set, get) => ({
  currentScreen: 'welcome',
  userData: initialUserData,
  progress: calculateProgress('welcome'),

  setCurrentScreen: (screen) => {
    set({ currentScreen: screen, progress: calculateProgress(screen) });
  },

  nextScreen: () => {
    console.log('Next screen');
    const { currentScreen } = get();
    const currentIndex = screenOrder.indexOf(currentScreen);
    if (currentIndex < screenOrder.length - 1) {
      const nextScreenId = screenOrder[currentIndex + 1];
      set({ currentScreen: nextScreenId, progress: calculateProgress(nextScreenId) });
    }
  },

  prevScreen: () => {
    const { currentScreen } = get();
    const currentIndex = screenOrder.indexOf(currentScreen);
    if (currentIndex > 0) {
      const prevScreenId = screenOrder[currentIndex - 1];
      set({ currentScreen: prevScreenId, progress: calculateProgress(prevScreenId) });
    }
  },

  updateUserData: (data) => {
    set((state) => ({ userData: { ...state.userData, ...data } }));
  },
  
  updateIncome: (income) => {
    set((state) => ({ userData: { ...state.userData, income } }));
  },

  updateSpending: (spending) => {
    set((state) => ({ userData: { ...state.userData, spending } }));
  },

  updateSavings: (savings) => {
    set((state) => ({ userData: { ...state.userData, savings } }));
  },

  updateGoal: (goal) => {
    set((state) => ({ userData: { ...state.userData, goal } }));
  },

  resetUserData: () => {
    set({ userData: initialUserData, currentScreen: 'welcome', progress: calculateProgress('welcome') });
  },
}));
