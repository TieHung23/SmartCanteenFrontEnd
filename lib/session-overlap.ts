import type { SessionListItem } from "@/types/session.types";
import { translateApiMessage } from "./utils";

/**
 * Safely extracts human-readable error string from backend API response
 */
export function extractApiErrorMessage(err: unknown, fallbackMsg: string = ""): string {
  if (!err || typeof err !== "object") return fallbackMsg;

  const axiosErr = err as {
    response?: {
      data?: {
        message?: string;
        error?: string | { message?: string; description?: string; code?: string };
        detail?: string;
        title?: string;
        errors?: Record<string, string[] | string> | string[] | string;
      };
    };
    message?: string;
  };

  const data = axiosErr.response?.data;
  if (!data) {
    if (axiosErr.message && typeof axiosErr.message === "string") {
      return translateApiMessage(axiosErr.message);
    }
    return fallbackMsg;
  }

  // 1. Direct message field
  if (data.message && typeof data.message === "string" && data.message.trim()) {
    return translateApiMessage(data.message);
  }

  // 2. Error string or object field
  if (data.error) {
    if (typeof data.error === "string" && data.error.trim()) {
      return translateApiMessage(data.error);
    }
    if (typeof data.error === "object" && data.error !== null) {
      if (
        data.error.message &&
        typeof data.error.message === "string" &&
        data.error.message.trim()
      ) {
        return translateApiMessage(data.error.message);
      }
      if (
        data.error.description &&
        typeof data.error.description === "string" &&
        data.error.description.trim()
      ) {
        return translateApiMessage(data.error.description);
      }
    }
  }

  // 3. Detail field
  if (data.detail && typeof data.detail === "string" && data.detail.trim()) {
    return translateApiMessage(data.detail);
  }

  // 4. Errors dictionary or array
  if (data.errors) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      if (typeof first === "string") return translateApiMessage(first);
    } else if (typeof data.errors === "object") {
      const values = Object.values(data.errors).flat();
      const firstStr = values.find((v) => typeof v === "string" && v.trim());
      if (firstStr) return translateApiMessage(firstStr as string);
    }
  }

  // 5. Title field
  if (data.title && typeof data.title === "string" && data.title.trim()) {
    return translateApiMessage(data.title);
  }

  return fallbackMsg;
}

/**
 * Formats a Date/ISO string to HH:mm DD/MM/YYYY
 */
export function formatSessionTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return isoStr;
  }
}

/**
 * Formats a Date/ISO string to HH:mm only
 */
export function formatHHMM(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoStr;
  }
}

/**
 * Formats full session time range, displaying dates if session spans across multiple days
 */
export function formatSessionRange(fromIso: string, toIso: string): string {
  try {
    const dFrom = new Date(fromIso);
    const dTo = new Date(toIso);
    if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) return `${fromIso} - ${toIso}`;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const timeFrom = `${pad(dFrom.getHours())}:${pad(dFrom.getMinutes())}`;
    const timeTo = `${pad(dTo.getHours())}:${pad(dTo.getMinutes())}`;
    const dateFrom = `${pad(dFrom.getDate())}/${pad(dFrom.getMonth() + 1)}`;
    const dateTo = `${pad(dTo.getDate())}/${pad(dTo.getMonth() + 1)}`;

    const diffHours = Math.round((dTo.getTime() - dFrom.getTime()) / (1000 * 60 * 60));

    if (dateFrom === dateTo) {
      return `${timeFrom} - ${timeTo} (${dateFrom})`;
    }

    const durationHint = diffHours >= 20 ? ` [ca ${diffHours}h]` : "";
    return `${timeFrom} ngày ${dateFrom} - ${timeTo} ngày ${dateTo}${durationHint}`;
  } catch {
    return `${fromIso} - ${toIso}`;
  }
}

/**
 * Chỉ những ca đang hoạt động mới chiếm khung giờ. Ca đã bị tắt (isActive = false)
 * không gây trùng lịch nên được bỏ qua khi kiểm tra.
 * Thiếu trường isActive thì coi như ca vẫn đang hoạt động.
 */
function isBlockingSession(sess: SessionListItem): boolean {
  return sess.isActive !== false;
}

/**
 * Checks if interval [fromIso, toIso] overlaps with any active existing sessions
 */
export function checkSessionOverlap(
  fromIso: string,
  toIso: string,
  existingSessions: SessionListItem[],
  currentSessionId?: string,
): SessionListItem[] {
  if (!fromIso || !toIso) return [];

  const startA = new Date(fromIso).getTime();
  const endA = new Date(toIso).getTime();

  if (isNaN(startA) || isNaN(endA) || startA >= endA) return [];

  return existingSessions.filter((sess) => {
    if (currentSessionId && sess.id === currentSessionId) return false;
    if (!isBlockingSession(sess)) return false;

    const startB = new Date(sess.availableFrom).getTime();
    const endB = new Date(sess.availableTo).getTime();

    if (isNaN(startB) || isNaN(endB)) return false;

    // Interval overlap condition: startA < endB && startB < endA
    return startA < endB && startB < endA;
  });
}

/**
 * Formats a clear Vietnamese error message identifying conflicting sessions with explicit start/end dates
 */
export function formatSessionOverlapMessage(
  fromIso: string,
  toIso: string,
  conflictingSessions: SessionListItem[],
): string {
  const newRangeStr = formatSessionRange(fromIso, toIso);

  if (conflictingSessions.length === 1) {
    const c = conflictingSessions[0];
    const cRange = formatSessionRange(c.availableFrom, c.availableTo);
    return `Thời gian ca ăn (${newRangeStr}) bị trùng với ca: "${c.name}" (${cRange}). Vui lòng chọn khung giờ khác.`;
  }

  const names = conflictingSessions
    .map((c) => `"${c.name}" (${formatSessionRange(c.availableFrom, c.availableTo)})`)
    .join(", ");
  return `Thời gian ca ăn (${newRangeStr}) bị trùng với ${conflictingSessions.length} ca khác: ${names}. Vui lòng chọn khung giờ khác.`;
}

/**
 * Returns active existing sessions that take place on or overlap with dateStr (YYYY-MM-DD)
 */
export function getSessionsForDate(
  dateStr: string,
  existingSessions: SessionListItem[],
  currentSessionId?: string,
): SessionListItem[] {
  if (!dateStr) return [];

  const dayStart = new Date(`${dateStr}T00:00:00`).getTime();
  const dayEnd = new Date(`${dateStr}T23:59:59.999`).getTime();

  if (isNaN(dayStart) || isNaN(dayEnd)) return [];

  return existingSessions.filter((sess) => {
    if (currentSessionId && sess.id === currentSessionId) return false;
    if (!isBlockingSession(sess)) return false;

    const startB = new Date(sess.availableFrom).getTime();
    const endB = new Date(sess.availableTo).getTime();

    if (isNaN(startB) || isNaN(endB)) return false;

    // Overlaps with the date if startB < dayEnd && endB > dayStart
    return startB < dayEnd && endB > dayStart;
  });
}
