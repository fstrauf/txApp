import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserFinancialProfile, DebtItem, SpendingCategory, Recommendation } from '@/types/financial'; // Assuming types are in src/types

const LOCAL_STORAGE_KEY = 'financialUserProfile_next';

// Default empty profile
const defaultProfile: UserFinancialProfile = {
  monthlyNetIncome: 0,
  expenses: [],
  currentSavings: 0,
  debts: [],
  financialGoals: [],
  demographics: {},
};

interface FinancialState {
  userProfile: UserFinancialProfile;
  recommendationInteractions: Record<string, 'done' | 'dismissed'>;
  // Actions
  updateUserProfile: (updates: Partial<UserFinancialProfile>) => void;
  setMonthlyNetIncome: (income: number) => void;
  addExpense: (expense: SpendingCategory) => void;
  updateExpense: (updatedExpense: SpendingCategory) => void;
  removeExpense: (expenseId: string) => void;
  addDebt: (debt: DebtItem) => void;
  removeDebtItem: (debtName: string) => void; // Consider using ID if available and unique
  setCurrentSavings: (savings: number) => void;
  setFinancialGoals: (goals: string[]) => void;
  setDemographics: (demographics: UserFinancialProfile['demographics']) => void;
  resetProfile: () => void;
  // Recommendation Interactions Actions
  setRecommendationInteraction: (payload: { id: string; status: 'done' | 'dismissed' }) => void;
  clearRecommendationInteraction: (recommendationId: string) => void;
  // Derived state (getters)
  getTotalMonthlyExpenses: () => number;
  getNetMonthlyCashflow: () => number;
}

export const useFinancialAdvisorStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      userProfile: defaultProfile,
      recommendationInteractions: {},

      // Actions
      updateUserProfile: (updates) =>
        set((state) => ({ userProfile: { ...state.userProfile, ...updates } })),
      setMonthlyNetIncome: (income) =>
        set((state) => ({ userProfile: { ...state.userProfile, monthlyNetIncome: income } })),
      addExpense: (expense) =>
        set((state) => ({
          userProfile: { ...state.userProfile, expenses: [...state.userProfile.expenses, expense] },
        })),
      updateExpense: (updatedExpense) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            expenses: state.userProfile.expenses.map((e) =>
              e.id === updatedExpense.id ? updatedExpense : e
            ),
          },
        })),
      removeExpense: (expenseId) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            expenses: state.userProfile.expenses.filter((e) => e.id !== expenseId),
          },
        })),
      addDebt: (debt) =>
        set((state) => ({
          userProfile: { ...state.userProfile, debts: [...state.userProfile.debts, debt] },
        })),
      removeDebtItem: (debtName) => // Consider using a unique ID for debts if names can duplicate
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            debts: state.userProfile.debts.filter((d) => d.name !== debtName),
          },
        })),
      setCurrentSavings: (savings) =>
        set((state) => ({ userProfile: { ...state.userProfile, currentSavings: savings } })),
      setFinancialGoals: (goals) =>
        set((state) => ({ userProfile: { ...state.userProfile, financialGoals: [...goals] } })),
      setDemographics: (demographics) =>
        set((state) => ({
          userProfile: { ...state.userProfile, demographics: { ...state.userProfile.demographics, ...demographics } },
        })),
      resetProfile: () => set({ userProfile: defaultProfile, recommendationInteractions: {} }),

      // Recommendation Interactions Actions
      setRecommendationInteraction: (payload) =>
        set((state) => ({
          recommendationInteractions: { ...state.recommendationInteractions, [payload.id]: payload.status },
        })),
      clearRecommendationInteraction: (recommendationId) =>
        set((state) => {
          const newInteractions = { ...state.recommendationInteractions };
          delete newInteractions[recommendationId];
          return { recommendationInteractions: newInteractions };
        }),

      // Derived state (getters)
      // These are implemented as functions that can be called, or you can select and derive in components
      getTotalMonthlyExpenses: () => {
        return get().userProfile.expenses.reduce((total, expense) => total + expense.amount, 0);
      },
      getNetMonthlyCashflow: () => {
        return get().userProfile.monthlyNetIncome - get().getTotalMonthlyExpenses();
      },
    }),
    {
      name: LOCAL_STORAGE_KEY, // Name of the item in local storage
      storage: createJSONStorage(() => localStorage), // Use local storage
      // Only persist userProfile, recommendationInteractions are session-only as per original store
      // However, the original store *did* reset recommendationInteractions on profile reset, but didn't explicitly exclude from persistence.
      // For now, let's persist both as it's simpler with Zustand's persist middleware unless explicitly needed otherwise.
      // If recommendationInteractions should NOT be persisted, we'd need a more complex setup or a separate non-persisted store.
    }
  )
);

// Example of how to use selectors for derived state (optional, can also be done in components):
// export const selectTotalMonthlyExpenses = (state: FinancialState) => state.userProfile.expenses.reduce((total, expense) => total + expense.amount, 0);
// export const selectNetMonthlyCashflow = (state: FinancialState) => state.userProfile.monthlyNetIncome - selectTotalMonthlyExpenses(state);
