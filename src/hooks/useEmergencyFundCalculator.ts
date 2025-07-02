'use client';

import { useState, useEffect } from 'react';

interface CalculatorState {
  savings: string;
  expenses: string;
  result: {
    months: number;
    message: string;
    emoji: string;
    ctaText: string;
    bgColor: string;
    textColor: string;
  } | null;
  showResult: boolean;
}

const STORAGE_KEY = 'emergency_fund_calculator';

const getInitialState = (): CalculatorState => {
  if (typeof window === 'undefined') {
    return {
      savings: '',
      expenses: '',
      result: null,
      showResult: false,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        savings: parsed.savings || '',
        expenses: parsed.expenses || '',
        result: parsed.result || null,
        showResult: parsed.showResult || false,
      };
    }
  } catch (error) {
    console.warn('Failed to parse stored calculator data:', error);
  }

  return {
    savings: '',
    expenses: '',
    result: null,
    showResult: false,
  };
};

export const useEmergencyFundCalculator = () => {
  const [state, setState] = useState<CalculatorState>(getInitialState);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save calculator data to localStorage:', error);
      }
    }
  }, [state]);

  const updateSavings = (value: string) => {
    setState(prev => ({
      ...prev,
      savings: value,
      showResult: false,
    }));
  };

  const updateExpenses = (value: string) => {
    setState(prev => ({
      ...prev,
      expenses: value,
      showResult: false,
    }));
  };

  const setResult = (result: CalculatorState['result']) => {
    setState(prev => ({
      ...prev,
      result,
      showResult: true,
    }));
  };

  const clearCalculator = () => {
    const clearedState = {
      savings: '',
      expenses: '',
      result: null,
      showResult: false,
    };
    setState(clearedState);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    savings: state.savings,
    expenses: state.expenses,
    result: state.result,
    showResult: state.showResult,
    updateSavings,
    updateExpenses,
    setResult,
    clearCalculator,
  };
}; 