import request from "./request";
import type { ApiResponse } from "@/types";
import type { ShowcaseExample, Character } from "@/types";

// 首页优秀示例列表 /showcase_examples
export const getShowcaseExampleList = async (): Promise<
  ApiResponse<ShowcaseExample[]>
> => {
  const response =
    await request.get<ApiResponse<ShowcaseExample[]>>("/showcase_examples");
  return response.data;
};

// 主页获取角色列表 /characters
export const getCharacterList = async (): Promise<ApiResponse<Character[]>> => {
  const response = await request.get<ApiResponse<Character[]>>("/characters");
  return response.data;
};
