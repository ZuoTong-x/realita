import { useEffect, useState, useRef, useCallback } from "react";

import CommonButton from "@/components/Common/Button";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioON.svg?react";
import IconVideoOff from "@/assets/svg/IconVideoOff.svg?react";
import IconVideoOn from "@/assets/svg/IconVideoOn.svg?react";

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
import { App, Modal } from "antd";
import { useRequest } from "ahooks";
import { useNavigate } from "react-router-dom";

const LivePage = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const bgImg = localStorage.getItem("bgImg");

  // 是否静音
  const [muted, setMuted] = useState<boolean>(false);
  // 控制摄像头窗口与底部按钮组显示
  const [uiVisible, setUiVisible] = useState<boolean>(true);

  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [permModalOpen, setPermModalOpen] = useState<boolean>(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [streamInfoErrorModalOpen, setStreamInfoErrorModalOpen] =
    useState<boolean>(false);
  const localPreviewRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // 视频盒子大小（取宽高中较小值的80%）
  const [videoBoxSize, setVideoBoxSize] = useState<number>(0);

  const {
    start: startLive,
    stop: stopLive,
    status: liveStatus,
  } = useWebRTCWhipWhep({
    preview: localPreviewRef.current,
    audioOnly: !videoEnabled,
    remoteVideoRef: remoteVideoRef.current,
    onSuccess: async () => {
      await recordStreamStartTime(streamInfo!.stream_id);
      run();
      cancelGetStreamInfo();
    },
  });
  const getStreamInfo = useCallback(async () => {
    const streamInfo = await getAvailableStreams();
    if (streamInfo.code === 200 && streamInfo.data) {
      setStreamInfo(streamInfo.data);
      if (
        streamInfo.data.status === "ready" &&
        streamInfo.data.whip_url &&
        streamInfo.data.whep_url
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
          await startLive(streamInfo.data.whip_url, streamInfo.data.whep_url);
        } catch {
          setPermModalOpen(true);
        }
      }
    } else {
      setStreamInfoErrorModalOpen(true);
      cancelGetStreamInfo();
    }
  }, []);

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
        await stopStream(streamInfo!.stream_id);
        cancel();
      } finally {
        // 关闭本地预览
        const s = localPreviewRef.current?.srcObject as MediaStream | null;
        s?.getTracks().forEach((t) => t.stop());
        if (localPreviewRef.current) localPreviewRef.current.srcObject = null;
      }
    }
  };
  const sendStreamHeartbeatRequest = useCallback(async () => {
    if (!streamInfo) return;
    await sendStreamHeartbeat(streamInfo?.stream_id);
  }, [streamInfo]);

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

  const { run, cancel } = useRequest(sendStreamHeartbeatRequest, {
    pollingInterval: 3000,
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
          {liveStatus !== "connected" ? (
            // 未连接状态：灰色蒙版 + 小正方形图片
            <div className="w-full h-full bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center">
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
            </div>
          ) : (
            // 连接状态：显示拉流视频
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted={muted}
              controls={false}
            />
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
          } catch (e) {
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
