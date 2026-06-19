import { useApiData } from "./useApiData";
import { sessionService, PaginatedList } from "@/services/session.service";
import type { SessionDetail, SessionListItem } from "@/types/session.types";

export function useSessions(isActive?: boolean) {
  return useApiData<PaginatedList<SessionListItem>>(async () => {
    const data = await sessionService.getSessions({ pageSize: 50, isActive });
    return {
      value: data,
      isSuccess: true,
      message: undefined,
    };
  }, [isActive]);
}

export function useSession(id: string | null) {
  return useApiData<SessionDetail | null>(async () => {
    if (!id) {
      return { isSuccess: false, value: null, message: "No ID provided" };
    }
    try {
      const result = await sessionService.getSessionDetail(id);
      return { value: result, isSuccess: true, message: undefined };
    } catch {
      return { isSuccess: false, value: null, message: "Failed to fetch session" };
    }
  }, [id]);
}
