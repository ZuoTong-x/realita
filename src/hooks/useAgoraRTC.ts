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
  // 🔧 新增：使用 state 来存储远程用户，以便触发重新渲染
  const [remoteUsers, setRemoteUsers] = useState<
    Map<
      string | number,
      { audioTrack?: IRemoteAudioTrack; videoTrack?: IRemoteVideoTrack }
    >
  >(new Map());

  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);

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
        console.log("🔔 [user-published] 远程用户发布媒体", {
          uid: user.uid,
          mediaType,
          hasVideo: !!user.videoTrack,
          hasAudio: !!user.audioTrack,
        });

        // 订阅远程用户
        await clientRef.current!.subscribe(user, mediaType);
        console.log("✅ [订阅成功]", user.uid, mediaType);

        // 保存远程用户的轨道
        setRemoteUsers((prev) => {
          const newMap = new Map(prev);
          const remoteUser = newMap.get(user.uid) || {};
          if (mediaType === "video") {
            remoteUser.videoTrack = user.videoTrack;
            console.log("📹 [video track] 已保存", user.uid);
          } else if (mediaType === "audio") {
            remoteUser.audioTrack = user.audioTrack;
            // 自动播放音频
            user.audioTrack?.play();
            console.log("🔊 [audio track] 已保存并播放", user.uid);
          }
          newMap.set(user.uid, remoteUser);
          console.log("📊 [remoteUsers 更新] 当前远程用户数:", newMap.size);
          return newMap;
        });
      });

      // 监听远程用户取消发布事件
      clientRef.current.on("user-unpublished", (user, mediaType) => {
        console.log("🚫 [user-unpublished] 用户取消发布", user.uid, mediaType);
        setRemoteUsers((prev) => {
          const newMap = new Map(prev);
          const remoteUser = newMap.get(user.uid);
          if (remoteUser) {
            if (mediaType === "video") {
              remoteUser.videoTrack = undefined;
            } else if (mediaType === "audio") {
              remoteUser.audioTrack = undefined;
            }
            newMap.set(user.uid, remoteUser);
          }
          return newMap;
        });
      });

      // 监听远程用户离开事件
      clientRef.current.on("user-left", (user) => {
        console.log("👋 [user-left] 用户离开", user.uid);
        setRemoteUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(user.uid);
          console.log("📊 [remoteUsers 更新] 当前远程用户数:", newMap.size);
          return newMap;
        });
      });
      // 监听用户加入频道事件
      clientRef.current.on("user-joined", (user) => {
        console.log("👤 [user-joined] 用户加入频道", {
          uid: user.uid,
          hasVideo: !!user.hasVideo,
          hasAudio: !!user.hasAudio,
        });
        onUserJoined?.();
      });
    }
    return clientRef.current;
  }, [onUserJoined]);

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
        console.log("🚀 [join] 开始加入频道", {
          appId: appId.substring(0, 8) + "...",
          channel,
          uid,
          enableAudio,
          enableVideo,
        });

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
        console.log("✅ [join] 成功加入频道:", channel);
        console.log("📊 [join] 频道中当前用户数:", client.remoteUsers.length);

        // 创建并发布本地音视频轨道
        if (enableAudio) {
          localAudioTrackRef.current =
            await AgoraRTC.createMicrophoneAudioTrack();
          await client.publish(localAudioTrackRef.current);
          console.log("🎤 [join] 已发布音频轨道");
        }

        if (enableVideo) {
          localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
          await client.publish(localVideoTrackRef.current);
          console.log("📹 [join] 已发布视频轨道");
        }

        setStatus("connected");
        console.log("🎉 [join] 连接状态设置为 connected");
      } catch (err) {
        console.error("❌ [join] 加入频道失败:", err);
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
      setRemoteUsers(new Map());

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
      console.log("🎬 [playRemoteVideo] 尝试播放远程视频", {
        userId,
        element: typeof element === "string" ? element : "HTMLElement",
      });
      setRemoteUsers((prev) => {
        const remoteUser = prev.get(userId);
        if (remoteUser?.videoTrack) {
          console.log("✅ [playRemoteVideo] 找到视频轨道，开始播放");
          remoteUser.videoTrack.play(element);
        } else {
          console.warn("⚠️ [playRemoteVideo] 未找到视频轨道", {
            userId,
            hasUser: !!remoteUser,
            hasVideoTrack: !!remoteUser?.videoTrack,
          });
        }
        return prev;
      });
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
    remoteUsers, // 🔧 使用 state 而不是 ref
  };
}
