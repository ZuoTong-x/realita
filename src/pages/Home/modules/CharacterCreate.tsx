import React, { useEffect, useRef, useState } from "react";
import { Dropdown, Modal, Input, Avatar, App } from "antd";
import RadioTabs from "@/components/RadioTabs";
import { Ratio, type RatioItem } from "@/types/Live";
import useCharacterStore from "@/stores/characterStore";
import { useTranslation } from "react-i18next";
import type { LipSyncModelInfo } from "@/types/Character";
import type { MenuProps } from "antd";
import CommonButton from "@/components/Common/Button";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "./cropper.css";

import IconRadio169 from "@/assets/svg/IconRadio_16_9.svg?react";
import IconRadio11 from "@/assets/svg/IconRadio_1_1.svg?react";
import IconRoleAdd from "@/assets/svg/IconRoleAdd.svg?react";
import IconCloseBGBlur from "@/assets/svg/IconCloseBGBlur.svg?react";
import IconChosenBlack from "@/assets/svg/IconChosenBlack.svg?react";
import IconModelBlack from "@/assets/svg/IconModelBlack.svg?react";
import IconModelGray from "@/assets/svg/IconModelGray.svg?react";
import IconArrowDownBlack from "@/assets/svg/IconArrowDownBlack.svg?react";
import IconStar from "@/assets/svg/IconStar.svg?react";
import Rectangle34624904 from "@/assets/images/Rectangle 34624904.png";
import IconPause from "@/assets/svg/IconPause.svg?react";
import IconPlay from "@/assets/svg/IconPlay.svg?react";
import IconAdd from "@/assets/svg/IconAdd.svg?react";

import IconWave from "@/assets/svg/IconWave.svg?react";
import { CreateStatus } from "@/types/Character";

