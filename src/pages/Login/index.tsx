import { useEffect, useRef, useState } from "react";
import LoginForm from "./modules/LoginForm";
import "./index.css";

import LoginBGVideo from "@/assets/videos/LoginBG.mp4";
import IconCamera from "@/assets/svg/IconCamera.svg?react";
import useCamera from "@/hooks/useCamera";
import { getShowcaseExampleList } from "@/api";
import type { ShowcaseExample } from "@/types";
import CommonButton from "@/components/Common/Button";
import IconVideoOn from "@/assets/svg/IconVideoOn.svg?react";
import IconVideoOff from "@/assets/svg/IconVideoOff.svg?react";

import IconCallMissed from "@/assets/svg/IconCallMissed.svg?react";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioOn.svg?react";

const imgPrefix = import.meta.env.VITE_API_BASE.replace("/api/v1", "");
const LoginPage = () => {
  const [muted, setMuted] = useState(true);
  // 用户摄像头
  const {
    videoRef: userVideoRef,
    stream: userStream,
    granted: cameraGranted,
    startCamera,
    stopCamera,
  } = useCamera({
    video: { facingMode: "user" },
    audio: false,
    autoPlay: true,
  });

  // 拉取展示数据并拆成三列
  const [exampleList, setExampleList] = useState<ShowcaseExample[][]>([
    [],
    [],
    [],
  ]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getShowcaseExampleList();
        const data = (res?.data ?? []) as ShowcaseExample[];
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        // 三列：均匀分配
        const cols: ShowcaseExample[][] = [[], [], []];
        shuffled.forEach((item, idx) => {
          cols[idx % 3].push(item);
        });
        setExampleList(cols);
      } catch {
        setExampleList([[], [], []]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="relative w-full min-h-screen flex login-container animate-bg-position animate-bg">
      {/* Left: login area with bg layers */}
      <section className="relative w-[648px] z-20 h-screen flex items-center justify-center px-10 bg-transparent">
        <LoginForm />
      </section>

      {/* Right: gallery with rotating columns and video overlay */}
      <section className="relative flex-1 overflow-visible p-5 pt-24 bg-transparent">
        <div
          className="relative flex justify-center items-start z-10"
          style={{
            transform: "translateX(-550px) translateY(-200px) rotate(15deg)",
          }}
        >
          <div className="flex gap-6 w-full justify-center ">
            {exampleList.map((col, colIdx) => (
              <div
                key={colIdx}
                className="relative overflow-hidden"
                style={{ height: "300vh", width: "120px" }}
              >
                <div
                  className={`${
                    colIdx === 1 ? "login-scroll-up" : "login-scroll-down"
                  }`}
                  style={{
                    animationDelay:
                      colIdx === 0 ? "0ms" : colIdx === 1 ? "200ms" : "400ms",
                  }}
                >
                  {/* two stacks for seamless loop */}
                  {[0, 1].map((stackKey) => (
                    <div key={stackKey} className="flex flex-col gap-1">
                      {col.map((item, i) => {
                        const img = item.image_url ?? item.video_url ?? "";
                        return (
                          <div
                            key={`${stackKey}-${i}`}
                            className="relative w-[120px] cursor-pointer hover:scale-105 transition-all duration-300"
                            style={{ aspectRatio: "9 / 16" }}
                          >
                            <img
                              src={imgPrefix + img}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video call overlay */}
        <div
          className="absolute top-20 right-[8rem] z-20"
          style={{
            transform: "rotate(15deg)",
          }}
        >
          <div className="relative w-[400px]" style={{ aspectRatio: "9 / 16" }}>
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              src={LoginBGVideo}
              autoPlay
              loop
              muted={muted}
              playsInline
            />

            {/* floating camera window */}
            <div className="absolute -top-5 -right-5 flex flex-col gap-2">
              <div
                className="relative w-[120px]"
                style={{ aspectRatio: "9 / 16" }}
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
                    onClick={startCamera}
                    className="w-full h-full rounded-md bg-black text-white flex flex-col items-center justify-center"
                  >
                    <IconCamera className="w-8 h-8 mb-2 opacity-80" />
                    <span className="text-xs opacity-90">点击开启摄像头</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* 底部按钮组（始终显示） */}
          <div className="absolute -bottom-10 left-0 w-full flex items-center justify-center gap-6 z-20">
            <CommonButton
              className="h-16 px-0 bg-white/60 hover:scale-105 transition-all duration-300"
              borderRadiusPx={54}
              onClick={() => {
                if (cameraGranted) stopCamera();
                else startCamera();
              }}
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
              onClick={() => setMuted((prev) => !prev)}
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
      </section>
    </div>
  );
};

export default LoginPage;
