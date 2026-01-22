import request from "./request";
import type { ApiResponse, FileInfo } from "@/types";

// 上传资源文件（图片/音频等）/asset
export const uploadAssetFile = async (
  file: File,
  source?: string,
  timeout: number = 60 // 超时(秒)
): Promise<ApiResponse<FileInfo>> => {
  const formData = new FormData();
  formData.append("file", file);
  if (source) {
    formData.append("source", source);
  }
  const response = await request.post("/asset", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: timeout * 1000, // 转换为毫秒
  });
  return response.data;
};
