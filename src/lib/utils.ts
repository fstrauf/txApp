import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO, parse } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string or Date object to DD/MM/YYYY format
 */
export function formatDate(date: string | Date): string {
  const parsedDate = parseISO(date.toString());
  if (isValid(parsedDate)) {
    return format(parsedDate, "yyyy-MM-dd");
  }
  return "";
}

/**
 * Format a date string or Date object to YYYY-MM-DD format
 * for HTML date input fields
 */
export function formatDateForInput(date: string | Date): string {
  const parsedDate = parseISO(date.toString());
  if (isValid(parsedDate)) {
    return format(parsedDate, "yyyy-MM-dd");
  }
  return "";
}

// Updated color palette with more distinct colors
const COLOR_PALETTE = [
  { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
  { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200" },
  { bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-200" },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
  { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-800", border: "border-fuchsia-200" },
  { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
];

// Fixed colors for special types
const INCOME_COLORS = { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" };
const EXPENSE_COLORS = { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200" };

// Reserved category names with fixed colors
const CATEGORY_COLOR_MAP: Record<string, typeof COLOR_PALETTE[0]> = {
  "Food": { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  "Dining": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  "Utilities": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  "Transport": { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200" },
  "Shopping": { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  "Housing": { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
  "Entertainment": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  "Healthcare": { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
  "Travel": { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200" },
  "Education": { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
};

/**
 * Generates consistent colors for a category based on its name
 * This ensures the same category always gets the same color
 */
export function getCategoryColors(name: string) {
  // Check for reserved category names
  const lowerName = name.toLowerCase();
  for (const [categoryName, colors] of Object.entries(CATEGORY_COLOR_MAP)) {
    if (lowerName === categoryName.toLowerCase()) {
      return colors;
    }
  }
  
  // For all other categories, use hash of the name to pick a color
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Get colors for transaction types (income/expense)
 */
export function getTransactionTypeColors(type: 'income' | 'expense') {
  return type === 'income' ? INCOME_COLORS : EXPENSE_COLORS;
} 