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
  /**
   * 上游LightX2V服务的流ID.
   */
  lightx2v_stream_id: string;
  /**
   * 流的进度信息,数值在[0.0, 1.0]之间, 如果流尚未开始或进度未知则为None.
   */
  progress: string;
  /**
   * 流的当前状态,如'created'、'ready'、'started'等。ready状态的流允许连接。
   */
  status: string;
  /**
   * 后续用于管理流的主键。
   */
  stream_id: string;
  /**
   * WebRTC WHEP协议的连接URL,用于拉流, 仅在流状态为ready时可用,否则为None.
   */
  whep_url: null | string;
  /**
   * WebRTC WHIP协议的连接URL, 用于推流,
   * 仅在流状态为ready时可用,否则为None.
   */
  whip_url: null | string;
}
