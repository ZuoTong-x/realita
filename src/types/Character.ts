import type { UserInfo } from "./UserInfo";

export interface ShowcaseExample {
  id: string;
  image_url: string;
  video_url: string;
}
export interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  voice: string;

  userInfo: UserInfo;
  created_at: string;
  updated_at: string;
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
