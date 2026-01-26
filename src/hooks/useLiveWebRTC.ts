import { useCallback, useEffect, useRef, useState } from "react";
export type LiveStatus = "connecting" | "connected" | "finished" | "error";

export function useWebRTCWhipWhep({
  preview,
  audioOnly = false,
  remoteVideoRef, // 新增：用于播放远程流的视频元素 ref
  localStream, // 新增：直接传入本地流（优先级最高）
  onSuccess, // 新增：连接成功后的回调
}: {
  preview?: React.RefObject<HTMLVideoElement | null>;
  audioOnly?: boolean;
  remoteVideoRef?: React.RefObject<HTMLVideoElement | null>; // 新增
  localStream?: MediaStream | null; // 新增
  onSuccess?: () => void; // 新增
}) {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const whipPcRef = useRef<RTCPeerConnection | null>(null);
  const whepPcRef = useRef<RTCPeerConnection | null>(null);
  const resourceUrlRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 新增：用于存储拉流相关的状态
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // 等待 ICE 收集完成，保证一次性带上候选，避免不支持 trickle 的场景失败
  async function waitIceGathering(pc: RTCPeerConnection) {
    if (pc.iceGatheringState === "complete") return;
    await new Promise<void>((resolve) => {
      const onChange = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", onChange);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", onChange);
      // 兜底 2s
      setTimeout(() => {
        pc.removeEventListener("icegatheringstatechange", onChange);
        resolve();
      }, 2000);
    });
  }

  /** --------------------------
   *  释放所有资源
   *  -------------------------*/
  const stop = useCallback(async () => {
    // 1. 更新状态为完成
    setStatus("finished");

    // 2. 停止本地流轨道（仅操作一次，覆盖所有本地音视频轨道）
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (!track.readyState || track.readyState !== "ended") {
          // 避免重复停止已结束轨道
          track.stop();
        }
      });
    }

    // 3. 清理本地预览视频元素（核心：清空srcObject，释放流引用）
    if (preview?.current) {
      // 简化判断：仅判断current是否存在
      if (preview.current.srcObject) {
        preview.current.srcObject = null; // 关键：切断视频元素与流的绑定
      }
    }

    // 4. 停止远程流轨道（仅操作一次）
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        if (!track.readyState || track.readyState !== "ended") {
          track.stop();
        }
      });
    }

    // 5. 清理远程视频元素
    if (remoteVideoRef?.current) {
      // 简化判断
      if (remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = null;
      }
    }

    // 6. 关闭并清空PeerConnection（先关闭再置空，避免残留）
    if (whipPcRef.current) {
      whipPcRef.current.close();
      whipPcRef.current = null;
    }
    if (whepPcRef.current) {
      whepPcRef.current.close();
      whepPcRef.current = null;
    }

    // 7. 清空所有媒体流Ref（彻底释放引用，让垃圾回收生效）
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    resourceUrlRef.current = null;

    // 8. 清空组件状态中的流
    setRemoteStream(null);
  }, [preview, remoteVideoRef]);

  /** --------------------------
   *  启动拉流（WHEP）
   *  -------------------------*/
  const startWhep = useCallback(
    async (url: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
        bundlePolicy: "max-bundle",
      });
      whepPcRef.current = pc;

      const inbound = new MediaStream();
      remoteStreamRef.current = inbound; // 保存到 ref
      setRemoteStream(inbound);

      // 预先挂载到远端 <video>，但先不强制播放，等待有轨道时再触发
      if (remoteVideoRef && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = inbound;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.playsInline = true;
      }

      pc.ontrack = (ev) => {
        if (!inbound.getTracks().some((track) => track.id === ev.track.id)) {
          inbound.addTrack(ev.track);
        }
      };

      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitIceGathering(pc);

      const resp = await fetch(url, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {
          "Content-Type": "application/sdp",
          Accept: "*/*",
        },
        body: offer.sdp!,
      });

      if (!resp.ok) {
        throw new Error("WHEP 请求失败: " + resp.status);
      }

      const answerSdp = await resp.text();

      if (!answerSdp || answerSdp.length === 0) {
        throw new Error("WHEP 响应为空");
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      // 新增：错误处理和连接状态监听
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setError("拉流连接失败");
          setStatus("error");
        }
        if (pc.connectionState === "connected") {
          if (remoteVideoRef && remoteVideoRef.current) {
            remoteVideoRef.current.play().catch(() => {
              // 忽略播放错误
            });
          }
        }
      };
    },
    [remoteVideoRef]
  );

  /** --------------------------
   *  启动推流（WHIP）- 保持原样或添加改进
   *  -------------------------*/
  const startWhip = useCallback(
    async (url: string) => {
      // 构造本地媒体流：优先使用外部传入的 localStream，其次使用 preview.srcObject，最后回退到 getUserMedia
      let stream: MediaStream | null = null;
      if (localStream && localStream.getTracks().length > 0) {
        stream = localStream;
      } else if (
        preview &&
        preview.current &&
        preview.current.srcObject instanceof MediaStream
      ) {
        stream = preview.current.srcObject as MediaStream;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: !audioOnly,
          audio: true,
        });
        // 如果提供了预览元素但尚未绑定，则绑定并尝试播放
        if (preview && preview.current && !preview.current.srcObject) {
          preview.current.srcObject = stream;
          preview.current.muted = true;
          preview.current.playsInline = true as unknown as boolean;
          try {
            await preview.current.play();
          } catch {
            /* ignore autoplay errors */
          }
        }
      }

      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
        bundlePolicy: "max-bundle",
      });
      whipPcRef.current = pc;

      // 添加连接状态监听
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setError("推流连接失败");
          setStatus("error");
        }
      };

      // 将本地轨道加入连接
      stream!.getTracks().forEach((track) => pc.addTrack(track, stream!));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitIceGathering(pc);

      const resp = await fetch(url, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {
          "Content-Type": "application/sdp",
          Accept: "*/*",
        },
        body: offer.sdp!,
      });

      if (!resp.ok) {
        throw new Error("WHIP 请求失败: " + resp.status);
      }

      const location = resp.headers.get("Location");
      if (location) {
        // 兼容相对路径 Location，转换为完整 URL
        resourceUrlRef.current = new URL(location, url).href;
      }

      const answerSdp = await resp.text();

      if (!answerSdp || answerSdp.length === 0) {
        throw new Error("WHIP 响应为空");
      }

      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
    },
    [audioOnly, preview, localStream]
  );

  /** --------------------------
   *  启动整个直播流程
   *  -------------------------*/
  const start = useCallback(
    async (whipUrl: string, whepUrl: string) => {
      try {
        setError(null);
        setStatus("connecting");

        // 并行启动推流和拉流
        await Promise.all([
          whipUrl ? startWhip(whipUrl) : Promise.resolve(),
          whepUrl ? startWhep(whepUrl) : Promise.resolve(),
        ]);

        setStatus("connected");

        // 连接成功后执行回调
        onSuccess?.();
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
        setStatus("error");
        await stop();
      }
    },
    [startWhep, startWhip, onSuccess, stop]
  );

  /** --------------------------
   *  自动清理
   *  -------------------------*/
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    remoteStream,
    status,
    error,

    whipPcRef, // 推流 PeerConnection
    whepPcRef, // 拉流 PeerConnection
    localStreamRef, // 本地流
    remoteStreamRef, // 远程流（新增）
  };
}
