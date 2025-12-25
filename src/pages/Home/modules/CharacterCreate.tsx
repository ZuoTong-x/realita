import React, { useEffect, useRef, useState, useCallback } from "react";
import { Modal, Input, App } from "antd";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/style_utils";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "./cropper.css";

import CommonButton from "@/components/Common/Button";
import DropdownMenu from "@/components/DropdownMenu";
import VoiceModal from "./VoiceModal";

import IconRoleAdd from "@/assets/svg/IconRoleAdd.svg?react";
import IconCloseBGBlur from "@/assets/svg/IconCloseBGBlur.svg?react";
import IconChosenBlack from "@/assets/svg/IconChosenBlack.svg?react";
import IconModelBlack from "@/assets/svg/IconModelBlack.svg?react";
import IconModelGray from "@/assets/svg/IconModelGray.svg?react";
import IconArrowDownBlack from "@/assets/svg/IconArrowDownBlack.svg?react";
import IconStar from "@/assets/svg/IconStar.svg?react";
import IconRefresh from "@/assets/svg/IconRefresh.svg?react";
import IconAdd from "@/assets/svg/IconAdd.svg?react";
import IconWave from "@/assets/svg/IconWave.svg?react";

import { getVoicesOptions, getModelsOptions } from "@/api/characterRequest";
import { useLiveService } from "@/hooks/useLiveService";
import { useVoiceProcessing } from "@/hooks/useVoiceProcessing";
import {
  POSITIVE_TAGS,
  NEGATIVE_TAGS,
  DEFAULT_POSITIVE_PROMPT,
  DEFAULT_NEGATIVE_PROMPT,
} from "@/constants";

import type { StartServicePayload } from "@/types/Live";
import type {
  Voice,
  ProcessedVoice,
  CharacterInfo,
  LipSyncModelInfo,
} from "@/types/Character";
import { LipSyncMotionStyle } from "@/types/Character";
import { fileToDataURL } from "@/utils/file_util";

type CharacterCreateProps = {
  open: boolean;
  characterInfo?: CharacterInfo | null;
  onClose: () => void;
};

const DEFAULT_MODEL_NAME = "SekoTalk";

