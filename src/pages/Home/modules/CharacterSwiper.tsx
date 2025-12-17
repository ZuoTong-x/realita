import { useEffect, useRef, useState, useMemo } from "react";
import { Skeleton } from "antd";
import type { Character } from "@/types/Character";
import CommonButton from "@/components/Common/Button";
import IconArrow from "@/assets/svg/IconArrow.svg?react";
import { cn } from "@/utils/style_utils";
import { useTranslation } from "react-i18next";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioOn.svg?react";
import IconChat from "@/assets/svg/IconChat.svg?react";

import useCharacterListStore from "@/stores/characterListStore";

type CharacterSwiperProps = {
  // registerPause?: (pauseFn: () => void) => void;
  // registerPlay?: (playFn: () => void) => void;
  onChat: (character: Character) => void;
};

const CharacterSwiper = ({ onChat }: CharacterSwiperProps) => {
  const {
    characterList,
    currentCharacter,

    setCurrentCharacter,
  } = useCharacterListStore();
  const { t } = useTranslation();
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [mutedAll, setMutedAll] = useState<boolean>(false);

  const visibleList = useMemo(() => {
    if (!currentCharacter || characterList.length === 0) return [];
    const len = characterList.length;
    const curIdx = characterList.findIndex((c) => c.id === currentCharacter.id);
    if (curIdx === -1) return [];
    const res: Character[] = [];
    for (let o = -3; o <= 3; o++) {
      const idx = (curIdx + o + len) % len;
      res.push(characterList[idx]);
    }
    return res;
  }, [characterList, currentCharacter]);

  const getCardStyleByOffset = (offset: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: "380px",
      maxWidth: "90vw",
      height: "100%",
      backgroundColor: "transparent",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      overflow: "hidden",
      opacity: 0,
      pointerEvents: "none",
      transition:
        "transform 400ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 400ms cubic-bezier(0.25,0.46,0.45,0.94), filter 400ms cubic-bezier(0.25,0.46,0.45,0.94)",
      willChange: "transform",
      cursor: "pointer",
      transformStyle: "preserve-3d",
      transformOrigin: "center bottom",
      left: "50%",
      bottom: "-30px",
      marginLeft: "-190px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    };

    if (offset === 0) {
      return {
        ...baseStyle,
        transform: "scale(1.05) rotate(0deg) translateY(0)",
        zIndex: 10,
        filter: "blur(0px)",
        opacity: 1,
        pointerEvents: "auto",
      };
    }

    const map: Record<number, React.CSSProperties> = {
      [-3]: {
        ...baseStyle,
        transform: "scale(0.8) rotate(-60deg) translateY(-150px)",
        zIndex: 1,
        filter: "blur(6px)",
        opacity: 1,
        pointerEvents: "auto",
      },
      [-2]: {
        ...baseStyle,
        transform: "scale(0.8) rotate(-40deg) translateY(-170px)",
        zIndex: 2,
        filter: "blur(4px)",
        opacity: 1,
        pointerEvents: "auto",
      },
      [-1]: {
        ...baseStyle,
        transform: "scale(0.8) rotate(-20deg) translateY(-200px)",
        zIndex: 3,
        filter: "blur(2px)",
        opacity: 1,
        pointerEvents: "auto",
      },
      [1]: {
        ...baseStyle,
        transform: "scale(0.8) rotate(20deg) translateY(-200px)",
        zIndex: 3,
        filter: "blur(2px)",
        opacity: 1,
        pointerEvents: "auto",
      },
      [2]: {
        ...baseStyle,
        transform: "scale(0.8) rotate(40deg) translateY(-170px)",
        zIndex: 2,
        filter: "blur(4px)",
        opacity: 1,
        pointerEvents: "auto",
      },
      [3]: {
        ...baseStyle,
        transform: "scale(0.8) rotate(60deg) translateY(-150px)",
        zIndex: 1,
        filter: "blur(6px)",
        opacity: 1,
        pointerEvents: "auto",
      },
    };
    return map[offset] ?? baseStyle;
  };

  const getCardClassByOffset = (offset: number) => {
    return cn(
      "group flex flex-col",
      offset === 0 &&
        "hover:!scale-[1.07] hover:!shadow-[0_16px_48px_rgba(0,0,0,0.25)]"
    );
  };

  const playOnly = (idx: number) => {
    const v = videoRefs.current[idx];
    if (v) {
      v.muted = mutedAll;
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const handleChat = (character: Character) => {
    onChat(character);
  };

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) v.muted = mutedAll;
    });
  }, [mutedAll, characterList]);

  const renderSkeleton = () => {
    const offsets = [-3, -2, -1, 0, 1, 2, 3];
    return (
      <div
        className={cn(
          "flex-1 relative flex items-end justify-center h-full",
          "[perspective:1200px] [transform-style:preserve-3d] pb-[100px] mx-auto translate-y-[-40px]"
        )}
      >
        {offsets.map((offset, idx) => (
          <div
            key={idx}
            style={getCardStyleByOffset(offset)}
            className={getCardClassByOffset(offset)}
          >
            <div className="w-full aspect-[2/3] overflow-hidden bg-transparent mt-0 rounded-t-[16px] relative flex-1">
              <Skeleton.Button
                active
                block
                style={{ width: "100%", height: "100%", borderRadius: 16 }}
              />
            </div>
            <div className="w-full h-[120px] bg-[#ffffff] p-3 flex flex-col justify-center gap-2">
              <Skeleton.Input active size="small" style={{ width: "60%" }} />
              <Skeleton.Input active size="small" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const stepTimerRef = useRef<number | null>(null);
  const stepToIndex = (targetIdx: number) => {
    if (!currentCharacter || characterList.length === 0) return;
    const len = characterList.length;
    let curIdx = characterList.findIndex((c) => c.id === currentCharacter.id);
    if (curIdx === -1 || targetIdx === curIdx) return;
    const forward = (targetIdx - curIdx + len) % len;
    const backward = (curIdx - targetIdx + len) % len;
    const dir = forward <= backward ? 1 : -1;
    let steps = Math.min(forward, backward);
    const run = () => {
      if (steps <= 0) {
        stepTimerRef.current = null;
        return;
      }
      curIdx = characterList.findIndex((c) => c.id === currentCharacter!.id);
      const nextIdx = (curIdx + dir + len) % len;
      setCurrentCharacter(characterList[nextIdx]);
      steps -= 1;
      stepTimerRef.current = window.setTimeout(run, 60);
    };
    if (stepTimerRef.current) {
      window.clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    run();
  };

  const goNext = () => {
    if (!currentCharacter || characterList.length === 0) return;
    const curIdx = characterList.findIndex((c) => c.id === currentCharacter.id);
    const nextIdx = (curIdx + 1) % characterList.length;
    stepToIndex(nextIdx);
  };
  const goPrev = () => {
    if (!currentCharacter || characterList.length === 0) return;
    const curIdx = characterList.findIndex((c) => c.id === currentCharacter.id);
    const prevIdx = (curIdx - 1 + characterList.length) % characterList.length;
    stepToIndex(prevIdx);
  };

  return (
    <div className={cn("relative w-full h-full flex flex-col pt-[72px]")}>
      {characterList.length === 0 && renderSkeleton()}
      {visibleList.length > 0 && currentCharacter && (
        <div
          className={cn(
            "flex-1 relative flex items-end justify-center h-full",
            "[perspective:1200px] [transform-style:preserve-3d] pb-[100px] mx-auto translate-y-[-40px]"
          )}
        >
          {visibleList.map((character: Character, idx: number) => {
            const offset = idx - 3; // -3..3
            const isCenter = offset === 0;
            return (
              <div
                key={character.id}
                style={getCardStyleByOffset(offset)}
                className={getCardClassByOffset(offset)}
                onClick={() => {
                  const targetIdx = characterList.findIndex(
                    (c) => c.id === character.id
                  );
                  if (targetIdx !== -1) stepToIndex(targetIdx);
                }}
              >
                <div
                  className="w-full aspect-[2/3] overflow-hidden bg-transparent mt-0 rounded-t-[16px] relative flex-1"
                  onMouseEnter={() => {
                    if (isCenter) {
                      playOnly(idx);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isCenter) {
                      const v = videoRefs.current[idx];
                      if (v) {
                        v.pause();
                      }
                    }
                  }}
                >
                  <video
                    src={character.voice}
                    poster={character.image}
                    autoPlay={false}
                    loop
                    muted={mutedAll}
                    playsInline
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                    }}
                    className="w-full h-full object-cover relative z-0"
                  >
                    <source src={character.voice} type="video/mp4" />
                  </video>

                  {isCenter && (
                    <>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                        <CommonButton
                          size="large"
                          className="h-14 px-0 hover:scale-110 transition-transform duration-300"
                          borderRadiusPx={54}
                          onClick={() => {
                            handleChat(character);
                          }}
                        >
                          <span className="text-2xl font-medium text-[#333] flex items-center gap-4 justify-center px-10">
                            {t("common.chat")}
                            <IconChat className="w-6 h-6" />
                          </span>
                        </CommonButton>
                      </div>
                      <div className="absolute bottom-3 right-4 flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                        <CommonButton
                          borderRadiusPx={42}
                          className="h-10 w-10 p-0 bg-white/60 hover:scale-110 transition-transform duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMutedAll((prev) => !prev);
                          }}
                        >
                          {mutedAll ? (
                            <IconAudioOff className="w-5 h-5" />
                          ) : (
                            <IconAudioOn className="w-5 h-5" />
                          )}
                        </CommonButton>
                      </div>
                    </>
                  )}
                </div>
                <div className="w-full h-[120px] bg-[#ffffff] p-3 flex flex-col justify-center gap-2">
                  <div className="w-full h-5 text-base font-medium">
                    {character.name}
                  </div>
                  {/* 描述  */}
                  <div className="w-full text-sm text-gray-500 line-clamp-2 h-10 leading-relaxed">
                    {character.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {characterList.length > 1 && currentCharacter && (
        <div className="w-full flex items-center justify-center gap-4">
          <CommonButton
            onClick={goPrev}
            className="w-12 h-12 p-0"
            borderRadiusPx={54}
          >
            <IconArrow className="w-6 h-6 transform rotate-180" />
          </CommonButton>
          <CommonButton
            onClick={goNext}
            className="w-12 h-12 p-0"
            borderRadiusPx={54}
          >
            <IconArrow className="w-6 h-6" />
          </CommonButton>
        </div>
      )}
    </div>
  );
};

export default CharacterSwiper;
