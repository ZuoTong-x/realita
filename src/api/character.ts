import request from "./request";
import type { ApiResponse } from "@/types";
import type { CharacterInfo } from "@/types";
import type {
  Voice,
  Model,
  SampleAsset,
  EditCharacterRequest,
  CreateCharacterRequest,
  QueueStatus,
} from "@/types/Character";

// 主页获取公开角色列表 //api/v1/public_characters
export const getPublicCharacterList = async (): Promise<
  ApiResponse<CharacterInfo[]>
> => {
  const response =
    await request.get<ApiResponse<CharacterInfo[]>>("/public_characters");
  return response.data;
};
// 获取非公开角色列表 /user_characters/non_public
export const getNonPublicCharacterList = async (): Promise<
  ApiResponse<CharacterInfo[]>
> => {
  const response =
    await request.get<ApiResponse<CharacterInfo[]>>("/user_characters");
  return response.data;
};

// 获取角色设置 /character/{character_id}
export const getCharacterInfo = async (
  characterId: string
): Promise<ApiResponse<CharacterInfo>> => {
  const response = await request.get<ApiResponse<CharacterInfo>>(
    `/character/${characterId}`
  );
  return response.data;
};

// 创建角色 /create_character
export const createCharacter = async (
  createCharacterRequest: CreateCharacterRequest
): Promise<ApiResponse<CharacterInfo>> => {
  const response = await request.post<ApiResponse<CharacterInfo>>(
    `/create_character`,
    { ...createCharacterRequest }
  );
  return response.data;
};

// 复制角色 /duplicate_character
export const duplicateCharacter = async (
  characterId: string
): Promise<ApiResponse<CharacterInfo>> => {
  const response = await request.post<ApiResponse<CharacterInfo>>(
    `/duplicate_character`,
    {
      character_id: characterId,
    }
  );
  return response.data;
};

// 删除角色 /delete_character
export const deleteCharacter = async (
  characterId: string
): Promise<ApiResponse<null>> => {
  const response = await request.delete<ApiResponse<null>>(
    `/delete_character`,
    {
      data: { character_id: characterId },
    }
  );
  return response.data;
};

// 编辑角色 /edit_character
export const editCharacter = async (
  editCharacterRequest: EditCharacterRequest
): Promise<ApiResponse<CharacterInfo>> => {
  const response = await request.put<ApiResponse<CharacterInfo>>(
    `/edit_character`,
    { ...editCharacterRequest }
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

// 获取音色收藏列表 /user_favorite_voices

export const getUserFavoriteVoices = async (): Promise<
  ApiResponse<{ voice_ids: string[] }>
> => {
  const response = await request.get<ApiResponse<{ voice_ids: string[] }>>(
    "/user_favorite_voices"
  );
  return response.data;
};

// 添加音色收藏 /add_voice_to_user_favorite

export const addVoiceToUserFavorite = async (
  voiceId: string
): Promise<ApiResponse<null>> => {
  const response = await request.post<ApiResponse<null>>(
    "/add_voice_to_user_favorite",
    { voice_id: voiceId }
  );
  return response.data;
};

// 删除音色收藏 /remove_voice_from_user_favorite

export const removeVoiceFromUserFavorite = async (
  voiceId: string
): Promise<ApiResponse<null>> => {
  const response = await request.delete<ApiResponse<null>>(
    "/remove_voice_from_user_favorite",
    {
      data: { voice_id: voiceId },
    }
  );
  return response.data;
};

// 获取音色试听音频 /voice_sample_asset
export const getVoiceSampleAsset = async (
  voiceId: string
): Promise<ApiResponse<SampleAsset>> => {
  const response = await request.get<ApiResponse<SampleAsset>>(
    `/voice_sample_asset?voice_id=${voiceId}`
  );
  return response.data;
};

// 喜欢角色 /like_character
export const likeCharacter = async (
  characterId: string
): Promise<ApiResponse<null>> => {
  const response = await request.post<ApiResponse<null>>("/like_character", {
    character_id: characterId,
  });
  return response.data;
};

// /api/v1/dislike_character 取消点赞角色
export const dislikeCharacter = async (
  characterId: string
): Promise<ApiResponse<null>> => {
  const response = await request.delete<ApiResponse<null>>(
    "/dislike_character",
    {
      data: { character_id: characterId },
    }
  );
  return response.data;
};

// 加入队列 /join_queue
export const joinQueue = async (
  characterId: string
): Promise<ApiResponse<QueueStatus>> => {
  const response = await request.post<ApiResponse<QueueStatus>>("/queue", {
    character_id: characterId,
  });
  return response.data;
};

// 获取排队情况
// GET /queue_status

export const getQueueStatus = async (): Promise<ApiResponse<QueueStatus>> => {
  const response = await request.get<ApiResponse<QueueStatus>>("/queue");
  return response.data;
};

// 离开队列 /leave_queue
export const leaveQueue = async (): Promise<ApiResponse<null>> => {
  const response = await request.delete<ApiResponse<null>>("/queue");
  return response.data;
};

// 发送排队心跳信号 /api/v1/queue_heartbeat
export const sendQueueHeartbeat = async (): Promise<ApiResponse<null>> => {
  const response = await request.put<ApiResponse<null>>("/queue");
  return response.data;
};
