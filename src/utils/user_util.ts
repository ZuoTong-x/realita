const TOKEN_KEY = "seko-talk-token";
const REFRESH_TOKEN_KEY = "seko-talk-refresh-token";
const USER_ID_KEY = "seko-talk-user-id";
const LANGUAGE_KEY = "seko-talk-language";
const DAILY_LOGIN_TIME_KEY = "seko-talk-daily-login-time";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);
export const saveRefreshToken = (token: string) =>
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = () =>
  localStorage.removeItem(REFRESH_TOKEN_KEY);

export const getUserID = (): string | null => localStorage.getItem(USER_ID_KEY);
export const saveUserID = (id: string) => localStorage.setItem(USER_ID_KEY, id);
export const removeUserID = () => localStorage.removeItem(USER_ID_KEY);

export const getLanguage = (): string | null =>
  localStorage.getItem(LANGUAGE_KEY);
export const saveLanguage = (language: string) =>
  localStorage.setItem(LANGUAGE_KEY, language);
export const removeLanguage = () => localStorage.removeItem(LANGUAGE_KEY);

export const getDailyLoginTime = (): string | null =>
  localStorage.getItem(DAILY_LOGIN_TIME_KEY);
export const saveDailyLoginTime = (time: string) =>
  localStorage.setItem(DAILY_LOGIN_TIME_KEY, time);
export const removeDailyLoginTime = () =>
  localStorage.removeItem(DAILY_LOGIN_TIME_KEY);

export const clearAll = () => {
  removeToken();
  removeRefreshToken();
  removeUserID();
  removeLanguage();
  removeDailyLoginTime();
};
