export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}
export interface Lightx2vApiResponse<T> {
  success: boolean;
  msg: string;
  data: T;
}
export interface PaginatedResponse<T> {
  code: number;
  total: number;
  msg: string;
  data: T[];
}
export interface FileInfo {
  id: string;
  type: string;
  url: string;
  path: string;
}
