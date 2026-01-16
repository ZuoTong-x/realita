import { create } from "zustand";
import type { UserInfo } from "@/types/UserInfo";
import type { UserCredits } from "../types/Login";
import { clearAll, getToken, saveUserID } from "../utils/user_util";

interface UserStore {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  credits: UserCredits | null;
  isLoginSuccess: boolean;
  setUserStore: (info: UserInfo) => void;
  setCreditStore: (credit: UserCredits) => void;
  setLoginSuccess?: (success: boolean) => void;
  loginStore: () => void;
  logoutStore: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  isLoggedIn: !!getToken(), // 如果有 accessToken 则认为已登录
  userInfo: null,
  credits: null,
  isLoginSuccess: false,
  setUserStore: (info: UserInfo) => {
    saveUserID(info.id);
    set({ isLoggedIn: true, userInfo: info });
  },
  setCreditStore: (credit: UserCredits) => {
    set({ credits: credit });
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
