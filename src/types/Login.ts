export interface Examples {
  /**
   * 角色主键
   */
  id: string;
  /**
   * 图片资产信息
   */
  image: Image;
  /**
   * 视频资产信息
   */
  video: Video;
}

/**
 * 图片资产信息
 */
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

/**
 * 视频资产信息
 */
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

export interface TokenInfo {
  /**
   * 后续用于在Header中标识用户身份的令牌。
   */
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
}

export interface UserCredits {
  /**
   * 用户当前的积分余额数量
   */
  credits: number;
}