type CharacterCreateProps = {
  open: boolean;
  onClose: () => void;
  onPreview: () => void;
};
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
const defaultModelName = "SekoTalk-v1.0";
const MAX_AUDIO_DURATION = 120;
const CharacterCreate: React.FC<CharacterCreateProps> = ({
  open,
  onClose,
  onPreview,
}) => {
  const { message } = App.useApp();
  const [ratio, setRatio] = useState<Ratio>(Ratio.LANDSCAPE);
  const {
    imageInfo,
    setImageInfo,
    voiceInfo,
    setVoiceInfo,
    createStatus,
    setCreateStatus,
  } = useCharacterStore();

  const [inputImgUrl, setInputImgUrl] = useState<string | null>(null);
  const [inputAudioUrl, setInputAudioUrl] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const imgFileRef = useRef<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<File | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const [chosenModel, setChosenModel] = useState<LipSyncModelInfo | null>(null);
  const [showModelList, setShowModelList] = useState(false);
  const [lipSyncModels, setLipSyncModels] = useState<LipSyncModelInfo[]>([]);
  const { t, i18n } = useTranslation();
  const [characterName, setCharacterName] = useState<string>("");
  const [characterPrompt, setCharacterPrompt] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceName, setVoiceName] = useState<string>("");

  const handleAudioFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const files = ["audio/mpeg", "audio/wav", "video/mp4"];
    if (!files.includes(file.type)) {
      message.error(t("home_input_audio_invalid"));
      return;
    }
    audioFileRef.current = file;
    setInputAudioUrl(URL.createObjectURL(file));
    setVoiceInfo(file as File);
  };

  // sync cropper aspect ratio when ratio changes
  useEffect(() => {
    if (!cropperRef.current || !inputImgUrl) return;
    const cropper = cropperRef.current.cropper;
    const aspect =
      ratio === Ratio.LANDSCAPE
        ? 16 / 9
        : ratio === Ratio.PORTRAIT
          ? 9 / 16
          : 1;
    if (cropper && typeof cropper.setAspectRatio === "function") {
      cropper.setAspectRatio(aspect);
    }
  }, [ratio, inputImgUrl]);

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
      // 确保同一文件选择也能再次触发
      input.value = "";
      return;
    }
    imgFileRef.current = file;
    setInputImgUrl(URL.createObjectURL(file));
    setImageInfo(file as File);
    // 关键：清空 input 的值，保证下次选择同一文件也会触发 onChange
    input.value = "";
  };
  //移除图片
  const handleRemoveImg = () => {
    setInputImgUrl(null);
    setImageInfo(null);
    imgFileRef.current = null;
    if (imgInputRef.current) {
      imgInputRef.current.value = "";
    }
  };
  const handleModelChange = (model: LipSyncModelInfo) => {
    setChosenModel(model);
    setShowModelList(false);
  };
  const modelMenuItems: MenuProps["items"] = lipSyncModels.map(
    (model, index) => ({
      key: index,
      label: (
        <div
          className=" min-w-[150px] px-1 py-1 flex justify-between items-center hover:bg-[#F5F5F1] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleModelChange(model);
          }}
        >
          <span
            className={`
          ${
            chosenModel?.motion_style === model.motion_style
              ? "font-semibold text-[#3B3D2C]"
              : "font-normal text-[#3B3D2CD0]"
          }
        `}
          >
            {formatModelName(model)}
          </span>
          {model.motion_style === "dynamic" && (
            <span className="bg-[#eef0f0] rounded px-2 py-1 text-xs  ">
              <span
                style={{
                  background:
                    "linear-gradient(270deg, #29E4F1 0%, #FFBC36 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                new
              </span>
            </span>
          )}
          {chosenModel?.motion_style === model.motion_style ? (
            <IconChosenBlack className="w-4 h-4 ml-3" />
          ) : (
            <div className="w-4 h-4 ml-3" />
          )}
        </div>
      ),
    })
  );
  const createCharacter = () => {
    setCreateStatus(CreateStatus.PROCESSING);
    onPreview();
  };
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      title={
        <RadioTabs
          tabsList={tabsList}
          activeValue={ratio}
          onChange={(value) => setRatio(value as Ratio)}
        />
      }
      maskClosable={false}
      classNames={{
        container: "w-[32.25rem] h-[45rem] !rounded-2xl",
      }}
    >
      <div className="w-full h-full flex flex-col gap-3">
        <div
          className="w-full h-80 flex items-center justify-center border border-black/30 rounded-2xl relative group"
          onClick={() => {
            if (imgInputRef.current && !inputImgUrl) {
              imgInputRef.current.click();
            }
          }}
        >
          {inputImgUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className=" h-full max-h-full max-w-full rounded-2xl overflow-hidden relative border-[2px] border-white">
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
                  aspectRatio={
                    ratio === Ratio.LANDSCAPE
                      ? 16 / 9
                      : ratio === Ratio.PORTRAIT
                        ? 9 / 16
                        : 1
                  }
                  style={{
                    width: "100%",
                    height: "20rem",
                    background: "#333333",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center cursor-pointer">
              <IconRoleAdd className="w-[56px] h-[56px] mb-6" />
              <span className="text-base font-medium text-[#3B3D2C80]">
                {t("home.upload_character_image")}
              </span>
            </div>
          )}
          {/* 移除按钮 */}
          {inputImgUrl && (
            <button
              className="absolute top-1.5 right-1.5 invisible group-hover:visible"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImg();
              }}
            >
              <IconCloseBGBlur className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="w-full h-[42px] flex items-center justify-between">
          <Input
            placeholder={t("home.enter_character_name")}
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            prefix={
              <Avatar
                src={Rectangle34624904}
                size={32}
                className="m-1"
                shape="circle"
              />
            }
            className="w-full h-full rounded-xl"
          />
        </div>
        <div className="w-full h-[137px] flex items-center justify-between border border-black/30 rounded-2xl p-1 hover:border-primary focus-within:border-primary">
          <div className="relative w-full h-full">
            <Avatar
              src={Rectangle34624904}
              size={32}
              className="m-1 absolute top-2 left-0 z-10"
              shape="circle"
            />
            <textarea
              value={characterPrompt}
              onChange={(e) => setCharacterPrompt(e.target.value)}
              rows={1} // 初始行数
              style={{
                width: "calc(100% - 35px)",
                resize: "none",
                lineHeight: "24px",
                height: "120px",
                padding: "8px",
                marginLeft: "36px",
                boxSizing: "border-box",
                overflow: "auto",
                outline: "none",
              }}
              placeholder={t("home.enter_character_prompt")}
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
        </div>
        {/* 语音框 */}
        <div className="w-full h-[54px] flex items-center justify-between border border-black/30 rounded-2xl p-1 bg-[#f4f4f4]">
          <Avatar
            src={Rectangle34624904}
            size={40}
            className="m-1"
            shape="circle"
          />
          <div className="flex-1">
            <div className="w-full h-full flex items-center justify-between relative ml-2 group">
              <div className="w-10 h-10 bg-white rounded-full absolute top-[-2px] left-[-2px] z-10 cursor-pointer shadow-md flex items-center justify-center">
                {voiceInfo ? (
                  <IconWave className="w-5 h-5" />
                ) : (
                  <IconAdd
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => audioInputRef.current?.click()}
                  />
                )}
              </div>
              <Input
                placeholder={t("home.enter_voice_name")}
                className="w-[calc(100%-20px)]  h-9 pl-[45px] bg-[#fff] rounded-2xl p-2 border-none outline-none"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              />
            </div>
          </div>
          <CommonButton
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
          </CommonButton>
        </div>
        {/* 创建角色按钮 */}
        <div className="w-full h-[42px] flex items-center justify-between">
          <Dropdown
            className=""
            menu={{ items: modelMenuItems }}
            open={showModelList}
            onOpenChange={(open) => setShowModelList(open)}
          >
            <button
              className={`
              h-8 px-[14px] flex items-center bg-[#F6F3F3] rounded-full
              ${lipSyncModels.length > 1 ? "cursor-pointer" : "cursor-not-allowed"}
            `}
              onClick={(e) => {
                e.stopPropagation();
                setShowModelList(!showModelList);
              }}
            >
              {lipSyncModels.length > 1 ? (
                <IconModelBlack className="w-4 h-4 mr-1" />
              ) : (
                <IconModelGray className="w-4 h-4 mr-1" />
              )}
              <span
                className={`
              text-sm font-normal
              ${
                lipSyncModels.length > 1 ? "text-[#3B3D2C]" : "text-[#3B3D2C4C]"
              }
            `}
              >
                {chosenModel ? formatModelName(chosenModel!) : defaultModelName}
              </span>
              {chosenModel?.motion_style === "dynamic" && (
                <span className="bg-[#F6F3F3] rounded px-2 py-1 text-xs ">
                  <span
                    style={{
                      background:
                        "linear-gradient(270deg, #29E4F1 0%, #FFBC36 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    new
                  </span>
                </span>
              )}
              {lipSyncModels.length > 1 ? (
                <IconArrowDownBlack className="w-4 h-4 ml-1" />
              ) : null}
            </button>
          </Dropdown>
          <button
            className="h-8 px-[14px] flex items-center bg-[#F6F3F3] rounded-full cursor-pointer"
            onClick={createCharacter}
          >
            <span className=" text-sm font-normal text-[#3B3D2C]">
              {t("home.create_new_character")}
            </span>
            <IconStar className="w-4 h-4 mx-1" />
          </button>
        </div>
      </div>

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImgFileChange}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg, audio/wav, video/mp4"
        className="hidden"
        onChange={handleAudioFileChange}
      />
    </Modal>
  );
};

export default CharacterCreate;
