import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSessionActive(availableFrom: string, availableTo: string): boolean {
  const now = new Date();
  return new Date(availableFrom) <= now && now <= new Date(availableTo);
}

export function isSessionExpired(availableTo: string): boolean {
  return new Date(availableTo) < new Date();
}

export function isSessionUpcoming(availableFrom: string): boolean {
  return new Date(availableFrom) > new Date();
}
