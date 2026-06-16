import { create } from "zustand";
import { userService, type UserProfileResponse } from "@/services/user.service";

interface UserState {
  profile: UserProfileResponse | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
}

export const useUser = create<UserState>((set) => ({
  profile: null,
  loading: true,
  fetchProfile: async () => {
    try {
      const data = await userService.getProfile();
      set({ profile: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
