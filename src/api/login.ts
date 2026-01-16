import request from "./request";
import type { ApiResponse } from "@/types";
import type { Examples, TokenInfo, UserCredits } from "@/types/Login";
import type { UserInfo } from "@/types/UserInfo";
// 首页优秀示例列表 /showcase_examples
export const getShowcaseExampleList = async (): Promise<
  ApiResponse<Examples[]>
> => {
  const response =
    await request.get<ApiResponse<Examples[]>>("/showcase_examples");
  return response.data;
};

// 通过Google登录 /google_sign_in
export const signInWithGoogle = async (
  accessToken: string
): Promise<ApiResponse<TokenInfo>> => {
  const response = await request.post<ApiResponse<TokenInfo>>(
    "/google_sign_in",
    {
      access_token: accessToken,
    }
  );
  return response.data;
};

// 退出登录; /sign_out;

export const signOut = async (): Promise<ApiResponse<null>> => {
  const response = await request.post<ApiResponse<null>>("/sign_out");
  return response.data;
};

// 获取积分余额; /get_user_credits;

export const getUserCredits = async (): Promise<ApiResponse<UserCredits>> => {
  const response =
    await request.get<ApiResponse<UserCredits>>("/get_user_credits");
  return response.data;
};

// 获取用户信息; /get_user_info;
export const getUserInfo = async (): Promise<ApiResponse<UserInfo>> => {
  const response = await request.get<ApiResponse<UserInfo>>("/get_user_info");
  return response.data;
};

// 获取用户喜欢的角色列表; /get_user_liked_characters
export const getUserLikedCharacters = async (): Promise<
  ApiResponse<string[]>
> => {
  const response = await request.get<ApiResponse<string[]>>(
    "/get_user_liked_characters"
  );
  return response.data;
};
