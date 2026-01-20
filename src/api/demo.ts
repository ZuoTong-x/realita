import request from "./request";
import type { Lightx2vApiResponse } from "@/types";
import type {
  VoicesResponse,
  ServiceStatusResponse,
  StartServicePayload,
  StartServiceResponse
} from "@/types/Live";

// 获取tts 列表 /lightx2v/voices
export const getVoicesList = async (): Promise<
  Lightx2vApiResponse<VoicesResponse>
> => {
  const response =
    await request.get<Lightx2vApiResponse<VoicesResponse>>("/lightx2v/voices");
  return response.data;
};

// 获取服务状态 /service/status
export const getServiceStatus = async (): Promise<ServiceStatusResponse> => {
  const response = await request.get<ServiceStatusResponse>("/service/status");
  return response.data;
};

// 启动对话
export const startService = async (
  payload: StartServicePayload
): Promise<StartServiceResponse> => {
  const response = await request.post<StartServiceResponse>(
    "/service/start",
    payload
  );
  return response.data;
};

// 停止对话
export const stopService = async (
  sessionId: string
): Promise<ServiceStatusResponse> => {
  const response = await request.post<ServiceStatusResponse>("/service/stop", {
    sessionId
  });
  return response.data;
};
