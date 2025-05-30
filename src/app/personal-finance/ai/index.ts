/**
 * AI-Powered Financial Advisor
 * 
 * This module integrates Vercel's AI SDK to create an intelligent
 * financial advisor that works alongside the rules-based engine.
 * 
 * Key Features:
 * - LLM-powered personalized recommendations
 * - Internal knowledge base with financial expertise
 * - Context-aware advice based on user's financial situation
 * - Validates all suggestions against the rules engine
 */

import { openai } from "@ai-sdk/openai";
import { UserFinancialData } from "../engine/FinancialRulesEngine";

// Custom AI model with financial expertise - simplified version without middleware
export const financialAdvisorModel = openai("gpt-4o");

export interface AIRecommendation {
  id: string;
  type: 'insight' | 'action' | 'warning' | 'education';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-1 scale
  priority: 'high' | 'medium' | 'low';
  category: 'savings' | 'spending' | 'investing' | 'planning' | 'general';
  actionSteps?: string[];
  validatedByRules: boolean;
  educationalContent?: {
    concept: string;
    explanation: string;
    resources?: string[];
  };
}

export interface AIFinancialInsight {
  personalizedMessage: string;
  recommendations: AIRecommendation[];
  contextualFactors: string[];
  nextSteps: string[];
  educationalTopics: string[];
}

export interface FinancialAdvisorQuery {
  userData: UserFinancialData;
  question?: string;
  context?: 'general' | 'savings_optimization' | 'spending_analysis' | 'goal_planning';
  previousRecommendations?: string[];
}
