import React, { useState, useMemo, useRef, useEffect } from "react";
import { Modal, Button, Empty, App } from "antd";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/style_utils";
import DropdownMenu from "@/components/DropdownMenu";
import RadioTabs from "@/components/RadioTabs";
import { useMobile } from "@/provider";
import IconModelBlack from "@/assets/svg/IconModelBlack.svg?react";
import IconModelGray from "@/assets/svg/IconModelGray.svg?react";
import IconArrowDownBlack from "@/assets/svg/IconArrowDownBlack.svg?react";

import IconPlay from "@/assets/svg/IconPlay.svg?react";
import IconPause from "@/assets/svg/IconPause.svg?react";
import IconUnFavorite from "@/assets/svg/IconUnFavorite.svg?react";
import IconFavorite from "@/assets/svg/IconFavorite.svg?react";
import type { ProcessedVoice, Option } from "@/types/Character";
import {
  getUserFavoriteVoices,
  addVoiceToUserFavorite,
  removeVoiceFromUserFavorite,
  getVoiceSampleAsset,
} from "@/api/character";

type VoiceModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (voice: ProcessedVoice | null) => void;
  voiceList: ProcessedVoice[];
  defaultVoiceId?: string;
};

const VoiceModal: React.FC<VoiceModalProps> = ({
  open,
  onClose,
  onApply,
  voiceList,
  defaultVoiceId,
}) => {
  const { message } = App.useApp();
  const [selected, setSelected] = useState<ProcessedVoice | null>(null);
  const { isMobile } = useMobile();
  const { i18n, t } = useTranslation();

  const [langFilter, setLangFilter] = useState<string>("全部");
  const [genderFilter, setGenderFilter] = useState<string>("全部");
  const [ageFilter, setAgeFilter] = useState<string>("全部");
  const [activeTab, setActiveTab] = useState<string>("public");
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentAudioUrlRef = useRef<string>("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>([]);

  const currentBaseList = useMemo(() => {
    if (activeTab === "favorites") {
      return voiceList.filter((v) => favoriteVoiceIds.includes(v.id));
    }
    return voiceList;
  }, [voiceList, activeTab, favoriteVoiceIds]);

  const languages = useMemo(() => {
    const map = new Map<string, Option>();
    currentBaseList.forEach((v) => {
      if (v.language) {
        map.set(v.language.key, v.language);
      }
    });

    const allLang = { key: "全部", label_zh: "全部", label_en: "All" };
    return [allLang, ...Array.from(map.values())];
  }, [currentBaseList]);

  const genders = useMemo(() => {
    const map = new Map<string, Option>();
    currentBaseList.forEach((v) => {
      if (v.gender) {
        map.set(v.gender.key, v.gender);
      }
    });
    const allGender = { key: "全部", label_zh: "全部", label_en: "All" };
    return [allGender, ...Array.from(map.values())];
  }, [currentBaseList]);

  const ages = useMemo(() => {
    const map = new Map<string, Option>();
    currentBaseList.forEach((v) => {
      if (v.age) {
        map.set(v.age.key, v.age);
      }
    });
    const allAge = { key: "全部", label_zh: "全部", label_en: "All" };
    return [allAge, ...Array.from(map.values())];
  }, [currentBaseList]);

  const filteredList = useMemo(() => {
    return currentBaseList.filter((v) => {
      const matchLang = langFilter === "全部" || v.language?.key === langFilter;
      const matchGender =
        genderFilter === "全部" || v.gender?.key === genderFilter;
      const matchAge = ageFilter === "全部" || v.age?.key === ageFilter;
      return matchLang && matchGender && matchAge;
    });
  }, [currentBaseList, langFilter, genderFilter, ageFilter]);
  const handleAudioPlay = async (ev: React.MouseEvent, v: ProcessedVoice) => {
    ev.stopPropagation();

    // 再次点击当前播放的声音 => 暂停
    if (playingId === v.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    // 切换声音时先暂停上一个
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setLoadingId(v.id);
    setPlayingId(null); // 开始加载新音频时，确保 UI 播放状态先置空

    try {
      const res = await getVoiceSampleAsset(v.id);
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
            setPlayingId(v.id);
          } catch (err) {
            console.error("audio play error", err);
            message.error("无法自动播放音频，请检查浏览器权限。");
            setPlayingId(null);
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
      setPlayingId(null);
    } finally {
      setLoadingId(null);
    }
  };
  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  useEffect(() => {
    if (open) {
      getUserFavoriteVoices().then((res) => {
        if (res.code === 200 && res.data && Array.isArray(res.data.voice_ids)) {
          setFavoriteVoiceIds(res.data.voice_ids);
          setSelected(voiceList.find((v) => v.id === defaultVoiceId) || null);
        }
      });
    }
  }, [open, defaultVoiceId, voiceList]);

  const handleApply = () => {
    if (!selected) {
      message.error(t("common_please_select_voice"));
      return;
    }
    onApply(selected);
    onClose();
  };

  const handleFavorite = async (ev: React.MouseEvent, voiceId: string) => {
    ev.stopPropagation();
    if (favoriteVoiceIds.includes(voiceId)) {
      const res = await removeVoiceFromUserFavorite(voiceId);
      if (res.code === 200) {
        setFavoriteVoiceIds(favoriteVoiceIds.filter((id) => id !== voiceId));
      } else {
        message.error(res.msg);
      }
    } else {
      const res = await addVoiceToUserFavorite(voiceId);
      if (res.code === 200) {
        setFavoriteVoiceIds([...favoriteVoiceIds, voiceId]);
      } else {
        message.error(res.msg);
      }
    }
  };
  const renderTitle = () => (
    <div
      className={cn(
        "flex w-full gap-4",
        isMobile
          ? "flex-col items-start pr-0"
          : "flex-row justify-between items-center pr-8"
      )}
    >
      <div className={cn("w-auto", isMobile && "w-full")}>
        <RadioTabs
          tabsList={[
            {
              label: i18n.language === "zh" ? "公共" : "Public",
              value: "public",
            },
            {
              label: i18n.language === "zh" ? "收藏" : "Favorites",
              value: "favorites",
            },
          ]}
          activeValue={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setLangFilter("全部");
            setGenderFilter("全部");
            setAgeFilter("全部");
          }}
        />
      </div>
      <div
        className={cn(
          "flex gap-2 items-center",
          isMobile ? "w-full justify-between" : "justify-end flex-1"
        )}
      >
        <DropdownMenu<Option>
          list={languages}
          value={languages.find((l) => l.key === langFilter) || languages[0]}
          onChange={(item) => {
            setLangFilter(item.key);
            setAgeFilter("全部");
          }}
          formatLabel={(l) =>
            i18n.language === "zh" ? l.label_zh : l.label_en
          }
          getKey={(l) => l.key}
          isSelected={(l, v) => l.key === v?.key}
          defaultLabel={t("common_language")}
          iconActive={<IconModelBlack className="w-4 h-4" />}
          iconInactive={<IconModelGray className="w-4 h-4" />}
          iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
        />

        <DropdownMenu<Option>
          list={genders}
          value={genders.find((g) => g.key === genderFilter) || genders[0]}
          onChange={(item) => {
            setGenderFilter(item.key);
          }}
          formatLabel={(g) =>
            i18n.language === "zh" ? g.label_zh : g.label_en
          }
          getKey={(g) => g.key}
          isSelected={(g, v) => g.key === v?.key}
          defaultLabel={i18n.language === "zh" ? "性别" : "Gender"}
          iconActive={<IconModelBlack className="w-4 h-4" />}
          iconInactive={<IconModelGray className="w-4 h-4" />}
          iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
        />

        <DropdownMenu<Option>
          list={ages}
          value={ages.find((a) => a.key === ageFilter) || ages[0]}
          onChange={(item) => {
            setAgeFilter(item.key);
          }}
          formatLabel={(a) =>
            i18n.language === "zh" ? a.label_zh : a.label_en
          }
          getKey={(a) => a.key}
          isSelected={(a, v) => a.key === v?.key}
          defaultLabel={i18n.language === "zh" ? "年龄" : "Age"}
          iconActive={<IconModelBlack className="w-4 h-4" />}
          iconInactive={<IconModelGray className="w-4 h-4" />}
          iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
        />
      </div>
    </div>
  );
  const renderFooter = () => (
    <div
      className={cn(
        "w-full flex items-center gap-3",
        isMobile ? "flex-col-reverse" : "justify-end"
      )}
    >
      <Button
        className={cn(
          "bg-white/90 border border-black/30",
          isMobile ? "h-10 w-full" : "h-8 px-3"
        )}
        onClick={onClose}
      >
        <span className={cn("text-[#333]", isMobile ? "text-base" : "text-sm")}>
          {t("common_cancel")}
        </span>
      </Button>
      <Button
        className={cn("bg-white/90", isMobile ? "h-10 w-full" : "h-8 px-3")}
        onClick={handleApply}
      >
        <span
          className={cn("text-primary", isMobile ? "text-base" : "text-sm")}
        >
          {t("common_apply")}
        </span>
      </Button>
    </div>
  );
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={renderTitle()}
      centered
      width={isMobile ? undefined : 640}
      footer={renderFooter()}
      classNames={{
        container: cn(
          "!rounded-2xl",
          isMobile ? "w-[95vw] max-w-[95vw] max-h-[90vh]" : "w-[40rem]"
        ),
        body: cn(
          "overflow-y-auto",
          isMobile ? "h-auto max-h-[calc(90vh-260px)]" : "h-[30rem]"
        ),
      }}
    >
      <div
        className={cn(
          "w-full mt-4",
          filteredList.length > 0
            ? cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-2")
            : "flex items-center justify-center h-40"
        )}
      >
        {filteredList.length > 0 ? (
          filteredList.map((v) => {
            const active = selected?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                className={cn(
                  "w-full rounded-[50px] border text-left flex flex-col gap-1 transition-all",
                  isMobile ? "p-2.5" : "p-3",
                  active
                    ? "border-[#3B3D2C] bg-[#f6f6f6]"
                    : "border-black/10 hover:border-black/20"
                )}
                onClick={() => setSelected(v)}
              >
                <div className="flex justify-between items-center">
                  <div
                    className={cn(
                      "rounded-[50%] flex justify-center items-center overflow-hidden transition-all duration-300",
                      "bg-[#000] cursor-pointer group hover:bg-[#333]",
                      loadingId === v.id && "animate-pulse",
                      isMobile ? "w-9 h-9" : "w-10 h-10"
                    )}
                    onClick={(e) => {
                      handleAudioPlay(e, v);
                    }}
                  >
                    {loadingId === v.id ? (
                      <div
                        className={cn(
                          "border-2 border-white border-t-transparent rounded-full animate-spin",
                          isMobile ? "w-5 h-5" : "w-6 h-6"
                        )}
                      />
                    ) : playingId === v.id ? (
                      <IconPause
                        className={cn(
                          "group-hover:scale-110 transition-transform duration-300 text-[#fff]",
                          isMobile ? "w-5 h-5" : "w-6 h-6"
                        )}
                      />
                    ) : (
                      <IconPlay
                        className={cn(
                          "transition-transform duration-300 text-[#fff]",
                          currentAudioUrlRef.current && "group-hover:scale-110",
                          isMobile ? "w-5 h-5" : "w-6 h-6"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <span
                      className={cn(
                        "font-medium text-ellipsis overflow-hidden whitespace-nowrap text-center",
                        isMobile ? "text-sm w-[220px]" : "text-sm w-[180px]"
                      )}
                    >
                      {v.friendly_name}
                    </span>
                    <span
                      className={cn(
                        "text-[#666] flex items-center gap-1",
                        isMobile ? "text-[11px]" : "text-xs"
                      )}
                    >
                      <span>
                        {i18n.language === "zh"
                          ? v.gender?.label_zh
                          : v.gender?.label_en}
                      </span>
                      <span>
                        {i18n.language === "zh"
                          ? v.age?.label_zh
                          : v.age?.label_en}
                      </span>
                      <span>
                        {i18n.language === "zh"
                          ? v.language?.label_zh
                          : v.language?.label_en}
                      </span>
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center cursor-pointer group/fav",
                      isMobile ? "w-5 h-5" : "w-6 h-6"
                    )}
                    onClick={(e) => handleFavorite(e, v.id)}
                  >
                    <div
                      className={cn(
                        "transition-all duration-300 transform",
                        favoriteVoiceIds.includes(v.id)
                          ? "scale-110 animate-heartbeat text-red-500"
                          : "scale-100 group-hover/fav:scale-125 text-gray-400"
                      )}
                    >
                      {favoriteVoiceIds.includes(v.id) ? (
                        <IconFavorite
                          className={cn(isMobile ? "w-3.5 h-3.5" : "w-4 h-4")}
                        />
                      ) : (
                        <IconUnFavorite
                          className={cn(isMobile ? "w-3.5 h-3.5" : "w-4 h-4")}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("common_no_data")}
          />
        )}
      </div>
      <audio ref={audioRef} onEnded={handleAudioEnded} />
      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1); }
          75% { transform: scale(1.3); }
          100% { transform: scale(1.1); }
        }
        .animate-heartbeat {
          animation: heartbeat 0.45s ease-in-out;
        }
      `}</style>
    </Modal>
  );
};

export default VoiceModal;
