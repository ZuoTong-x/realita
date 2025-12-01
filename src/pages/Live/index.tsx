import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import type { Character } from "@/types/Character";

import img_34624891 from "@/assets/images/Rectangle 34624891.png";
import { CallingStatus, Ratio } from "@/types/Live";
import { getWindowSize, getUserWindowSize } from "@/utils/live_util";
import CommonButton from "@/components/Common/Button";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioOn.svg?react";
import IconVideoOff from "@/assets/svg/IconVideoOff.svg?react";
import IconVideoOn from "@/assets/svg/IconVideoOn.svg?react";
import IconCalling from "@/assets/svg/IconCalling.svg?react";
import IconCallMissed from "@/assets/svg/IconCallMissed.svg?react";
import IconCamera from "@/assets/svg/IconCamera.svg?react";
import useCamera from "@/hooks/useCamera";

import { useTranslation } from "react-i18next";

const LivePage = () => {
  const [searchParams] = useSearchParams();
  const characterId = searchParams.get("characterId");
  const { t } = useTranslation();
  //角色信息
  const [character, setCharacter] = useState<Character | null>(null);
  //背景图片
  const [bgImg, setBgImg] = useState<string | null>(null);
  //页面加载
  const [isLoading, setIsLoading] = useState<boolean>(false);
  //比例信息
  const [ratio] = useState<Ratio>(Ratio.PORTRAIT);
  // 是否静音
  const [muted, setMuted] = useState<boolean>(false);

  // 通话状态
  const [callingStatus, setCallingStatus] = useState<CallingStatus>(
    CallingStatus.PENDING
  );
  // 用户摄像头
  const {
    videoRef: userVideoRef,
    stream: userStream,
    granted: cameraGranted,
    startCamera,
    stopCamera,
    toggleCamera,
  } = useCamera({ video: true, audio: false, autoPlay: true });

  // Global page mute: toggle all media elements
  useEffect(() => {
    const medias = Array.from(
      document.querySelectorAll<HTMLMediaElement>("video, audio")
    );
    medias.forEach((m) => {
      m.muted = muted;
      if (!muted) {
        m.play().catch(() => {});
      }
    });
  }, [muted]);

  useEffect(() => {
    if (characterId) {
      setIsLoading(true);
      //  const character = await getCharacter(characterId);
      // character example:

      setCharacter(character);
      setBgImg(img_34624891);
      setIsLoading(false);
      setCallingStatus(CallingStatus.PENDING);
    }
  }, [characterId]);
  const characterRef = useRef<HTMLDivElement | null>(null);
  const [userPos, setUserPos] = useState<{ left: number; top: number } | null>(
    null
  );
  const [dragState, setDragState] = useState<null | {
    startX: number;
    startY: number;
    baseLeft: number;
    baseTop: number;
  }>(null);

  // Compute initial user window position: to the left of character window, vertically centered
  useEffect(() => {
    const computeInitial = () => {
      const charEl = characterRef.current;
      if (!charEl) return;
      const rect = charEl.getBoundingClientRect();
      const { width: uw, height: uh } = getUserWindowSize(ratio);
      const gap = 16;
      let left = rect.left - uw - gap;
      let top = rect.top + (rect.height - uh) / 2;

      const maxLeft = window.innerWidth - uw - 8;
      const maxTop = window.innerHeight - uh - 8;
      left = Math.min(Math.max(8, left), Math.max(8, maxLeft));
      top = Math.min(Math.max(8, top), Math.max(8, maxTop));
      setUserPos({ left: Math.round(left), top: Math.round(top) });
    };
    // Run after layout
    const id = window.requestAnimationFrame(computeInitial);
    return () => window.cancelAnimationFrame(id);
  }, [ratio, bgImg, callingStatus]);

  const onUserMouseDown = (e: React.MouseEvent) => {
    if (!userPos) return;
    setDragState({
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: userPos.left,
      baseTop: userPos.top,
    });
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState) return;
      const { width: uw, height: uh } = getUserWindowSize(ratio);
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      let left = dragState.baseLeft + dx;
      let top = dragState.baseTop + dy;
      const maxLeft = window.innerWidth - uw - 8;
      const maxTop = window.innerHeight - uh - 8;
      left = Math.min(Math.max(8, left), Math.max(8, maxLeft));
      top = Math.min(Math.max(8, top), Math.max(8, maxTop));
      setUserPos({ left, top });
    };
    const onUp = () => setDragState(null);
    if (dragState) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp, { once: true });
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragState, ratio]);

  const getCharacterWindow = useCallback(() => {
    return (
      <div
        ref={characterRef}
        className="rounded-2xl relative"
        style={getWindowSize(ratio)}
      >
        {callingStatus === CallingStatus.PENDING ? (
          <div
            className="relative w-full h-full bg-no-repeat bg-center bg-cover rounded-2xl overflow-hidden"
            style={{ backgroundImage: `url(${bgImg})` }}
          >
            {/* 蒙版 */}
            <div className="absolute inset-0 bg-[#3e4244]/50 scale-105 blur-[10px] backdrop-blur-[10px]" />
            {/* 内容 */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3">
              <img
                src={img_34624891}
                alt=""
                className="w-[150px] aspect-square object-cover rounded-2xl"
              />
              <div className="text-white/80 text-sm">padding.....</div>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full bg-black/20 bg-no-repeat bg-center bg-cover blur-[50px] scale-110 transform-gpu border-[2px] border-solid border-white rounded-2xl"
            style={{ backgroundImage: `url(${bgImg})` }}
          />
        )}

        {/* 底部按钮组（始终显示） */}
        <div className="absolute bottom-10 left-0 w-full flex items-center justify-center gap-6 z-20">
          <CommonButton
            size="large"
            className="h-20 px-0"
            borderRadiusPx={54}
            onClick={() => {
              if (cameraGranted) stopCamera();
              else startCamera();
            }}
          >
            <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-4">
              {cameraGranted ? (
                <IconVideoOn className="w-12 h-12" />
              ) : (
                <IconVideoOff className="w-12 h-12" />
              )}
            </span>
          </CommonButton>
          <CommonButton size="large" className="h-24 px-0" borderRadiusPx={54}>
            <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-5">
              {callingStatus === CallingStatus.CALLING ? (
                <IconCalling className="w-13 h-13 text-[#26babb]" />
              ) : (
                <IconCallMissed className="w-13 h-13 text-[#DB7A7A]" />
              )}
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
      </div>
    );
  }, [ratio, bgImg, callingStatus, cameraGranted, muted]);
  const getUserWindow = useCallback(() => {
    const size = getUserWindowSize(ratio);
    return (
      <div
        className="border-[2px] border-solid border-white rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm"
        style={size}
        onClick={() => {
          if (!cameraGranted) startCamera();
        }}
      >
        {cameraGranted && userStream ? (
          <video
            ref={userVideoRef}
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
    );
  }, [ratio, cameraGranted, userStream]);
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center">
      {/* Background layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-r from-[#26babb]/20 to-[#f3e8cb]" />
        ) : (
          <div
            className="w-full h-full bg-black/20 bg-no-repeat bg-center bg-cover blur-[50px] scale-110 transform-gpu"
            style={{ backgroundImage: `url(${bgImg})` }}
          />
        )}
      </div>

      {getCharacterWindow()}

      {/* Draggable user window */}
      {userPos && (
        <div
          className="absolute cursor-move z-30"
          style={{ left: userPos.left, top: userPos.top }}
          onMouseDown={onUserMouseDown}
        >
          {getUserWindow()}
        </div>
      )}
    </div>
  );
};

export default LivePage;
