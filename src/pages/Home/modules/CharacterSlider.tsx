import type { CharacterInfo } from "@/types/Character";
import { Skeleton, Popover } from "antd";
import { cn } from "@/utils/style_utils";
import { useRef, useMemo } from "react";

type CharacterSliderProps = {
  characterList: CharacterInfo[];
  currentCharacter: CharacterInfo | null;
  changeCharacter: (character: CharacterInfo) => void;
};

const CharacterSlider = ({
  characterList,
  currentCharacter,
  changeCharacter,
}: CharacterSliderProps) => {
  const DISPLAY_COUNT = 13; // 最大展示数量

  const { visibleList, currentOrderIdx } = useMemo(() => {
    if (!currentCharacter || characterList.length === 0) {
      return { visibleList: [], currentOrderIdx: 0 };
    }

    const len = characterList.length;
    const centerIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );

    if (centerIdx === -1) return { visibleList: [], currentOrderIdx: 0 };

    const count = Math.min(len, DISPLAY_COUNT);
    const half = Math.floor(count / 2);
    const res: { item: CharacterInfo; order: number }[] = [];

    for (let i = -half; i <= half; i++) {
      const idx = (centerIdx + i + len) % len;
      res.push({
        item: characterList[idx],
        order: i + half, // 这里的 order 是相对于 visibleList 的
      });
    }

    return { visibleList: res, currentOrderIdx: half };
  }, [characterList, currentCharacter]);

  const timerRef = useRef<number | null>(null);
  const stepToIndex = (targetIdx: number) => {
    if (!currentCharacter || characterList.length === 0) return;
    const len = characterList.length;
    let curIdx = characterList.findIndex(
      (c) => c.character_id === currentCharacter.character_id
    );
    if (curIdx === -1 || targetIdx === curIdx) return;
    const forward = (targetIdx - curIdx + len) % len; // steps if going forward
    const backward = (curIdx - targetIdx + len) % len; // steps if going backward
    const dir = forward <= backward ? 1 : -1;
    let steps = Math.min(forward, backward);
    const run = () => {
      if (steps <= 0) {
        timerRef.current = null;
        return;
      }
      curIdx = (curIdx + dir + len) % len;
      changeCharacter(characterList[curIdx]);
      steps -= 1;
      timerRef.current = window.setTimeout(run, 60);
    };
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    run();
  };

  return (
    <div className="w-full h-full rounded-md bg-white/10 p-2 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden">
      {visibleList.length > 0 && currentCharacter ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          {visibleList.map(({ item: character, order }) => {
            const isCenter = order === currentOrderIdx;
            return (
              <Popover
                key={character.character_id}
                content={
                  <img
                    src={character.image.url}
                    alt={character.character_name}
                    className="w-[200px] h-[264px] object-cover rounded-2xl overflow-hidden"
                  />
                }
                placement="left"
                align={{ offset: [-15, 0] }}
                arrow={false}
              >
                <div
                  className={cn(
                    "w-full cursor-pointer hover:scale-110 overflow-hidden",
                    isCenter
                      ? "h-[76px] w-[76px] rounded-full"
                      : "shadow-[0_0_13.5px_0_rgba(0,0,0,0.25)] opacity-70 h-7 rounded-[50%]"
                  )}
                  style={{
                    order: order,
                    transition:
                      "all 300ms cubic-bezier(0.4, 0, 0.2, 1), order 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "height, width, opacity, transform, order",
                  }}
                  onClick={() => {
                    const targetIdx = characterList.findIndex(
                      (c) => c.character_id === character.character_id
                    );
                    stepToIndex(targetIdx);
                  }}
                >
                  <img
                    src={character.image.url}
                    alt={character.character_name}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-300",
                      isCenter ? "rounded-full" : "rounded-[50%]"
                    )}
                  />
                </div>
              </Popover>
            );
          })}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            {Array.from({ length: DISPLAY_COUNT }).map((_, idx) => {
              const center = Math.floor(DISPLAY_COUNT / 2);
              const isCenter = idx === center;
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-full transition-all duration-300 overflow-hidden",
                    isCenter
                      ? "flex items-center justify-center"
                      : "shadow-[0_0_13.5px_0_rgba(0,0,0,0.25)] opacity-70 h-7 rounded-[50%]"
                  )}
                >
                  {isCenter ? (
                    <Skeleton.Avatar active size={50} shape="circle" />
                  ) : (
                    <Skeleton.Button
                      active
                      block
                      shape="round"
                      style={{ height: 28 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSlider;
