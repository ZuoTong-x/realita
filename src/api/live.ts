import request from "./request";
import type { ApiResponse, StreamInfo } from "@/types";

// 获取可用的视频流 /stream
export const getAvailableStreams = async (): Promise<
  ApiResponse<StreamInfo>
> => {
  const response = await request.get<ApiResponse<StreamInfo>>("/stream");
  return response.data;
};

// 记录视频流开始时刻 /stream
export const recordStreamStartTime = async (
  stream_id: string
): Promise<ApiResponse<null>> => {
  const response = await request.post<ApiResponse<null>>("/stream", {
    stream_id,
  });
  return response.data;
};

// 发送视频流心跳信号 /stream
export const sendStreamHeartbeat = async (
  stream_id: string
): Promise<ApiResponse<null>> => {
  const response = await request.put<ApiResponse<null>>("/stream", {
    stream_id,
  });
  return response.data;
};

// 记录视频流结束时刻
export const stopStream = async (
  stream_id: string
): Promise<ApiResponse<null>> => {
  const response = await request.delete<ApiResponse<null>>(`/stream`, {
    data: {
      stream_id,
    },
  });
  return response.data;
};
