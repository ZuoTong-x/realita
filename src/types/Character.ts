export interface ShowcaseExample {
  id: string;
  image: string;
  video: string;
}
export interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  voice: string;

  // userInfo: UserInfo;
  // created_at: string;
  // updated_at: string;
}

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

export interface CharacterSettings {
  id: string;
  name: string;
  author: string;
  voice: string;
  prompt: string;
  image_url: string;
  model: string;
  number_of_likes: number;
}

export interface EditCharacterRequest {
  character_id: string;
  name: string;

  prompt: string;
  voice_id: string;
  image_id: string;
  model_id: string;
}

export interface VoiceOption {
  id: string;
  name_zh: string;
  name_en: string;
}

export interface ModelOption {
  id: string;
  name_zh: string;
  name_en: string;
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
  /**
   * 音色的试听音频资产，如果试听音频不存在，则返回null.
   */
  sample_asset: SampleAsset;
}
export interface VoiceOption {
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
  /**
   * 音色的试听音频资产，如果试听音频不存在，则返回null.
   */
  sample_asset: SampleAsset;
  language: { key: string; label_zh: string; label_en: string };
  type: { label_zh: string; label_en: string; key: string };
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
