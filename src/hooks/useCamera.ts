import { useCallback, useEffect, useRef, useState } from "react";

type UseCameraOptions = {
  video?:
    | boolean
    | MediaTrackConstraints
    | {
        facingMode?: "user" | "environment";
        width?: number | { ideal?: number };
        height?: number | { ideal?: number };
      };
  audio?: boolean;
  autoPlay?: boolean;
};

type UseCameraResult = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  granted: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleCamera: () => Promise<void>;
  lastError: Error | null;
};

function normalizeConstraints(opts?: UseCameraOptions): MediaStreamConstraints {
  const audio = opts?.audio ?? false;
  let video: boolean | MediaTrackConstraints = opts?.video ?? true;
  if (typeof video === "object" && video !== null) {
    const { facingMode, width, height, ...rest } =
      video as MediaTrackConstraints;
    video = {
      facingMode: facingMode ?? "user",
      width: width ?? { ideal: 1280 },
      height: height ?? { ideal: 720 },
      ...rest
    };
  } else if (video === true) {
    video = {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    };
  }
  return { video, audio };
}

export default function useCamera(options?: UseCameraOptions): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [granted, setGranted] = useState<boolean>(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const constraints = normalizeConstraints(options);
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setGranted(true);
      setLastError(null);
    } catch (e) {
      setGranted(false);
      setLastError(e as Error);
      throw e;
    }
  }, [options]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setGranted(false);
  }, [stream]);

  const toggleCamera = useCallback(async () => {
    if (stream) {
      stopCamera();
    } else {
      await startCamera();
    }
  }, [stream, startCamera, stopCamera]);

  // attach stream to video element
  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;
      if (options?.autoPlay !== false) {
        el.play().catch(() => {});
      }
    }
  }, [stream, options?.autoPlay]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    granted,
    startCamera,
    stopCamera,
    toggleCamera,
    lastError
  };
}
