import React, { useEffect, useRef, useState, useCallback } from "react";
import { Modal, Input, App } from "antd";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/style_utils";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "./cropper.css";

import DropdownMenu from "@/components/DropdownMenu";
import VoiceModal from "./VoiceModal";
import RadioTabs from "@/components/RadioTabs";

import IconRoleAdd from "@/assets/svg/IconRoleAdd.svg?react";
import IconCloseBGBlur from "@/assets/svg/IconCloseBGBlur.svg?react";
import IconChosenBlack from "@/assets/svg/IconChosenBlack.svg?react";
import IconModelBlack from "@/assets/svg/IconModelBlack.svg?react";
import IconModelGray from "@/assets/svg/IconModelGray.svg?react";
import IconArrowDownBlack from "@/assets/svg/IconArrowDownBlack.svg?react";
import IconStar from "@/assets/svg/IconStar.svg?react";
import IconAdd from "@/assets/svg/IconAdd.svg?react";
import IconWave from "@/assets/svg/IconWave.svg?react";
import IconPause from "@/assets/svg/IconPause.svg?react";
import IconPlay from "@/assets/svg/IconPlay.svg?react";
import IconRadio169 from "@/assets/svg/IconRadio_16_9.svg?react";
import IconRadio11 from "@/assets/svg/IconRadio_1_1.svg?react";

import { Ratio } from "@/types/Live";
import { getVoicesOptions, getModelsOptions } from "@/api";

import { useVoiceProcessing } from "@/hooks/useVoiceProcessing";
import { DEFAULT_VIDEO_PROMPT } from "@/constants";
import type {
  Voice,
  CharacterFormData,
  ExtendedLipSyncModelInfo,
  CharacterInfo,
  LipSyncModelInfo,
  CreateCharacterRequest,
} from "@/types/Character";
import { LipSyncMotionStyle } from "@/types/Character";
import type { EditCharacterRequest } from "@/types/Character";
import {
  getVoiceSampleAsset,
  createCharacter as createCharacterApi,
  editCharacter,
  uploadAssetFile,
  duplicateCharacter,
} from "@/api";
import type { RatioItem } from "@/types/Live";

type CharacterCreateProps = {
  open: boolean;
  characterInfo?: CharacterInfo | null;
  onClose: () => void;
  onSuccess?: (characterId: string, ratio: Ratio) => void;
};

const DEFAULT_MODEL_NAME = "SekoTalk";

