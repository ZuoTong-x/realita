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

export interface StreamInfo {
  lightx2v_stream_id: string;
  lightx2v_task_id: null;
  /**
   * 后续用于管理流的主键。
   */
  stream_id: string;
}
