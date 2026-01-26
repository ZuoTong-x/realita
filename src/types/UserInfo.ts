export interface TokenInfo {
  token_type: string;
  access_token: string;
  access_token_expires_in: number;
  refresh_token_expires_in: number;
  refresh_token: string;
}

export interface CreditInfo {
  id: string;
  user_id: string;
  total_credits: number;
  used_credits: number;
  available_credits: number;
  updated_at: number;
}

export interface CaptchaRespInfo {
  resend_delay_seconds: number;
  code_expire_seconds: number;
}

export interface UserInfo {
  /**
   * 用户头像URL，如果未设置则为None
   */
  avatar_url: null | string;
  /**
   * 用户积分
   */
  credits: number;
  /**
   * 用户邮箱，如果未设置则为None
   */
  email: null | string;
  id: string;
  /**
   * 登录类型，如'google'等
   */
  login_type: string;
  /**
   * 用户手机号，如果未设置则为None
   */
  phone: null;
  status: null;
  /**
   * 用户名
   */
  username: string;
  /**
   *用户角色，regular_user或premium_user或administrator，其中premium_user和admin允许调用积分补充接口。
   */
  role: "regular_user" | "premium_user" | "administrator";
}