const CharacterCreate: React.FC<CharacterCreateProps> = ({
  open,
  onClose,
  characterInfo,
}) => {
  const { message } = App.useApp();
  const { t, i18n } = useTranslation();

  // --- Refs ---
  const imgInputRef = useRef<HTMLInputElement>(null);
  const imgFileRef = useRef<File | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  // --- State ---
  const [inputImgUrl, setInputImgUrl] = useState<string | null>(null);
  const [positivePrompt, setPositivePrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [chosenModel, setChosenModel] = useState<LipSyncModelInfo | null>(null);
  const [lipSyncModels, setLipSyncModels] = useState<LipSyncModelInfo[]>([]);
  const [voice, setVoice] = useState<ProcessedVoice | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceList, setVoiceList] = useState<Voice[]>([]);

  // --- Custom Hooks ---
  const {
    serviceStatus,
    setServiceStatus,
    setSessionId,
    isServiceRunning,
    updateServiceStatus,
    startLiveService,
    stopLiveService,
  } = useLiveService();

  const { processedVoiceList, typeList } = useVoiceProcessing(voiceList);

  // --- Functions ---
  const insertTag = (
    value: string,
    setter: (v: string) => void,
    tag: string
  ) => {
    if (!value.includes(tag)) {
      setter(value ? value + " " + tag : tag);
    }
  };

  const formatModelName = (model: LipSyncModelInfo): string => {
    return i18n.language === "zh" ? model.label_zh : model.label_en;
  };

  const handleImgFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    imgFileRef.current = file;
    setInputImgUrl(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleRemoveImg = () => {
    setInputImgUrl(null);
    imgFileRef.current = null;
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const createCharacter = async () => {
    if (!cropperRef.current || !inputImgUrl) {
      message.error(t("home.please_upload_image"));
      return;
    }

    try {
      const cropper = cropperRef.current.cropper;
      const canvas = cropper.getCroppedCanvas({
        width: 640,
        height: 480,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      const mime = imgFileRef.current?.type || "image/png";
      const ext = mime.split("/")[1] || "png";
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), mime)
      );

      if (blob) {
        const file = new File([blob], `cropped-image.${ext}`, { type: mime });
        const base64 = await fileToDataURL(file);
        const payload: StartServicePayload = {
          account: "default",
          aiConfig: {
            task: "s2v",
            model_cls: "SekoTalk",
            stage: "single_stage",
            inputImage: base64,
            inputImageType: mime,
            huoshan_tts_voice_type: "ICL_zh_female_keainvsheng_tob",
          },
          promptConfig: {
            prompt: positivePrompt,
            negativePrompt: negativePrompt,
          },
        };
        await startLiveService(payload, file);
      }
    } catch {
      message.error(t("common.error"));
    }
  };

  const fetchOptions = useCallback(async () => {
    const [vRes, mRes] = await Promise.all([
      getVoicesOptions(),
      getModelsOptions(),
    ]);
    if (vRes.code === 200) setVoiceList(vRes.data);
    if (mRes.code === 200) {
      const models = mRes.data.map((item) => ({
        label_en: item.name_en ?? "",
        label_zh: item.name_zh ?? "",
        motion_style: LipSyncMotionStyle.DYNAMIC,
      }));
      setLipSyncModels(models);
      if (models.length > 0) setChosenModel(models[0]);
    }
  }, []);

  const init = useCallback(async () => {
    setPositivePrompt(characterInfo?.llm_prompt || DEFAULT_POSITIVE_PROMPT);
    setNegativePrompt(characterInfo?.video_prompt || DEFAULT_NEGATIVE_PROMPT);

    if (characterInfo) {
      const ossDomain = "http://aoss.cn-sh-01b.sensecoreapi-oss.cn";
      const proxyUrl = characterInfo.image.url.replace(ossDomain, "/oss-proxy");
      fetch(proxyUrl)
        .then((res) => (res.ok ? res.blob() : Promise.reject()))
        .then((blob) => {
          const mime = characterInfo.image.mime || "image/png";
          const ext = mime.split("/")[1] || "png";
          imgFileRef.current = new File([blob], `image.${ext}`, { type: mime });
          setInputImgUrl(URL.createObjectURL(blob));
        })
        .catch(() => setInputImgUrl(characterInfo.image.url));
    } else {
      imgFileRef.current = null;
      setInputImgUrl(null);
      setVoice(null);
    }
    await fetchOptions();
  }, [characterInfo, fetchOptions]);

  // --- Effects ---
  useEffect(() => {
    if (characterInfo && processedVoiceList.length > 0) {
      const target = processedVoiceList.find(
        (v) => v.id === characterInfo.voice.id
      );
      if (target) setVoice(target);
    }
  }, [processedVoiceList, characterInfo]);

  useEffect(() => {
    if (open) {
      init();
    } else {
      setInputImgUrl(null);
      setPositivePrompt("");
      setNegativePrompt("");
      setChosenModel(null);
      setVoice(null);
      setServiceStatus("idle");
      setSessionId(null);
      imgFileRef.current = null;
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  }, [open, init, setServiceStatus, setSessionId]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      title={null}
      maskClosable={false}
      footer={
        <div className="w-full flex items-center justify-between">
          <DropdownMenu<LipSyncModelInfo>
            list={lipSyncModels}
            value={chosenModel}
            onChange={setChosenModel}
            formatLabel={formatModelName}
            getKey={(_, index) => index}
            isSelected={(item, val) => val?.motion_style === item.motion_style}
            defaultLabel={DEFAULT_MODEL_NAME}
            iconActive={<IconModelBlack className="w-4 h-4" />}
            iconInactive={<IconModelGray className="w-4 h-4" />}
            iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
            showNewTag={(item) => item.motion_style === "dynamic"}
            renderSelectedIcon={(_, isSelected) =>
              isSelected ? (
                <IconChosenBlack className="w-4 h-4 ml-3" />
              ) : (
                <div className="w-4 h-4 ml-3" />
              )
            }
            disabled={lipSyncModels.length === 0}
          />
          <button
            className="h-8 px-[14px] flex items-center bg-[#F6F3F3] rounded-full cursor-pointer"
            onClick={() =>
              isServiceRunning() ? stopLiveService() : createCharacter()
            }
          >
            <span className="text-sm font-normal text-[#3B3D2C]">
              {isServiceRunning()
                ? t("home.end_conversation")
                : t("home.start_conversation")}
            </span>
            <IconStar className="w-4 h-4 mx-1" />
          </button>
        </div>
      }
      classNames={{
        container: "w-[32.25rem] h-[40rem] !rounded-2xl",
        body: "!pt-4 max-h-[35rem] overflow-y-auto",
      }}
    >
      <div className="w-full flex flex-col gap-3">
        {/* Image Upload Section */}
        <div
          className="w-full h-[18rem] flex items-center justify-center border border-black/30 rounded-2xl relative"
          onClick={() => !inputImgUrl && imgInputRef.current?.click()}
        >
          {inputImgUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Cropper
                className="w-full h-full"
                ref={cropperRef}
                src={inputImgUrl}
                dragMode="move"
                cropBoxMovable={true} // 允许移动裁剪框
                cropBoxResizable={true} // 允许调整裁剪框大小
                movable={false} // 禁止移动图片
                zoomable={false} // 禁止缩放（放大/缩小）
                scalable={false} // 禁止翻转
                viewMode={1} // 限制裁剪框在画布内
                guides={false}
                center={false}
                highlight={false}
                background={false}
                checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
                autoCropArea={1}
                aspectRatio={640 / 480}
                style={{ width: "24rem", height: "18rem", background: "#333" }}
              />
            </div>
          ) : (
            <div className="w-[24rem] h-[18rem] flex flex-col justify-center items-center cursor-pointer">
              <IconRoleAdd className="w-[56px] h-[56px] mb-6" />
              <span className="text-base font-medium text-[#3B3D2C80]">
                {t("home.upload_character_image")}
              </span>
            </div>
          )}
          {inputImgUrl && (
            <button
              className="absolute bottom-2 right-2"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImg();
              }}
            >
              <IconCloseBGBlur className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Positive Prompt */}
        <div className="w-full flex flex-col border border-black/30 rounded-2xl p-2 hover:border-primary focus-within:border-primary">
          <label className="text-sm text-[#666] mb-1">
            {t("home.positive_prompt")}
          </label>
          <textarea
            value={positivePrompt}
            onChange={(e) => setPositivePrompt(e.target.value)}
            rows={4}
            className="w-full resize-none leading-6 h-24 p-2 box-border overflow-auto outline-none"
            placeholder={t("home.positive_prompt_placeholder")}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {POSITIVE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  positivePrompt.includes(tag)
                    ? "bg-primary text-white"
                    : "bg-[#eef0f0] hover:bg-[#e5e7eb] text-[#3B3D2C]"
                )}
                onClick={() =>
                  insertTag(positivePrompt, setPositivePrompt, tag)
                }
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Negative Prompt */}
        <div className="w-full flex flex-col border border-black/30 rounded-2xl p-2 hover:border-primary focus-within:border-primary">
          <label className="text-sm text-[#666] mb-1">
            {t("home.negative_prompt")}
          </label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={4}
            className="w-full resize-none leading-6 h-24 p-2 box-border overflow-auto outline-none"
            placeholder={t("home.negative_prompt_placeholder")}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {NEGATIVE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  negativePrompt.includes(tag)
                    ? "bg-primary text-white"
                    : "bg-[#eef0f0] hover:bg-[#e5e7eb] text-[#3B3D2C]"
                )}
                onClick={() =>
                  insertTag(negativePrompt, setNegativePrompt, tag)
                }
              >
                {tag}
              </button>
            ))}
          </div>
          <style>{`
              textarea {
                position: relative;
              }
              textarea::-webkit-scrollbar {
                width: 3px;
              }
              textarea::-webkit-scrollbar-thumb {
                background: #D9D9D9;
                border-radius: 2px;
              }
          `}</style>
        </div>

        {/* Voice Selection */}
        <div className="w-full h-[54px] flex items-center justify-between border border-black/30 rounded-2xl p-1 bg-[#f4f4f4]">
          <div className="flex-1">
            <div className="w-full h-full flex items-center justify-between relative ml-2 group">
              <button
                type="button"
                className="w-10 h-10 bg-white rounded-full absolute top-[-2px] left-[-2px] z-10 cursor-pointer shadow-md flex items-center justify-center"
                onClick={() => setVoiceModalOpen(true)}
              >
                {voice ? (
                  <IconWave className="w-5 h-5" />
                ) : (
                  <IconAdd className="w-5 h-5" />
                )}
              </button>
              <Input
                placeholder={t("home.please_select_voice")}
                className="w-[calc(100%-20px)] h-9 pl-[45px] bg-[#fff] rounded-2xl p-2 border-none outline-none cursor-pointer"
                value={
                  voice ? voice.friendly_name : t("home.please_select_voice")
                }
                readOnly
                onClick={() => setVoiceModalOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="w-full h-[54px] flex items-center justify-between border border-black/30 rounded-2xl p-1 bg-[#f4f4f4]">
          <div
            className="w-10 h-10 rounded-full m-1"
            style={{
              backgroundColor:
                serviceStatus === "running"
                  ? "#22c55e"
                  : serviceStatus === "stopped"
                    ? "#ef4444"
                    : "#d1d5db",
            }}
          />
          <div className="flex-1 px-3 text-[#3B3D2C]">
            {serviceStatus === "running"
              ? t("home.service_running")
              : serviceStatus === "stopped"
                ? t("home.service_stopped")
                : t("home.service_not_started")}
          </div>
          <CommonButton
            size="large"
            className="w-10 h-10 p-0"
            borderRadiusPx={54}
            onClick={updateServiceStatus}
          >
            <span className="text-xl font-medium text-[#333] flex items-center justify-center">
              <IconRefresh className="w-5 h-5" />
            </span>
          </CommonButton>
        </div>
      </div>

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImgFileChange}
      />
      <VoiceModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        voiceList={processedVoiceList}
        typeList={typeList}
        onApply={(v) => {
          setVoice(v);
          setVoiceModalOpen(false);
        }}
      />
    </Modal>
  );
};

export default CharacterCreate;
