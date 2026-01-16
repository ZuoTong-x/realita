import { useState } from "react";

import { Modal } from "antd";
// import IconDelete from "@/assets/svg/IconDelete.svg?react";
// import IconEdit from "@/assets/svg/IconEdit.svg?react";
// import IconShare from "@/assets/svg/IconShare.svg?react";
// import { CreateStatus } from "@/types/Character";
import { Ratio } from "@/types/Live";

import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo } from "react";
import CommonButton from "@/components/Common/Button";
import IconChat from "@/assets/svg/IconChat.svg?react";
import { getCharacterInfo } from "@/api/characterRequest";
import type { CharacterInfo } from "@/types/Character";

type CharacterPreviewProps = {
  open: boolean;
  onClose: () => void;
  characterId: string;

  ratio: Ratio;
};
const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  open,
  onClose,
  characterId,

  ratio,
}) => {
  const { t } = useTranslation();
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo | null>(
    null
  );

  const frameClass = useMemo(() => {
    if (ratio === Ratio.LANDSCAPE) {
      return "w-full max-w-full aspect-[16/9]";
    }
    if (ratio === Ratio.PORTRAIT) {
      return "w-full max-w-full aspect-[9/16]";
    }
    return "w-full max-w-full aspect-square";
  }, [ratio]);

  const modalWidth = useMemo(() => {
    if (ratio === Ratio.LANDSCAPE) return 896; // 56rem
    if (ratio === Ratio.PORTRAIT) return 416; // 26rem
    return 576; // 36rem
  }, [ratio]);

  const handleChat = () => {
    console.log("handleChat");
  };

  const handleEdit = () => {
    console.log("handleEdit");
  };

  const handleShare = () => {
    console.log("handleShare");
  };

  const handleDelete = () => {
    console.log("handleDelete");
  };
  const init = useCallback(async () => {
    const res = await getCharacterInfo(characterId);
    if (res.code === 200) {
      setCharacterInfo(res.data);
    }
  }, [characterId]);
  useEffect(() => {
    if (open) {
      init();
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
            {characterInfo?.image.url ? (
              <img
                src={characterInfo?.image.url}
                alt="character"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-[#999]">
                {t("common.no_image") ?? "No image"}
              </div>
            )}
            {/* {createStatus === CreateStatus.SUCCESS && ( */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <CommonButton
                size="large"
                className="h-14 px-0 hover:scale-110 transition-transform duration-300"
                borderRadiusPx={54}
                onClick={() => {
                  handleChat();
                }}
              >
                <span className="text-2xl font-medium text-[#333] flex items-center gap-4 justify-center px-10">
                  {t("common.chat")}
                  <IconChat className="w-6 h-6" />
                </span>
              </CommonButton>
            </div>
            {/* )} */}
          </div>
        </div>
        {/* {createStatus === CreateStatus.PROCESSING ? (
          <div className="w-full flex items-center justify-center text-xl font-medium text-[#3B3D2C]">
            {t("character.character_creating")}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <div className="text-xl font-medium text-[#3B3D2C]">
              {t("character.generated_success")}
            </div>
            <div className="w-full flex items-center justify-center gap-6">
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
              <CommonButton
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
            </div>
          </div>
        )} */}
      </div>
    </Modal>
  );
};

export default CharacterPreview;
