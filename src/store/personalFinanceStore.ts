// src/store/personalFinanceStore.ts
import { create } from 'zustand';

interface SavingsBreakdown {
  checking: number;
  savings: number;
  termDeposit: number;
  other: number;
}

interface UserData {
  income: number;
  spending: number;
  savings: number;
  savingsBreakdown?: SavingsBreakdown;
  selectedBank?: string;
}

interface PersonalFinanceState {
  currentScreen: string;
  progress: number;
  userData: UserData;
  setCurrentScreen: (screen: string) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  updateIncome: (income: number) => void;
  updateSpending: (spending: number) => void;
  updateSavings: (savings: number) => void;
  updateSavingsBreakdown: (breakdown: SavingsBreakdown) => void;
  updateSelectedBank: (bank: string) => void;
}

const screenOrder = [
  'welcome',
  'income',
  'spending',
  'savings',
  'initialInsights',
  'spendingAnalysisUpload',
  'spendingAnalysisResults',
  'savingsAnalysisInput',
  'savingsAnalysisResults',
  'goalPlanning'
];

const progressMap: Record<string, number> = {
  'welcome': 0,
  'income': 25,
  'spending': 50,
  'savings': 75,
  'initialInsights': 100,
  'spendingAnalysisUpload': 100,
  'spendingAnalysisResults': 100,
  'savingsAnalysisInput': 100,
  'savingsAnalysisResults': 100,
  'goalPlanning': 100
};

export const usePersonalFinanceStore = create<PersonalFinanceState>((set, get) => ({
  currentScreen: 'welcome',
  progress: 0,
  userData: {
    income: 0,
    spending: 0,
    savings: 0,
  },
  
  setCurrentScreen: (screen: string) => {
    set({ 
      currentScreen: screen, 
      progress: progressMap[screen] || 0 
    });
  },
  
  nextScreen: () => {
    const { currentScreen } = get();
    const currentIndex = screenOrder.indexOf(currentScreen);
    if (currentIndex < screenOrder.length - 1) {
      const nextScreen = screenOrder[currentIndex + 1];
      set({ 
        currentScreen: nextScreen,
        progress: progressMap[nextScreen] || 0
      });
    }
  },
  
  prevScreen: () => {
    const { currentScreen } = get();
    const currentIndex = screenOrder.indexOf(currentScreen);
    if (currentIndex > 0) {
      const prevScreen = screenOrder[currentIndex - 1];
      set({ 
        currentScreen: prevScreen,
        progress: progressMap[prevScreen] || 0
      });
    }
  },
  
  updateIncome: (income: number) => {
    set((state) => ({
      userData: { ...state.userData, income }
    }));
  },
  
  updateSpending: (spending: number) => {
    set((state) => ({
      userData: { ...state.userData, spending }
    }));
  },
  
  updateSavings: (savings: number) => {
    set((state) => ({
      userData: { ...state.userData, savings }
    }));
  },
  
  updateSavingsBreakdown: (breakdown: SavingsBreakdown) => {
    set((state) => ({
      userData: { ...state.userData, savingsBreakdown: breakdown }
    }));
  },
  
  updateSelectedBank: (bank: string) => {
    set((state) => ({
      userData: { ...state.userData, selectedBank: bank }
    }));
  }
}));