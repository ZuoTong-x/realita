import { useEffect, useState, useRef } from "react";

import CommonButton from "@/components/Common/Button";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioON.svg?react";
import IconVideoOff from "@/assets/svg/IconVideoOff.svg?react";
import IconVideoOn from "@/assets/svg/IconVideoOn.svg?react";
import IconCallMissed from "@/assets/svg/IconCallMissed.svg?react";
import IconCamera from "@/assets/svg/IconCamera.svg?react";
import { useAgoraRTC } from "@/hooks/useAgoraRTC";

import useDraggable from "@/hooks/useDraggable";
import {
  getAvailableStreams,
  recordStreamStartTime,
  sendStreamHeartbeat,
  stopStream,
} from "@/api";
import { useTranslation } from "react-i18next";
import type { StreamInfo } from "@/types";
import { App, Modal, Progress } from "antd";
import { useRequest } from "ahooks";
import { useNavigate } from "react-router-dom";
import useUserStore from "@/stores/userStore";

// 预览窗口尺寸（用户本地视频）
const previewSize = {
  width: 200,
  height: 200,
};

// 判断图片宽高比
const getAspectRatio = (
  width: number,
  height: number
): "1:1" | "16:9" | "9:16" => {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.1) return "1:1";
  if (ratio > 1.5) return "16:9";
  return "9:16";
};

