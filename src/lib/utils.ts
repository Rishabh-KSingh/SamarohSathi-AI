import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard utility for combining class names with Tailwind CSS token merge support.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a numeric amount in Indian Rupee notation (e.g. 1500000 -> "₹15,00,000").
 */
export function formatCurrency(amount: number | undefined | null, symbol = "₹"): string {
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return `${symbol}${safeAmount.toLocaleString("en-IN")}`;
}

/**
 * Format a number using Indian locale formatting.
 */
export function formatNumber(amount: number | undefined | null): string {
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return safeAmount.toLocaleString("en-IN");
}

/**
 * Safely parse a JSON string with fallback, preventing uncaught syntax exceptions.
 */
export function safeParseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Clamp a number between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
