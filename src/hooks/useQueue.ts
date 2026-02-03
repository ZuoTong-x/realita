import { useState, useCallback, useEffect } from "react";
import { App } from "antd";
import { useRequest } from "ahooks";
import { useTranslation } from "react-i18next";
import type { QueueStatus, StreamInfo } from "@/types";
import {
  joinQueue,
  getQueueStatus,
  leaveQueue,
  sendQueueHeartbeat,
  getAvailableStreams,
} from "@/api";

interface UseQueueOptions {
  characterId: string;
  onQueueComplete: (streamInfo: StreamInfo, isQueue: boolean) => void;
  enabled?: boolean;
}

export const useQueue = ({
  characterId,
  onQueueComplete,
  enabled = true,
}: UseQueueOptions) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);

  // 格式化预估时间
  const formatEstimateTime = useCallback(
    (estimateTime: number) => {
      if (estimateTime < 60) {
        return estimateTime + t("queue_seconds");
      } else {
        return Math.ceil(estimateTime / 60) + t("queue_minutes");
      }
    },
    [t]
  );

  // 离开队列
  const handleLeaveQueue = async () => {
    const res = await leaveQueue();
    if (res.code === 200) {
      setIsInQueue(false);
      setQueueStatus(null);
      cancel();
      cancelGetAvailableStreams();
    }
  };

  // 获取用户队列状态
  const getUserQueueStatus = useCallback(async () => {
    const res = await getQueueStatus();
    if (res.code === 200) {
      if (
        !res.data ||
        res.data.number_of_users_ahead === null ||
        res.data.expire_time === null
      ) {
        // 用户不在队列中
        cancel();
      } else if (
        res.data.number_of_users_ahead > 0 &&
        res.data.estimate_time! > 0
      ) {
        setIsInQueue(true);
        setQueueStatus(res.data);
      }
      if (res.data.expire_time && res.data.expire_time < 3) {
        await sendQueueHeartbeat();
      }
    }
  }, []);

  const getAvailableStreamsStatus = useCallback(async () => {
    const res = await getAvailableStreams();
    if (res.code === 200 && res.data) {
      cancelGetAvailableStreams();
      cancel();
      setIsInQueue(false);
      onQueueComplete?.(res.data, true);
    }
  }, []);

  const { run, cancel } = useRequest(getUserQueueStatus, {
    pollingInterval: 3000,
    pollingErrorRetryCount: 3,
    manual: true,
  });
  const { run: runGetAvailableStreams, cancel: cancelGetAvailableStreams } =
    useRequest(getAvailableStreamsStatus, {
      pollingInterval: 3000,
      pollingErrorRetryCount: 3,
      manual: true,
    });

  // 加入队列
  const handleJoinQueue = useCallback(async () => {
    setIsInQueue(false);
    const res = await getAvailableStreams();
    if (res.data) {
      onQueueComplete?.(res.data, false);
      return;
    } else {
      const queueRes = await joinQueue(characterId);
      if (queueRes.code === 200) {
        setIsInQueue(true);
        setQueueStatus(queueRes.data);
        message.success(t("queue_joined_queue"));
        runGetAvailableStreams();
        run();
      } else {
        message.error(queueRes.msg || t("queue_join_queue_failed"));
      }
    }
  }, [onQueueComplete, characterId, message, t, runGetAvailableStreams, run]);

  // 当组件卸载或 enabled 变为 false 时，取消轮询
  useEffect(() => {
    if (!enabled) {
      cancel();
      cancelGetAvailableStreams();
    }
  }, [enabled, cancel, cancelGetAvailableStreams]);

  return {
    isInQueue,
    queueStatus,
    handleJoinQueue,
    handleLeaveQueue,
    formatEstimateTime,
  };
};