const LivePage = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { updateCredits } = useUserStore();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);

  const characterIdFromUrl = searchParams.get("characterId");
  const bgImg = characterIdFromUrl
    ? localStorage.getItem(`${characterIdFromUrl}_bgImg`)
    : localStorage.getItem("bgImg");
  const [progress, setProgress] = useState<number>(0);
  // 是否静音
  const [muted, setMuted] = useState<boolean>(false);

  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [permModalOpen, setPermModalOpen] = useState<boolean>(false);

  const [streamInfoErrorModalOpen, setStreamInfoErrorModalOpen] =
    useState<boolean>(false);
  const localPreviewRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamInfo = useRef<StreamInfo | null>(null);
  // 记录进入通话时的初始积分
  const initialCreditsRef = useRef<number>(0);
  const useCreditsRef = useRef<number>(0);
  // 视频盒子尺寸（根据图片比例计算）
  const [videoBoxSize, setVideoBoxSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const agoraInfo = useRef<{
    app_id: string;
    channel_name: string;
    user_rtc_token: string;
    user_uid: string;
  } | null>(null);

  // const {
  //   start: startLive,
  //   stop: stopLive,
  //   status: liveStatus,
  //   whipPcRef,
  // } = useWebRTCWhipWhep({
  //   preview: localPreviewRef,
  //   audioOnly: !videoEnabled,
  //   remoteVideoRef: remoteVideoRef,
  //   onSuccess: () => handleStartLiveSuccess(),
  // });
  const {
    status: liveStatus,
    join,
    leave,
    playLocalVideo,
    playRemoteVideo,
    remoteUsers,
    toggleAudio,
    toggleVideo,
  } = useAgoraRTC({
    enableVideo: videoEnabled,
    enableAudio: true,
    onUserJoined: async () => {
      await recordStreamStartTime(streamInfo.current!.stream_id);
      // 记录进入通话时的初始积分
      const currentUserInfo = useUserStore.getState().userInfo;
      if (currentUserInfo) {
        initialCreditsRef.current = currentUserInfo.credits;
      }
      run();
      cancelGetStreamInfo();
    },
  });

  const sendStreamHeartbeatRequest = async () => {
    if (!streamInfo.current) return;
    const remainingCredits = initialCreditsRef.current - useCreditsRef.current;
    // 更新积分显示
    updateCredits(remainingCredits);
    const res = await sendStreamHeartbeat(streamInfo.current.stream_id);
    if (res.code !== 200) {
      await leave();
      await stopStream(streamInfo.current.stream_id);
      cancel();
      cancelGetStreamInfo();
      localStorage.removeItem(`${characterIdFromUrl}_bgImg`);
      setStreamInfoErrorModalOpen(true);
    } else {
      if (res.data) {
        // res.data 是当前通话的总消耗量
        // 计算剩余积分 = 初始积分 - 总消耗量
        useCreditsRef.current = res.data;
        // 检查积分是否足够
        if (remainingCredits < 0) {
          message.error(t("live_no_credits"));
          await leave();
          await stopStream(streamInfo.current.stream_id);
          cancel();
          cancelGetStreamInfo();
          localStorage.removeItem(`${characterIdFromUrl}_bgImg`);
          setStreamInfoErrorModalOpen(true);
          return;
        }
      }
    }
  };

  const { run, cancel } = useRequest(sendStreamHeartbeatRequest, {
    pollingInterval: 1000,
    pollingErrorRetryCount: 3,
    manual: true,
  });

  const getStreamInfoRequest = async () => {
    const res = await getAvailableStreams();
    if (res.code === 200 && res.data) {
      streamInfo.current = res.data;
      setProgress(Number(res.data.progress) * 100);
      if (
        res.data.status === "ready" &&
        res.data.channel_name &&
        res.data.user_rtc_token &&
        res.data.user_uid
      ) {
        agoraInfo.current = {
          app_id: res.data.app_id,
          channel_name: res.data.channel_name,
          user_rtc_token: res.data.user_rtc_token,
          user_uid: res.data.user_uid,
        };
        join(
          agoraInfo.current.app_id,
          agoraInfo.current.channel_name,
          agoraInfo.current.user_rtc_token,
          agoraInfo.current.user_uid
        );
        cancelGetStreamInfo();
      }
    } else {
      setStreamInfoErrorModalOpen(true);
      cancelGetStreamInfo();
    }
  };

  const { run: runGetStreamInfo, cancel: cancelGetStreamInfo } = useRequest(
    getStreamInfoRequest,
    {
      pollingInterval: 1000,
      pollingErrorRetryCount: 3,
      manual: true,
    }
  );

  const characterRef = useRef<HTMLDivElement | null>(null);
  const {
    dragRef: userDragRef,
    position: userPos,
    setPosition: setUserPos,
  } = useDraggable({
    elementWidth: previewSize.width,
    elementHeight: previewSize.height,
    margin: 8,
  });

  // 只在首次挂载时设置初始位置
  useEffect(() => {
    // 如果已经有位置了，就不再重置
    if (userPos) return;

    const computeInitial = () => {
      const left = 100;
      const top = window.innerHeight - previewSize.height - 100;
      setUserPos({ left, top });
    };
    const id = window.requestAnimationFrame(computeInitial);
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 计算视频盒子大小（根据图片比例）
  useEffect(() => {
    const calculateVideoBoxSize = async () => {
      if (!bgImg) {
        // 如果没有背景图，默认使用 1:1
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        const size = minDimension * 0.8;
        setVideoBoxSize({ width: size, height: size });
        return;
      }

      // 加载图片获取宽高
      const img = new Image();
      img.src = bgImg;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const ratio = getAspectRatio(img.width, img.height);

      // 根据比例和屏幕大小计算视频容器尺寸
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      let width = 0;
      let height = 0;

      if (ratio === "1:1") {
        const minDimension = Math.min(screenWidth, screenHeight);
        const size = minDimension * 0.8;
        width = size;
        height = size;
      } else if (ratio === "16:9") {
        // 横屏：优先使用屏幕宽度的 80%
        width = screenWidth * 0.8;
        height = width * (9 / 16);
        // 如果高度超过屏幕高度的 80%，则调整
        if (height > screenHeight * 0.8) {
          height = screenHeight * 0.8;
          width = height * (16 / 9);
        }
      } else if (ratio === "9:16") {
        // 竖屏：优先使用屏幕高度的 80%
        height = screenHeight * 0.8;
        width = height * (9 / 16);
        // 如果宽度超过屏幕宽度的 80%，则调整
        if (width > screenWidth * 0.8) {
          width = screenWidth * 0.8;
          height = width * (16 / 9);
        }
      }

      setVideoBoxSize({ width, height });
    };

    calculateVideoBoxSize();
    window.addEventListener("resize", calculateVideoBoxSize);
    return () => window.removeEventListener("resize", calculateVideoBoxSize);
  }, [bgImg]);

  const handleCall = async () => {
    if (liveStatus === "connected") {
      await leave();
      await stopStream(streamInfo.current!.stream_id);
      cancel();
      navigate(-1);
    }
  };

  // 同步 muted 状态（控制本地音频发送）
  useEffect(() => {
    if (liveStatus === "connected") {
      toggleAudio(!muted);
    }
  }, [muted, liveStatus, toggleAudio]);

  // 监听 videoEnabled 变化，切换视频开关
  useEffect(() => {
    if (liveStatus === "connected") {
      toggleVideo(videoEnabled);
    }
  }, [videoEnabled, liveStatus, toggleVideo]);

  // 初始化：开始轮询获取流信息
  useEffect(() => {
    runGetStreamInfo();
    return () => {
      cancelGetStreamInfo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 本地视频播放
  useEffect(() => {
    if (liveStatus === "connected" && localPreviewRef.current && videoEnabled) {
      playLocalVideo(localPreviewRef.current);
    }
  }, [liveStatus, videoEnabled, playLocalVideo]);

  // 远程视频播放
  useEffect(() => {
    if (liveStatus === "connected" && remoteVideoRef.current) {
      const remoteUserIds = Array.from(remoteUsers.keys());
      if (remoteUserIds.length > 0) {
        playRemoteVideo(remoteUserIds[0], remoteVideoRef.current);
      }
    }
  }, [liveStatus, remoteUsers, playRemoteVideo]);

  return (
    <div
      className="relative w-full min-h-screen flex items-center justify-center"
      style={{ overflow: "hidden", height: "100vh" }}
    >
      {bgImg ? (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={bgImg}
            alt="bg"
            className="w-full h-full object-cover blur-md"
          />
          {/* 灰黑色模糊遮罩 */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-[#26babb]/20 to-[#f3e8cb]" />
        </div>
      )}
      <div
        ref={characterRef}
        className="flex items-center justify-center w-full h-full"
      >
        <div
          className="relative border-[2px] border-solid border-white rounded-2xl overflow-hidden"
          style={{
            width: videoBoxSize.width,
            height: videoBoxSize.height,
          }}
        >
          {/* 拉流视频 - 一直存在 */}
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            playsInline
            muted={muted}
            controls={false}
            autoPlay
            disablePictureInPicture
          />

          {/* 未连接状态：灰色蒙版 + 小正方形图片 */}
          {liveStatus !== "connected" && (
            <div className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              {bgImg && (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    width:
                      Math.min(videoBoxSize.width, videoBoxSize.height) * 0.3,
                    height:
                      Math.min(videoBoxSize.width, videoBoxSize.height) * 0.3,
                  }}
                >
                  <img
                    src={bgImg}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* <IconLoading className="w-16 h-16 text-[#26babb] animate-spin" /> */}
              <div className="w-[70%] h-16 flex items-center justify-center">
                <Progress
                  percent={progress}
                  showInfo={false}
                  styles={{
                    track: {
                      backgroundImage:
                        "linear-gradient( to right, #b1f2ed, #f7e299 )",
                      borderRadius: 8,
                      transition: "all 0.3s ease",
                    },
                    rail: {
                      backgroundColor: "rgba(0, 0, 0, 0.1)",
                      borderRadius: 8,
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮组（受 uiVisible 控制） */}

        <div className="absolute bottom-10 left-0 w-full flex items-center justify-center gap-6 z-20">
          <CommonButton
            size="large"
            className="h-20 px-0"
            borderRadiusPx={54}
            onClick={() => {
              // 切换视频开关，并在通话中重启以生效
              const next = !videoEnabled;
              setVideoEnabled(next);
            }}
          >
            <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-4">
              {videoEnabled ? (
                <IconVideoOn className="w-12 h-12" />
              ) : (
                <IconVideoOff className="w-12 h-12" />
              )}
            </span>
          </CommonButton>
          {liveStatus === "connected" && (
            <CommonButton
              size="large"
              className="h-24 px-0"
              borderRadiusPx={54}
              onClick={handleCall}
            >
              <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-5">
                {/* {liveStatus === "connecting" && (
                  <IconLoading className="w-13 h-13 text-[#26babb] animate-spin" />
                )} */}
                {liveStatus === "connected" && (
                  <IconCallMissed className="w-13 h-13 text-[#DB7A7A]" />
                )}
              </span>
            </CommonButton>
          )}
          <CommonButton
            size="large"
            className="h-20 px-0"
            borderRadiusPx={54}
            onClick={() => setMuted((prev) => !prev)}
            aria-label={muted ? "unmute-page" : "mute-page"}
          >
            <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-4">
              {muted ? (
                <IconAudioOff className="w-12 h-12" />
              ) : (
                <IconAudioOn className="w-12 h-12" />
              )}
            </span>
          </CommonButton>
        </div>
      </div>

      {userPos && (
        <div
          className="absolute z-30"
          style={{
            left: userPos.left,
            top: userPos.top,
            touchAction: "none",
            cursor: "move",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          ref={userDragRef as React.RefObject<HTMLDivElement>}
        >
          <div
            className="border-[2px] border-solid border-white rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm"
            style={{
              width: previewSize.width,
              height: previewSize.height,
              pointerEvents: "auto",
            }}
          >
            {videoEnabled ? (
              <video
                ref={localPreviewRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
                style={{ pointerEvents: "none" }}
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-2 select-none bg-black"
                style={{ pointerEvents: "none" }}
              >
                <IconCamera className="w-10 h-10 text-white/80" />
                <div className="text-white/80 text-sm">
                  {t("common_open_camera")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={permModalOpen}
        centered
        title={t("live_permission_title")}
        okText={t("common_confirm")}
        cancelButtonProps={{ style: { display: "none" } }}
        maskClosable={false}
        onOk={() => {
          setPermModalOpen(false);
          navigate(-1);
        }}
        onCancel={() => {
          setPermModalOpen(false);
          navigate(-1);
        }}
      >
        <div className="text-[#3B3D2C]">{t("live_permission_desc")}</div>
      </Modal>

      <Modal
        open={streamInfoErrorModalOpen}
        centered
        title={t("live_stream_info_error_title")}
        okText={t("common_confirm")}
        cancelButtonProps={{ style: { display: "none" } }}
        maskClosable={false}
        onOk={() => {
          navigate(-1);
        }}
      >
        <div className="text-[#3B3D2C]">{t("live_stream_info_error_desc")}</div>
      </Modal>
    </div>
  );
};

export default LivePage;
