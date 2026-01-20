import { useState, useCallback } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import { getServiceStatus, startService, stopService } from "@/api/demo";
import type { StartServicePayload, ServiceStatus } from "@/types/Live";

export const useLiveService = () => {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const isServiceRunning = useCallback(() => {
    return serviceStatus === "running";
  }, [serviceStatus]);

  const updateServiceStatus = useCallback(async () => {
    const res = await getServiceStatus();
    if (res.success) {
      setServiceStatus(res.data.status);
    }
  }, []);

  const startLiveService = useCallback(
    async (payload: StartServicePayload, file: File) => {
      try {
        const res = await startService(payload);
        if (res.success) {
          setServiceStatus("running");
          setSessionId(res.data.sessionId);

          // Store session data
          localStorage.setItem("bgImg", URL.createObjectURL(file));
          localStorage.setItem("whipUrl", res.data.whipUrl);
          localStorage.setItem("whepUrl", res.data.whepUrl);
          localStorage.setItem("lightx2vTaskId", res.data.stream);
          localStorage.setItem("stream", res.data.stream);

          // Open live page
          window.open(`/live/?stream=${res.data.stream}`, "_blank");
          return true;
        } else {
          message.error(res.message ?? "Error");
          return false;
        }
      } catch {
        message.error(t("common_error") ?? "Error");
        return false;
      }
    },
    [message, t]
  );

  const stopLiveService = useCallback(async () => {
    const id = sessionId ?? "id-placeholder";
    const res = await stopService(id);
    if (res.success) {
      setServiceStatus("stopped");
      setSessionId(null);
      return true;
    } else {
      message.error(res.message ?? "Error");
      return false;
    }
  }, [sessionId, message]);

  return {
    serviceStatus,
    setServiceStatus,
    setSessionId,
    isServiceRunning,
    updateServiceStatus,
    startLiveService,
    stopLiveService
  };
};
