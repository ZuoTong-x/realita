import { useEffect, useState, useCallback, useRef } from "react";
import {
  useRTCClient,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRemoteVideoTracks,
  useRemoteAudioTracks,
} from "agora-rtc-react";

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
  const [appId, setAppId] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | number | null>(null);

  // 获取 Agora 客户端（从 AgoraRTCProvider 提供）
  const client = useRTCClient();

  // 创建本地音视频轨道
  const { localCameraTrack } = useLocalCameraTrack(enableVideo);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(enableAudio);
  const calling = useRef(false);

  const joinState = useJoin(
    {
      appid: appId,
      channel: channel,
      token: token,
      uid: uid !== null ? uid : undefined,
    },
    calling.current
  );

  // 发布本地轨道
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // 获取远程用户
  const remoteUsers = useRemoteUsers();

  // 获取远程视频和音频轨道
  const { videoTracks } = useRemoteVideoTracks(remoteUsers);
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // 计算状态
  const status: AgoraLiveStatus = joinState.isLoading
    ? "connecting"
    : joinState.isConnected
      ? "connected"
      : joinState.error
        ? "error"
        : "idle";

  // 监听加入状态变化
  useEffect(() => {
    if (joinState.isLoading) {
      console.log("🚀 [join] 正在加入频道...");
    } else if (joinState.error) {
      console.error("❌ [join] 加入频道失败:", joinState.error);
    } else if (joinState.isConnected) {
      console.log("✅ [join] 成功加入频道:", channel);
      onUserJoined?.();
    }
  }, [joinState.isLoading, joinState.error, joinState.isConnected]);

  /**
   * 加入频道
   */
  const join = async (
    _appId: string,
    _channel: string,
    _token: string,
    _uid?: string | number
  ) => {
    setAppId(_appId);
    setChannel(_channel);
    setToken(_token || null);
    setUid(_uid !== undefined ? _uid : null);
    calling.current = true;
  };

  /**
   * 离开频道
   */
  const leave = useCallback(async () => {
    try {
      console.log("👋 [leave] 正在离开频道...");

      // 清空参数，触发 useJoin 自动离开
      setAppId("");
      setChannel("");
      setToken(null);
      setUid(null);
      calling.current = false;
      // 停止本地轨道
      localCameraTrack?.stop();
      localCameraTrack?.close();
      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();

      console.log("✅ [leave] 已离开频道");
    } catch (err) {
      console.error("❌ [leave] 离开频道失败:", err);
    }
  }, [localCameraTrack, localMicrophoneTrack]);

  /**
   * 切换音频开关
   */
  const toggleAudio = async (enabled?: boolean) => {
    const nextState =
      enabled !== undefined ? enabled : !localMicrophoneTrack?.enabled;
    if (localMicrophoneTrack) {
      await localMicrophoneTrack.setEnabled(nextState);
      console.log(`🎤 [toggleAudio] 音频${nextState ? "开启" : "关闭"}`);
    }
  };

  /**
   * 切换视频开关
   */
  const toggleVideo = async (enabled?: boolean) => {
    const nextState =
      enabled !== undefined ? enabled : !localCameraTrack?.enabled;
    if (localCameraTrack) {
      await localCameraTrack.setEnabled(nextState);
      console.log(`📹 [toggleVideo] 视频${nextState ? "开启" : "关闭"}`);
    }
  };

  /**
   * 在指定的 DOM 元素中播放本地视频
   */
  const playLocalVideo = (element: HTMLElement | string) => {
    if (localCameraTrack) {
      localCameraTrack.play(element);
    }
  };

  /**
   * 在指定的 DOM 元素中播放远程视频
   */
  const playRemoteVideo = (
    userId: string | number,
    element: HTMLElement | string
  ) => {
    const videoTrack = videoTracks.find(
      (track) => track.getUserId() === userId
    );
    if (videoTrack) {
      videoTrack.play(element);
    }
  };

  // 将远程用户转换为 Map 格式（保持与原 API 兼容）
  const remoteUsersMap = new Map(
    remoteUsers.map((user) => {
      const videoTrack = videoTracks.find((t) => t.getUserId() === user.uid);
      const audioTrack = audioTracks.find((t) => t.getUserId() === user.uid);
      return [
        user.uid,
        {
          videoTrack,
          audioTrack,
        },
      ];
    })
  );

  return {
    // 状态
    status,
    error: joinState.error?.message || null,
    isAudioEnabled: localMicrophoneTrack?.enabled ?? false,
    isVideoEnabled: localCameraTrack?.enabled ?? false,

    // 方法
    join,
    leave,
    toggleAudio,
    toggleVideo,
    playLocalVideo,
    playRemoteVideo,

    // Agora 对象（供高级用户使用）
    client,
    localAudioTrack: localMicrophoneTrack,
    localVideoTrack: localCameraTrack,
    remoteUsers: remoteUsersMap, // 返回 Map 格式，保持 API 兼容
    videoTracks,
    audioTracks,
  };
}
