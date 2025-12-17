import React, { useEffect, useRef, useState, useCallback } from "react";
import { Modal, Input, App } from "antd";

import { useTranslation } from "react-i18next";
import type { LipSyncModelInfo } from "@/types/Character";
import { LipSyncMotionStyle } from "@/types/Character";
import CommonButton from "@/components/Common/Button";
import DropdownMenu from "@/components/DropdownMenu";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "./cropper.css";

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

import VoiceModal from "./VoiceModal";
import {
  getVoicesList,
  getServiceStatus,
  startService,
  stopService,
} from "@/api/demo";
import type { Voice, StartServicePayload } from "@/types/Live";
import { fileToDataURL } from "@/utils/file_util";

import type { Character } from "@/types/Character";

type CharacterCreateProps = {
  open: boolean;
  characterInfo?: Character | null;
  onClose: () => void;
};
const defaultModelName = "SekoTalk";

const CharacterCreate: React.FC<CharacterCreateProps> = ({
  open,
  onClose,
  characterInfo,
}) => {
  const { message } = App.useApp();
  const [inputImgUrl, setInputImgUrl] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const imgFileRef = useRef<File | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const [chosenModel, setChosenModel] = useState<LipSyncModelInfo | null>(null);
  const [lipSyncModels, setLipSyncModels] = useState<LipSyncModelInfo[]>([]);
  const { t, i18n } = useTranslation();
  // prompts
  const [positivePrompt, setPositivePrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const positiveTags = ["高质量", "4k", "高清", "细节丰富"];
  const negativeTags = [
    "镜头晃动",
    "色调艳丽",
    "过曝",
    "静态",
    "细节模糊不清",
    "字幕",
    "风格",
    "作品",
    "画作",
    "画面",
    "静止",
    "整体发灰",
    "最差质量",
    "低质量",
    "JPEG压缩残留",
    "丑陋的",
    "残缺的",
    "多余的手指",
    "画得不好的手部",
    "画得不好的脸部",
    "畸形的",
    "毁容的",
    "形态畸形的肢体",
    "手指融合",
    "静止不动的画面",
    "杂乱的背景",
    "三条腿",
    "背景人很多",
    "倒着走",
  ];
  const insertTag = (
    value: string,
    setter: (v: string) => void,
    tag: string
  ) => {
    if (!value.includes(tag)) {
      setter(value ? value + " " + tag : tag);
    }
  };

  const [serviceStatus, setServiceStatus] = useState<
    "idle" | "running" | "stopped"
  >("idle");
  const isServiceRunning = useCallback(() => {
    return serviceStatus === "running";
  }, [serviceStatus]);

  const [voice, setVoice] = useState<Voice | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceList, setVoiceList] = useState<Voice[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const formatModelName = (model: LipSyncModelInfo): string => {
    if (i18n.language === "zh") {
      // 中文
      return model.label_zh;
    } else {
      // 默认英文
      return model.label_en;
    }
  };

  //上传图片
  const handleImgFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      input.value = "";
      return;
    }
    imgFileRef.current = file;
    setInputImgUrl(URL.createObjectURL(file));

    input.value = "";
  };
  //移除图片
  const handleRemoveImg = () => {
    setInputImgUrl(null);

    imgFileRef.current = null;
    if (imgInputRef.current) {
      imgInputRef.current.value = "";
    }
  };
  const handleModelChange = (model: LipSyncModelInfo) => {
    setChosenModel(model);
  };
  const createCharacter = async () => {
    if (!cropperRef.current || !inputImgUrl) {
      message.error(t("home.please_upload_image"));
      return;
    }
    // if (!voice) {
    //   message.error(t("home.please_select_voice") ?? "Error");
    //   return;
    // }

    try {
      // 如果有裁剪器与原始图片，则基于裁剪结果更新 imageInfo
      if (cropperRef.current && inputImgUrl) {
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
          const file = new File([blob], `cropped-image.${ext}`, {
            type: mime,
          });
          const base64 = await fileToDataURL(file);
          const startServicePayload: StartServicePayload = {
            account: "default",
            aiConfig: {
              task: "s2v", // 任务类型 常量
              model_cls: "SekoTalk", // 模型类型 常量
              stage: "single_stage", // 阶段类型 常量
              inputImage: base64, // 经过base64编码后的图片数据
              inputImageType: mime, // 根据图片文件动态确定的类型
              // huoshan_tts_voice_type: voice.voice_type ||'',
              huoshan_tts_voice_type: "ICL_zh_female_keainvsheng_tob",
            },
            promptConfig: {
              prompt: positivePrompt,
              negativePrompt: negativePrompt,
            },
          };
          const startServiceRes = await startService(startServicePayload);
          if (startServiceRes.success) {
            setServiceStatus("running");
            const whipUrl = startServiceRes.data.whipUrl;
            const whepUrl = startServiceRes.data.whepUrl;
            const lightx2vTaskId = startServiceRes.data.stream;
            const stream = startServiceRes.data.stream;
            localStorage.setItem("bgImg", URL.createObjectURL(file));
            localStorage.setItem("whipUrl", whipUrl);
            localStorage.setItem("whepUrl", whepUrl);
            localStorage.setItem("lightx2vTaskId", lightx2vTaskId);
            localStorage.setItem("stream", stream);
            setSessionId(startServiceRes.data.sessionId);
            // 新窗口
            window.open(`/live/?stream=${stream}`, "_blank");
            localStorage.setItem("bgImg", URL.createObjectURL(file));
          } else {
            message.error(startServiceRes.message ?? "Error");
          }
        }
      }
    } catch (e) {
      // 如果导出失败，不阻塞创建流程
      message.error(t("common.error") ?? "Error");
    }
  };
  const endService = async () => {
    const endServiceRes = await stopService(sessionId ?? "id-placeholder");
    if (endServiceRes.success) {
      setServiceStatus("stopped");
    } else {
      message.error(endServiceRes.message ?? "Error");
    }
  };
  const getVoiceListFunc = useCallback(async () => {
    const res = await getVoicesList();
    if (res.success) {
      setVoiceList(res.data.voices);
    }
  }, []);
  const getServiceStatusFunc = useCallback(async () => {
    const statusRes = await getServiceStatus();
    if (statusRes.success) {
      setServiceStatus(statusRes.data.status);
    } else {
      message.error(statusRes.message ?? "Error");
    }
  }, [message]);

  const init = useCallback(async () => {
    setPositivePrompt("The video features a person is saying something.");
    setNegativePrompt(
      "镜头晃动，色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走"
    );

    setLipSyncModels([
      {
        label_en: "SekoTalk",
        label_zh: "SekoTalk",
        motion_style: LipSyncMotionStyle.DYNAMIC,
      },
    ]);
    if (characterInfo) {
      imgFileRef.current = new File([], characterInfo.image, {
        type: "image/png",
      });
      setInputImgUrl(characterInfo.image);
    } else {
      imgFileRef.current = null;
      setInputImgUrl(null);
    }
    await getVoiceListFunc();
    await getServiceStatusFunc();
  }, [getVoiceListFunc, characterInfo]);

  useEffect(() => {
    if (open) {
      init();
    }
  }, [init, open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div className="w-full flex items-center justify-between">
          <DropdownMenu<LipSyncModelInfo>
            list={lipSyncModels}
            value={chosenModel}
            onChange={handleModelChange}
            formatLabel={formatModelName}
            getKey={(item, index) => index}
            isSelected={(item, value) =>
              value?.motion_style === item.motion_style
            }
            defaultLabel={defaultModelName}
            iconActive={<IconModelBlack className="w-4 h-4" />}
            iconInactive={<IconModelGray className="w-4 h-4" />}
            iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
            showNewTag={(item) => item.motion_style === "dynamic"}
            renderSelectedIcon={(item, isSelected) =>
              isSelected ? (
                <IconChosenBlack className="w-4 h-4 ml-3" />
              ) : (
                <div className="w-4 h-4 ml-3" />
              )
            }
          />
          <button
            className="h-8 px-[14px] flex items-center bg-[#F6F3F3] rounded-full cursor-pointer"
            onClick={() => {
              if (isServiceRunning()) {
                endService();
              } else {
                createCharacter();
              }
            }}
          >
            <span className=" text-sm font-normal text-[#3B3D2C]">
              {isServiceRunning()
                ? t("home.end_conversation")
                : t("home.start_conversation")}
            </span>
            <IconStar className="w-4 h-4 mx-1" />
          </button>
        </div>
      }
      centered
      title={null}
      maskClosable={false}
      classNames={{
        container: "w-[32.25rem] h-[40rem] !rounded-2xl",
        body: "!pt-4 max-h-[35rem] overflow-y-auto",
      }}
    >
      <div className="w-full flex flex-col gap-3">
        <div
          className="w-full h-[18rem] flex items-center justify-center border border-black/30 rounded-2xl relative"
          onClick={() => {
            if (imgInputRef.current && !inputImgUrl) {
              imgInputRef.current.click();
            }
          }}
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
                style={{
                  width: "24rem",
                  height: "18rem",
                  background: "#333333",
                }}
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
          {/* 移除按钮 */}
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

        {/* 正向 Prompt */}
        <div className="w-full flex flex-col border border-black/30 rounded-2xl p-2 hover:border-primary focus-within:border-primary">
          <label className="text-sm text-[#666] mb-1">正向提示词</label>
          <textarea
            value={positivePrompt}
            onChange={(e) => setPositivePrompt(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              resize: "none",
              lineHeight: "24px",
              height: "96px",
              padding: "8px",
              boxSizing: "border-box",
              overflow: "auto",
              outline: "none",
            }}
            placeholder="请输入正向提示词..."
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {positiveTags.map((tag) => {
              const active = positivePrompt.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`px-2 py-1 text-xs rounded-full ${
                    active
                      ? "bg-primary text-white"
                      : "bg-[#eef0f0] hover:bg-[#e5e7eb] text-[#3B3D2C]"
                  }`}
                  onClick={() =>
                    insertTag(positivePrompt, setPositivePrompt, tag)
                  }
                >
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* 负面 Prompt */}
        <div className="w-full flex flex-col border border-black/30 rounded-2xl p-2 hover:border-primary focus-within:border-primary">
          <label className="text-sm text-[#666] mb-1">负面提示词</label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              resize: "none",
              lineHeight: "24px",
              height: "96px",
              padding: "8px",
              boxSizing: "border-box",
              overflow: "auto",
              outline: "none",
            }}
            placeholder="请输入反向/排除提示词..."
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {negativeTags.map((tag) => {
              const active = negativePrompt.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`px-2 py-1 text-xs rounded-full ${
                    active
                      ? "bg-primary text-white"
                      : "bg-[#eef0f0] hover:bg-[#e5e7eb] text-[#3B3D2C]"
                  }`}
                  onClick={() =>
                    insertTag(negativePrompt, setNegativePrompt, tag)
                  }
                >
                  <span>{tag}</span>
                </button>
              );
            })}
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
        {/* 语音框：选择语音 */}
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
                className="w-[calc(100%-20px)]  h-9 pl-[45px] bg-[#fff] rounded-2xl p-2 border-none outline-none"
                value={
                  voice
                    ? `${voice?.name}( ${voice?.gender})- ${voice?.scene}`
                    : t("home.please_select_voice")
                }
                readOnly
                onClick={() => setVoiceModalOpen(true)}
              />
            </div>
          </div>
          {/* <CommonButton
            size="large"
            className="w-10 h-10 p-0"
            borderRadiusPx={54}
            onClick={() => {
              setIsPlaying(!isPlaying);
            }}
          >
            <span className="text-xl font-medium text-[#333] flex items-center  justify-center">
              {isPlaying ? (
                <IconPause className="w-5 h-5" />
              ) : (
                <IconPlay className="w-5 h-5" />
              )}
            </span>
          </CommonButton> */}
        </div>
        {/* 服务状态条 */}
        <div className="w-full h-[54px] flex items-center justify-between border border-black/30 rounded-2xl p-1 bg-[#f4f4f4]">
          <div
            className="w-10 h-10 rounded-full m-1"
            style={{
              backgroundColor:
                serviceStatus === "running"
                  ? "#22c55e" // green
                  : serviceStatus === "stopped"
                    ? "#ef4444" // red
                    : "#d1d5db", // gray
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
            onClick={getServiceStatusFunc}
          >
            <span className="text-xl font-medium text-[#333] flex items-center  justify-center">
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
        voiceList={voiceList}
        onApply={(v) => {
          setVoice(v);
          setVoiceModalOpen(false);
        }}
      />
    </Modal>
  );
};

export default CharacterCreate;
