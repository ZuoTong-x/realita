import React, { useState, useMemo, useRef, useEffect } from "react";
import { Modal, Button, Empty, App } from "antd";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/style_utils";
import DropdownMenu from "@/components/DropdownMenu";
import RadioTabs from "@/components/RadioTabs";
import IconModelBlack from "@/assets/svg/IconModelBlack.svg?react";
import IconModelGray from "@/assets/svg/IconModelGray.svg?react";
import IconArrowDownBlack from "@/assets/svg/IconArrowDownBlack.svg?react";

import IconPlay from "@/assets/svg/IconPlay.svg?react";
import IconPause from "@/assets/svg/IconPause.svg?react";
import IconUnFavorite from "@/assets/svg/IconUnFavorite.svg?react";
import IconFavorite from "@/assets/svg/IconFavorite.svg?react";
import type { ProcessedVoice } from "@/types/Character";
import {
  getUserFavoriteVoices,
  addVoiceToUserFavorite,
  removeVoiceFromUserFavorite,
} from "@/api/characterRequest";

interface LanguageOption {
  key: string;
  label_zh: string;
  label_en: string;
}

interface GenderOption {
  key: string;
  label_zh: string;
  label_en: string;
}

type VoiceModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (voice: ProcessedVoice | null) => void;
  voiceList: ProcessedVoice[];
  typeList: { zh: string; en: string; key: string }[];
};

