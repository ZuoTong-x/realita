import { Modal } from "antd";
import IconDelete from "@/assets/svg/IconDelete.svg?react";
import IconEdit from "@/assets/svg/IconEdit.svg?react";
import { CreateStatus, type Character } from "@/types/Character";
import RadioTabs from "@/components/RadioTabs";
import type { Ratio } from "@/types/Live";
import useCharacterStore from "@/stores/characterStore";
import { useTranslation } from "react-i18next";

type CharacterPreviewProps = {
  open: boolean;
  onClose: () => void;
};
const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  open,
  onClose,
}) => {
  const { imageInfo, createStatus } = useCharacterStore();
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      maskClosable={false}
      classNames={{
        container: "w-[26rem] h-[42rem] !rounded-2xl",
      }}
    >
      <div className="w-full h-full flex flex-col gap-3">
        <img
          src={imageInfo ? URL.createObjectURL(imageInfo) : ""}
          alt="character"
          className="w-full h-full object-contain rounded-2xl"
        />
        {createStatus === CreateStatus.PROCESSING && (
          <div className="w-full h-full flex items-center justify-center">
            {t("character.character_creating")}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CharacterPreview;
