import { useState } from "react";

import { Modal } from "antd";
import IconDelete from "@/assets/svg/IconDelete.svg?react";
import IconEdit from "@/assets/svg/IconEdit.svg?react";
import IconShare from "@/assets/svg/IconShare.svg?react";

import { Ratio } from "@/types/Live";
import { Divider } from "antd";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo } from "react";
import CommonButton from "@/components/Common/Button";
import IconChat from "@/assets/svg/IconChat.svg?react";
import { getCharacterInfo } from "@/api/characterRequest";
import type { CharacterInfo } from "@/types/Character";
import { App } from "antd";
import { joinQueue, getQueueStatus, leaveQueue, sendQueueHeartbeat, deleteCharacter } from "@/api/characterRequest";
import type { QueueStatus } from "@/types/Character";
import { useRequest } from "ahooks";


type CharacterPreviewProps = {
  open: boolean;
  onClose: () => void;
  characterId: string;
  ratio: Ratio;
  onEdit?: (character: CharacterInfo) => void;
  onDelete?: () => void;
};
const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  open,
  onClose,
  characterId,
  ratio,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo | null>(
    null
  );
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);



  const frameClass = useMemo(() => {
    if (ratio === Ratio.LANDSCAPE) {
      return "w-full max-w-full aspect-[16/9]";
    }
    if (ratio === Ratio.PORTRAIT) {
      return "w-[24rem] max-w-full aspect-[9/16]";
    }
    return "w-full max-w-full aspect-square";
  }, [ratio]);

  const modalWidth = useMemo(() => {
    if (ratio === Ratio.LANDSCAPE) return 896; // 56rem
    if (ratio === Ratio.PORTRAIT) return 384; // 26rem
    return 576; // 36rem
  }, [ratio]);

  const handleChat = async () => {
    const res = await getQueueStatus();
    if (res.code === 200) {
      if (res.data.number_of_users_ahead === null || res.data.number_of_users_ahead === null || res.data.expire_time === null) {
        // 用户不在队列中
        const queueRes = await joinQueue(characterId);
        if (queueRes.code === 200) {
          setIsInQueue(true);
          setQueueStatus(queueRes.data);
          message.success(t("queue.joined_queue"));
          run()

        } else {
          message.error(queueRes.msg || t("queue.join_queue_failed"));
        }
      } else if (res.data.number_of_users_ahead > 0 && res.data.estimate_time! > 0) {
        setIsInQueue(true);
        setQueueStatus(res.data);
        run()
      }
    } else {
      message.error(res.msg || t("queue.join_queue_failed"));
    }
  };

  const handleEdit = () => {
    if (characterInfo && onEdit) {
      onEdit(characterInfo);
    }
  };

  const handleShare = () => {
    const baseUrl = window.location.origin; 
    const url = baseUrl + '?characterId=' + characterId;
    navigator.clipboard.writeText(url);
    message.success(t("common.copied_to_clipboard"));
  };

  const handleDelete = async () => {
    const res = await deleteCharacter(characterId);
    if (res.code === 200) {
      message.success(t("home.delete_character_success"));
      onDelete?.()
    } else {
      message.error(res.msg || t("home.delete_character_failed"));
    }
  };

  // 离开队列
  const handleLeaveQueue = async () => {

    const res = await leaveQueue();
    if (res.code === 200) {
      setIsInQueue(false);
      setQueueStatus(null);
      cancel();
      message.info(t("queue.left_queue"));
    }

  }
  const formatEstimateTime = (estimateTime: number) => {
    if (estimateTime < 60) {
      return estimateTime + t("queue.seconds");
    } else {
      return Math.ceil(estimateTime / 60) + t("queue.minutes");
    }
  }
  const getUserQueueStatus = async () => {
    const res = await getQueueStatus();
    if (res.code === 200) {

      if (res.data.number_of_users_ahead === null || res.data.number_of_users_ahead === null || res.data.expire_time === null) {
        // 用户不在队列中
        message.info(t("queue.not_in_queue"));
        cancel()
      } else if (res.data.number_of_users_ahead > 0 || res.data.estimate_time! > 0) {
        setIsInQueue(true);
        setQueueStatus(res.data);
        if (res.data.expire_time < 3) {
          await sendQueueHeartbeat();
        }
      } else {
        // 排队完成 可以开始聊天
        message.success(t("queue.ready_to_chat"));
        handleLeaveQueue()
        // TODO: 跳转到聊天页面
        setIsInQueue(false);
        cancel()
      }

    }
  };
  const { run, cancel } = useRequest(getUserQueueStatus, {
    pollingInterval: 3000,
    pollingErrorRetryCount: 3,
    manual: true,
  });

  const init = useCallback(async () => {
    const res = await getCharacterInfo(characterId);
    if (res.code === 200) {
      setCharacterInfo(res.data);
    }
  }, [characterId]);

  useEffect(() => {
    if (open) {
      init();
    } else {
      cancel()
    }
  }, [open, init]);


  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      maskClosable={false}
      width={modalWidth}
      classNames={{
        container: "rounded-2xl",
      }}
      styles={{
        body: {
          paddingTop: 16,
        },
      }}
    >
      <div className="w-full flex flex-col gap-4 items-center justify-start">
        <div className="w-full flex items-center justify-center">
          <div
            className={`relative rounded-2xl border border-[#0000001A] shadow-[0_8px_24px_rgba(0,0,0,0.08)] bg-white/60 overflow-hidden ${frameClass}`}
          >

            <img
              src={characterInfo?.image.url}
              alt="character"
              className="w-full h-full object-contain"
            />

            {/* 排队蒙层 */}
            {isInQueue && queueStatus && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-between gap-4 text-white">
                <div className="flex flex-col items-center justify-center gap-2 flex-1 mt-4">
                  <div className="text-2xl font-bold">
                    {t("queue.in_queue")}
                  </div>

                  {queueStatus.number_of_users_ahead !== null && (
                    <div className="flex flex-col items-center gap-2 ">
                      <div className="text-lg">
                        {t("queue.users_ahead")}: {queueStatus.number_of_users_ahead} {t("queue.users")}
                      </div>

                      {queueStatus.estimate_time !== null && (
                        <div className="text-base opacity-90">
                          {t("queue.estimate_time")}: {formatEstimateTime(queueStatus.estimate_time)}
                        </div>
                      )}


                    </div>
                  )}
                </div>
                <CommonButton
                  size="large"
                  className="h-10 px-0 hover:scale-110 transition-transform duration-300 mt-4 mb-4"
                  borderRadiusPx={54}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveQueue();
                  }}
                >
                  <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-6">
                    {t("queue.leave_queue")}
                  </span>
                </CommonButton>
              </div>
            )}

            {/* Chat 按钮 */}
            {!isInQueue && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <CommonButton
                  size="large"
                  className="h-10 px-0 hover:scale-110 transition-transform duration-300"
                  borderRadiusPx={54}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChat();
                  }}
                  disabled={isInQueue}
                >
                  <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-6">
                    {isInQueue ? t("queue.joining") : t("common.chat")}
                    {!isInQueue && <IconChat className="w-6 h-4" />}
                  </span>
                </CommonButton>
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center gap-4">
          <div className="text-xl font-medium text-[#3B3D2C]">
            {t("character.generated_success")}
          </div>
          <div className="w-full flex items-center justify-center gap-1">
            <CommonButton
              className="h-10 w-10 p-0 bg-white/80 hover:scale-110 transition-transform duration-300 "
              style={{ border: "2px solid #0000001A" }}
              borderRadiusPx={54}
              aria-label="edit-character"
              onClick={() => {
                handleEdit();
              }}
            >
              <IconEdit className="w-4 h-4" />
            </CommonButton>
            <CommonButton
              className="h-10 w-10 p-0 bg-white/90 hover:scale-110 transition-transform duration-300"
              style={{ border: "2px solid #0000001A" }}
              borderRadiusPx={54}
              aria-label="share-character"
              onClick={() => {
                handleShare();
              }}
            >
              <IconShare className="w-4 h-4" />
            </CommonButton>
            {characterInfo?.number_of_likes === null && <Divider orientation="vertical" />}
            {/* 只有用户创建的才显示删除按钮 */}
            {characterInfo?.number_of_likes === null && <CommonButton
              className="h-10 w-10 p-0 bg-white/80 hover:scale-110 transition-transform duration-300"
              style={{ border: "2px solid #0000001A" }}
              borderRadiusPx={54}
              aria-label="delete-character"
              onClick={() => {
                handleDelete();
              }}
            >
              <IconDelete className="w-4 h-4 " />
            </CommonButton>
            }
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default CharacterPreview;