const VoiceModal: React.FC<VoiceModalProps> = ({
  open,
  onClose,
  onApply,
  voiceList,
  typeList,
}) => {
  const { message } = App.useApp();
  const [selected, setSelected] = useState<ProcessedVoice | null>(null);
  const { i18n, t } = useTranslation();

  const [langFilter, setLangFilter] = useState<string>("全部");
  const [genderFilter, setGenderFilter] = useState<string>("全部");
  const [categoryFilter, setCategoryFilter] = useState<string>("全部");
  const [activeTab, setActiveTab] = useState<string>("public");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>([]);

  const currentBaseList = useMemo(() => {
    if (activeTab === "favorites") {
      return voiceList.filter((v) => favoriteVoiceIds.includes(v.id));
    }
    return voiceList;
  }, [voiceList, activeTab, favoriteVoiceIds]);

  const languages = useMemo(() => {
    const map = new Map<string, LanguageOption>();
    currentBaseList.forEach((v) => {
      if (v.language) {
        map.set(v.language.key, v.language);
      }
    });

    const allLang = { key: "全部", label_zh: "全部", label_en: "All" };
    return [allLang, ...Array.from(map.values())];
  }, [currentBaseList]);

  const genders = useMemo(() => {
    const map = new Map<string, GenderOption>();
    currentBaseList.forEach((v) => {
      if (v.gender) {
        map.set(v.gender.key, v.gender);
      }
    });
    const allGender = { key: "全部", label_zh: "全部", label_en: "All" };
    return [allGender, ...Array.from(map.values())];
  }, [currentBaseList]);

  const filteredList = useMemo(() => {
    return currentBaseList.filter((v) => {
      const matchLang = langFilter === "全部" || v.language?.key === langFilter;
      const matchGender =
        genderFilter === "全部" || v.gender?.key === genderFilter;
      const matchCategory =
        categoryFilter === "全部" || v.type?.key === categoryFilter;
      return matchLang && matchGender && matchCategory;
    });
  }, [currentBaseList, langFilter, genderFilter, categoryFilter]);

  const handleAudioPlay = (ev: React.MouseEvent, v: ProcessedVoice) => {
    ev.stopPropagation();

    if (playingId === v.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (v.sample_asset?.url) {
        setCurrentAudioUrl(v.sample_asset.url);
        setPlayingId(v.id);
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {
            setPlayingId(null);
          });
        }
      }
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
        }
      });
    }
  }, [open]);

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
    <div className="flex justify-between items-center w-full pr-8 gap-4">
      <div className="w-auto">
        <RadioTabs
          tabsList={[
            { label: "公共", value: "public" },
            { label: "收藏", value: "favorites" },
          ]}
          activeValue={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setLangFilter("全部");
            setGenderFilter("全部");
            setCategoryFilter("全部");
          }}
        />
      </div>
      <div className="flex gap-2 justify-end items-center flex-1">
        <DropdownMenu<LanguageOption>
          list={languages}
          value={languages.find((l) => l.key === langFilter) || languages[0]}
          onChange={(item) => {
            setLangFilter(item.key);
            setCategoryFilter("全部");
          }}
          formatLabel={(l) =>
            i18n.language === "zh" ? l.label_zh : l.label_en
          }
          getKey={(l) => l.key}
          isSelected={(l, v) => l.key === v?.key}
          defaultLabel={t("common.language")}
          iconActive={<IconModelBlack className="w-4 h-4" />}
          iconInactive={<IconModelGray className="w-4 h-4" />}
          iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
        />

        <DropdownMenu<GenderOption>
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

        <DropdownMenu<{ zh: string; en: string; key: string }>
          list={typeList}
          value={typeList.find((t) => t.key === categoryFilter) || typeList[0]}
          onChange={(item) => {
            setCategoryFilter(item.key);
          }}
          formatLabel={(c) => (i18n.language === "zh" ? c.zh : c.en)}
          getKey={(c) => c.key}
          isSelected={(c, v) => c.key === v?.key}
          defaultLabel={i18n.language === "zh" ? "类型" : "Type"}
          iconActive={<IconModelBlack className="w-4 h-4" />}
          iconInactive={<IconModelGray className="w-4 h-4" />}
          iconArrow={<IconArrowDownBlack className="w-4 h-4" />}
        />
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={renderTitle()}
      centered
      width={640}
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
        container: "w-[40rem] !rounded-2xl",
        body: "h-[30rem] overflow-y-auto",
      }}
    >
      <div
        className={
          filteredList.length > 0
            ? "w-full grid grid-cols-2 gap-3 mt-4"
            : "w-full flex items-center justify-center mt-4 h-40"
        }
      >
        {filteredList.length > 0 ? (
          filteredList.map((v) => {
            const active = selected?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                className={`w-full p-3 rounded-[50px] border text-left flex flex-col gap-1 transition-all ${
                  active
                    ? "border-[#3B3D2C] bg-[#f6f6f6]"
                    : "border-black/10 hover:border-black/20"
                }`}
                onClick={() => setSelected(v)}
              >
                <div className="flex justify-between items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-[50%] flex justify-center items-center overflow-hidden transition-all duration-300",
                      v.sample_asset?.url
                        ? "bg-[#000] cursor-pointer group hover:bg-[#333]"
                        : "bg-[#ccc] cursor-not-allowed"
                    )}
                    onClick={(e) => {
                      if (v.sample_asset?.url) {
                        handleAudioPlay(e, v);
                      } else {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {playingId === v.id ? (
                      <IconPause className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 text-[#fff]" />
                    ) : (
                      <IconPlay
                        className={cn(
                          "w-6 h-6 transition-transform duration-300 text-[#fff]",
                          v.sample_asset?.url && "group-hover:scale-110"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center ">
                    <span className="text-sm font-medium">
                      {v.friendly_name}
                    </span>
                    <span className="text-xs text-[#666]">
                      {i18n.language === "zh" ? v.type?.zh : v.type?.en}
                    </span>
                  </div>
                  <div
                    className="w-6 h-6 flex items-center justify-center cursor-pointer group/fav"
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
                        <IconFavorite className="w-4 h-4" />
                      ) : (
                        <IconUnFavorite className="w-4 h-4" />
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
            description={t("common.no_data")}
          />
        )}
      </div>
      <audio ref={audioRef} src={currentAudioUrl} onEnded={handleAudioEnded} />
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
