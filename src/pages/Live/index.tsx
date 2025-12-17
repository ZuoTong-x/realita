import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

import CommonButton from "@/components/Common/Button";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioOn.svg?react";
import IconVideoOff from "@/assets/svg/IconVideoOff.svg?react";
import IconVideoOn from "@/assets/svg/IconVideoOn.svg?react";
import IconCalling from "@/assets/svg/IconCalling.svg?react";
import IconCallMissed from "@/assets/svg/IconCallMissed.svg?react";
import IconCamera from "@/assets/svg/IconCamera.svg?react";
import { useWebRTCWhipWhep } from "@/hooks/useLiveWebRTC";
import useDraggable from "@/hooks/useDraggable";

import { useTranslation } from "react-i18next";

import { App, Modal } from "antd";
const LivePage = () => {
  const { message } = App.useApp();

  const [searchParams] = useSearchParams();

  const whipUrl = localStorage.getItem("whipUrl");
  const whepUrl = localStorage.getItem("whepUrl");
  const lightx2vTaskId = localStorage.getItem("lightx2vTaskId");
  const bgImg = localStorage.getItem("bgImg");

  const stream = searchParams.get("stream");

  const { t, i18n } = useTranslation();

  // 是否静音
  const [muted, setMuted] = useState<boolean>(false);
  // 控制摄像头窗口与底部按钮组显示
  const [uiVisible, setUiVisible] = useState<boolean>(true);
  // 双击/双指触控检测
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(
    null
  );

  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [permModalOpen, setPermModalOpen] = useState<boolean>(false);

  const localPreviewRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const {
    start: startLive,
    stop: stopLive,
    status: liveStatus,
  } = useWebRTCWhipWhep({
    whipUrl,
    whepUrl,
    preview: localPreviewRef.current,
    audioOnly: !videoEnabled,
    remoteVideoRef: remoteVideoRef.current,
  });

  // 页面不再自动发起通话；仅在参数缺失时提示
  useEffect(() => {
    if (!whipUrl || !whepUrl || !lightx2vTaskId || !stream) {
      message.error(i18n.t("live.lack_of_key_data"));
    }
  }, [whipUrl, whepUrl, lightx2vTaskId, stream, i18n, message]);

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

  const handleCall = async () => {
    if (liveStatus === "connected") {
      try {
        await stopLive();
      } finally {
        // 关闭本地预览
        const s = localPreviewRef.current?.srcObject as MediaStream | null;
        s?.getTracks().forEach((t) => t.stop());
        if (localPreviewRef.current) localPreviewRef.current.srcObject = null;
      }
    } else {
      try {
        // 用户手势下请求权限并启动本地预览
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
        await startLive();
      } catch {
        setPermModalOpen(true);
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

  return (
    <div
      className="relative w-full min-h-screen flex items-center justify-center"
      style={{ touchAction: "manipulation" }}
      onDoubleClick={(e) => {
        e.preventDefault();
        setUiVisible((prev) => !prev);
      }}
      onTouchEnd={(e) => {
        const touch = e.changedTouches && e.changedTouches[0];
        if (!touch) return;
        const now = Date.now();
        const last = lastTapRef.current;
        const isFast = last && now - last.time < 300;
        const dx = last ? Math.abs(touch.clientX - last.x) : 0;
        const dy = last ? Math.abs(touch.clientY - last.y) : 0;
        const isNear = dx < 30 && dy < 30;
        if (isFast && isNear) {
          setUiVisible((prev) => !prev);
          lastTapRef.current = null;
        } else {
          lastTapRef.current = {
            time: now,
            x: touch.clientX,
            y: touch.clientY,
          };
        }
      }}
    >
      {/* Background layer */}
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
        className="rounded-2xl relative w-screen h-screen"
      >
        <div className="w-full h-full relative border-[2px] border-solid border-white rounded-2xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            autoPlay
            muted={muted}
            controls={false}
          />
          {liveStatus !== "connected" && (
            <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-white/80">
              {liveStatus === "idle" && t("live.idle")}
              {liveStatus === "connecting" && t("live.connecting")}
              {/* {liveStatus === "connected" && t("live.calling")} */}
              {liveStatus === "error" && t("live.call_failed")}
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
            <CommonButton
              size="large"
              className="h-24 px-0"
              borderRadiusPx={54}
              onClick={handleCall}
            >
              <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-5">
                {/* {liveStatus === "connected" ? (
                 
                ) : (
                 
                )} */}
                {liveStatus === "idle" && (
                  <IconCalling className="w-13 h-13 text-[#26babb]" />
                )}
                {liveStatus === "connecting" && "连接中"}
                {liveStatus === "connected" && (
                  <IconCallMissed className="w-13 h-13 text-[#DB7A7A]" />
                )}
                {liveStatus === "error" && "连接失败"}
              </span>
            </CommonButton>
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

      {/* Draggable user window */}
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
                  {t("common.open_camera")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={permModalOpen}
        centered
        title={t("live.permission_title")}
        okText={t("common.confirm")}
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

            await startLive();
            setPermModalOpen(false);
          } catch (e) {
            message.error(t("live.permission_denied"));
          }
        }}
        onCancel={() => setPermModalOpen(false)}
      >
        <div className="text-[#3B3D2C]">{t("live.permission_desc")}</div>
      </Modal>
    </div>
  );
};

export default LivePage;
