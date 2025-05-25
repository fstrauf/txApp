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
  userData: UserData;
  updateIncome: (income: number) => void;
  updateSpending: (spending: number) => void;
  updateSavings: (savings: number) => void;
  updateSavingsBreakdown: (breakdown: SavingsBreakdown) => void;
  updateSelectedBank: (bank: string) => void;
}

export const usePersonalFinanceStore = create<PersonalFinanceState>((set) => ({
  userData: {
    income: 0,
    spending: 0,
    savings: 0,
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