import { useEffect, useRef, useState, useMemo } from "react";
import { Skeleton } from "antd";
import type { CharacterInfo } from "@/types/Character";
import CommonButton from "@/components/Common/Button";
import IconArrow from "@/assets/svg/IconArrow.svg?react";
import { cn } from "@/utils/style_utils";
import { useTranslation } from "react-i18next";
import IconAudioOff from "@/assets/svg/IconAudioOff.svg?react";
import IconAudioOn from "@/assets/svg/IconAudioON.svg?react";
import IconChat from "@/assets/svg/IconChat.svg?react";
import IconPlay from "@/assets/svg/IconPlay.svg?react";
// import IconPause from "@/assets/svg/IconPause.svg?react";
import LikeTag from "@/components/LikeTag";
import useCharacterListStore from "@/stores/characterListStore";
import { useMobile } from "@/provider";

type CharacterSwiperProps = {
  onChat: (character: CharacterInfo) => void;
  pauseVideo?: boolean;
};

const CharacterSwiper = ({ onChat, pauseVideo }: CharacterSwiperProps) => {
  const {
    characterList,
    currentCharacter,
    userLikedCharacters,
    setCurrentCharacter,
  } = useCharacterListStore();
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [mutedAll, setMutedAll] = useState<boolean>(false);
  const [videoPaused, setVideoPaused] = useState<boolean>(false);

  // 触摸滑动相关状态
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const visibleList = useMemo(() => {
    if (!currentCharacter || characterList.length === 0) return [];
    const len = characterList.length;
    const curIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );
    if (curIdx === -1) return [];

    const res: { item: CharacterInfo; offset: number }[] = [];

    // 移动端只显示中心卡片
    if (isMobile) {
      res.push({ item: currentCharacter, offset: 0 });
      return res;
    }

    // 如果数据量足够，显示 7 个（-3 到 3）
    if (len >= 7) {
      for (let o = -3; o <= 3; o++) {
        const idx = (curIdx + o + len) % len;
        res.push({ item: characterList[idx], offset: o });
      }
    } else {
      // 如果数据量不足，仅显示实际数量，并尽量居中
      const startOffset = -Math.floor((len - 1) / 2);
      for (let i = 0; i < len; i++) {
        const o = startOffset + i;
        const idx = (curIdx + o + len) % len;
        res.push({ item: characterList[idx], offset: o });
      }
    }
    return res;
  }, [characterList, currentCharacter, isMobile]);

  const getCardStyleByOffset = (offset: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: isMobile ? "100vw" : "380px",
      maxWidth: isMobile ? "100vw" : "90vw",
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
      left: isMobile ? "0" : "50%",
      bottom: isMobile ? "0" : "-30px",
      marginLeft: isMobile ? "0" : "-190px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    };

    if (offset === 0) {
      return {
        ...baseStyle,
        transform: isMobile ? "" : "scale(1.05) rotate(0deg) translateY(0)",
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
        !isMobile &&
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

  const handleChat = (character: CharacterInfo) => {
    onChat(character);
  };

  const handleVideoClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isMobile) return;

    const centerIdx = visibleList.findIndex((item) => item.offset === 0);
    if (centerIdx === -1) return;

    const video = videoRefs.current[centerIdx];
    if (!video) return;

    if (video.paused) {
      video.play();
      setVideoPaused(false);
    } else {
      video.pause();
      setVideoPaused(true);
    }
  };

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) v.muted = mutedAll;
    });
  }, [mutedAll, characterList]);

  // 移动端自动播放中心卡片视频
  useEffect(() => {
    if (isMobile && visibleList.length > 0) {
      const centerIdx = visibleList.findIndex((item) => item.offset === 0);
      if (centerIdx !== -1) {
        playOnly(centerIdx);
        setVideoPaused(false);
      }
    }
  }, [isMobile, currentCharacter]);

  // 当弹窗打开时暂停视频
  useEffect(() => {
    if (pauseVideo) {
      videoRefs.current.forEach((v) => {
        if (v && !v.paused) {
          v.pause();
        }
      });
      setVideoPaused(true);
    } else {
      // 弹窗关闭时，如果是移动端且有中心卡片，则恢复播放
      if (isMobile && visibleList.length > 0) {
        const centerIdx = visibleList.findIndex((item) => item.offset === 0);
        if (centerIdx !== -1) {
          const video = videoRefs.current[centerIdx];
          if (video && video.paused) {
            video.play();
            setVideoPaused(false);
          }
        }
      }
    }
  }, [pauseVideo, isMobile, visibleList]);

  const renderSkeleton = () => {
    // 移动端只显示中心卡片的骨架屏
    const offsets = isMobile ? [0] : [-3, -2, -1, 0, 1, 2, 3];
    return (
      <div
        className={cn(
          "flex-1 relative flex items-end justify-center h-full",
          "[perspective:1200px] [transform-style:preserve-3d] pb-[100px] translate-y-[-40px]",
          isMobile ? "mx-0 w-full" : "mx-auto"
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
    let curIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );
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
      curIdx = characterList.findIndex(
        (c) => c.character_id === currentCharacter.character_id
      );
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
    const curIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );
    const nextIdx = (curIdx + 1) % characterList.length;
    stepToIndex(nextIdx);
  };
  const goPrev = () => {
    if (!currentCharacter || characterList.length === 0) return;
    const curIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );
    const prevIdx = (curIdx - 1 + characterList.length) % characterList.length;
    stepToIndex(prevIdx);
  };

  // 触摸滑动处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // 最小滑动距离

    // 计算总移动距离
    const totalDistance = Math.sqrt(diffX * diffX + diffY * diffY);

    // 确保用户真的滑动了，并且水平滑动距离大于垂直滑动距离
    if (totalDistance > minSwipeDistance && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // 左滑，下一个
        goNext();
      } else {
        // 右滑，上一个
        goPrev();
      }
    }

    // 重置
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };

  return (
    <div className={cn("relative w-full h-full flex flex-col pt-[72px]")}>
      {characterList.length === 0 && renderSkeleton()}
      {visibleList.length > 0 && currentCharacter && (
        <div
          className={cn(
            "flex-1 relative flex items-end justify-center h-full z-[21]",
            "",
            isMobile
              ? "mx-0 w-full"
              : "mx-auto [perspective:1200px] [transform-style:preserve-3d]  pb-[100px] translate-y-[-40px]"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {visibleList.map(({ item: character, offset }, idx: number) => {
            const isCenter = offset === 0;
            return (
              <div
                key={character.character_id}
                style={getCardStyleByOffset(offset)}
                className={getCardClassByOffset(offset)}
                onClick={() => {
                  // 移动端禁用点击切换
                  if (isMobile) return;
                  const targetIdx = characterList.findIndex(
                    (c) => c.character_id === character.character_id
                  );
                  if (targetIdx !== -1) stepToIndex(targetIdx);
                }}
              >
                <div
                  className="w-full aspect-[2/3] overflow-hidden bg-transparent mt-0 rounded-t-[16px] relative flex-1"
                  onMouseEnter={() => {
                    // 桌面端 hover 播放
                    if (isCenter && !isMobile) {
                      playOnly(idx);
                    }
                  }}
                  onMouseLeave={() => {
                    // 桌面端 hover 离开暂停
                    if (isCenter && !isMobile) {
                      const v = videoRefs.current[idx];
                      if (v) {
                        v.pause();
                      }
                    }
                  }}
                  onClick={isCenter && isMobile ? handleVideoClick : undefined}
                  onTouchEnd={
                    isCenter && isMobile
                      ? (e) => {
                          // 确保不是滑动操作
                          const diffX = Math.abs(
                            touchStartX.current - touchEndX.current
                          );
                          const diffY = Math.abs(
                            touchStartY.current - touchEndY.current
                          );
                          if (diffX < 10 && diffY < 10) {
                            handleVideoClick(e);
                          }
                        }
                      : undefined
                  }
                >
                  <video
                    src={character.video?.url || ""}
                    poster={character.image.url}
                    autoPlay={false}
                    loop
                    muted={mutedAll}
                    playsInline
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                    }}
                    className="w-full h-full object-cover relative z-0"
                  >
                    <source src={character.video?.url || ""} type="video/mp4" />
                  </video>

                  {/* 移动端暂停时显示暂停图标 */}
                  {isCenter && isMobile && videoPaused && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                        <IconPlay className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  )}

                  {isCenter && (
                    <>
                      {character.number_of_likes !== null && (
                        <div
                          className="absolute top-3 right-3 flex items-center justify-center"
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchMove={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                        >
                          <LikeTag
                            characterId={character.character_id}
                            likeCount={character.number_of_likes}
                            isLiked={userLikedCharacters.includes(
                              character.character_id
                            )}
                            options={{
                              size: "large",
                              iconPosition: "right",
                              showCount: true,
                              showIcon: true,
                              showBorder: false,
                            }}
                          />
                        </div>
                      )}
                      <div
                        className={cn(
                          "absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity duration-300",
                          isMobile
                            ? "opacity-100"
                            : "group-hover:opacity-100 opacity-0"
                        )}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                      >
                        <CommonButton
                          size="large"
                          className="h-10 px-0 hover:scale-110 transition-transform duration-300"
                          borderRadiusPx={54}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChat(character);
                          }}
                        >
                          <span className="text-xl font-medium text-[#333] flex items-center gap-4 justify-center px-6">
                            {t("common_chat")}
                            <IconChat className="w-6 h-4" />
                          </span>
                        </CommonButton>
                      </div>
                      <div
                        className="absolute bottom-3 right-4 flex items-center justify-center"
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                      >
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
                    {character.character_name}
                  </div>
                  {/* 描述  */}
                  <div className="w-full text-sm text-gray-500 line-clamp-2 h-10 leading-relaxed">
                    {character.llm_prompt}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {characterList.length > 1 && currentCharacter && !isMobile && (
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
