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
