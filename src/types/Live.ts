export enum Ratio {
  LANDSCAPE = "landscape",
  PORTRAIT = "portrait",
  SQUARE = "square",
}
export interface RatioItem {
  label: string;
  value: Ratio;
  icon: React.ReactNode;
}

// 排队中 通话中 已挂断
export enum CallingStatus {
  PENDING = "pending",
  CALLING = "calling",
  ENDED = "ended",
}

export interface VoicesResponse {
  voices: Voice[];
}
export interface Voice {
  resource_id: string;
  name: string;
  gender: string;
  language: string[];
  scene: string;
  version: string;
  voice_category: string;
  voice_type: string;
}

// 服务状态值
export type ServiceStatus = "idle" | "running" | "stopped";

// 成功返回：{"success":true,"data":{"status":"idle"}}
export interface ServiceStatusSuccess {
  success: true;
  data: {
    status: ServiceStatus;
  };
  // 某些后端可能不返回该字段
  error?: false;
}

// 失败返回：
// {
//   "error": true,
//   "url": "...",
//   "statusCode": 500,
//   "statusMessage": "Server Error",
//   "message": "Server Error"
// }
export interface ApiErrorResponse {
  error: true;
  url?: string;
  statusCode: number;
  statusMessage?: string;
  message?: string;
  // 某些后端可能不返回该字段
  success?: false;
}

// 服务状态接口的联合类型
export type ServiceStatusResponse = ServiceStatusSuccess | ApiErrorResponse;

// 启动服务 - 请求体
export interface StartServicePayload {
  account: "default";
  aiConfig: {
    task: "s2v";
    model_cls: "SekoTalk";
    stage: "single_stage";
    inputImage: string; // base64 编码后的图片数据（不带 data: 前缀）
    inputImageType: string; // 例如 image/jpeg
    huoshan_tts_voice_type: string; // 语音类型（来自语音列表）
  };
  promptConfig: {
    prompt: string; // 正向提示词
    negativePrompt: string; // 负面提示词
  };
}

// 启动服务 - 成功响应 data
export interface StartServiceResponseData {
  sessionId: string;
  whipUrl: string;
  whepUrl: string;
  account: string;
  lightx2vTaskId: string;
  stream: string;
}

// 启动服务 - 响应
export type StartServiceResponse =
  | {
      success: true;
      data: StartServiceResponseData;
    }
  | ApiErrorResponse;