const CharacterCreate: React.FC<CharacterCreateProps> = ({
  open,
  onClose,
  characterInfo,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const { t, i18n } = useTranslation();

  const tabsList: RatioItem[] = [
    {
      label: "16:9",
      icon: <IconRadio169 className="w-4 h-4" />,
      value: Ratio.LANDSCAPE,
    },
    {
      label: "9:16",
      icon: <IconRadio169 className="rotate-90 w-4 h-4" />,
      value: Ratio.PORTRAIT,
    },
    {
      label: "1:1",
      icon: <IconRadio11 className="w-4 h-4" />,
      value: Ratio.SQUARE,
    },
  ];
  // --- Refs ---
  const imgInputRef = useRef<HTMLInputElement>(null);
  const imgFileRef = useRef<File | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentAudioUrlRef = useRef<string>("");
  const characterIdRef = useRef<string>("");

  // --- State ---
  const [formData, setFormData] = useState<CharacterFormData>({
    name: "",
    llm_prompt: "",
    video_prompt: DEFAULT_VIDEO_PROMPT,
    voice: null,
    model: null,
    imageUrl: null,
    ratio: Ratio.PORTRAIT,
  });
  const [type, setType] = useState<"create" | "edit">("create");
  // 其他独立的状态（与表单数据无关）
  const [lipSyncModels, setLipSyncModels] = useState<
    ExtendedLipSyncModelInfo[]
  >([]);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceList, setVoiceList] = useState<Voice[]>([]);
  const [audioStatus, setAudioStatus] = useState<
    "playing" | "loading" | "idle"
  >("idle");

  const [defaultData, setDefaultData] = useState<CharacterInfo | null>(null);

  const updateFormData = useCallback(
    <K extends keyof CharacterFormData>(
      key: K,
      value: CharacterFormData[K]
    ) => {
      setFormData((prev) => {
        const newData = { ...prev, [key]: value };
        return newData;
      });
    },
    []
  );

  const updateFormDataBatch = useCallback(
    (updates: Partial<CharacterFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    [setFormData]
  );
  // --- Custom Hooks ---

  const { processedVoiceList } = useVoiceProcessing(voiceList);

  const formatModelName = (model: LipSyncModelInfo): string => {
    return i18n.language === "zh" ? model.label_zh : model.label_en;
  };

  const handleImgFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    imgFileRef.current = file;
    updateFormData("imageUrl", URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleRemoveImg = () => {
    updateFormData("imageUrl", null);
    imgFileRef.current = null;
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const createCharacter = async () => {
    if (type === "create") {
      if (imgFileRef.current === null) {
        message.error(t("home_please_upload_image"));
        return;
      }
    } else {
      if (imgFileRef.current === null && !formData.imageUrl) {
        message.error(t("home_please_upload_image"));
        return;
      }
    }
    const payload: CreateCharacterRequest = {
      image_id: "",
      llm_prompt: formData.llm_prompt,
      name: formData.name,
      video_model_id: formData.model?.id || "",
      video_prompt: formData.video_prompt,
      voice_id: formData.voice?.id || "",
    };
    if (imgFileRef.current !== null && cropperRef.current !== null) {
      const cropper = cropperRef.current.cropper;

      // 根据 ratio 确定裁剪尺寸
      let width: number, height: number;
      if (formData.ratio === Ratio.LANDSCAPE) {
        width = 1280;
        height = 720;
      } else if (formData.ratio === Ratio.PORTRAIT) {
        width = 720;
        height = 1280;
      } else {
        width = 1024;
        height = 1024;
      }

      const canvas = cropper.getCroppedCanvas({
        width,
        height,
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
        const imageId = await uploadAssetFile(file);
        payload.image_id = imageId.data.id;
      }
    }
    if (type === "edit") {
      if (defaultData?.is_public) {
        const copyRes = await duplicateCharacter(defaultData.character_id);
        if (copyRes.code === 200) {
          characterIdRef.current = copyRes.data.character_id;
        } else {
          message.error(t("home_edit_character_failed"));
          return;
        }
      }
      const params: EditCharacterRequest = {
        character_id: characterIdRef.current,
      };
      if (imgFileRef.current !== null && payload.image_id)
        params.image_id = payload.image_id;
      if (formData.name !== defaultData?.character_name)
        params.name = formData.name;
      if (formData.llm_prompt !== defaultData?.llm_prompt)
        params.llm_prompt = formData.llm_prompt;
      if (formData.video_prompt !== defaultData?.video_prompt)
        params.video_prompt = formData.video_prompt;
      if (formData.voice?.id !== defaultData?.voice.id)
        params.voice_id = formData.voice?.id;
      if (formData.model?.id !== defaultData?.video_model_id)
        params.video_model_id = formData.model?.id;
      const res = await editCharacter(params);
      if (res.code === 200) {
        onClose();
        onSuccess?.(characterIdRef.current, formData.ratio);
      } else {
        message.error(t("home_edit_character_failed"));
      }
    } else {
      const res = await createCharacterApi(payload);
      if (res.code === 200) {
        onClose();
        characterIdRef.current = res.data.character_id;
        onSuccess?.(res.data.character_id, formData.ratio);
      } else {
        message.error(t("home_create_character_failed"));
      }
    }
  };

  const fetchOptions = useCallback(async () => {
    const [vRes, mRes] = await Promise.all([
      getVoicesOptions(),
      getModelsOptions(),
    ]);
    if (vRes.code === 200) setVoiceList(vRes.data);
    if (mRes.code === 200) {
      const models: ExtendedLipSyncModelInfo[] = mRes.data.map((item) => ({
        id: item.id,
        label_en: item.name_en ?? "",
        label_zh: item.name_zh ?? "",
        motion_style: LipSyncMotionStyle.DYNAMIC,
      }));
      setLipSyncModels(models);
      if (models.length > 0) {
        updateFormData("model", models[0]);
      }
    }
  }, [updateFormData]);

  const init = useCallback(async () => {
    if (characterInfo) {
      updateFormDataBatch({
        name: characterInfo.character_name || "",
        llm_prompt: characterInfo.llm_prompt || "",
        video_prompt: characterInfo.video_prompt || DEFAULT_VIDEO_PROMPT,
        voice: null,
        model: null,
        imageUrl: characterInfo.image.url,
        ratio: Ratio.PORTRAIT,
      });
      characterIdRef.current = characterInfo.character_id;
      setDefaultData(characterInfo);

      setType("edit");
    } else {
      // 重置为默认值
      updateFormDataBatch({
        name: "",
        llm_prompt: "",
        video_prompt: DEFAULT_VIDEO_PROMPT,
        voice: null,
        model: null,
        imageUrl: null,
        ratio: Ratio.PORTRAIT,
      });
      imgFileRef.current = null;
      setType("create");
    }
    await fetchOptions();
  }, [characterInfo, fetchOptions, updateFormDataBatch]);

  const handleAudioPlay = async (ev: React.MouseEvent) => {
    ev.stopPropagation();

    // 再次点击当前播放的声音 => 暂停
    if (audioStatus === "playing") {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setAudioStatus("idle");
      return;
    }

    // 切换声音时先暂停上一个
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setAudioStatus("loading");

    try {
      const res = await getVoiceSampleAsset(formData.voice?.id || "");
      if (res.code === 200 && res.data?.url) {
        const audioUrl = res.data.url;

        // 更新当前音频 URL 引用
        currentAudioUrlRef.current = audioUrl;

        // 直接对 audio 元素设置 src，并在加载后播放
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();

          try {
            await audioRef.current.play();
            setAudioStatus("playing");
          } catch (err) {
            console.error("audio play error", err);
            message.error("无法自动播放音频，请检查浏览器权限。");
            setAudioStatus("idle");
          }
        }
      } else {
        throw new Error(res.msg || "获取音频失败");
      }
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "获取音频失败，请稍后重试。"
      );
      setAudioStatus("idle");
    }
  };
  const renderFooter = () => {
    return (
      <div className="w-full flex items-center justify-between">
        <DropdownMenu<ExtendedLipSyncModelInfo>
          list={lipSyncModels}
          value={formData.model}
          onChange={(model) => updateFormData("model", model)}
          formatLabel={formatModelName}
          getKey={(_, index) => index}
          isSelected={(item, val) => val?.motion_style === item.motion_style}
          defaultLabel={DEFAULT_MODEL_NAME}
          iconActive={<IconModelBlack className="w-4 h-4" />}
          iconInactive={<IconModelGray className="w-4 h-4" />}
          iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
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
          onClick={() => createCharacter()}
        >
          <span className="text-sm font-normal text-[#3B3D2C]">
            {type === "create"
              ? t("home_create_character")
              : t("home_edit_character")}
          </span>
          <IconStar className="w-4 h-4 mx-1" />
        </button>
      </div>
    );
  };
  const renderTitle = () => {
    return (
      <RadioTabs
        disable={imgFileRef.current === null}
        tabsList={tabsList}
        activeValue={formData.ratio}
        onChange={(value) => updateFormData("ratio", value as Ratio)}
      />
    );
  };
  // --- Effects ---

  useEffect(() => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      let newAspectRatio: number;

      if (formData.ratio === Ratio.LANDSCAPE) {
        newAspectRatio = 16 / 9;
      } else if (formData.ratio === Ratio.PORTRAIT) {
        newAspectRatio = 9 / 16;
      } else {
        newAspectRatio = 1;
      }

      cropper.setAspectRatio(newAspectRatio);
    }
  }, [formData.ratio]);

  useEffect(() => {
    if (characterInfo && processedVoiceList.length > 0) {
      const target = processedVoiceList.find(
        (v) => v.id === characterInfo.voice.id
      );
      if (target) updateFormData("voice", target);
    }
  }, [processedVoiceList, characterInfo, updateFormData]);

  // 当模型列表加载完成且 characterInfo 存在时，设置对应的模型
  useEffect(() => {
    if (characterInfo && lipSyncModels.length > 0) {
      const targetModel = lipSyncModels.find(
        (m) => m.id === characterInfo.video_model_id
      );
      if (targetModel) {
        updateFormData("model", targetModel);
      }
    }
  }, [lipSyncModels, characterInfo, updateFormData]);

  useEffect(() => {
    if (open) {
      init();
    } else {
      // 重置表单数据
      updateFormDataBatch({
        name: "",
        llm_prompt: "",
        video_prompt: DEFAULT_VIDEO_PROMPT,
        voice: null,
        model: null,
        imageUrl: null,
        ratio: Ratio.PORTRAIT,
      });

      imgFileRef.current = null;
      if (imgInputRef.current) imgInputRef.current.value = "";
    }
  }, [open, init, updateFormDataBatch]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      title={renderTitle()}
      maskClosable={false}
      footer={renderFooter()}
      classNames={{
        container: "w-[32.25rem] h-[42rem] !rounded-2xl",
        body: "!pt-4 !pr-4 max-h-[35rem] overflow-y-auto",
      }}
    >
      <div className="w-full flex flex-col gap-3">
        {/* Image Upload Section */}
        <div
          className="w-full h-[18rem] flex items-center justify-center border border-black/30 rounded-2xl relative"
          onClick={() => !formData.imageUrl && imgInputRef.current?.click()}
        >
          {formData.imageUrl ? (
            imgFileRef.current === null ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={formData.imageUrl}
                  alt="character image"
                  className="w-full h-full object-contain "
                />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <Cropper
                  className="w-full h-full"
                  crossOrigin="anonymous"
                  ref={cropperRef}
                  src={formData.imageUrl}
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
                  aspectRatio={
                    formData.ratio === Ratio.LANDSCAPE
                      ? 16 / 9
                      : formData.ratio === Ratio.PORTRAIT
                        ? 9 / 16
                        : 1
                  }
                  style={{
                    width: "100%",
                    height: "18rem",
                    background: "#333",
                    borderRadius: "16px",
                  }}
                />
              </div>
            )
          ) : (
            <div className="w-[24rem] h-[18rem] flex flex-col justify-center items-center cursor-pointer">
              <IconRoleAdd className="w-[56px] h-[56px] mb-6" />
              <span className="text-base font-medium text-[#3B3D2C80]">
                {t("home_upload_character_image")}
              </span>
            </div>
          )}
          {formData.imageUrl && (
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
        {/* name */}

        <Input
          value={formData.name}
          className="w-full h-10  border-black/30 rounded-xl p-2 hover:border-primary focus-within:border-primary"
          onChange={(e) => updateFormData("name", e.target.value)}
          placeholder={t("home_enter_character_name")}
        />

        {/*  llm_prompt */}
        <div className="w-full flex flex-col border border-black/30 rounded-2xl p-2 hover:border-primary focus-within:border-primary">
          <textarea
            value={formData.llm_prompt}
            onChange={(e) => updateFormData("llm_prompt", e.target.value)}
            rows={4}
            className="w-full resize-none leading-6 h-24 p-2 box-border overflow-auto outline-none"
            placeholder={t("home_llm_prompt_placeholder")}
          />
        </div>

        {/* video_prompt */}
        <div className="w-full flex flex-col border border-black/30 rounded-2xl p-2 hover:border-primary focus-within:border-primary">
          <textarea
            value={formData.video_prompt}
            onChange={(e) => updateFormData("video_prompt", e.target.value)}
            rows={4}
            className="w-full resize-none leading-6 h-24 p-2 box-border overflow-auto outline-none"
            placeholder={t("home_video_prompt_placeholder")}
          />

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
        <div className="w-full h-[54px] mb-1 flex items-center justify-between border border-black/30 rounded-2xl p-1 bg-[#f4f4f4]">
          <div className="flex-1">
            <div className="w-full h-full flex items-center justify-between relative ml-2 group">
              <button
                type="button"
                className="w-10 h-10 bg-white rounded-full absolute top-[-2px] left-[-2px] z-10 cursor-pointer shadow-md flex items-center justify-center"
                onClick={() => setVoiceModalOpen(true)}
              >
                {formData.voice ? (
                  <IconWave className="w-5 h-5" />
                ) : (
                  <IconAdd className="w-5 h-5" />
                )}
              </button>
              <Input
                placeholder={t("home_please_select_voice")}
                className="w-[calc(100%-20px)] h-9 px-[45px]  bg-[#fff] rounded-2xl p-2 border-none outline-none cursor-pointer"
                value={
                  formData.voice
                    ? formData.voice.friendly_name
                    : t("home_please_select_voice")
                }
                readOnly
                onClick={() => setVoiceModalOpen(true)}
              />

              {formData.voice ? (
                <div
                  className={cn(
                    "w-10 h-10 rounded-[50%] flex justify-center items-center overflow-hidden transition-all duration-300 absolute right-2 shadow-md",
                    "bg-[#fff] cursor-pointer group ",
                    audioStatus === "loading" && "animate-pulse"
                  )}
                  onClick={(e) => {
                    handleAudioPlay(e);
                  }}
                >
                  {audioStatus === "loading" ? (
                    <div className="w-6 h-6 border-2 border-[#000] border-t-transparent rounded-full animate-spin" />
                  ) : audioStatus === "playing" ? (
                    <IconPause className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 text-[#000]" />
                  ) : (
                    <IconPlay
                      className={cn(
                        "w-6 h-6 transition-transform duration-300 text-[#000]",
                        currentAudioUrlRef.current && "group-hover:scale-110"
                      )}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImgFileChange}
      />
      <audio ref={audioRef} onEnded={() => setAudioStatus("idle")} />
      <VoiceModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        voiceList={processedVoiceList}
        defaultVoiceId={characterInfo?.voice.id}
        onApply={(v) => {
          updateFormData("voice", v);
          setVoiceModalOpen(false);
        }}
      />
    </Modal>
  );
};

export default CharacterCreate;
