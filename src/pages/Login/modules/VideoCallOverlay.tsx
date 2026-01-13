// Video call overlay component
import LoginBGVideo from "@/assets/videos/LoginBG.mp4";
import IconCamera from "@/assets/svg/IconCamera.svg?react";
import CommonButton from "@/components/Common/Button";
import IconVideoOn from "@/assets/svg/IconVideoOn.svg?react";
import IconVideoOff from "@/assets/svg/IconVideoOff.svg?react";
import IconCallMissed from "@/assets/svg/IconCallMissed.svg?react";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioON.svg?react";
import { useTranslation } from "react-i18next";

const VIDEO_WIDTH = 400;
const USER_VIDEO_WIDTH = 120;
type VideoCallOverlayProps = {
  muted: boolean;
  userStream: MediaStream | null;
  cameraGranted: boolean;
  userVideoRef: React.RefObject<HTMLVideoElement | null>;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onStartCamera: () => void;
};

const VideoCallOverlay = ({
  muted,
  userStream,
  cameraGranted,
  userVideoRef,
  onToggleCamera,
  onToggleMute,
  onStartCamera,
}: VideoCallOverlayProps) => {
  const { t } = useTranslation();
  return (
    <div
      className="absolute top-20 right-[8rem] z-20"
      style={{ transform: "rotate(15deg)" }}
    >
      <div
        className="relative"
        style={{ width: `${VIDEO_WIDTH}px`, aspectRatio: "9 / 16" }}
      >
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          src={LoginBGVideo}
          autoPlay
          loop
          muted={muted}
          playsInline
        />

        {/* Floating camera window */}
        <div className="absolute -top-5 -right-5 flex flex-col gap-2">
          <div
            className="relative"
            style={{
              width: `${USER_VIDEO_WIDTH}px`,
              aspectRatio: "9 / 16",
            }}
          >
            {userStream ? (
              <video
                ref={userVideoRef}
                className="w-full h-full object-cover rounded-md"
                autoPlay
                playsInline
              />
            ) : (
              <button
                onClick={onStartCamera}
                className="w-full h-full rounded-md bg-black text-white flex flex-col items-center justify-center hover:bg-black/80 transition-colors"
              >
                <IconCamera className="w-8 h-8 mb-2 opacity-80" />
                <span className="text-xs opacity-90">
                  {t("common.open_camera")}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom button group */}
      <div className="absolute -bottom-10 left-0 w-full flex items-center justify-center gap-6 z-20">
        <CommonButton
          className="h-16 px-0 bg-white/60 hover:scale-105 transition-all duration-300"
          borderRadiusPx={54}
          onClick={onToggleCamera}
        >
          <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-4">
            {cameraGranted ? (
              <IconVideoOn className="w-8 h-8" />
            ) : (
              <IconVideoOff className="w-8 h-8" />
            )}
          </span>
        </CommonButton>

        <CommonButton
          size="large"
          className="h-24 px-0 hover:scale-105 transition-all duration-300"
          borderRadiusPx={54}
        >
          <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-5">
            <IconCallMissed className="w-13 h-13 text-[#DB7A7A]" />
          </span>
        </CommonButton>

        <CommonButton
          size="large"
          className="h-16 px-0 bg-white/60 hover:scale-105 transition-all duration-300"
          borderRadiusPx={54}
          onClick={onToggleMute}
          aria-label={muted ? "unmute-page" : "mute-page"}
        >
          <span className="text-xl font-medium text-[#585858] flex items-center gap-4 justify-center px-4">
            {muted ? (
              <IconAudioOff className="w-8 h-8" />
            ) : (
              <IconAudioOn className="w-8 h-8" />
            )}
          </span>
        </CommonButton>
      </div>
    </div>
  );
};

export default VideoCallOverlay;
