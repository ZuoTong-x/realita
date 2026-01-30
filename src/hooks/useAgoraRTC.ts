import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
  type IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";

export type AgoraLiveStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface UseAgoraRTCProps {
  enableVideo?: boolean;
  enableAudio?: boolean;
  onUserJoined?: () => void;
}

export function useAgoraRTC({
  enableVideo = true,
  enableAudio = true,
  onUserJoined,
}: UseAgoraRTCProps) {
  const [status, setStatus] = useState<AgoraLiveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(enableAudio);
  const [isVideoEnabled, setIsVideoEnabled] = useState(enableVideo);

  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const remoteUsersRef = useRef<
    Map<
      string | number,
      { audioTrack?: IRemoteAudioTrack; videoTrack?: IRemoteVideoTrack }
    >
  >(new Map());

  /**
   * 初始化 Agora 客户端
   */
  const initClient = useCallback(() => {
    if (!clientRef.current) {
      // 创建 Agora 客户端
      clientRef.current = AgoraRTC.createClient({
        mode: "rtc", // 实时通话模式
        codec: "h264", // 编解码格式
      });

      // 监听远程用户发布事件
      clientRef.current.on("user-published", async (user, mediaType) => {
        // 订阅远程用户
        await clientRef.current!.subscribe(user, mediaType);
        console.log("订阅成功", user.uid, mediaType);

        // 保存远程用户的轨道
        const remoteUser = remoteUsersRef.current.get(user.uid) || {};
        if (mediaType === "video") {
          remoteUser.videoTrack = user.videoTrack;
        } else if (mediaType === "audio") {
          remoteUser.audioTrack = user.audioTrack;
          // 自动播放音频
          user.audioTrack?.play();
        }
        remoteUsersRef.current.set(user.uid, remoteUser);
      });

      // 监听远程用户取消发布事件
      clientRef.current.on("user-unpublished", (user, mediaType) => {
        console.log("用户取消发布", user.uid, mediaType);
        const remoteUser = remoteUsersRef.current.get(user.uid);
        if (remoteUser) {
          if (mediaType === "video") {
            remoteUser.videoTrack = undefined;
          } else if (mediaType === "audio") {
            remoteUser.audioTrack = undefined;
          }
        }
      });

      // 监听远程用户离开事件
      clientRef.current.on("user-left", (user) => {
        console.log("用户离开", user.uid);
        remoteUsersRef.current.delete(user.uid);
      });
      // 监听用户加入频道事件
      clientRef.current.on("user-joined", (user) => {
        console.log("用户加入频道", user.uid);
        onUserJoined?.();
      });
    }
    return clientRef.current;
  }, []);

  /**
   * 加入频道
   */
  const join = useCallback(
    async (
      appId: string,
      channel: string,
      token: string,
      uid: string | number
    ) => {
      try {
        if (!appId) {
          throw new Error("缺少 Agora App ID");
        }
        if (!channel) {
          throw new Error("缺少频道名称");
        }

        setStatus("connecting");
        setError(null);

        // 初始化客户端
        const client = initClient();

        // 加入频道
        await client.join(appId, channel, token, uid);
        console.log("成功加入频道:", channel);

        // 创建并发布本地音视频轨道
        if (enableAudio) {
          localAudioTrackRef.current =
            await AgoraRTC.createMicrophoneAudioTrack();
          await client.publish(localAudioTrackRef.current);
        }

        if (enableVideo) {
          localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
          await client.publish(localVideoTrackRef.current);
        }

        setStatus("connected");
      } catch (err) {
        console.error("加入频道失败:", err);
        setError(err instanceof Error ? err.message : "加入频道失败");
        setStatus("error");
      }
    },
    [enableAudio, enableVideo, initClient]
  );

  /**
   * 离开频道
   */
  const leave = useCallback(async () => {
    try {
      // 停止并关闭本地轨道
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      // 离开频道
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      // 清空远程用户
      remoteUsersRef.current.clear();

      setStatus("disconnected");
    } catch (err) {
      console.error("离开频道失败:", err);
      setError(err instanceof Error ? err.message : "离开频道失败");
    }
  }, []);

  /**
   * 切换音频开关
   */
  const toggleAudio = useCallback(
    async (enabled?: boolean) => {
      const nextState = enabled !== undefined ? enabled : !isAudioEnabled;
      if (localAudioTrackRef.current) {
        await localAudioTrackRef.current.setEnabled(nextState);
        setIsAudioEnabled(nextState);
      }
    },
    [isAudioEnabled]
  );

  /**
   * 切换视频开关
   */
  const toggleVideo = useCallback(
    async (enabled?: boolean) => {
      const nextState = enabled !== undefined ? enabled : !isVideoEnabled;
      if (localVideoTrackRef.current) {
        await localVideoTrackRef.current.setEnabled(nextState);
        setIsVideoEnabled(nextState);
      }
    },
    [isVideoEnabled]
  );

  /**
   * 在指定的 DOM 元素中播放本地视频
   */
  const playLocalVideo = useCallback((element: HTMLElement | string) => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.play(element);
    }
  }, []);

  /**
   * 在指定的 DOM 元素中播放远程视频
   */
  const playRemoteVideo = useCallback(
    (userId: string | number, element: HTMLElement | string) => {
      const remoteUser = remoteUsersRef.current.get(userId);
      if (remoteUser?.videoTrack) {
        remoteUser.videoTrack.play(element);
      }
    },
    []
  );

  /**
   * 组件卸载时自动清理
   */
  useEffect(() => {
    return () => {
      leave();
    };
  }, [leave]);

  return {
    // 状态
    status,
    error,
    isAudioEnabled,
    isVideoEnabled,

    // 方法
    join,
    leave,
    toggleAudio,
    toggleVideo,
    playLocalVideo,
    playRemoteVideo,

    // Refs（供高级用户使用）
    client: clientRef.current,
    localAudioTrack: localAudioTrackRef.current,
    localVideoTrack: localVideoTrackRef.current,
    remoteUsers: remoteUsersRef.current,
  };
}
