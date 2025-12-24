import request from "./request";
import type { ApiResponse } from "@/types";
import type {
  CharacterInfo,
  CharacterSettings,
  EditCharacterRequest,
} from "@/types";
import type { Voice, Model } from "@/types/Character";

// 主页获取角色列表 /get_user_characters
export const getCharacterList = async (): Promise<
  ApiResponse<CharacterInfo[]>
> => {
  const response = await request.get<ApiResponse<CharacterInfo[]>>(
    "/get_user_characters"
  );
  return response.data;
};

// 获取角色设置 /character/{character_id}
export const getCharacterSettings = async (
  characterId: string
): Promise<ApiResponse<CharacterSettings>> => {
  const response = await request.get<ApiResponse<CharacterSettings>>(
    `/character/${characterId}`
  );
  return response.data;
};

// 复制角色 /duplicate_character
export const duplicateCharacter = async (
  characterId: string
): Promise<ApiResponse<CharacterSettings>> => {
  const response = await request.post<ApiResponse<CharacterSettings>>(
    `/duplicate_character`,
    { character_id: characterId }
  );
  return response.data;
};

// 删除角色 /delete_character
export const deleteCharacter = async (
  characterId: string
): Promise<ApiResponse<null>> => {
  const response = await request.delete<ApiResponse<null>>(
    `/delete_character`,
    { data: { character_id: characterId } }
  );
  return response.data;
};

// 编辑角色 /edit_character
export const editCharacter = async (
  editCharacterRequest: EditCharacterRequest
): Promise<ApiResponse<CharacterSettings>> => {
  const response = await request.put<ApiResponse<CharacterSettings>>(
    `/edit_character`,
    { data: editCharacterRequest }
  );
  return response.data;
};

// 音色列表 /voices_options
export const getVoicesOptions = async (): Promise<ApiResponse<Voice[]>> => {
  const response = await request.get<ApiResponse<Voice[]>>("/voice_options");
  return response.data;
};

// 模型列表 /models_options
export const getModelsOptions = async (): Promise<ApiResponse<Model[]>> => {
  const response = await request.get<ApiResponse<Model[]>>("/model_options");
  return response.data;
};
