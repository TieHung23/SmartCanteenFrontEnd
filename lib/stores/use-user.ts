import { create } from "zustand";
import { userService, type UserProfileResponse } from "@/services/user.service";

interface UserState {
  profile: UserProfileResponse | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
}

export const useUser = create<UserState>((set, get) => ({
  profile: null,
  loading: true,
  fetchProfile: async () => {
    if (get().profile && !get().loading) return;
    try {
      const data = await userService.getProfile();
      set({ profile: data, loading: false });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        console.warn("[UserStore] 429 Too Many Requests, using cached state.");
      }
      set({ loading: false });
    }
  },
}));
