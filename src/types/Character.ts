import type { Ratio } from "./Live";

export enum CreateStatus {
  INIT = "init",
  PROCESSING = "processing",
  SUCCESS = "completed",
  FAILED = "failed",
}

export enum LipSyncMotionStyle {
  STATIC = "static",
  DYNAMIC = "dynamic",
}

export interface LipSyncModelInfo {
  label_en: string;
  label_zh: string;
  motion_style: LipSyncMotionStyle;
}

export interface CharacterInfo {
  character_id: string;
  character_name: string;
  image: Image;
  llm_prompt: string;
  number_of_likes: number | null;
  video: Video;
  video_model_id: string;
  video_model_name_en: string;
  video_model_name_zh: string;
  video_prompt: string;
  voice: Voice;
}

export interface ProcessedVoice extends Voice {
  language: { key: string; label_zh: string; label_en: string } | null;
  gender: { key: string; label_zh: string; label_en: string } | null;
  age: { key: string; label_zh: string; label_en: string } | null;
}

export interface Image {
  /**
   * 资产主键
   */
  id: string;
  /**
   * 资产媒体类型
   */
  mime: string;
  /**
   * 资产原始文件名
   */
  name?: string;
  /**
   * 资产存储路径
   */
  path?: string;
  /**
   * 资产下载链接
   */
  url: string;
}

export interface Video {
  /**
   * 资产主键
   */
  id: string;
  /**
   * 资产媒体类型
   */
  mime: string;
  /**
   * 资产原始文件名
   */
  name?: string;
  /**
   * 资产存储路径
   */
  path?: string;
  /**
   * 资产下载链接
   */
  url: string;
}

export interface Voice {
  /**
   * 音色在前端显示的名称。
   */
  friendly_name: string;
  /**
   * 音色主键。
   */
  id: string;
  /**
   * 音色的标注标签，列表长度可能为0.
   */
  labels: string[];
}

/**
 * 音色的试听音频资产，如果试听音频不存在，则返回null.
 */
export interface SampleAsset {
  /**
   * 资产主键
   */
  id: string;
  /**
   * 资产媒体类型
   */
  mime: string;
  /**
   * 资产原始文件名
   */
  name?: string;
  /**
   * 资产存储路径
   */
  path?: string;
  /**
   * 资产下载链接
   */
  url: string;
}

export interface Model {
  /**
   * 视频模型主键。
   */
  id?: string;
  /**
   * 视频模型在前端显示的英文名称。
   */
  name_en?: string;
  /**
   * 视频模型在前端显示的中文名称。
   */
  name_zh?: string;
}

export interface Option {
  key: string;
  label_zh: string;
  label_en: string;
}

export interface EditCharacterRequest {
  /**
   * 被修改的角色主键。
   */
  character_id: string;
  /**
   * 修改后的图片资产主键。如果不希望修改，则不传入该项。
   */
  image_id?: string;
  /**
   * 修改后的LLM人设提示词。如果不希望修改，则不传入该项。
   */
  llm_prompt?: string;
  /**
   * 修改后的视频模型主键。如果不希望修改，则不传入该项。
   */
  model_id?: string;
  /**
   * 修改后的角色名称。如果不希望修改，则不传入该项。
   */
  name?: string;
  /**
   * 修改后的视频模型提示词。如果不希望修改，则不传入该项。
   */
  video_prompt?: string;
  /**
   * 修改后的音色主键。如果不希望修改，则不传入该项。
   */
  voice_id?: string;
  video_model_id?: string;
}

export interface CreateCharacterRequest {
  image_id: string;
  llm_prompt: string;
  name: string;
  video_model_id: string;
  video_prompt: string;
  voice_id: string;
}
export interface ExtendedLipSyncModelInfo extends LipSyncModelInfo {
  id?: string;
}


export interface CharacterFormData {
  name: string;
  llm_prompt: string;
  video_prompt: string;
  voice: ProcessedVoice | null;
  model: ExtendedLipSyncModelInfo | null;
  imageUrl: string | null;
  ratio: Ratio;
}


export interface QueueStatus {
  /**
 * 预估等待时间(秒),如果用户不在队列中则为None
 */
  estimate_time: number | null;
  /**
   * 距离被踢出队列的剩余时间(秒),如果已超时则为负数,
   * 如果用户不在队列中则为None
   */
  expire_time: number | null;
  /**
   * 排在前面的用户数量,如果用户不在队列中则为None
   */
  number_of_users_ahead: number | null;
}

