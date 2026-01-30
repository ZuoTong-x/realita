import { useEffect, useState, useRef, useCallback } from "react";

import CommonButton from "@/components/Common/Button";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioON.svg?react";
import IconVideoOff from "@/assets/svg/IconVideoOff.svg?react";
import IconVideoOn from "@/assets/svg/IconVideoOn.svg?react";
// import IconLoading from "@/assets/svg/IconLoading.svg?react";
import IconCallMissed from "@/assets/svg/IconCallMissed.svg?react";
import IconCamera from "@/assets/svg/IconCamera.svg?react";
import { useWebRTCWhipWhep } from "@/hooks/useLiveWebRTC";
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
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">(
    "1:1"
  );

  const {
    start: startLive,
    stop: stopLive,
    status: liveStatus,
    whipPcRef,
  } = useWebRTCWhipWhep({
    preview: localPreviewRef,
    audioOnly: !videoEnabled,
    remoteVideoRef: remoteVideoRef,
    onSuccess: () => handleStartLiveSuccess(),
  });
  const getStreamInfo = useCallback(async () => {
    const res = await getAvailableStreams();
    if (res.code === 200 && res.data) {
      streamInfo.current = res.data;
      setProgress(Number(res.data.progress) * 100);
      if (
        res.data.status === "ready" &&
        res.data.whip_url &&
        res.data.whep_url
      ) {
        try {
          const constraints: MediaStreamConstraints = {
            video: videoEnabled,
            audio: true,
          };
          const local = await navigator.mediaDevices.getUserMedia(constraints);

          // 🔧 验证获取到的媒体流
          const audioTracks = local.getAudioTracks();
          const videoTracks = local.getVideoTracks();
          console.log(
            `[Live] 获取到本地流: ${audioTracks.length} 个音频轨道, ${videoTracks.length} 个视频轨道`
          );

          if (audioTracks.length === 0) {
            console.error("[Live] 错误：没有获取到音频轨道！");
          }

          if (localPreviewRef.current) {
            localPreviewRef.current.srcObject = local;

            await localPreviewRef.current.play().catch(() => {});
          }
          // 发起通话（WHIP/WHEP）
          await startLive(res.data.whip_url, res.data.whep_url);
        } catch (err) {
          console.error("[Live] 获取媒体流失败:", err);
          setPermModalOpen(true);
        }
      }
    } else {
      setStreamInfoErrorModalOpen(true);
      cancelGetStreamInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoEnabled, startLive]);

  const handleStartLiveSuccess = async () => {
    await recordStreamStartTime(streamInfo.current!.stream_id);
    // 记录进入通话时的初始积分
    const currentUserInfo = useUserStore.getState().userInfo;
    if (currentUserInfo) {
      initialCreditsRef.current = currentUserInfo.credits;
    }
    run();
    cancelGetStreamInfo();
  };

  // 根据图片宽高比选择视频输出尺寸
  const getAspectRatio = (
    width: number,
    height: number
  ): "1:1" | "16:9" | "9:16" => {
    if (height <= 0) {
      return "1:1";
    }
    const r = width / height;
    if (r <= 25 / 32) {
      return "9:16";
    }
    if (r >= 25 / 18) {
      return "16:9";
    }
    return "1:1";
  };

  // 计算本地预览窗口的尺寸
  const getPreviewSize = () => {
    const baseSize = 200;
    if (aspectRatio === "1:1") {
      return { width: baseSize, height: baseSize };
    } else if (aspectRatio === "16:9") {
      return { width: baseSize, height: baseSize * (9 / 16) };
    } else {
      // 9:16
      return { width: baseSize * (9 / 16), height: baseSize };
    }
  };

  const previewSize = getPreviewSize();

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

  useEffect(() => {
    const computeInitial = () => {
      const left = 100;
      const top = window.innerHeight - previewSize.height - 100;
      setUserPos({ left, top });
    };
    const id = window.requestAnimationFrame(computeInitial);
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSize]);

  // 计算视频盒子大小（根据图片比例）
  useEffect(() => {
    const calculateVideoBoxSize = async () => {
      if (!bgImg) {
        // 如果没有背景图，默认使用 1:1
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        const size = minDimension * 0.8;
        setVideoBoxSize({ width: size, height: size });
        setAspectRatio("1:1");
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
      setAspectRatio(ratio);

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
      try {
        await stopLive();
        await stopStream(streamInfo.current!.stream_id);
        cancel();
        navigate(-1);
      } finally {
        // 关闭本地预览
        const s = localPreviewRef.current?.srcObject as MediaStream | null;
        s?.getTracks().forEach((t) => t.stop());
        if (localPreviewRef.current) localPreviewRef.current.srcObject = null;
      }
    }
  };
  const sendStreamHeartbeatRequest = async () => {
    if (!streamInfo.current) return;
    const remainingCredits = initialCreditsRef.current - useCreditsRef.current;
    // 更新积分显示
    updateCredits(remainingCredits);
    const res = await sendStreamHeartbeat(streamInfo.current.stream_id);
    if (res.code !== 200) {
      await stopLive();
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
          await stopLive();
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

  // 同步 muted 状态到远端视频（确保音频控制正确）
  useEffect(() => {
    if (remoteVideoRef.current && liveStatus === "connected") {
      remoteVideoRef.current.muted = muted;
    }
  }, [muted, liveStatus]);

  // 监听 videoEnabled 变化，更新本地媒体流
  useEffect(() => {
    const updateLocalStream = async () => {
      // 仅校验视频元素是否存在，删除所有srcObject相关前置判断
      if (!localPreviewRef.current) {
        console.error("本地预览视频元素未找到");
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: videoEnabled,
          audio: true,
        };
        const newStream =
          await navigator.mediaDevices.getUserMedia(constraints);

        // 🔧 修复：同时获取音频和视频轨道
        const newVideoTracks = newStream.getVideoTracks();
        const newAudioTracks = newStream.getAudioTracks();

        const oldStream = localPreviewRef.current
          .srcObject as MediaStream | null;
        if (oldStream) {
          oldStream.getTracks().forEach((track) => {
            if (track.readyState !== "ended") track.stop();
          });

          localPreviewRef.current.srcObject = null;
        }

        // 🔧 修复：替换音频和视频轨道到 PeerConnection
        if (liveStatus === "connected" && whipPcRef?.current) {
          const senders = whipPcRef.current.getSenders();
          for (const sender of senders) {
            if (sender.track?.kind === "video") {
              // 替换视频轨道（如果 videoEnabled=false，则传 null 关闭视频）
              await sender.replaceTrack(newVideoTracks[0] || null);
            } else if (sender.track?.kind === "audio") {
              // 🔧 关键修复：替换音频轨道，确保音频持续发送
              if (newAudioTracks[0]) {
                await sender.replaceTrack(newAudioTracks[0]);
              }
            }
          }
        }

        localPreviewRef.current.srcObject = newStream;
        await localPreviewRef.current.play();
      } catch {
        message.error(t("live_permission_denied"));
      }
    };

    // 🔧 修复：无论 videoEnabled 是 true 还是 false，都要更新（因为可能需要更新音频）
    if (liveStatus === "connected") {
      updateLocalStream();
    }
  }, [videoEnabled, liveStatus, message, t, whipPcRef]);

  const { run, cancel } = useRequest(sendStreamHeartbeatRequest, {
    pollingInterval: 1000,
    pollingErrorRetryCount: 3,
    manual: true,
  });
  const { cancel: cancelGetStreamInfo } = useRequest(getStreamInfo, {
    pollingInterval: 3000,
    pollingErrorRetryCount: 3,
  });

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center">
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
          className="absolute cursor-move z-30"
          style={{ left: userPos.left, top: userPos.top, touchAction: "none" }}
          ref={userDragRef as React.RefObject<HTMLDivElement>}
        >
          <div
            className="border-[2px] border-solid border-white rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm"
            style={{ width: previewSize.width, height: previewSize.height }}
          >
            {videoEnabled ? (
              <video
                ref={localPreviewRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer select-none bg-black">
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
        onOk={async () => {
          try {
            // 明确请求权限（用户点击确认后触发）
            const constraints: MediaStreamConstraints = {
              video: videoEnabled,
              audio: true,
            };
            await navigator.mediaDevices.getUserMedia(constraints);
            setPermModalOpen(false);
          } catch {
            message.error(t("live_permission_denied"));
          }
        }}
        onCancel={() => setPermModalOpen(false)}
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
