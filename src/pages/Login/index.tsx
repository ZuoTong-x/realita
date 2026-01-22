import { useEffect, useState, useCallback } from "react";
import LoginForm from "./modules/LoginForm";
import "./index.css";

import useCamera from "@/hooks/useCamera";
import { getShowcaseExampleList } from "@/api";
import type { Examples } from "@/types/Login";

import VideoCallOverlay from "./modules/VideoCallOverlay";
import GalleryColumn from "./modules/GalleryColumn";

const NUM_COLUMNS = 3;

const LoginPage = () => {
  const [muted, setMuted] = useState(true);
  const [exampleList, setExampleList] = useState<Examples[][]>([[], [], []]);

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
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getShowcaseExampleList();
        const data = (res?.data ?? []) as Examples[];
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        // 三列：均匀分配
        const cols: Examples[][] = [[], [], []];
        shuffled.forEach((item, idx) => {
          cols[idx % NUM_COLUMNS].push(item);
        });
        setExampleList(cols);
      } catch {
        setExampleList([[], [], []]);
      }
    };
    fetchData();
  }, []);

  // Event handlers
  const handleToggleCamera = useCallback(() => {
    if (cameraGranted) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [cameraGranted, startCamera, stopCamera]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  return (
    <div className="relative w-full min-h-screen flex login-container animate-bg-position animate-bg max-w-[1680px] mx-auto">
      {/* Left: login area */}
      <section className="relative w-[648px] z-20 h-screen flex items-center justify-center px-10 bg-transparent">
        <LoginForm />
      </section>

      {/* Right: gallery with rotating columns and video overlay */}
      <section className="relative flex-1 overflow-visible p-5 pt-24 bg-transparent">
        <div
          className="relative flex justify-center items-start z-10"
          style={{
            transform: "translateX(-500px) translateY(-200px) rotate(15deg)",
          }}
        >
          <div className="flex gap-6 w-full justify-center">
            {exampleList.map((col, colIdx) => (
              <GalleryColumn key={colIdx} col={col} colIdx={colIdx} />
            ))}
          </div>
        </div>

        {/* Video call overlay */}
        <VideoCallOverlay
          muted={muted}
          userStream={userStream}
          cameraGranted={cameraGranted}
          userVideoRef={userVideoRef}
          onToggleCamera={handleToggleCamera}
          onToggleMute={handleToggleMute}
          onStartCamera={startCamera}
        />
      </section>
    </div>
  );
};

export default LoginPage;
