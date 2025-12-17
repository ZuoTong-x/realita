import React, { useState } from "react";
import { Modal } from "antd";
import { Button } from "antd";
import type { Voice } from "@/types/Live";

type VoiceModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (voice: Voice | null) => void;
  voiceList: Voice[];
};

const VoiceModal: React.FC<VoiceModalProps> = ({
  open,
  onClose,
  onApply,
  voiceList,
}) => {
  const [selected, setSelected] = useState<Voice | null>(null);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="选择语音"
      centered
      footer={
        <div className="w-full flex items-center justify-end gap-3">
          <Button
            className="h-8 px-3 bg-white/90 border border-black/30"
            onClick={onClose}
          >
            <span className="text-sm text-[#333]">取消</span>
          </Button>
          <Button
            className="h-8 px-3 bg-white/90"
            onClick={() => onApply(selected)}
          >
            <span className="text-sm text-primary">应用</span>
          </Button>
        </div>
      }
      classNames={{
        container: "w-[24rem] !rounded-2xl",
        body: "max-h-[20rem] overflow-y-auto",
      }}
    >
      <div className="w-full flex flex-col gap-2">
        {voiceList.map((v) => {
          const active = selected?.voice_type === v.voice_type;
          return (
            <button
              key={v.voice_type}
              type="button"
              className={`w-full h-10 px-3 rounded-xl border text-left ${
                active ? "border-[#3B3D2C] bg-[#f6f6f6]" : "border-black/20"
              }`}
              onClick={() => setSelected(v)}
            >
              <span className="text-sm">{`${v.name}( ${v.gender})- ${v.scene}`}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default VoiceModal;
