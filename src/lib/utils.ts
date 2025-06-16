import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tremor focusInput [v0.0.2]

export const focusInput = [
  // base
  "focus:ring-2",
  // ring color
  "focus:ring-blue-200 dark:focus:ring-blue-700/30",
  // border color
  "focus:border-blue-500 dark:focus:border-blue-700",
];

// Tremor Raw focusRing [v0.0.1]

export const focusRing = [
  // base
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  // outline color
  "outline-blue-500 dark:outline-blue-500",
];

// Tremor Raw hasErrorInput [v0.0.1]

export const hasErrorInput = [
  // base
  "ring-2",
  // border color
  "border-red-500 dark:border-red-700",
  // ring color
  "ring-red-200 dark:ring-red-700/30",
];

// Date utilities
export function parseTransactionDate(dateString: string): Date {
  // Handle DD/MM/YYYY format from categorization API
  if (typeof dateString === "string" && dateString.includes("/")) {
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
      const year = parseInt(parts[2], 10);

      // Validate the parsed values
      if (
        !isNaN(day) &&
        !isNaN(month) &&
        !isNaN(year) &&
        day >= 1 &&
        day <= 31 &&
        month >= 0 &&
        month <= 11 &&
        year >= 1900
      ) {
        // Create date as noon UTC to avoid timezone shifting
        const isoString = `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00.000Z`;
        return new Date(isoString);
      }
    }
  }

  // Handle YYYY-MM-DD format (common in CSV exports)
  if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Create date as noon UTC to avoid timezone shifting
    const isoString = `${dateString}T12:00:00.000Z`;
    return new Date(isoString);
  }

  // Fallback to standard Date parsing for other formats, but try to preserve the date
  let fallbackDate = new Date(dateString);
  
  // If the standard parsing creates a time component, reset it to noon to avoid timezone issues
  if (!isNaN(fallbackDate.getTime())) {
    // Check if this is just a date (no time) by seeing if it's at midnight
    const timeComponent = fallbackDate.getHours() + fallbackDate.getMinutes() + fallbackDate.getSeconds();
    if (timeComponent === 0) {
      // This was probably just a date, so create it as noon UTC instead
      const year = fallbackDate.getFullYear();
      const month = fallbackDate.getMonth();
      const day = fallbackDate.getDate();
      const isoString = `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00.000Z`;
      return new Date(isoString);
    }
    return fallbackDate;
  }

  // If still invalid, return current date as last resort
  console.warn(
    `Invalid date format: ${dateString}, using current date as fallback`
  );
  return new Date();
}