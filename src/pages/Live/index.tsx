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
  // 控制摄像头窗口与底部按钮组显示
  const [uiVisible, setUiVisible] = useState<boolean>(true);

  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [permModalOpen, setPermModalOpen] = useState<boolean>(false);

  const [streamInfoErrorModalOpen, setStreamInfoErrorModalOpen] =
    useState<boolean>(false);
  const localPreviewRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamInfo = useRef<StreamInfo | null>(null);
  // 视频盒子大小（取宽高中较小值的80%）
  const [videoBoxSize, setVideoBoxSize] = useState<number>(0);

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
          if (localPreviewRef.current) {
            localPreviewRef.current.srcObject = local;

            await localPreviewRef.current.play().catch(() => {});
          }
          // 发起通话（WHIP/WHEP）
          await startLive(res.data.whip_url, res.data.whep_url);
        } catch {
          setPermModalOpen(true);
        }
      }
    } else {
      setStreamInfoErrorModalOpen(true);
      cancelGetStreamInfo();
    }
  }, [videoEnabled, startLive]);

  const handleStartLiveSuccess = async () => {
    await recordStreamStartTime(streamInfo.current!.stream_id);
    run();
    cancelGetStreamInfo();
  };

  const characterRef = useRef<HTMLDivElement | null>(null);
  const {
    dragRef: userDragRef,
    position: userPos,
    setPosition: setUserPos,
  } = useDraggable({
    elementWidth: 200,
    elementHeight: 200,
    margin: 8,
  });

  useEffect(() => {
    const computeInitial = () => {
      const elementSize = 200;
      const left = 100;
      const top = window.innerHeight - elementSize - 100;
      setUserPos({ left, top });
    };
    const id = window.requestAnimationFrame(computeInitial);
    return () => window.cancelAnimationFrame(id);
  }, []);

  // 计算视频盒子大小
  useEffect(() => {
    const calculateVideoBoxSize = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      setVideoBoxSize(minDimension * 0.8);
    };

    calculateVideoBoxSize();
    window.addEventListener("resize", calculateVideoBoxSize);
    return () => window.removeEventListener("resize", calculateVideoBoxSize);
  }, []);

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
    const res = await sendStreamHeartbeat(streamInfo.current.stream_id);
    if (res.code !== 200) {
      stopLive();
      stopStream(streamInfo.current.stream_id);
      cancel();
      cancelGetStreamInfo();
      setStreamInfoErrorModalOpen(true);
    } else {
      if (res.data) {
        // 获取最新的用户信息，避免使用闭包中的旧值
        const currentUserInfo = useUserStore.getState().userInfo;
        if (!currentUserInfo || currentUserInfo.credits - res.data < 0) {
          message.error(t("live_no_credits"));
          stopLive();
          stopStream(streamInfo.current.stream_id);
          cancel();
          cancelGetStreamInfo();
          setStreamInfoErrorModalOpen(true);
          return;
        }
        updateCredits(currentUserInfo.credits - res.data);
      }
    }
  };

  useEffect(() => {
    const onDblClick = () => setUiVisible((prev) => !prev);
    window.addEventListener("dblclick", onDblClick, { passive: true });
    return () => window.removeEventListener("dblclick", onDblClick);
  }, []);

  // 同步 muted 状态到远端视频（确保音频控制正确）
  useEffect(() => {
    if (remoteVideoRef.current && liveStatus === "connected") {
      remoteVideoRef.current.muted = muted;
    }
  }, [muted, liveStatus]);

  // 监听 videoEnabled 变化，更新本地媒体流
  useEffect(() => {
    const updateLocalStream = async () => {
      // 只在本地预览已存在时才更新
      if (!localPreviewRef.current?.srcObject) return;

      try {
        // 获取当前流
        const oldStream = localPreviewRef.current.srcObject as MediaStream;
        const oldVideoTracks = oldStream?.getVideoTracks() || [];

        // 获取新的媒体流
        const constraints: MediaStreamConstraints = {
          video: videoEnabled,
          audio: true,
        };
        const newStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        const newVideoTracks = newStream.getVideoTracks();
        const newAudioTracks = newStream.getAudioTracks();

        // 如果有推流连接，替换视频轨道
        if (liveStatus === "connected" && whipPcRef?.current) {
          const senders = whipPcRef.current.getSenders();
          for (const sender of senders) {
            if (sender.track?.kind === "video") {
              // 用新的视频轨道替换（可能是 null 如果 videoEnabled 为 false）
              await sender.replaceTrack(newVideoTracks[0] || null);
            }
          }
        }

        // 停止旧的视频轨道
        oldVideoTracks.forEach((track) => track.stop());

        // 更新本地预览流
        if (localPreviewRef.current) {
          // 创建新的流，保留音频轨道，使用新的视频轨道
          const updatedStream = new MediaStream();
          newAudioTracks.forEach((track) => updatedStream.addTrack(track));
          newVideoTracks.forEach((track) => updatedStream.addTrack(track));

          localPreviewRef.current.srcObject = updatedStream;
          await localPreviewRef.current.play().catch(() => {});
        }
      } catch (error) {
        console.error("更新本地媒体流失败:", error);
        message.error(t("live_permission_denied"));
      }
    };

    // 只在连接状态下且本地预览存在时更新
    if (liveStatus === "connected" && localPreviewRef.current?.srcObject) {
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
    <div
      className="relative w-full min-h-screen flex items-center justify-center"
      style={{ touchAction: "manipulation" }}
      onDoubleClick={(e) => {
        e.preventDefault();
        setUiVisible((prev) => !prev);
      }}
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
            width: videoBoxSize,
            height: videoBoxSize,
          }}
        >
          {/* 拉流视频 - 一直存在 */}
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted={muted}
            controls={false}
          />

          {/* 未连接状态：灰色蒙版 + 小正方形图片 */}
          {liveStatus !== "connected" && (
            <div className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              {bgImg && (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    width: videoBoxSize * 0.3,
                    height: videoBoxSize * 0.3,
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
        {uiVisible && (
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
        )}
      </div>

      {userPos && uiVisible && (
        <div
          className="absolute cursor-move z-30"
          style={{ left: userPos.left, top: userPos.top, touchAction: "none" }}
          ref={userDragRef as React.RefObject<HTMLDivElement>}
        >
          <div
            className="border-[2px] border-solid border-white rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm"
            style={{ width: 200, height: 200 }}
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
            // if (streamInfo && streamInfo.whip_url && streamInfo.whep_url) {
            //   await startLive(streamInfo.whip_url, streamInfo.whep_url);
            // }
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
