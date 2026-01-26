import { create } from "zustand";
import type { UserInfo } from "@/types/UserInfo";
import { clearAll, getToken, saveUserID } from "../utils/user_util";

interface UserStore {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;

  isLoginSuccess: boolean;
  setUserStore: (info: UserInfo) => void;

  setLoginSuccess?: (success: boolean) => void;
  loginStore: () => void;
  logoutStore: () => void;
  updateCredits: (credits: number) => void;
}

const useUserStore = create<UserStore>((set) => ({
  isLoggedIn: !!getToken(), // 如果有 accessToken 则认为已登录
  userInfo: null,
  isLoginSuccess: false,
  setUserStore: (info: UserInfo) => {
    saveUserID(info.id);
    set({ isLoggedIn: true, userInfo: info });
  },
  updateCredits: (credits: number) => {
    set((state) => ({
      userInfo: state.userInfo ? { ...state.userInfo, credits } : null,
    }));
  },
  setLoginSuccess: (success: boolean) => {
    set({ isLoginSuccess: success });
  },
  loginStore: () => {
    set({ isLoggedIn: true });
  },
  logoutStore: () => {
    clearAll();
    set({ isLoggedIn: false, userInfo: null });
  },
}));

export default useUserStore;
