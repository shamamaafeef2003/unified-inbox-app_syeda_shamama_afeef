import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind + conditional classes
 * Example:
 * cn("px-4 py-2", isActive && "bg-blue-500")
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
